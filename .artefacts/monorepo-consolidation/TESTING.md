# E2E Testing Guide — AI Arena Monorepo

Manual testing steps for verifying the full AI Arena monorepo after consolidation.

---

## Prerequisites

1. **API keys:** Copy `.env.example` to `.env` and add at least one LLM provider key:
   ```
   OPENAI_API_KEY=sk-...
   MISTRAL_API_KEY=...
   ```
2. **Docker:** Docker and Docker Compose installed and running.
3. **Ports:** 3000 (frontend) and 8080 (gateway) must be free.

---

## 1. Docker Compose Startup

### Steps
```bash
cd ai-arena/
docker-compose up --build
```

### Expected Results
- All 5 services start without errors: `frontend`, `gateway`, `tic-tac-toe`, `mr-white`, `codenames`
- Health checks pass (services become `healthy` in Docker logs)
- Gateway logs: `Gateway started — routing to http://tic-tac-toe:8000, http://mr-white:8001, http://codenames:8002`
- Frontend accessible at `http://localhost:3000`
- Gateway accessible at `http://localhost:8080`

### Verify
```bash
# Gateway health (aggregates all services)
curl http://localhost:8080/health
# Expected: {"status":"healthy","services":{"tic-tac-toe":{"status":"healthy",...},"mr-white":{"status":"healthy",...},"codenames":{"status":"healthy",...}}}

# Models endpoint
curl http://localhost:8080/api/models
# Expected: JSON array of available LLM models
```

---

## 2. Gateway Routing Verification

### REST Proxy
```bash
# Tic-Tac-Toe via gateway
curl http://localhost:8080/api/tic-tac-toe/health
# Expected: {"status":"healthy","service":"ai-arena-tictactoe","version":"1.0.0",...}

# Mr. White via gateway
curl http://localhost:8080/api/mr-white/health
# Expected: {"status":"healthy","version":"1.0.0"}

# Codenames root via gateway
curl http://localhost:8080/api/codenames/models
# Expected: JSON array of models

# Unknown service
curl http://localhost:8080/api/unknown/anything
# Expected: 404 {"detail":"Unknown service"}
```

### WebSocket Proxy
WebSocket connections are verified during each game's E2E test (sections 3–5).

---

## 3. Tic-Tac-Toe — Full Game Flow

### 3a. Create Game (REST)
```bash
curl -X POST http://localhost:8080/api/tic-tac-toe/games \
  -H "Content-Type: application/json" \
  -d '{
    "player_x": {"use_llm": true, "provider": "openai", "model": "gpt-4o-mini"},
    "player_o": {"use_llm": true, "provider": "openai", "model": "gpt-4o-mini"}
  }'
```

**Expected:**
```json
{
  "game_id": "<uuid>",
  "message": "Game created successfully",
  "state": { "board": [["","",""],["","",""],["","",""]], "current_player": "X", "game_over": false, "winner": null },
  "player_x": { "type": "llm", "model": "gpt-4o-mini" },
  "player_o": { "type": "llm", "model": "gpt-4o-mini" }
}
```

### 3b. Auto-Play with WebSocket Events
```bash
# Start auto-play
curl -X POST http://localhost:8080/api/tic-tac-toe/games/<game_id>/auto
# Expected: {"game_id":"...","message":"Auto-play started. Connect to WebSocket for real-time updates.","ws_url":"/ws/games/<game_id>"}
```

**WebSocket test** (using `websocat` or browser console):
```bash
websocat ws://localhost:8080/ws/tic-tac-toe/games/<game_id>
```

**Expected events in order:**
1. `{"event_type": "connected", "data": {"game_id": "...", "state": {...}, "player_x": {...}, "player_o": {...}}}`
2. Multiple `{"event_type": "move_made", "data": {"player": "X"/"O", "position": [row, col], "board": [...], "reasoning": "..."}}`
3. `{"event_type": "game_ended", "data": {"winner": "X"/"O"/null, "board": [...], "reason": "..."}}`

