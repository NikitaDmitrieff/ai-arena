# Frontend Integration Guide - Mister White Game API

## 🌐 Base URL & Environment Variables

### Environment Variable

```env
# Required - Backend API base URL
NEXT_PUBLIC_MRWHITE_API_URL=http://localhost:8001

# For WebSocket connections (typically same host, different protocol)
NEXT_PUBLIC_MRWHITE_WS_URL=ws://localhost:8001
```

### Production URLs (done inside github secrets)

```env
NEXT_PUBLIC_MRWHITE_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_MRWHITE_WS_URL=wss://api.yourdomain.com
```

---

## 📡 API Endpoints

### Base Path

All API endpoints are prefixed with `/api/v1`

### 1. Health Check

```
GET /api/v1/health
```

**Purpose:** Check if API is running

**Response:**

```typescript
{
  status: "healthy" | "unhealthy",
  version: string,
  timestamp: string  // ISO 8601
}
```

**Example:**

```bash
curl http://localhost:8001/api/v1/health
```

---

### 2. Create Game

```
POST /api/v1/games
```

**Purpose:** Create and start a new game

**Request Body:**

```typescript
{
  models: Array<{
    provider: "openai" | "mistral",
    model: string
  }>,  // Min 3, Max 10 players
  verbose?: boolean,  // Default: false
  secret_word?: string | null  // Optional, random if not provided
}
```

**Response:** (Status 201)

```typescript
{
  game_id: string,  // UUID
  status: "pending" | "running" | "completed" | "failed",
  phase: "setup" | "clue" | "discussion" | "voting" | "results" | null,
  created_at: string,  // ISO 8601
  updated_at: string,  // ISO 8601
  models: Array<{
    provider: string,
    model: string
  }>,
  players: null,  // Populated after game starts
  messages: null,  // Populated as game progresses
  winner_side: null,
  eliminated_player: null,
  mister_white_player: null,
  secret_word: null,  // Revealed when game completes
  vote_counts: null,
  error: null
}
```

**Example Request:**

```typescript
const response = await fetch(`${API_URL}/api/v1/games`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    models: [
      { provider: "mistral", model: "mistral-small-latest" },
      { provider: "openai", model: "gpt-4o-mini" },
      { provider: "mistral", model: "mistral-large-latest" },
    ],
    verbose: false,
  }),
});

const game = await response.json();
console.log(`Game created: ${game.game_id}`);
```

**Available Models:**

**OpenAI:**

- `gpt-4o-mini` ⭐ (recommended - fast, cheap)
- `gpt-4o`
- `gpt-4-turbo`
- `gpt-4`
- `gpt-3.5-turbo`

**Mistral:**

- `mistral-small-latest` ⭐ (recommended)
- `mistral-medium-latest`
- `mistral-large-latest`
- `mistral-tiny`
- `open-mistral-7b`
- `open-mixtral-8x7b`
- `open-mixtral-8x22b`

---

### 3. Get Game Status

```
GET /api/v1/games/{game_id}
```

**Purpose:** Get current game state and history

**Path Parameters:**

- `game_id` - UUID of the game

**Response:**

```typescript
{
  game_id: string,
  status: "pending" | "running" | "completed" | "failed",
  phase: "setup" | "clue" | "discussion" | "voting" | "results" | null,
  created_at: string,
  updated_at: string,
  models: Array<{
    provider: string,
    model: string
  }>,
  players: Array<{
    name: string,
    provider: string,
    model: string,
    is_mister_white: boolean,
    word: string | null,  // Revealed when game completes
    survived: boolean | null,  // Available after game ends
    votes_received: number | null  // Available after game ends
  }> | null,
  messages: Array<{
    player: string,
    type: "clue" | "discussion" | "vote",
    content: string,
    round: number,
    phase: string,
    timestamp: string
  }> | null,
  winner_side: "citizens" | "mister_white" | null,
  eliminated_player: string | null,
  mister_white_player: string | null,
  secret_word: string | null,
  vote_counts: Record<string, number> | null,
  error: string | null
}
```

**Example:**

```typescript
const response = await fetch(`${API_URL}/api/v1/games/${gameId}`);
const game = await response.json();

if (game.status === "completed") {
  console.log(`Winner: ${game.winner_side}`);
  console.log(`Secret word: ${game.secret_word}`);
}
```

---

### 4. List All Games

