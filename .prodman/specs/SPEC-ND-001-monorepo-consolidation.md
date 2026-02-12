# Monorepo Consolidation & UI Polish Implementation Plan

> **For the Ralph loop:** Follow this plan task-by-task. Track progress in `progress.txt`.

**Epic:** EP-ND-001
**Goal:** Consolidate 4 repos into a monorepo with shared core, unified gateway, WebSocket tic-tac-toe, and consistent pixel-art UI.
**Architecture:** A monorepo rooted at `/Users/nikitadmitrieff/Projects/tmp/ai-arena/ai-arena/` (the existing empty subdirectory) with `apps/frontend`, `services/{game}`, `packages/arena-core` (shared Python lib), and a FastAPI gateway that mounts each game's routes under `/api/{game}/*`. Frontend talks to one URL. All services run via a root `docker-compose.yml`. The monorepo gets published to GitHub as a public `ai-arena` repo.

---

### Target Monorepo Structure

```
ai-arena/
├── apps/
│   └── frontend/                 # Next.js 14 app (moved from ai-arena-front)
├── services/
│   ├── gateway/                  # Unified FastAPI gateway
│   ├── tic-tac-toe/             # Game service (refactored)
│   ├── mr-white/                # Game service (refactored)
│   └── codenames/               # Game service (refactored)
├── packages/
│   └── arena-core/              # Shared Python library
│       ├── pyproject.toml
│       └── arena_core/
│           ├── __init__.py
│           ├── websocket_manager.py
│           ├── game_manager.py
│           ├── models.py
│           └── config.py
├── docker-compose.yml
├── .prodman/
├── .artefacts/
└── CLAUDE.md
```

---

### Task 1: Initialize Monorepo Structure

**Files:**
- Create: `apps/` directory (inside `ai-arena/ai-arena/`)
- Create: `services/` directory (inside `ai-arena/ai-arena/`)
- Create: `packages/` directory (inside `ai-arena/ai-arena/`)
- Create: `CLAUDE.md` (inside `ai-arena/ai-arena/`)

**IMPORTANT: The monorepo root is `/Users/nikitadmitrieff/Projects/tmp/ai-arena/ai-arena/`** (the existing empty subdirectory). All paths in this spec are relative to that root. The sibling repos (`ai-arena-front/`, `ai-arena-back-*`) remain in the parent directory as source material.

**What to do:**
1. Work inside `/Users/nikitadmitrieff/Projects/tmp/ai-arena/ai-arena/`. This is the monorepo root.
2. Initialize git: `git init` inside `ai-arena/ai-arena/`.
3. Create the directory skeleton: `apps/`, `services/`, `packages/arena-core/arena_core/`.
4. Copy the frontend code from `../ai-arena-front/` into `apps/frontend/`. Skip `.git/` and `node_modules/`.
5. Copy game backends (skip `.git/`, `__pycache__/`, `.venv/`):
   - `../ai-arena-back-tic-tac-toe/` → `services/tic-tac-toe/`
   - `../ai-arena-back-mr-white/` → `services/mr-white/`
   - `../ai-arena-back-codename/` → `services/codenames/`
6. Copy `.prodman/` and `.artefacts/` from the parent directory into the monorepo root.
7. Create a root `CLAUDE.md` with project description, structure overview, and development instructions.
8. Do NOT delete the sibling repos — they stay as reference in the parent folder.
9. Verify the directory structure matches the target above.

**Commit:** `feat: initialize monorepo structure with all services`

---

### Task 2: Extract Shared Python Core Library

**Files:**
- Create: `packages/arena-core/pyproject.toml`
- Create: `packages/arena-core/arena_core/__init__.py`
- Create: `packages/arena-core/arena_core/websocket_manager.py`
- Create: `packages/arena-core/arena_core/game_manager.py`
- Create: `packages/arena-core/arena_core/models.py`
- Create: `packages/arena-core/arena_core/config.py`

**What to do:**
1. Create `pyproject.toml` for the `arena-core` package with dependencies: `fastapi`, `websockets`, `pydantic`, `python-dotenv`.
2. Extract the **WebSocket manager** pattern shared by mr-white (`api/websocket_manager.py`) and codenames (`api/websocket_manager.py`). Create a unified `WebSocketManager` class that:
   - Manages connections per game_id
   - Supports event queues and buffering
   - Has `connect()`, `disconnect()`, `broadcast()`, `send_event()` methods
   - Handles automatic cleanup