### 3c. Verify Final State (REST)
```bash
curl http://localhost:8080/api/tic-tac-toe/games/<game_id>
# Expected: game_over=true, winner is "X", "O", or null (draw)
```

### 3d. Cleanup
```bash
curl -X DELETE http://localhost:8080/api/tic-tac-toe/games/<game_id>
# Expected: {"game_id":"...","message":"Game deleted successfully"}
```

### Frontend Verification
1. Navigate to `http://localhost:3000/games/tic-tac-toe`
2. Select LLM models for Player X and Player O
3. Click "Start Game"
4. Verify: WebSocket connection indicator shows "Connected"
5. Verify: Board updates in real-time as moves arrive via WebSocket
6. Verify: Each move animates in (scale + rotate) when revealed
7. Verify: Game result displays when finished (winner or draw)
8. Verify: Pixel-art styling — cream backgrounds, 3px borders, Sora font

---

## 4. Mr. White — Full Game Flow

### 4a. Create Game (REST)
```bash
curl -X POST http://localhost:8080/api/mr-white/games \
  -H "Content-Type: application/json" \
  -d '{
    "models": [
      {"provider": "openai", "model": "gpt-4o-mini"},
      {"provider": "openai", "model": "gpt-4o-mini"},
      {"provider": "openai", "model": "gpt-4o-mini"}
    ],
    "verbose": true
  }'
```

**Expected:**
```json
{
  "game_id": "<uuid>",
  "status": "running",
  "players": [...],
  ...
}
```

### 4b. WebSocket Events
```bash
websocat ws://localhost:8080/ws/mr-white/games/<game_id>/ws
```

**Expected events:**
1. `{"event_type": "connected", "data": {"game_id": "...", "status": "running", "phase": "..."}}`
2. Multiple `{"event_type": "phase_change", "data": {"phase": "...", ...}}`
3. Multiple `{"event_type": "message", "data": {"player": "...", "content": "...", ...}}`
4. `{"event_type": "game_complete", "data": {"winner": "...", "mr_white": "...", ...}}`

### 4c. Verify Final State (REST)
```bash
curl http://localhost:8080/api/mr-white/games/<game_id>
# Expected: status=completed, result data present
```

