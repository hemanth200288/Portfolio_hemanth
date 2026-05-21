import asyncio
import argparse
import logging
import os
import sys
from dataclasses import asdict, dataclass
from functools import partial
from pathlib import Path

import httpx
from dotenv import load_dotenv

from livekit import api, rtc
from livekit.agents import JobContext, JobProcess, WorkerOptions, WorkerType, cli
from livekit.agents.voice import Agent, AgentSession
from livekit.agents.voice.avatar import DataStreamAudioOutput
from livekit.agents.voice.io import PlaybackFinishedEvent
from livekit.agents.voice.room_io import ATTRIBUTE_PUBLISH_ON_BEHALF, RoomOutputOptions
from livekit.plugins import deepgram, elevenlabs, openai, silero

logger = logging.getLogger("avatar-example")
logger.setLevel(logging.INFO)

load_dotenv()


AVATAR_IDENTITY = "avatar_worker"
THIS_DIR = Path(__file__).parent.resolve()
PROMPT_PATH = THIS_DIR / "propmt.txt"
DEFAULT_PROMPT = (
    "You are Hemanth Kumar Chittiprolu's personal AI assistant. "
    "Answer in first person on his behalf, stay concise, and keep responses professional."
)
DEFAULT_ELEVEN_VOICE_ID = "TX3LPaxmHKxFdv7VOQHJ"


@dataclass
class AvatarConnectionInfo:
    room_name: str
    url: str
    """LiveKit server URL"""
    token: str
    """Token for avatar worker to join"""


def load_agent_instructions() -> str:
    if PROMPT_PATH.exists():
        return PROMPT_PATH.read_text(encoding="utf-8").strip()
    logger.warning("Prompt file %s not found, using fallback instructions", PROMPT_PATH)
    return DEFAULT_PROMPT


async def launch_avatar_worker(
    ctx: JobContext, avatar_dispatcher_url: str, avatar_identity: str
) -> None:
    """Wait for worker participant to join and start streaming"""
    # create a token for the avatar worker
    agent_identity = ctx.room.local_participant.identity
    token = (
        api.AccessToken()
        .with_identity(avatar_identity)
        .with_name("Avatar Runner")
        .with_grants(api.VideoGrants(room_join=True, room=ctx.room.name))
        .with_kind("agent")
        .with_attributes({ATTRIBUTE_PUBLISH_ON_BEHALF: agent_identity})
        .to_jwt()
    )

    logger.info(f"Sending connection info to avatar dispatcher {avatar_dispatcher_url}")
    connection_info = AvatarConnectionInfo(room_name=ctx.room.name, url=ctx._info.url, token=token)
    async with httpx.AsyncClient() as client:
        response = await client.post(avatar_dispatcher_url, json=asdict(connection_info))
        response.raise_for_status()
    logger.info("Avatar handshake completed")

    # wait for the remote participant to join
    await ctx.wait_for_participant(
        identity=avatar_identity, kind=rtc.ParticipantKind.PARTICIPANT_KIND_AGENT
    )
    logger.info("Avatar runner joined")

def prewarm(proc: JobProcess):
    proc.userdata["vad"] = silero.VAD.load()

async def entrypoint(ctx: JobContext, avatar_dispatcher_url: str):
    await ctx.connect()

    voice_id = os.getenv("ELEVEN_VOICE_ID", DEFAULT_ELEVEN_VOICE_ID)
    instructions = load_agent_instructions()
    stop_event = asyncio.Event()

    agent = Agent(
        instructions=instructions,
    )

    session = AgentSession(
        vad=ctx.proc.userdata["vad"],
        llm=openai.LLM(
            model="deepseek/deepseek-chat",
            base_url="https://openrouter.ai/api/v1",
            api_key=os.getenv("OPENROUTER_API_KEY"),
        ),
        stt=deepgram.STT(model="nova-3"),
        tts=elevenlabs.TTS(voice_id=voice_id, api_key=os.getenv("ELEVEN_API_KEY")),
    )

    # wait for the participant to join the room and the avatar worker to connect
    await launch_avatar_worker(ctx, avatar_dispatcher_url, AVATAR_IDENTITY)

    # connect the output audio to the avatar runner
    session.output.audio = DataStreamAudioOutput(ctx.room, destination_identity=AVATAR_IDENTITY)

    # start agent with room input and room text output
    await session.start(
        agent=agent,
        room=ctx.room,
        room_output_options=RoomOutputOptions(audio_enabled=False, transcription_enabled=True),
    )

    @session.output.audio.on("playback_finished")
    def on_playback_finished(ev: PlaybackFinishedEvent) -> None:
        logger.info(
            "playback_finished",
            extra={
                "playback_position": ev.playback_position,
                "interrupted": ev.interrupted,
            },
        )

    @session.on("user_input_transcribed")
    def on_user_input_transcribed(event) -> None:
        logger.info(
            "user_input_transcribed",
            extra={
                "transcript": event.transcript,
                "is_final": event.is_final,
                "language": event.language,
            },
        )

    @session.on("agent_state_changed")
    def on_agent_state_changed(event) -> None:
        logger.info("agent_state_changed", extra={"state": event.new_state})

    @session.on("conversation_item_added")
    def on_conversation_item_added(event) -> None:
        logger.info(
            "conversation_item_added",
            extra={
                "role": getattr(event.item, "role", None),
                "text": getattr(event.item, "text_content", None),
            },
        )

    def on_participant_disconnected(participant: rtc.RemoteParticipant) -> None:
        if participant.kind == rtc.ParticipantKind.PARTICIPANT_KIND_STANDARD:
            logger.info("Client participant disconnected, closing session")
            stop_event.set()

    ctx.room.on("participant_disconnected", on_participant_disconnected)
    ctx.room.on("disconnected", lambda *_: stop_event.set())

    try:
        await stop_event.wait()
    finally:
        await session.aclose()


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--avatar-url", type=str, default="http://localhost:8089/launch")
    args, remaining_args = parser.parse_known_args()
    print(sys.argv, remaining_args)
    sys.argv = sys.argv[:1] + remaining_args

    # WorkerType.ROOM is the default worker type which will create an agent for every room.
    # You can also use WorkerType.PUBLISHER to create a single agent for all participants that publish a track.
    cli.run_app(
        WorkerOptions(
            entrypoint_fnc=partial(entrypoint, avatar_dispatcher_url=args.avatar_url),
            prewarm_fnc=prewarm,
            worker_type=WorkerType.ROOM,
        )
    )