3. Extract the **game manager** pattern shared by mr-white (`api/game_manager.py`) and codenames (`api/game_manager.py`). Create a base `GameManager` class that:
   - Manages game lifecycle (PENDING → RUNNING → COMPLETED/FAILED)
   - Runs games in executor (asyncio)
   - Stores game state in-memory dict
   - Has `create_game()`, `get_game()`, `list_games()`, `delete_game()` abstract methods
4. Extract **shared models**: `GameStatus` enum, `GameState` base model, `WebSocketEvent` model.
5. Extract **config utilities**: environment variable loading, LLM provider config patterns.

**Commit:** `feat: extract shared arena-core Python library`

---

### Task 3: Refactor Tic-Tac-Toe Backend to Use Shared Core

**Files:**
- Modify: `services/tic-tac-toe/requirements.txt` (add arena-core dependency)
- Modify: `services/tic-tac-toe/main.py` (use shared game manager)
- Create: `services/tic-tac-toe/game_manager.py` (concrete implementation)

**What to do:**
1. Add `arena-core` as a local dependency in requirements.txt (or use pip install -e path).
2. Create a `TicTacToeGameManager` that extends the base `GameManager` from arena-core.
3. Refactor `main.py` to use the game manager instead of the raw dict-based storage.
4. Keep game-specific logic (`game.py`, `board.py`, `player.py`, `prompts.py`) untouched — only the API layer changes.
5. Verify all existing REST endpoints still work.

**Commit:** `refactor: tic-tac-toe backend uses arena-core game manager`

---

### Task 4: Refactor Mr. White Backend to Use Shared Core

**Files:**
- Modify: `services/mr-white/requirements.txt`
- Modify: `services/mr-white/api/main.py`
- Modify: `services/mr-white/api/routes.py`
- Modify: `services/mr-white/api/websocket_manager.py` → replace with import from arena-core
- Modify: `services/mr-white/api/game_manager.py` → extend base from arena-core

**What to do:**
1. Add `arena-core` as a local dependency.
2. Replace the custom `WebSocketManager` with `from arena_core import WebSocketManager`.
3. Refactor `MrWhiteGameManager` to extend the base `GameManager` from arena-core. Keep mr-white-specific game execution logic.
4. Update routes to use the refactored manager.
5. Verify WebSocket events still flow correctly (phase_change, message, game_complete).

**Commit:** `refactor: mr-white backend uses arena-core`

---

### Task 5: Refactor Codenames Backend to Use Shared Core

**Files:**
- Modify: `services/codenames/requirements.txt`
- Modify: `services/codenames/api/app.py`
- Modify: `services/codenames/api/websocket_manager.py` → replace with import from arena-core
- Modify: `services/codenames/api/game_manager.py` → extend base from arena-core

**What to do:**
1. Add `arena-core` as a local dependency.
2. Replace the custom `WebSocketManager` with `from arena_core import WebSocketManager`.
3. Refactor `CodenamesGameManager` to extend the base `GameManager` from arena-core. Keep codenames-specific game execution logic.
4. Update the app to use the refactored manager.
5. Verify WebSocket events still flow correctly (game_started, clue_given, guess_made, game_ended).

**Commit:** `refactor: codenames backend uses arena-core`

---

### Task 6: Add WebSocket Support to Tic-Tac-Toe Backend

**Files:**
- Modify: `services/tic-tac-toe/main.py` (add WebSocket endpoint)
- Modify: `services/tic-tac-toe/game_manager.py` (add event emission)
- Modify: `services/tic-tac-toe/requirements.txt` (add websockets)

**What to do:**
1. Import `WebSocketManager` from arena-core.
2. Add a WebSocket endpoint at `/ws/games/{game_id}` (matching codenames pattern).
3. Modify the game execution to emit events:
   - `game_started` — when game is created with player configs
   - `move_made` — after each move (includes board state, player, position, reasoning)
   - `game_ended` — when a winner is determined or draw
4. The auto-play endpoint (`/games/{id}/auto`) should emit events in real-time as moves happen.
5. Keep REST endpoints working as before (backward compatible).

**Commit:** `feat: add WebSocket support to tic-tac-toe backend`

---

### Task 7: Create Unified API Gateway