### Frontend Verification
1. Navigate to `http://localhost:3000/games/mr-white`
2. Configure 3+ models in the model selector
3. Click "Start Game"
4. Verify: WebSocket connection indicator shows "Connected" (with pulse animation)
5. Verify: Phases progress in order (Sketchpad → Rounds → Voting → Results)
6. Verify: Player messages appear in the message feed with color-coded borders
7. Verify: Vote results display with pixel-art styled progress bars
8. Verify: MrWhiteCanvas renders (the visual canvas component)
9. Verify: Pixel-art styling — cream backgrounds (#FAF6F0), pixel-panel/pixel-card classes, 3px borders

---

## 5. Codenames — Full Game Flow

### 5a. Create Game (REST)
```bash
curl -X POST http://localhost:8080/api/codenames/games \
  -H "Content-Type: application/json" \
  -d '{
    "red_spymaster": {"provider": "openai", "model": "gpt-4o-mini"},
    "red_operative": {"provider": "openai", "model": "gpt-4o-mini"},
    "blue_spymaster": {"provider": "openai", "model": "gpt-4o-mini"},
    "blue_operative": {"provider": "openai", "model": "gpt-4o-mini"}
  }'
```

**Expected:**
```json
{
  "game_id": "<uuid>",
  "phase": "await_clue",
  "current_team": "RED" or "BLUE",
  "turn_number": 0,
  ...
}
```

### 5b. WebSocket Events
```bash
websocat ws://localhost:8080/ws/codenames/games/<game_id>
```

**Expected events:**
1. `{"event_type": "game_state", "data": {"game_id": "...", "phase": "...", "board": [...], ...}}`
2. `{"event_type": "game_started", "data": {"starting_team": "...", "board": [...], ...}}` (from buffer)
3. Multiple `{"event_type": "clue_given", "data": {"team": "...", "word": "...", "number": N}}`
4. Multiple `{"event_type": "guess_made", "data": {"team": "...", "word": "...", "card_type": "...", "correct": true/false}}`
5. `{"event_type": "game_ended", "data": {"winner": "RED"/"BLUE", "reason": "..."}}`

### 5c. Verify Final State (REST)
```bash
curl http://localhost:8080/api/codenames/games/<game_id>
# Expected: phase=FINISHED, winner present, board with revealed cards
```

### 5d. Cleanup
```bash
curl -X DELETE http://localhost:8080/api/codenames/games/<game_id>
# Expected: {"message":"Game deleted"}
```

### Frontend Verification
1. Navigate to `http://localhost:3000/games/codenames`
2. Configure 4 agents (red spymaster, red operative, blue spymaster, blue operative)
3. Click "Start Game"
4. Verify: WebSocket connection indicator shows "Connected"
5. Verify: 5x5 board renders with word cards
6. Verify: Cards flip/reveal as guesses come in via WebSocket
7. Verify: Event log shows clues and guesses in order
8. Verify: Team scores update in real-time
9. Verify: Game ends with winner announcement
10. Verify: Pixel-art styling — pixel-card for word cards, pixel-hover-lift on unrevealed cards

---

## 6. Frontend Pages — UI Consistency Check

### Home Page (`/`)
- [ ] Hero section renders with pixel-art styling
- [ ] "Play now" button in header uses pixel-btn class
- [ ] StartRandomButton randomly picks from all 3 games (tic-tac-toe, mr-white, codenames)
- [ ] Page entry animation (fadeIn with y offset)

### Games Hub (`/games`)
- [ ] 3-column grid displays all 3 game cards
- [ ] Each card uses pixel-card class with hover lift effect
- [ ] Stagger animation on card load
- [ ] Links navigate to correct game pages

### All Game Pages
- [ ] Cream background (#FAF6F0) — no dark theme remnants
- [ ] 3px black borders on panels and cards
- [ ] Sora font for headings
- [ ] Hard shadows (4px offset, black)
- [ ] Consistent hover effect: translate(-2px, -2px) + shadow increase
- [ ] Connection status indicator (3px border, colored dot)
- [ ] Loading states (skeleton/spinner) while waiting for API/LLM
- [ ] Error states with retry buttons on connection loss
- [ ] Responsive layout at mobile breakpoints
- [ ] Framer Motion animations: fadeIn entry, stagger children, AnimatePresence transitions

---

## 7. Edge Cases

### WebSocket Disconnection
1. Start a game with WebSocket connection
2. Kill the backend service mid-game
3. **Expected:** Frontend shows "Disconnected" indicator and reconnect button
4. Restart the backend service
5. Click reconnect (or verify auto-reconnect)

### No API Keys
1. Start services without any LLM API keys in `.env`
2. Attempt to create a game
3. **Expected:** Backend returns a clear error (not a crash). Frontend displays the error message.

### Concurrent Games
1. Create 2+ games simultaneously across different game types
2. **Expected:** Each game runs independently. WebSocket events are isolated per game_id.

### Gateway Service Down
1. Stop one backend service (e.g., tic-tac-toe)
2. Hit gateway health endpoint
3. **Expected:** Health response shows that service as "unreachable", others as "healthy"
4. Hit gateway route for downed service
5. **Expected:** 503 with `"Service tic-tac-toe is unavailable"`

---

## 8. Known Limitations

- **No persistent storage:** All game state is in-memory. Restarting a service clears all games.
- **No authentication:** All endpoints are public. CORS is set to allow all origins.
- **LLM rate limits:** Running many games simultaneously may hit provider rate limits.
- **WebSocket reconnection:** Frontend shows a reconnect button but does not auto-reconnect.
- **Visual audit:** Done via code review (Task 14). Full browser-level visual testing requires running the app locally.
- **words.txt location:** Codenames requires `words.txt` in `services/codenames/`. It's included in the service directory and copied during Docker build.
