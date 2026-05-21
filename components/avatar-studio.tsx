"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import {
  ConnectionState,
  RemoteAudioTrack,
  RemoteParticipant,
  RemoteTrack,
  RemoteTrackPublication,
  RemoteVideoTrack,
  Room,
  RoomEvent,
  Track,
} from "livekit-client";

const AVATAR_IDENTITY = "avatar_worker";
const DEFAULT_HIDDEN_TIMEOUT_MS = 45_000;
const DEFAULT_IDLE_TIMEOUT_MS = 180_000;
const DEFAULT_WARNING_TIMEOUT_MS = 20_000;

type SessionPayload = {
  token: string;
  roomName: string;
  identity: string;
  wsUrl: string;
  displayName: string;
  idleTimeoutMs: number;
  warningTimeoutMs: number;
  hiddenTimeoutMs: number;
};

type DisconnectReason =
  | "manual"
  | "idle"
  | "hidden"
  | "room-ended"
  | "connection-error"
  | "page-exit";

type StudioStatus = "idle" | "creating" | "connecting" | "live" | "ending" | "error";
type ChatMessage = {
  id: string;
  author: "user" | "agent" | "system";
  text: string;
};

function formatCountdown(ms: number) {
  const safeMs = Math.max(ms, 0);
  const totalSeconds = Math.ceil(safeMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function createRoomInstance() {
  return new Room({
    adaptiveStream: true,
    dynacast: true,
    stopLocalTrackOnUnpublish: true,
    audioCaptureDefaults: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    },
  });
}

export function AvatarStudio() {
  const [status, setStatus] = useState<StudioStatus>("idle");
  const [displayName, setDisplayName] = useState("Recruiter");
  const [session, setSession] = useState<SessionPayload | null>(null);
  const [videoTrack, setVideoTrack] = useState<RemoteVideoTrack | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isMicEnabled, setIsMicEnabled] = useState(false);
  const [warningCountdownMs, setWarningCountdownMs] = useState<number | null>(null);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isPending, startTransition] = useTransition();

  const roomRef = useRef<Room | null>(null);
  const roomNameRef = useRef<string | null>(null);
  const videoElementRef = useRef<HTMLVideoElement | null>(null);
  const audioElementsRef = useRef<Map<string, HTMLAudioElement>>(new Map());
  const idleWarnTimeoutRef = useRef<ReturnType<typeof window.setTimeout> | null>(null);
  const idleDisconnectTimeoutRef = useRef<ReturnType<typeof window.setTimeout> | null>(null);
  const warningIntervalRef = useRef<ReturnType<typeof window.setInterval> | null>(null);
  const hiddenDisconnectTimeoutRef = useRef<ReturnType<typeof window.setTimeout> | null>(null);
  const disconnectingRef = useRef(false);

  const idleTimeoutMs = session?.idleTimeoutMs ?? DEFAULT_IDLE_TIMEOUT_MS;
  const warningTimeoutMs = session?.warningTimeoutMs ?? DEFAULT_WARNING_TIMEOUT_MS;
  const hiddenTimeoutMs = session?.hiddenTimeoutMs ?? DEFAULT_HIDDEN_TIMEOUT_MS;

  const sessionLabel = useMemo(() => {
    if (!session?.roomName) {
      return "Not connected";
    }
    return session.roomName;
  }, [session?.roomName]);

  useEffect(() => {
    if (!videoElementRef.current || !videoTrack) {
      return;
    }

    videoTrack.attach(videoElementRef.current);
    return () => {
      videoTrack.detach(videoElementRef.current!);
    };
  }, [videoTrack]);

  useEffect(() => {
    const onPageHide = () => {
      if (roomNameRef.current) {
        void teardownSession("page-exit", { skipStateReset: true, keepalive: true });
      }
    };

    window.addEventListener("pagehide", onPageHide);
    return () => window.removeEventListener("pagehide", onPageHide);
  }, []);

  useEffect(() => {
    const bumpActivity = () => {
      if (status === "live") {
        scheduleSessionTimers();
      }
    };

    const handleVisibility = () => {
      if (status !== "live") {
        return;
      }

      if (document.visibilityState === "hidden") {
        if (hiddenDisconnectTimeoutRef.current) {
          window.clearTimeout(hiddenDisconnectTimeoutRef.current);
        }
        hiddenDisconnectTimeoutRef.current = window.setTimeout(() => {
          void teardownSession("hidden");
        }, hiddenTimeoutMs);
        return;
      }

      if (hiddenDisconnectTimeoutRef.current) {
        window.clearTimeout(hiddenDisconnectTimeoutRef.current);
        hiddenDisconnectTimeoutRef.current = null;
      }
      scheduleSessionTimers();
    };

    const events: Array<keyof WindowEventMap> = ["pointerdown", "keydown", "focus", "touchstart"];
    events.forEach((eventName) => window.addEventListener(eventName, bumpActivity));
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      events.forEach((eventName) => window.removeEventListener(eventName, bumpActivity));
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [hiddenTimeoutMs, status]);

  function clearTimers() {
    if (idleWarnTimeoutRef.current) {
      window.clearTimeout(idleWarnTimeoutRef.current);
      idleWarnTimeoutRef.current = null;
    }
    if (idleDisconnectTimeoutRef.current) {
      window.clearTimeout(idleDisconnectTimeoutRef.current);
      idleDisconnectTimeoutRef.current = null;
    }
    if (warningIntervalRef.current) {
      window.clearInterval(warningIntervalRef.current);
      warningIntervalRef.current = null;
    }
    if (hiddenDisconnectTimeoutRef.current) {
      window.clearTimeout(hiddenDisconnectTimeoutRef.current);
      hiddenDisconnectTimeoutRef.current = null;
    }
    setWarningCountdownMs(null);
  }

  function scheduleSessionTimers() {
    clearTimers();

    if (!roomRef.current || roomRef.current.state !== ConnectionState.Connected) {
      return;
    }

    const warningStartsInMs = Math.max(idleTimeoutMs - warningTimeoutMs, 0);
    const disconnectAt = Date.now() + idleTimeoutMs;

    idleWarnTimeoutRef.current = window.setTimeout(() => {
      setWarningCountdownMs(Math.max(disconnectAt - Date.now(), 0));
      warningIntervalRef.current = window.setInterval(() => {
        const remaining = Math.max(disconnectAt - Date.now(), 0);
        setWarningCountdownMs(remaining);
        if (remaining <= 0 && warningIntervalRef.current) {
          window.clearInterval(warningIntervalRef.current);
          warningIntervalRef.current = null;
        }
      }, 1000);
    }, warningStartsInMs);

    idleDisconnectTimeoutRef.current = window.setTimeout(() => {
      void teardownSession("idle");
    }, idleTimeoutMs);
  }

  function clearAudioElements() {
    audioElementsRef.current.forEach((element) => {
      element.pause();
      element.srcObject = null;
      element.remove();
    });
    audioElementsRef.current.clear();
  }

  function pushChatMessage(message: ChatMessage) {
    setChatMessages((current) => [...current, message]);
  }

  function handleTrackSubscribed(
    track: RemoteTrack,
    publication: RemoteTrackPublication,
    participant: RemoteParticipant,
  ) {
    if (track.kind === Track.Kind.Video) {
      const remoteVideoTrack = track as RemoteVideoTrack;
      if (participant.identity === AVATAR_IDENTITY || !videoTrack) {
        setVideoTrack(remoteVideoTrack);
      }
      return;
    }

    if (track.kind === Track.Kind.Audio) {
      const remoteAudioTrack = track as RemoteAudioTrack;
      const audioElement = remoteAudioTrack.attach();
      audioElement.autoplay = true;
      audioElement.playsInline = true;
      audioElement.dataset.trackSid = publication.trackSid;
      document.body.appendChild(audioElement);
      audioElementsRef.current.set(publication.trackSid, audioElement);
    }
  }

  function handleTrackUnsubscribed(track: RemoteTrack, publication: RemoteTrackPublication) {
    if (track.kind === Track.Kind.Video && videoTrack?.sid === track.sid) {
      setVideoTrack(null);
    }

    if (track.kind === Track.Kind.Audio) {
      const audioElement = audioElementsRef.current.get(publication.trackSid);
      if (audioElement) {
        track.detach(audioElement);
        audioElement.remove();
        audioElementsRef.current.delete(publication.trackSid);
      }
    }
  }

  function bindRoomEvents(room: Room) {
    room.registerTextStreamHandler("lk.chat", async (reader, participantInfo) => {
      const text = await reader.readAll();
      pushChatMessage({
        id: `${reader.info.id}-chat`,
        author: participantInfo.identity === room.localParticipant.identity ? "user" : "agent",
        text,
      });
    });

    room.registerTextStreamHandler("lk.transcription", async (reader, participantInfo) => {
      const text = await reader.readAll();
      if (!text.trim()) {
        return;
      }
      pushChatMessage({
        id: `${reader.info.id}-transcript`,
        author: participantInfo.identity === room.localParticipant.identity ? "user" : "agent",
        text,
      });
    });

    room
      .on(RoomEvent.TrackSubscribed, handleTrackSubscribed)
      .on(RoomEvent.TrackUnsubscribed, handleTrackUnsubscribed)
      .on(RoomEvent.Disconnected, () => {
        if (!disconnectingRef.current) {
          startTransition(() => {
            setNotice("Session ended. Connect again when you want to speak with the avatar.");
            setStatus("idle");
            setSession(null);
            setVideoTrack(null);
            setIsMicEnabled(false);
          });
        }
        clearTimers();
        clearAudioElements();
      })
      .on(RoomEvent.MediaDevicesError, (error) => {
        setErrorMessage(error.message);
        setStatus("error");
      });
  }

  async function teardownSession(
    reason: DisconnectReason,
    options?: { skipStateReset?: boolean; keepalive?: boolean },
  ) {
    if (disconnectingRef.current) {
      return;
    }

    disconnectingRef.current = true;
    setStatus("ending");
    clearTimers();

    const room = roomRef.current;
    const roomName = roomNameRef.current;
    roomRef.current = null;
    roomNameRef.current = null;

    try {
      if (room && room.state !== ConnectionState.Disconnected) {
        await room.disconnect();
      }
    } catch (error) {
      console.error("Failed to disconnect room", error);
    } finally {
      clearAudioElements();
      setVideoTrack(null);
      setIsMicEnabled(false);
    }

    if (roomName) {
      try {
        await fetch(`/api/session?roomName=${encodeURIComponent(roomName)}`, {
          method: "DELETE",
          cache: "no-store",
          keepalive: options?.keepalive ?? false,
        });
      } catch (error) {
        console.error("Failed to delete room", error);
      }
    }

    if (!options?.skipStateReset) {
      setSession(null);
      setStatus("idle");
      if (reason === "idle") {
        setNotice("Session ended after inactivity to conserve trial credits.");
      } else if (reason === "hidden") {
        setNotice("Session ended because the tab stayed hidden too long.");
      } else if (reason === "manual") {
        setNotice("Session ended.");
      } else if (reason === "connection-error") {
        setNotice("Connection ended unexpectedly.");
      } else if (reason === "room-ended") {
        setNotice("Room closed.");
      }
    }

    disconnectingRef.current = false;
  }

  async function startSession() {
    if (status === "creating" || status === "connecting" || status === "live") {
      return;
    }

    setErrorMessage(null);
    setNotice(null);
    setChatMessages([]);
    setStatus("creating");

    let payload: SessionPayload | null = null;

    try {
      const response = await fetch("/api/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ displayName }),
      });

      if (!response.ok) {
        throw new Error("Failed to create LiveKit session");
      }

      payload = (await response.json()) as SessionPayload;
      const room = createRoomInstance();
      bindRoomEvents(room);

      roomRef.current = room;
      roomNameRef.current = payload.roomName;
      setSession(payload);
      setStatus("connecting");

      await room.connect(payload.wsUrl, payload.token);
      await room.localParticipant.setMicrophoneEnabled(true);

      setIsMicEnabled(true);
      setStatus("live");
      scheduleSessionTimers();
    } catch (error) {
      console.error(error);
      if (payload?.roomName) {
        void fetch(`/api/session?roomName=${encodeURIComponent(payload.roomName)}`, {
          method: "DELETE",
          cache: "no-store",
        });
      }
      setErrorMessage(error instanceof Error ? error.message : "Failed to start the session");
      setStatus("error");
      roomRef.current = null;
      roomNameRef.current = null;
      setSession(null);
    }
  }

  async function toggleMicrophone() {
    const room = roomRef.current;
    if (!room) {
      return;
    }

    const nextState = !isMicEnabled;
    await room.localParticipant.setMicrophoneEnabled(nextState);
    setIsMicEnabled(nextState);
    scheduleSessionTimers();
  }

  async function sendChat() {
    const room = roomRef.current;
    const text = chatInput.trim();
    if (!room || !text) {
      return;
    }

    await room.localParticipant.sendText(text, { topic: "lk.chat" });
    setChatInput("");
    scheduleSessionTimers();
  }

  return (
    <main className="shell">
      <section className="hero">
        <div className="copy">
          <p className="eyebrow">AI Avatar Portfolio</p>
          <h1>Talk to Hemanth&apos;s interview-ready avatar in real time.</h1>
          <p className="lede">
            This interface connects to a LiveKit room only when you ask it to, streams the Simli
            avatar into the browser, and automatically tears the room down when it sits idle.
          </p>

          <div className="control-card">
            <label className="label" htmlFor="displayName">
              Your name
            </label>
            <input
              id="displayName"
              className="input"
              value={displayName}
              maxLength={48}
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder="Recruiter name"
            />

            <div className="actions">
              <button
                className="primaryButton"
                disabled={status === "creating" || status === "connecting" || isPending}
                onClick={() => void startSession()}
              >
                {status === "creating" || status === "connecting" ? "Starting..." : "Start session"}
              </button>

              <button
                className="secondaryButton"
                disabled={status !== "live" || isPending}
                onClick={() => void teardownSession("manual")}
              >
                End session
              </button>
            </div>

            <div className="metaGrid">
              <div>
                <span className="metaLabel">Room</span>
                <strong>{sessionLabel}</strong>
              </div>
              <div>
                <span className="metaLabel">Mic</span>
                <strong>{isMicEnabled ? "On" : "Off"}</strong>
              </div>
              <div>
                <span className="metaLabel">Status</span>
                <strong>{status}</strong>
              </div>
            </div>

            <div className="toolbar">
              <button
                className="ghostButton"
                disabled={status !== "live"}
                onClick={() => void toggleMicrophone()}
              >
                {isMicEnabled ? "Mute microphone" : "Unmute microphone"}
              </button>
              <span className="hint">Auto-disconnect after 3 minutes idle or 45 seconds hidden.</span>
            </div>

            {warningCountdownMs !== null ? (
              <div className="warningBanner">
                Session ends in {formatCountdown(warningCountdownMs)} unless activity resumes.
              </div>
            ) : null}

            {notice ? <div className="notice">{notice}</div> : null}
            {errorMessage ? <div className="error">{errorMessage}</div> : null}
          </div>

          <div className="chatCard">
            <div className="chatHeader">
              <strong>Chat fallback</strong>
              <span className="hint">Type if voice input is unreliable</span>
            </div>

            <div className="chatLog">
              {chatMessages.length === 0 ? (
                <p className="chatEmpty">No messages yet.</p>
              ) : (
                chatMessages.map((message) => (
                  <div key={message.id} className={`chatBubble chatBubble--${message.author}`}>
                    <span className="metaLabel">{message.author}</span>
                    <p>{message.text}</p>
                  </div>
                ))
              )}
            </div>

            <div className="chatComposer">
              <input
                className="input"
                value={chatInput}
                onChange={(event) => setChatInput(event.target.value)}
                placeholder="Type a question to Hemanth's assistant"
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    void sendChat();
                  }
                }}
              />
              <button
                className="ghostButton"
                disabled={status !== "live" || !chatInput.trim()}
                onClick={() => void sendChat()}
              >
                Send
              </button>
            </div>
          </div>
        </div>

        <div className="stage">
          <div className="videoFrame">
            <video ref={videoElementRef} autoPlay playsInline muted={false} />
            {!videoTrack ? (
              <div className="videoFallback">
                <p>Avatar feed will appear here after the LiveKit session comes online.</p>
              </div>
            ) : null}
          </div>

          <div className="stageFooter">
            <div>
              <span className="metaLabel">Optimization</span>
              <strong>Manual connect + forced room teardown</strong>
            </div>
            <div>
              <span className="metaLabel">Agent persona</span>
              <strong>Loaded from propmt.txt</strong>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
