from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]


def read_project_file(name: str) -> str:
    return (PROJECT_ROOT / name).read_text(encoding="utf-8")


def test_python_entrypoints_compile() -> None:
    for name in ("agent_worker.py", "dispatcher.py", "simli_avatar_runner.py"):
        source = read_project_file(name)
        compile(source, name, "exec")


def test_prompt_file_exists_and_has_content() -> None:
    prompt = read_project_file("propmt.txt").strip()
    assert prompt
    assert "Hemanth Kumar Chittiprolu" in prompt


def test_agent_worker_loads_prompt_file() -> None:
    source = read_project_file("agent_worker.py")
    assert 'PROMPT_PATH = THIS_DIR / "propmt.txt"' in source
    assert "instructions = load_agent_instructions()" in source
    assert 'os.getenv("ELEVEN_VOICE_ID"' in source


def test_simli_runner_propagates_audio_segment_end() -> None:
    source = read_project_file("simli_avatar_runner.py")
    assert "await self._data_ch.put(AudioSegmentEnd())" in source


def test_nextjs_session_api_has_room_cleanup() -> None:
    source = read_project_file("app/api/session/route.ts")
    assert "createRoom" in source
    assert "deleteRoom" in source
    assert "emptyTimeout: 10" in source
    assert "departureTimeout: 15" in source