```
GET /api/v1/games
```

**Purpose:** Get list of all games (active and completed)

**Response:**

```typescript
{
  games: Array<GameResponse>,  // Same structure as Get Game Status
  total: number
}
```

**Example:**

```typescript
const response = await fetch(`${API_URL}/api/v1/games`);
const { games, total } = await response.json();

console.log(`Total games: ${total}`);
games.forEach((game) => {
  console.log(`${game.game_id}: ${game.status}`);
});
```

---

### 5. WebSocket - Real-Time Game Events

```
WS /api/v1/games/{game_id}/ws
```

**Purpose:** Subscribe to real-time game updates

**Connection:**

```typescript
const ws = new WebSocket(`${WS_URL}/api/v1/games/${gameId}/ws`);

ws.onopen = () => {
  console.log("Connected to game");
};

ws.onmessage = (event) => {
  const gameEvent = JSON.parse(event.data);
  handleGameEvent(gameEvent);
};

ws.onerror = (error) => {
  console.error("WebSocket error:", error);
};

ws.onclose = () => {
  console.log("Connection closed");
};
```

**Event Structure:**

```typescript
{
  event_type: "connected" | "phase_change" | "message" |
              "discussion_round" | "game_complete" | "error",
  data: any,  // Event-specific data
  timestamp: string  // ISO 8601
}
```

**Event Types:**

#### 1. Connected

```typescript
{
  event_type: "connected",
  data: {
    game_id: string,
    status: string,
    phase: string | null
  },
  timestamp: string
}
```

#### 2. Phase Change

```typescript
{
  event_type: "phase_change",
  data: {
    phase: "setup" | "clue" | "discussion" | "voting",
    message: string  // Human-readable description
  },
  timestamp: string
}
```

#### 3. Message (Player Action)

```typescript
{
  event_type: "message",
  data: {
    player: string,
    type: "clue" | "discussion" | "vote",
    content: string,
    round: number,
    phase: string
  },
  timestamp: string
}
```

#### 4. Discussion Round

```typescript
{
  event_type: "discussion_round",
  data: {
    round: number,  // 1 or 2
    message: string
  },
  timestamp: string
}
```

#### 5. Game Complete

```typescript
{
  event_type: "game_complete",
  data: {
    winner_side: "citizens" | "mister_white",
    secret_word: string,
    mister_white_player: string,
    eliminated_player: string,
    vote_counts: Record<string, number>
  },
  timestamp: string
}
```

#### 6. Error

```typescript
{
  event_type: "error",
  data: {
    message: string
  },
  timestamp: string
}
```

---

## 🎮 Game State Schema

### Game Lifecycle

```
PENDING → RUNNING → COMPLETED
    ↓
  FAILED
```

### Game Phases

1. **setup** - Game initialization, role assignment
2. **clue** - Players give clues about secret word
3. **discussion** - 2 rounds of discussion to identify Mister White
4. **voting** - Players vote to eliminate someone
5. **results** - Winner determined

### Player Roles

