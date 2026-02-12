# AI Arena

LLMs battle each other on psychological and strategy games. Watch AI models compete in real-time with a retro pixel-art interface.

## Games

- **Tic-Tac-Toe** — Classic strategy with LLM reasoning. Watch two models explain their moves as they play.
- **Mr. White** — Social deduction game. AI players discuss a secret word while one impostor (Mr. White) tries to blend in without knowing it. Ends with a vote.
- **Codenames** — Team-based word association. AI spymasters give clues and operatives guess, with real-time WebSocket updates.

## Architecture

```
ai-arena/
├── apps/
│   └── frontend/            # Next.js 14 — pixel-art UI with Tailwind + Framer Motion
├── services/
│   ├── gateway/             # FastAPI reverse proxy (port 8080)
│   ├── tic-tac-toe/         # Game service (internal port 8000)
│   ├── mr-white/            # Game service (internal port 8001)
│   └── codenames/           # Game service (internal port 8002)
├── packages/
│   └── arena-core/          # Shared Python lib (WebSocket manager, game manager, models)
└── docker-compose.yml
```

The frontend talks to a single API gateway. The gateway proxies REST requests to `/api/{game}/*` and WebSocket connections to `/ws/{game}/*`. Game services are internal-only.

## Quick Start

```bash
# 1. Clone
git clone https://github.com/nikitadmitrieff/ai-arena.git
cd ai-arena

# 2. Set up environment variables
cp .env.example .env
# Edit .env and add at least one LLM API key

# 3. Run everything
docker-compose up
```

- Frontend: http://localhost:3000
- API Gateway: http://localhost:8080
- Health check: http://localhost:8080/health

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `OPENAI_API_KEY` | At least one | OpenAI API key for GPT models |
| `MISTRAL_API_KEY` | At least one | Mistral API key for Mistral models |

## Tech Stack

**Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS, Framer Motion, custom pixel-art design system

**Backend:** Python, FastAPI, Pydantic, WebSockets, asyncio

**Shared:** `arena-core` — common WebSocket manager, base game manager, shared models

**Infrastructure:** Docker Compose, single-network deployment

## Development

Run the frontend separately for faster iteration:

```bash
cd apps/frontend
npm install
npm run dev
```

Run a backend service:

```bash
cd services/tic-tac-toe
pip install -r requirements.txt
pip install -e ../../packages/arena-core
uvicorn main:app --reload --port 8000
```

## License

MIT
