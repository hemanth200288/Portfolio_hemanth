# Hemanth AI Avatar Portfolio

This repo now contains two parts:

1. A Python LiveKit + Simli avatar backend
2. A production-oriented Next.js frontend for the browser UI

The frontend is designed so the avatar session only starts when a visitor explicitly clicks `Start session`, and it automatically tears the room down on inactivity or when the tab is hidden. That matters on free-tier LiveKit and Simli usage.

## Architecture

- `agent_worker.py`
  Loads persona instructions from `propmt.txt`, runs the LiveKit voice agent, and sends TTS output to the avatar worker.
- `dispatcher.py`
  Launches `simli_avatar_runner.py` for each room.
- `app/`
  Next.js App Router UI and API routes.
- `components/avatar-studio.tsx`
  Browser client that connects to LiveKit, renders the avatar track, publishes microphone audio, and auto-disconnects on idle.
- `app/api/session/route.ts`
  Server-side token and room lifecycle endpoint for the frontend.

## Environment

Add these variables to your local `.env` for Python and to your deployment environment for Next.js:

```env
LIVEKIT_API_KEY=<your-livekit-api-key>
LIVEKIT_API_SECRET=<your-livekit-api-secret>
LIVEKIT_URL=<your-livekit-url>

DEEPGRAM_API_KEY=<your-deepgram-api-key>
OPENAI_API_KEY=<your-openai-api-key>
OPENROUTER_API_KEY=<your-openrouter-api-key>
ELEVEN_API_KEY=<your-eleven-api-key>
ELEVEN_VOICE_ID=<your-elevenlabs-voice-id>

SIMLI_API_KEY=<your-simli-api-key>
SIMLI_FACE_ID=<your-simli-face-id>
```

## Run The Python Backend

Use your Windows environment, since that is where your working Python + Simli setup already exists:

```powershell
python dispatcher.py
```

In another terminal:

```powershell
python agent_worker.py dev --avatar-url http://localhost:8089/launch
```

## Run The Next.js Frontend

Install dependencies:

```bash
npm install
```

Start development mode:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Trial-Saving Behavior

The frontend conserves trial usage in four ways:

1. It does not connect automatically on page load.
2. It creates a new room only when a session is started.
3. It deletes the room when the user ends the session.
4. It auto-ends the session after 3 minutes of inactivity or 45 seconds with the tab hidden.

The room is also created with short LiveKit room timeouts:

- `emptyTimeout: 10`
- `departureTimeout: 15`

## Deploy

For Vercel or a similar frontend host:

1. Deploy the Next.js app in this repo.
2. Set the LiveKit environment variables in the deployment dashboard.
3. Keep the Python worker and dispatcher on a separate machine or service.
4. Make sure that worker uses the same LiveKit project credentials as the frontend.

The browser frontend does not host Simli or the LiveKit agent itself. It only joins rooms and renders the published avatar/audio tracks.