**Files:**
- Create: `services/gateway/main.py`
- Create: `services/gateway/requirements.txt`
- Create: `services/gateway/Dockerfile`

**What to do:**
1. Create a FastAPI application that acts as a reverse proxy / API gateway.
2. Use `httpx` for proxying REST requests and `websockets` for WebSocket proxying.
3. Route structure:
   - `/api/tic-tac-toe/*` → `http://tic-tac-toe:8000/*`
   - `/api/mr-white/*` → `http://mr-white:8001/*`
   - `/api/codenames/*` → `http://codenames:8002/*`
   - `/ws/tic-tac-toe/*` → `ws://tic-tac-toe:8000/*`
   - `/ws/mr-white/*` → `ws://mr-white:8001/*`
   - `/ws/codenames/*` → `ws://codenames:8002/*`
   - `/health` → aggregate health from all services
   - `/api/models` → proxy to any backend's model list (they share the same LLM providers)
4. Enable CORS for the frontend origin.
5. Gateway runs on port 8080.
6. Create a simple Dockerfile (Python slim, uvicorn).

**Commit:** `feat: create unified API gateway`

---

### Task 8: Refactor Frontend API Clients to Use Gateway

**Files:**
- Modify: `apps/frontend/src/services/tictactoeApi.ts`
- Modify: `apps/frontend/src/services/mrwhiteApi.ts`
- Modify: `apps/frontend/src/services/codenamesApi.ts`
- Modify: `apps/frontend/.env.example`
- Modify: `apps/frontend/next.config.js`

**What to do:**
1. Replace 3 separate API URL env vars with a single `NEXT_PUBLIC_API_URL` (e.g., `http://localhost:8080`).
2. Update `tictactoeApi.ts`:
   - Base URL: `${API_URL}/api/tic-tac-toe`
   - Add WebSocket support (new!) using `${WS_URL}/ws/tic-tac-toe/games/{id}`
3. Update `mrwhiteApi.ts`:
   - Base URL: `${API_URL}/api/mr-white`
   - WebSocket URL: `${WS_URL}/ws/mr-white/games/{id}/ws`
4. Update `codenamesApi.ts`:
   - Base URL: `${API_URL}/api/codenames`
   - WebSocket URL: `${WS_URL}/ws/codenames/games/{id}`
5. Update `.env.example` to show the single gateway URL.
6. Clean up `next.config.js` to remove the 3 separate backend env vars.

**Commit:** `refactor: frontend uses unified API gateway`

---

### Task 9: Update Tic-Tac-Toe Frontend for WebSocket Support

**Files:**
- Modify: `apps/frontend/src/hooks/useTicTacToe.ts`
- Modify: `apps/frontend/src/app/games/tic-tac-toe/page.tsx`
- Modify: `apps/frontend/src/components/tictactoe/GameBoard.tsx`

**What to do:**
1. Refactor `useTicTacToe.ts` to use WebSocket for real-time updates (similar pattern to `useMrWhite.ts` and `useCodenames.ts`):
   - Connect to WebSocket when a game starts
   - Handle `move_made` events to update board in real-time
   - Handle `game_ended` event for final state
   - Keep REST fallback for initial game creation
2. Update the tic-tac-toe page to show a connection status indicator (like codenames has).
3. Add smooth move animations — when a move comes in via WebSocket, animate the cell reveal (the board already has scale+rotate animations, just wire them to WebSocket events).
4. Remove polling-based auto-play in favor of WebSocket-driven updates.

**Commit:** `feat: tic-tac-toe frontend uses WebSocket for real-time updates`

---

### Task 10: Convert Mr. White UI to Pixel-Art Design System

**Files:**
- Modify: `apps/frontend/src/components/mrwhite/GameInfo.tsx`
- Modify: `apps/frontend/src/components/mrwhite/PlayerList.tsx`
- Modify: `apps/frontend/src/components/mrwhite/MessageFeed.tsx`
- Modify: `apps/frontend/src/components/mrwhite/VoteResults.tsx`
- Modify: `apps/frontend/src/components/mrwhite/GameControls.tsx`
- Modify: `apps/frontend/src/components/mrwhite/ModelSelector.tsx`
- Modify: `apps/frontend/src/app/games/mr-white/page.tsx`
- Modify: `apps/frontend/src/styles/mrwhite-canvas.css` (reduce scope)