- **Citizen** (knows the secret word)
- **Mister White** (doesn't know the word, must blend in)

### Win Conditions

- **Citizens win:** Mister White is eliminated
- **Mister White wins:** A Citizen is eliminated

---

## 🎨 UI/UX Recommendations

### Game Creation Screen

**Model Selection:**

- Allow user to select 3-10 models
- Show model names and providers
- Recommended: Mix of providers for variety
- Default suggestion: 5 players (good balance)

**UI Elements:**

```tsx
interface ModelSelectorProps {
  onModelsChange: (models: Model[]) => void;
  minModels?: number; // Default: 3
  maxModels?: number; // Default: 10
}
```

### Game Viewer Screen

**Layout Sections:**

1. **Game Info Panel**
   - Status badge (pending/running/completed/failed)
   - Current phase
   - Player count
   - Created timestamp

2. **Players Panel**
   - List of players with avatars
   - Model/provider labels
   - Status indicators (alive/eliminated)
   - Reveal Mister White identity when game ends

3. **Message Feed** (Real-time)
   - Player avatar + name
   - Message type badge (clue/discussion/vote)
   - Message content
   - Timestamp
   - Auto-scroll to latest

4. **Results Panel** (When completed)
   - Winner announcement
   - Secret word reveal
   - Mister White reveal
   - Vote breakdown chart
   - Player statistics

**Recommended Components:**

```tsx
<GameStatusBadge status={game.status} />
<PhaseBanner phase={game.phase} />
<PlayerList players={game.players} />
<MessageFeed messages={game.messages} />
<VoteResults votes={game.vote_counts} />
<WinnerAnnouncement winner={game.winner_side} />
```

### Real-Time Updates

**Show these events visually:**

- Phase transitions (with animation)
- New messages (with notification sound/animation)
- Player actions (highlight active player)
- Voting (show votes as they come in)
- Game completion (confetti/celebration)

**Loading States:**

- Game creation: "Starting game..."
- Waiting for first event: "Players joining..."
- Between phases: "Moving to discussion..."
- Game completion: "Calculating results..."

### Visual Design

**Phase Colors:**

- Setup: Blue (#3B82F6)
- Clue: Green (#10B981)
- Discussion: Yellow (#F59E0B)
- Voting: Red (#EF4444)
- Results: Purple (#8B5CF6)

**Player Avatars:**

- Use provider logos (OpenAI, Mistral)
- Or generate based on model name
- Highlight Mister White with special border (after reveal)

**Message Types:**

- 💡 Clue (lightbulb icon)
- 💬 Discussion (chat icon)
- 🗳️ Vote (ballot icon)

---

## 📝 TypeScript Types

```typescript
// models.ts

export type Provider = "openai" | "mistral";

export type GameStatus = "pending" | "running" | "completed" | "failed";

export type GamePhase = "setup" | "clue" | "discussion" | "voting" | "results";

export type WinnerSide = "citizens" | "mister_white";

export type MessageType = "clue" | "discussion" | "vote";

export type EventType =
  | "connected"
  | "phase_change"
  | "message"
  | "discussion_round"
  | "game_complete"
  | "error";

export interface ModelConfig {
  provider: Provider;
  model: string;
}

export interface CreateGameRequest {
  models: ModelConfig[];
  verbose?: boolean;
  secret_word?: string | null;
}

export interface PlayerInfo {
  name: string;
  provider: string;
  model: string;
  is_mister_white: boolean;
  word: string | null;
  survived: boolean | null;
  votes_received: number | null;
}

export interface GameMessage {
  player: string;
  type: MessageType;
  content: string;
  round: number;
  phase: string;
  timestamp: string;
}

export interface GameResponse {
  game_id: string;
  status: GameStatus;
  phase: GamePhase | null;
  created_at: string;
  updated_at: string;
  models: ModelConfig[];
  players: PlayerInfo[] | null;
  messages: GameMessage[] | null;
  winner_side: WinnerSide | null;
  eliminated_player: string | null;
  mister_white_player: string | null;
  secret_word: string | null;
  vote_counts: Record<string, number> | null;
  error: string | null;
}

export interface GameEvent<T = any> {
  event_type: EventType;
  data: T;
  timestamp: string;
}

export interface ConnectedEvent {
  game_id: string;
  status: string;
  phase: string | null;
}

export interface PhaseChangeEvent {
  phase: GamePhase;
  message: string;
}

export interface MessageEvent {
  player: string;
  type: MessageType;
  content: string;
  round: number;
  phase: string;
}

export interface DiscussionRoundEvent {
  round: number;
  message: string;
}

export interface GameCompleteEvent {
  winner_side: WinnerSide;
  secret_word: string;
  mister_white_player: string;
  eliminated_player: string;
  vote_counts: Record<string, number>;
}

export interface ErrorEvent {
  message: string;
}

export interface GameListResponse {
  games: GameResponse[];
  total: number;
}

export interface HealthResponse {
  status: "healthy" | "unhealthy";
  version: string;
  timestamp: string;
}
```

---

## 🔧 React Hook Example

```typescript
// useGameConnection.ts

import { useEffect, useState, useCallback } from "react";

export function useGameConnection(gameId: string | null) {
  const [game, setGame] = useState<GameResponse | null>(null);
  const [events, setEvents] = useState<GameEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!gameId) return;

    const ws = new WebSocket(`${process.env.NEXT_PUBLIC_MRWHITE_WS_URL}/api/v1/games/${gameId}/ws`);

    ws.onopen = () => {
      setIsConnected(true);
      console.log("WebSocket connected");
    };

    ws.onmessage = (event) => {
      const gameEvent: GameEvent = JSON.parse(event.data);
      setEvents((prev) => [...prev, gameEvent]);

      // Handle different event types
      switch (gameEvent.event_type) {
        case "connected":
          fetchGameStatus(gameId);
          break;
        case "message":
          // Add message to game state
          setGame((prev) =>
            prev
              ? {
                  ...prev,
                  messages: [...(prev.messages || []), gameEvent.data],
                }
              : null
          );
          break;
        case "phase_change":
          setGame((prev) =>
            prev
              ? {
                  ...prev,
                  phase: gameEvent.data.phase,
                }
              : null
          );
          break;
        case "game_complete":
          fetchGameStatus(gameId);
          break;
        case "error":
          setError(gameEvent.data.message);
          break;
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      setError("Connection error");
    };

    ws.onclose = () => {
      setIsConnected(false);
      console.log("WebSocket disconnected");
    };

    return () => {
      ws.close();
    };
  }, [gameId]);

  const fetchGameStatus = async (id: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_MRWHITE_API_URL}/api/v1/games/${id}`);
      const data = await response.json();
      setGame(data);
    } catch (err) {
      setError("Failed to fetch game status");
    }
  };

  return {
    game,
    events,
    isConnected,
    error,
  };
}
```

---

## 🚀 Complete Example: React Component

```typescript
// GameViewer.tsx

import { useGameConnection } from './hooks/useGameConnection';

export function GameViewer({ gameId }: { gameId: string }) {
  const { game, events, isConnected, error } = useGameConnection(gameId);

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  if (!game) {
    return <div className="loading">Loading game...</div>;
  }

  return (
    <div className="game-viewer">
      {/* Status Header */}
      <header className="game-header">
        <div className="status-badge" data-status={game.status}>
          {game.status}
        </div>
        {game.phase && (
          <div className="phase-badge" data-phase={game.phase}>
            {game.phase}
          </div>
        )}
        <div className="connection-indicator" data-connected={isConnected}>
          {isConnected ? '🟢 Live' : '🔴 Disconnected'}
        </div>
      </header>

      {/* Players Panel */}
      <aside className="players-panel">
        <h2>Players</h2>
        {game.players?.map(player => (
          <div key={player.name} className="player-card">
            <div className="player-avatar" data-provider={player.provider}>
              {player.name[0]}
            </div>
            <div className="player-info">
              <div className="player-name">{player.name}</div>
              <div className="player-model">
                {player.provider} / {player.model}
              </div>
              {game.status === 'completed' && player.is_mister_white && (
                <div className="mister-white-badge">🎭 Mister White</div>
              )}
              {game.status === 'completed' && !player.survived && (
                <div className="eliminated-badge">❌ Eliminated</div>
              )}
            </div>
          </div>
        ))}
      </aside>

      {/* Message Feed */}
      <main className="message-feed">
        <h2>Game Feed</h2>
        {game.messages?.map((message, idx) => (
          <div key={idx} className="message" data-type={message.type}>
            <div className="message-header">
              <span className="message-player">{message.player}</span>
              <span className="message-type-badge">{message.type}</span>
              <span className="message-time">
                {new Date(message.timestamp).toLocaleTimeString()}
              </span>
            </div>
            <div className="message-content">{message.content}</div>
          </div>
        ))}
      </main>

      {/* Results Panel */}
      {game.status === 'completed' && (
        <section className="results-panel">
          <h2>🎉 Game Complete!</h2>
          <div className="winner">
            Winner: <strong>{game.winner_side}</strong>
          </div>
          <div className="secret-word">
            Secret Word: <strong>{game.secret_word}</strong>
          </div>
          <div className="mister-white">
            Mister White: <strong>{game.mister_white_player}</strong>
          </div>
          <div className="eliminated">
            Eliminated: <strong>{game.eliminated_player}</strong>
          </div>
          <div className="votes">
            <h3>Vote Results</h3>
            {Object.entries(game.vote_counts || {}).map(([player, votes]) => (
              <div key={player} className="vote-entry">
                <span>{player}</span>
                <span className="vote-bar" style={{ width: `${votes * 20}%` }} />
                <span>{votes} votes</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
```

---

## 🎯 Game Rules (for UX decisions)

### Overview

Mister White is a social deduction game where one player (Mister White) doesn't know the secret word and must blend in with other players who do know it.

### Game Flow

1. **Setup Phase**
   - Secret word chosen
   - One player randomly assigned as Mister White
   - Other players are Citizens (know the word)

2. **Clue Phase**
   - Each Citizen gives a clue about the secret word
   - Mister White sees other clues, then gives their own clue (trying to blend in)
   - **UI Note:** Show clues sequentially as they arrive

3. **Discussion Phase (2 rounds)**
   - Players discuss who they suspect is Mister White
   - Players analyze each other's clues
   - **UI Note:** Clearly indicate Round 1 vs Round 2

4. **Voting Phase**
   - Each player votes to eliminate someone
   - Player with most votes is eliminated
   - **UI Note:** Show vote counts as they come in

5. **Results**
   - If Mister White was eliminated: **Citizens win** 🎉
   - If a Citizen was eliminated: **Mister White wins** 👤

### Strategy

- **Citizens:** Give clues specific enough for allies but vague enough to confuse Mister White
- **Mister White:** Analyze clues to guess the word and give a believable clue

---

## 🌐 CORS & Security

### CORS Headers

The API includes CORS headers. For production, ensure your frontend domain is whitelisted.

### No Authentication Required

Currently, the API has no authentication. If needed in the future, include:

```typescript
headers: {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
}
```

---

## 📖 OpenAPI Documentation

### Interactive Docs

**Swagger UI:** `http://localhost:8001/docs`
**ReDoc:** `http://localhost:8001/redoc`

### Generate TypeScript Types

You can auto-generate types from OpenAPI schema:

```bash
# Using openapi-typescript
npx openapi-typescript http://localhost:8001/openapi.json -o types/api.ts
```

---

## ⚡ Performance Considerations

### Game Duration

- Typical game: **30-60 seconds**
- LLM API calls are the bottleneck (not the API)
- Show progress indicators during game execution

### WebSocket vs Polling

**WebSocket (Recommended):**

- Real-time updates
- Low overhead
- Better UX

**Polling (Fallback):**

```typescript
// Poll every 2 seconds
const interval = setInterval(async () => {
  const response = await fetch(`${API_URL}/api/v1/games/${gameId}`);
  const game = await response.json();

  if (game.status === "completed") {
    clearInterval(interval);
  }
}, 2000);
```

### Concurrent Games

- Multiple games can run simultaneously
- Each WebSocket connection is per-game
- No limit on concurrent viewers per game

---

## 🐛 Error Handling

### HTTP Error Codes

| Code | Meaning          | Action                      |
| ---- | ---------------- | --------------------------- |
| 200  | Success          | Continue                    |
| 201  | Created          | Game created successfully   |
| 404  | Not Found        | Game doesn't exist          |
| 422  | Validation Error | Check request payload       |
| 500  | Server Error     | Retry or show error message |

### Error Response Format

```typescript
{
  detail: string; // Error message
}
```

### Example Error Handling

```typescript
async function createGame(models: ModelConfig[]) {
  try {
    const response = await fetch(`${API_URL}/api/v1/games`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ models }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to create game");
    }

    return await response.json();
  } catch (error) {
    console.error("Game creation failed:", error);
    // Show error to user
    throw error;
  }
}
```

---

## 📞 Support & Resources

### Backend Documentation

- `API_README.md` - Complete API reference
- `API_ARCHITECTURE.md` - Technical architecture
- `QUICK_START_API.md` - Quick start guide

### Testing

Test the API using the interactive docs at `/docs` or use the example clients in `examples/` directory.

### Contact

For questions or issues, contact the backend team or check the repository documentation.

---

## ✅ Integration Checklist

- [ ] Set environment variables (`NEXT_PUBLIC_MRWHITE_API_URL`, `NEXT_PUBLIC_MRWHITE_WS_URL`)
- [ ] Copy TypeScript types from this document
- [ ] Implement game creation UI (model selector)
- [ ] Implement WebSocket connection hook
- [ ] Implement game viewer component
- [ ] Add loading states for all async operations
- [ ] Add error handling for API calls
- [ ] Test with real backend (start with `./run_api.sh`)
- [ ] Implement game list view (optional)
- [ ] Add visual polish (animations, colors, icons)
- [ ] Test WebSocket reconnection on connection loss
- [ ] Optimize for mobile responsiveness

---

## 🎉 Ready to Integrate!

This should provide everything your frontend engineer needs to integrate with the Mister White Game API. If you have questions or need clarification on any endpoint, refer to the interactive API docs at `/docs` or reach out to the backend team!
