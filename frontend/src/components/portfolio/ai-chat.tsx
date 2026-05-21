"use client";

import { useEffect, useRef, useState, useTransition, useMemo, useCallback } from "react";
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
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  Mic,
  MicOff,
  Phone,
  PhoneOff,
  Send,
  Bot,
  User,
  AlertCircle,
  Loader2,
} from "lucide-react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

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

type StudioStatus =
  | "idle"
  | "creating"
  | "connecting"
  | "live"
  | "ending"
  | "error";

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

export function AIChat() {
  const [status, setStatus] = useState<StudioStatus>("idle");
  const [displayName, setDisplayName] = useState("Visitor");
  const [session, setSession] = useState<SessionPayload | null>(null);
  const [videoTrack, setVideoTrack] = useState<RemoteVideoTrack | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isMicEnabled, setIsMicEnabled] = useState(false);
  const [warningCountdownMs, setWarningCountdownMs] = useState<number | null>(
    null
  );
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isPending, startTransition] = useTransition();

  const roomRef = useRef<Room | null>(null);
  const roomNameRef = useRef<string | null>(null);
  const videoElementRef = useRef<HTMLVideoElement | null>(null);
  const audioElementsRef = useRef<Map<string, HTMLAudioElement>>(new Map());
  const idleWarnTimeoutRef = useRef<ReturnType<typeof window.setTimeout> | null>(
    null
  );
  const idleDisconnectTimeoutRef = useRef<
    ReturnType<typeof window.setTimeout> | null
  >(null);
  const warningIntervalRef = useRef<ReturnType<typeof window.setInterval> | null>(
    null
  );
  const hiddenDisconnectTimeoutRef = useRef<
    ReturnType<typeof window.setTimeout> | null
  >(null);
  const disconnectingRef = useRef(false);
  const chatLogRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);

  const idleTimeoutMs = session?.idleTimeoutMs ?? DEFAULT_IDLE_TIMEOUT_MS;
  const warningTimeoutMs =
    session?.warningTimeoutMs ?? DEFAULT_WARNING_TIMEOUT_MS;
  const hiddenTimeoutMs =
    session?.hiddenTimeoutMs ?? DEFAULT_HIDDEN_TIMEOUT_MS;

  const sessionLabel = useMemo(() => {
    if (!session?.roomName) return "Not connected";
    return session.roomName;
  }, [session?.roomName]);

  // ─── GSAP Scroll Animation ─────────────────────────────────────
  useEffect(() => {
    if (!sectionRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".aichat-heading",
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          ease: "power2.out",
          scrollTrigger: {
            trigger: ".aichat-heading",
            start: "top 85%",
            once: true,
          },
        }
      );

      gsap.fromTo(
        ".aichat-panel",
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.7,
          ease: "power2.out",
          scrollTrigger: {
            trigger: ".aichat-panel",
            start: "top 85%",
            once: true,
          },
        }
      );
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  // ─── Video track attachment ─────────────────────────────────────
  useEffect(() => {
    if (!videoElementRef.current || !videoTrack) return;
    videoTrack.attach(videoElementRef.current);
    return () => {
      videoTrack.detach(videoElementRef.current!);
    };
  }, [videoTrack]);

  // ─── Auto-scroll chat ───────────────────────────────────────────
  useEffect(() => {
    if (chatLogRef.current) {
      chatLogRef.current.scrollTop = chatLogRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // ─── Page visibility ────────────────────────────────────────────
  useEffect(() => {
    const onPageHide = () => {
      if (roomNameRef.current) {
        void teardownSession("page-exit", {
          skipStateReset: true,
          keepalive: true,
        });
      }
    };
    window.addEventListener("pagehide", onPageHide);
    return () => window.removeEventListener("pagehide", onPageHide);
  }, []);

  // ─── Activity & visibility timers ───────────────────────────────
  useEffect(() => {
    const bumpActivity = () => {
      if (status === "live") scheduleSessionTimers();
    };
    const handleVisibility = () => {
      if (status !== "live") return;
      if (document.visibilityState === "hidden") {
        if (hiddenDisconnectTimeoutRef.current)
          clearTimeout(hiddenDisconnectTimeoutRef.current);
        hiddenDisconnectTimeoutRef.current = setTimeout(() => {
          void teardownSession("hidden");
        }, hiddenTimeoutMs);
        return;
      }
      if (hiddenDisconnectTimeoutRef.current) {
        clearTimeout(hiddenDisconnectTimeoutRef.current);
        hiddenDisconnectTimeoutRef.current = null;
      }
      scheduleSessionTimers();
    };
    const events: Array<keyof WindowEventMap> = [
      "pointerdown",
      "keydown",
      "focus",
      "touchstart",
    ];
    events.forEach((e) => window.addEventListener(e, bumpActivity));
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      events.forEach((e) => window.removeEventListener(e, bumpActivity));
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [hiddenTimeoutMs, status]);

  // ─── Timer helpers ──────────────────────────────────────────────
  function clearTimers() {
    if (idleWarnTimeoutRef.current) {
      clearTimeout(idleWarnTimeoutRef.current);
      idleWarnTimeoutRef.current = null;
    }
    if (idleDisconnectTimeoutRef.current) {
      clearTimeout(idleDisconnectTimeoutRef.current);
      idleDisconnectTimeoutRef.current = null;
    }
    if (warningIntervalRef.current) {
      clearInterval(warningIntervalRef.current);
      warningIntervalRef.current = null;
    }
    if (hiddenDisconnectTimeoutRef.current) {
      clearTimeout(hiddenDisconnectTimeoutRef.current);
      hiddenDisconnectTimeoutRef.current = null;
    }
    setWarningCountdownMs(null);
  }

  function scheduleSessionTimers() {
    clearTimers();
    if (!roomRef.current || roomRef.current.state !== ConnectionState.Connected)
      return;
    const warningStartsInMs = Math.max(idleTimeoutMs - warningTimeoutMs, 0);
    const disconnectAt = Date.now() + idleTimeoutMs;
    idleWarnTimeoutRef.current = setTimeout(() => {
      setWarningCountdownMs(Math.max(disconnectAt - Date.now(), 0));
      warningIntervalRef.current = setInterval(() => {
        const remaining = Math.max(disconnectAt - Date.now(), 0);
        setWarningCountdownMs(remaining);
        if (remaining <= 0 && warningIntervalRef.current) {
          clearInterval(warningIntervalRef.current);
          warningIntervalRef.current = null;
        }
      }, 1000);
    }, warningStartsInMs);
    idleDisconnectTimeoutRef.current = setTimeout(() => {
      void teardownSession("idle");
    }, idleTimeoutMs);
  }

  function clearAudioElements() {
    audioElementsRef.current.forEach((el) => {
      el.pause();
      el.srcObject = null;
      el.remove();
    });
    audioElementsRef.current.clear();
  }

  function pushChatMessage(message: ChatMessage) {
    setChatMessages((current) => [...current, message]);
  }

  // ─── Room event handlers ────────────────────────────────────────
  const handleTrackSubscribed = useCallback(
    (
      track: RemoteTrack,
      publication: RemoteTrackPublication,
      participant: RemoteParticipant
    ) => {
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
    },
    [videoTrack]
  );

  const handleTrackUnsubscribed = useCallback(
    (track: RemoteTrack, publication: RemoteTrackPublication) => {
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
    },
    [videoTrack]
  );

  function bindRoomEvents(room: Room) {
    room.registerTextStreamHandler(
      "lk.chat",
      async (reader, participantInfo) => {
        const text = await reader.readAll();
        pushChatMessage({
          id: `${reader.info.id}-chat`,
          author:
            participantInfo.identity === room.localParticipant.identity
              ? "user"
              : "agent",
          text,
        });
      }
    );

    room.registerTextStreamHandler(
      "lk.transcription",
      async (reader, participantInfo) => {
        const text = await reader.readAll();
        if (!text.trim()) return;
        pushChatMessage({
          id: `${reader.info.id}-transcript`,
          author:
            participantInfo.identity === room.localParticipant.identity
              ? "user"
              : "agent",
          text,
        });
      }
    );

    room
      .on(RoomEvent.TrackSubscribed, handleTrackSubscribed)
      .on(RoomEvent.TrackUnsubscribed, handleTrackUnsubscribed)
      .on(RoomEvent.Disconnected, () => {
        if (!disconnectingRef.current) {
          startTransition(() => {
            setNotice(
              "Session ended. Connect again when you want to speak with the avatar."
            );
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

  // ─── Session lifecycle ──────────────────────────────────────────
  async function teardownSession(
    reason: DisconnectReason,
    options?: { skipStateReset?: boolean; keepalive?: boolean }
  ) {
    if (disconnectingRef.current) return;
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
    } catch (err) {
      console.error("Failed to disconnect room", err);
    } finally {
      clearAudioElements();
      setVideoTrack(null);
      setIsMicEnabled(false);
    }

    if (roomName) {
      try {
        await fetch(
          `/api/session?roomName=${encodeURIComponent(roomName)}`,
          {
            method: "DELETE",
            cache: "no-store",
            keepalive: options?.keepalive ?? false,
          }
        );
      } catch (err) {
        console.error("Failed to delete room", err);
      }
    }

    if (!options?.skipStateReset) {
      setSession(null);
      setStatus("idle");
      const reasonMessages: Record<string, string> = {
        idle: "Session ended after inactivity.",
        hidden: "Session ended because the tab was hidden too long.",
        manual: "Session ended.",
        "connection-error": "Connection ended unexpectedly.",
        "room-ended": "Room closed.",
      };
      setNotice(reasonMessages[reason] || "Session ended.");
    }
    disconnectingRef.current = false;
  }

  async function startSession() {
    if (status === "creating" || status === "connecting" || status === "live")
      return;
    setErrorMessage(null);
    setNotice(null);
    setChatMessages([]);
    setStatus("creating");

    let payload: SessionPayload | null = null;
    try {
      const response = await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName }),
      });
      if (!response.ok) throw new Error("Failed to create LiveKit session");
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
        void fetch(
          `/api/session?roomName=${encodeURIComponent(payload.roomName)}`,
          { method: "DELETE", cache: "no-store" }
        );
      }
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to start the session"
      );
      setStatus("error");
      roomRef.current = null;
      roomNameRef.current = null;
      setSession(null);
    }
  }

  async function toggleMicrophone() {
    const room = roomRef.current;
    if (!room) return;
    const nextState = !isMicEnabled;
    await room.localParticipant.setMicrophoneEnabled(nextState);
    setIsMicEnabled(nextState);
    scheduleSessionTimers();
  }

  async function sendChat() {
    const room = roomRef.current;
    const text = chatInput.trim();
    if (!room || !text) return;
    await room.localParticipant.sendText(text, { topic: "lk.chat" });
    setChatInput("");
    scheduleSessionTimers();
  }

  // ─── Status indicator ───────────────────────────────────────────
  const statusColors: Record<StudioStatus, string> = {
    idle: "bg-slate-500",
    creating: "bg-yellow-400 animate-pulse",
    connecting: "bg-yellow-400 animate-pulse",
    live: "bg-emerald-400 animate-pulse",
    ending: "bg-orange-400",
    error: "bg-red-400",
  };

  return (
    <section
      id="ai-chat"
      ref={sectionRef}
      className="py-20 md:py-32 px-4 sm:px-6"
    >
      <div className="max-w-6xl mx-auto">
        {/* Heading */}
        <div className="aichat-heading mb-8">
          <p className="text-emerald-400 text-sm font-medium tracking-wider uppercase mb-2">
            AI Assistant
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            Talk to My AI Avatar
          </h2>
          <p className="text-slate-500 text-sm mt-2">
            Chat with an AI that knows everything about my experience, skills,
            and projects.
          </p>
        </div>

        {/* Main panel — Avatar LEFT, Chat RIGHT */}
        <div className="aichat-panel grid lg:grid-cols-[1fr_1.2fr] gap-4">
          {/* LEFT — Avatar */}
          <div className="flex flex-col bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
            {/* Video / Fallback */}
            <div className="relative flex-1 min-h-[280px] md:min-h-[360px] bg-gradient-to-br from-emerald-500/5 via-transparent to-teal-500/5 flex items-center justify-center">
              <video
                ref={videoElementRef}
                autoPlay
                playsInline
                muted={false}
                className="absolute inset-0 w-full h-full object-cover"
                style={{ display: videoTrack ? "block" : "none" }}
              />
              {!videoTrack && (
                <div className="text-center px-6">
                  <div className="w-20 h-20 mx-auto mb-4 bg-emerald-500/10 rounded-full flex items-center justify-center">
                    <Bot size={32} className="text-emerald-400" />
                  </div>
                  <p className="text-sm text-slate-500">
                    {status === "idle"
                      ? "Start a session to see the AI avatar"
                      : status === "creating"
                      ? "Creating session..."
                      : status === "connecting"
                      ? "Connecting to avatar..."
                      : status === "live"
                      ? "Avatar connecting..."
                      : status === "error"
                      ? "Connection failed"
                      : "Session ending..."}
                  </p>
                </div>
              )}
            </div>

            {/* Avatar Controls */}
            <div className="p-4 border-t border-white/[0.06] space-y-3">
              {/* Status row */}
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${statusColors[status]}`}
                  />
                  <span className="text-slate-400 capitalize">{status}</span>
                </div>
                <span className="text-xs text-slate-600 font-mono">
                  {sessionLabel !== "Not connected" ? sessionLabel : ""}
                </span>
              </div>

              {/* Name input (when idle) */}
              {status === "idle" && (
                <input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your name"
                  maxLength={48}
                  className="w-full px-3 py-2 text-sm bg-white/[0.04] border border-white/[0.08] rounded-lg text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500/40"
                />
              )}

              {/* Action buttons */}
              <div className="flex gap-2">
                {status === "idle" || status === "error" ? (
                  <button
                    onClick={() => void startSession()}
                    disabled={isPending}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium bg-gradient-to-r from-emerald-500 to-teal-500 text-[#0a0f1a] rounded-lg hover:shadow-lg hover:shadow-emerald-500/20 transition-all disabled:opacity-50"
                  >
                    <Phone size={14} />
                    Start Session
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => void toggleMicrophone()}
                      disabled={status !== "live"}
                      className="inline-flex items-center justify-center gap-2 px-3 py-2.5 text-sm bg-white/[0.06] border border-white/[0.08] rounded-lg text-white hover:bg-white/[0.1] transition-colors disabled:opacity-40"
                    >
                      {isMicEnabled ? (
                        <Mic size={14} />
                      ) : (
                        <MicOff size={14} />
                      )}
                    </button>
                    <button
                      onClick={() => void teardownSession("manual")}
                      disabled={status === "ending"}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors disabled:opacity-40"
                    >
                      <PhoneOff size={14} />
                      End
                    </button>
                  </>
                )}
              </div>

              {/* Warning banner */}
              {warningCountdownMs !== null && (
                <div className="flex items-center gap-2 px-3 py-2 text-xs bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 rounded-lg">
                  <AlertCircle size={12} />
                  Ends in {formatCountdown(warningCountdownMs)} unless active
                </div>
              )}

              {/* Notice */}
              {notice && (
                <div className="px-3 py-2 text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg">
                  {notice}
                </div>
              )}

              {/* Error */}
              {errorMessage && (
                <div className="px-3 py-2 text-xs bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg">
                  {errorMessage}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT — Chat Panel */}
          <div className="flex flex-col bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden min-h-[400px] md:min-h-[500px]">
            {/* Chat header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <Bot size={16} className="text-emerald-400" />
                <span className="text-sm font-medium text-white">
                  Chat with Hemanth&apos;s AI
                </span>
              </div>
              <span className="text-xs text-slate-600">
                {status === "live" ? "Online" : "Offline"}
              </span>
            </div>

            {/* Chat messages */}
            <div
              ref={chatLogRef}
              className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[400px] md:max-h-[500px]"
            >
              {chatMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="w-12 h-12 bg-white/[0.03] rounded-full flex items-center justify-center mb-3">
                    <Bot size={20} className="text-slate-600" />
                  </div>
                  <p className="text-sm text-slate-600">
                    {status === "live"
                      ? "Ask me anything about Hemanth..."
                      : "Start a session to begin chatting"}
                  </p>
                  <p className="text-xs text-slate-700 mt-1">
                    Voice or text — the AI responds to both
                  </p>
                </div>
              ) : (
                chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-2 ${
                      msg.author === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    {msg.author !== "user" && (
                      <div className="w-6 h-6 shrink-0 bg-emerald-500/10 rounded-full flex items-center justify-center mt-1">
                        <Bot size={12} className="text-emerald-400" />
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] px-3 py-2 rounded-xl text-sm leading-relaxed ${
                        msg.author === "user"
                          ? "bg-emerald-500/10 text-emerald-100 border border-emerald-500/15"
                          : msg.author === "agent"
                          ? "bg-white/[0.04] text-slate-300 border border-white/[0.06]"
                          : "bg-yellow-500/10 text-yellow-200 border border-yellow-500/15"
                      }`}
                    >
                      {msg.text}
                    </div>
                    {msg.author === "user" && (
                      <div className="w-6 h-6 shrink-0 bg-white/[0.06] rounded-full flex items-center justify-center mt-1">
                        <User size={12} className="text-slate-400" />
                      </div>
                    )}
                  </div>
                ))
              )}

              {/* Typing indicator when creating/connecting */}
              {(status === "creating" || status === "connecting") && (
                <div className="flex gap-2 justify-start">
                  <div className="w-6 h-6 shrink-0 bg-emerald-500/10 rounded-full flex items-center justify-center mt-1">
                    <Bot size={12} className="text-emerald-400" />
                  </div>
                  <div className="px-3 py-2 bg-white/[0.04] border border-white/[0.06] rounded-xl">
                    <div className="flex items-center gap-1">
                      <Loader2
                        size={12}
                        className="text-emerald-400 animate-spin"
                      />
                      <span className="text-xs text-slate-500">
                        Connecting to AI...
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Chat input */}
            <div className="p-3 border-t border-white/[0.06]">
              <div className="flex gap-2">
                <input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      void sendChat();
                    }
                  }}
                  placeholder={
                    status === "live"
                      ? "Type a message..."
                      : "Start a session to chat"
                  }
                  disabled={status !== "live"}
                  className="flex-1 px-3 py-2.5 text-sm bg-white/[0.04] border border-white/[0.08] rounded-lg text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500/40 disabled:opacity-40"
                />
                <button
                  onClick={() => void sendChat()}
                  disabled={status !== "live" || !chatInput.trim()}
                  className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/20 transition-colors disabled:opacity-30"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