**What to do:**
This is the biggest UI task. Mr. White currently uses a dark theme (zinc-900 backgrounds) that is completely inconsistent with the pixel-art design system used by tic-tac-toe and codenames.

1. **GameInfo.tsx**: Replace dark zinc backgrounds with pixel-art:
   - Use `pixel-panel` class for containers
   - Cream background (#FAF6F0) instead of zinc-900
   - 3px black borders, hard shadows
   - Sora font, pixel-art color tokens

2. **PlayerList.tsx**: Convert from dark theme:
   - Use `pixel-card` for each player card
   - Color-code by role (citizen = pixel-teal, Mister White reveal = pixel-red)
   - Hard shadow on hover
   - Model name badges using `pixel-badge`

3. **MessageFeed.tsx**: Convert chat-style dark UI:
   - Use `pixel-panel` for the feed container
   - Each message in a `pixel-card` with left border color-coded by player
   - Scrollable with custom pixel-art scrollbar (like MoveHistory in tic-tac-toe)
   - Phase headers as `pixel-badge` elements

4. **VoteResults.tsx**: Convert vote bars:
   - Cream background, 3px borders
   - Vote bars with pixel-art styling (hard edges, solid colors from the palette)
   - Winner highlight with pixel-yellow or pixel-teal

5. **GameControls.tsx**: Use `pixel-btn` classes for all buttons.

6. **ModelSelector.tsx**: Replace `.mrwhite-*` classes with `.pixel-*` equivalents:
   - Config panels match the style of tic-tac-toe's PlayerConfigForm
   - Use pixel-input for dropdowns, pixel-btn for submit

7. **Page layout** (`mr-white/page.tsx`): Restructure to match tic-tac-toe/codenames layout:
   - Config form at top (before game starts)
   - Game area with MrWhiteCanvas (keep the canvas — it's cool)
   - Info panels in a grid below the canvas
   - Consistent spacing and padding

8. **mrwhite-canvas.css**: Keep canvas-specific styles only. Remove any component styles that now come from pixel-art classes.

**Reference the existing pixel-art implementations:**
- `apps/frontend/src/styles/pixel-art.css` for all available classes
- `apps/frontend/src/components/tictactoe/` for reference implementations
- `apps/frontend/src/components/codenames/` for reference implementations

**Commit:** `fix: convert mr-white UI to pixel-art design system`

---

### Task 11: Fix Shared UI Components

**Files:**
- Modify: `apps/frontend/src/components/ui/Button.tsx`
- Modify: `apps/frontend/src/components/ui/StartRandomButton.tsx`
- Modify: `apps/frontend/src/components/layout/Header.tsx`

**What to do:**
1. **Button.tsx**: Refactor to use `pixel-btn` as base class:
   - `primary` variant → `pixel-btn` (teal background, standard)
   - `danger` variant → `pixel-btn` with pixel-red background
   - `warning` variant → `pixel-btn` with pixel-yellow background
   - `soft` variant → `pixel-btn` with cream/light background
   - Keep the size props but map to pixel-art sizing
   - Maintain the same API (props interface unchanged)

2. **StartRandomButton.tsx**: Use `pixel-btn` class for the CTA button. Keep the routing logic.

3. **Header.tsx**: Apply `pixel-btn` to the "Play now" button. Ensure the header itself follows the pixel-art visual language (3px bottom border, hard shadow).

**Commit:** `fix: align Button and Header with pixel-art design system`

---

### Task 12: Animation and Polish Consistency Pass

**Files:**
- Modify: various component files across all 3 games

**What to do:**
1. Ensure all three games use consistent Framer Motion patterns:
   - Page entry: `fadeIn` with slight `y` offset
   - Cards/panels: staggered children animation
   - Interactive elements: `whileHover` scale/shadow effects
   - State transitions: `AnimatePresence` for mount/unmount
2. Add loading states where missing:
   - Skeleton placeholders while game is being created
   - Spinner/pulse animation while waiting for LLM response
3. Add error states where missing:
   - Connection lost indicator for WebSocket games
   - Retry button on API failures
4. Ensure responsive behavior is consistent across all game pages (check mobile breakpoints).
5. Verify the pixel-art hover effect (translate(-2px, -2px) + shadow increase) is applied consistently to all interactive cards and buttons.

**Commit:** `fix: consistent animations and polish across all games`

---

### Task 13: Create Unified Docker Compose

**Files:**
- Create: `docker-compose.yml` (root)
- Create: `services/gateway/Dockerfile` (if not created in Task 7)
- Modify: `services/tic-tac-toe/Dockerfile`
- Modify: `services/mr-white/Dockerfile`
- Modify: `services/codenames/Dockerfile`
- Modify: `apps/frontend/Dockerfile`
- Create: `.env.example` (root)

**What to do:**
1. Create a root `docker-compose.yml` with services:
   - `frontend` (port 3000) — Next.js app
   - `gateway` (port 8080) — API gateway
   - `tic-tac-toe` (internal port 8000) — game service
   - `mr-white` (internal port 8001) — game service
   - `codenames` (internal port 8002) — game service
2. All game services share a `arena-network` Docker network.
3. Game services are NOT exposed externally — only gateway and frontend are.
4. Environment variables:
   - Root `.env.example` with `OPENAI_API_KEY`, `MISTRAL_API_KEY`
   - Frontend gets `NEXT_PUBLIC_API_URL=http://localhost:8080`
   - Gateway gets internal service hostnames
5. Update individual Dockerfiles to install `arena-core` from the local `packages/` directory:
   - Copy `packages/arena-core/` into the build context
   - `pip install -e /app/packages/arena-core` in each backend Dockerfile
6. Add health checks to all services.
7. Add a volume mount for the `words.txt` file that codenames needs.

**Commit:** `feat: unified docker-compose for local development`

---

### Task 14: Visual Audit via Chrome MCP

**Files:**
- No new files — this is a verification and fix task

**What to do:**
1. Start the application locally using `docker-compose up` (or `npm run dev` for frontend + individual backend services).
2. Use the Chrome MCP tools to browse every page:
   - Home page (`/`)
   - Games hub (`/games`)
   - Tic-Tac-Toe game (`/games/tic-tac-toe`) — create and play a game
   - Mr. White game (`/games/mr-white`) — create and play a game
   - Codenames game (`/games/codenames`) — create and play a game
3. For each page, verify:
   - Pixel-art design consistency (borders, shadows, colors, typography)
   - Animations work smoothly
   - No visual glitches or layout issues
   - Responsive on different screen sizes
4. Fix any issues found during the visual audit.
5. Take note of any remaining polish items.

**Commit:** `fix: visual audit fixes from Chrome MCP review`

---

### Task 15: E2E Verification

**Files:**
- Create: `.artefacts/monorepo-consolidation/TESTING.md`

**What to do:**
1. Verify the full flow for each game:
   - **Tic-Tac-Toe:** Create game → auto-play → verify WebSocket events → see result
   - **Mr. White:** Create game → watch phases via WebSocket → see vote results
   - **Codenames:** Create game → watch clues/guesses via WebSocket → see winner
2. Verify the gateway routes all requests correctly.
3. Verify `docker-compose up` starts everything cleanly.
4. Create `TESTING.md` with manual testing steps for each game and the gateway.
5. Document any known issues or limitations.

**Commit:** `test: add e2e verification and TESTING.md`

---

### Task 16: Publish to GitHub

**Files:**
- Create: `.gitignore` (root, if not already present)
- Create: `README.md` (root)

**What to do:**
1. Ensure `.gitignore` covers: `node_modules/`, `__pycache__/`, `.venv/`, `.env`, `*.pyc`, `.next/`, `logs/`.
2. Create a `README.md` with:
   - Project title and description (AI Arena — LLMs battle on psychological games)
   - Architecture overview with the monorepo structure
   - Quick start instructions (`docker-compose up`)
   - Game descriptions (Tic-Tac-Toe, Mr. White, Codenames)
   - Environment variables needed
   - Tech stack summary
3. Stage all files and create an initial commit if not already committed.
4. Create a public GitHub repo: `gh repo create ai-arena --public --source . --push`
5. Verify the repo is live and accessible.

**Commit:** `docs: add README and publish to GitHub`

---

### Final Verification

- [ ] All tasks implemented per spec
- [ ] All acceptance criteria from EP-ND-001 met
- [ ] `progress.txt` shows all tasks complete
- [ ] `.artefacts/monorepo-consolidation/TESTING.md` created
- [ ] `.artefacts/monorepo-consolidation/CHANGELOG.md` created
- [ ] GitHub repo is public and contains the full monorepo
