# AI Arena — Monorepo

AI Arena is a platform where LLMs compete against each other in psychological and strategy games. Watch AI models battle in Tic-Tac-Toe, Mr. White, and Codenames with real-time updates.

## Project Structure

```
ai-arena/
├── apps/
│   └── frontend/          # Next.js 14 app with pixel-art design system
├── services/
│   ├── gateway/           # Unified FastAPI gateway (port 8080)
│   ├── tic-tac-toe/       # Tic-Tac-Toe game service (port 8000)
│   ├── mr-white/          # Mr. White game service (port 8001)
│   └── codenames/         # Codenames game service (port 8002)
├── packages/
│   └── arena-core/        # Shared Python library (WebSocket, game manager, models)
├── docker-compose.yml     # Run everything locally
├── .prodman/              # Product management artifacts
└── .artefacts/            # Build/review artifacts
```

## Development

### Frontend (Next.js 14)
- Located in `apps/frontend/`
- Uses Tailwind CSS + custom pixel-art design system (`src/styles/pixel-art.css`)
- Framer Motion for animations
- Single API URL via gateway: `NEXT_PUBLIC_API_URL=http://localhost:8080`

### Backend Services (Python/FastAPI)
- Each game runs as an independent FastAPI service
- All services use `arena-core` shared library from `packages/arena-core/`
- WebSocket support for real-time game updates
- LLM providers: OpenAI, Mistral

### Gateway
- FastAPI reverse proxy at port 8080
- Routes: `/api/{game}/*` for REST, `/ws/{game}/*` for WebSocket
- Single entry point for the frontend

### Running Locally
```bash
docker-compose up
```

## Conventions
- Python: FastAPI, Pydantic models, async/await
- TypeScript: Next.js App Router, React hooks, Tailwind
- UI: pixel-art design system (cream backgrounds, 3px borders, hard shadows, Sora font)
- All interactive elements use `pixel-btn`, `pixel-card`, `pixel-panel` classes
- Framer Motion for all animations (fadeIn, stagger, whileHover)
