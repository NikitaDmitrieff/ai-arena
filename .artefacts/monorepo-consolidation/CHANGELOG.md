# Changelog — Monorepo Consolidation & UI Polish (EP-ND-001)

## Summary

Consolidated 4 separate repositories (ai-arena-front, ai-arena-back-tic-tac-toe, ai-arena-back-mr-white, ai-arena-back-codename) into a single monorepo with shared core library, unified API gateway, WebSocket support for all games, and consistent pixel-art UI.

## Changes by Task

### Task 1: Initialize Monorepo Structure
- Created `apps/frontend/`, `services/`, `packages/arena-core/` directory structure
- Copied frontend and 3 backend services into monorepo
- Initialized git, created CLAUDE.md

### Task 2: Extract Shared Python Core Library
- Created `packages/arena-core/` with shared `WebSocketManager`, `GameManager` base class, `GameStatus` enum, shared models, and config utilities
- Extracted common patterns from mr-white and codenames WebSocket/game managers

### Task 3: Refactor Tic-Tac-Toe Backend
- Created `TicTacToeGameManager` extending base `GameManager`
- Added arena-core dependency

### Task 4: Refactor Mr. White Backend
- Replaced custom `WebSocketManager` with arena-core import
- Refactored `MrWhiteGameManager` to extend base `GameManager`

### Task 5: Refactor Codenames Backend
- Replaced custom `WebSocketManager` with arena-core import
- Refactored `CodenamesGameManager` to extend base `GameManager`

### Task 6: Add WebSocket Support to Tic-Tac-Toe
- Added `/ws/games/{game_id}` WebSocket endpoint
- Emits `game_started`, `move_made`, `game_ended` events during auto-play

### Task 7: Create Unified API Gateway
- Created FastAPI gateway at `services/gateway/` (port 8080)
- Proxies REST (`/api/{game}/*`) and WebSocket (`/ws/{game}/*`) to backend services
- Health check aggregation at `/health`

### Task 8: Refactor Frontend API Clients
- Replaced 3 separate API URL env vars with single `NEXT_PUBLIC_API_URL`
- Updated all API clients to route through gateway
- Added WebSocket URL support to tictactoeApi

### Task 9: Tic-Tac-Toe Frontend WebSocket Support
- Refactored `useTicTacToe` hook to use WebSocket for real-time move updates
- Replaced polling with WebSocket-driven auto-play
- Added connection status indicator

### Task 10: Mr. White Pixel-Art Conversion
- Replaced dark zinc-900 theme with pixel-art design system (cream backgrounds, 3px borders, hard shadows)
- Converted all components: GameInfo, PlayerList, MessageFeed, VoteResults, GameControls, ModelSelector
- Removed ~200 lines of dead CSS from mrwhite-canvas.css

### Task 11: Fix Shared UI Components
- Refactored Button.tsx to use `pixel-btn` as base class with variant mapping
- Updated StartRandomButton and Header to use pixel-art classes

### Task 12: Animation and Polish Consistency
- Added consistent Framer Motion patterns (fadeIn, stagger, whileHover) across all 3 games
- Added reconnect buttons for WebSocket disconnection
- Fixed heading colors and missing pixel-btn classes

### Task 13: Unified Docker Compose
- Created root `docker-compose.yml` with 5 services on `arena-network`
- Game services internal-only; frontend (3000) and gateway (8080) exposed
- All Dockerfiles install arena-core from local packages/
- Added health checks to all services

### Task 14: Visual Audit
- Fixed games hub grid from 2-col to 3-col
- Standardized all borders to 3px for pixel-art consistency
- Added codenames to random game selection
- Removed dead code

### Task 15: E2E Verification
- Created comprehensive TESTING.md with manual testing steps, curl commands, WebSocket event sequences, and edge cases

### Task 16: Publish to GitHub
- Created README.md with architecture, quick start, and tech stack
- Published to https://github.com/NikitaDmitrieff/ai-arena

### Post-Implementation: Code Simplification
- Consolidated 3 redundant route maps into 1 in gateway
- Removed dead imports, unused endpoints, and dead code (~184 lines net reduction)
- Deduplicated player-info serialization via shared helper
- Tightened TypeScript `any` types to `unknown`

## Files Modified

**New directories:** `apps/frontend/`, `services/gateway/`, `services/tic-tac-toe/`, `services/mr-white/`, `services/codenames/`, `packages/arena-core/`

**Key new files:**
- `packages/arena-core/arena_core/` — shared Python library (5 modules)
- `services/gateway/main.py` — API gateway
- `docker-compose.yml` — orchestration
- `README.md` — project documentation

**Key modified files:**
- All frontend components under `src/components/mrwhite/` — pixel-art conversion
- `src/hooks/useTicTacToe.ts` — WebSocket support
- `src/services/*Api.ts` — gateway routing
- All backend `game_manager.py` files — arena-core integration
- All backend `websocket_manager.py` files — replaced with arena-core imports

## Breaking Changes

- Frontend now requires `NEXT_PUBLIC_API_URL` instead of 3 separate backend URLs
- Backend services are no longer accessible directly; all traffic goes through the gateway on port 8080
- Mr. White UI completely restyled (dark theme → pixel-art)
