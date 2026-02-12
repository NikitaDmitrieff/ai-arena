# Frontend Integration Guide - Codenames AI Arena

## Overview

This document provides all technical details needed to integrate the frontend with the Codenames AI Arena FastAPI backend.

**Game Type**: Codenames (word association board game)  
**Players**: 4 AI agents (2 teams: Red vs Blue, each with Spymaster + Operative)  
**Gameplay**: Fire-and-forget (games run automatically to completion)  
**Real-time**: WebSocket for live game updates

---

## 1. FastAPI Endpoints Structure

### Base URL

```
http://localhost:8002
```

### Endpoints Summary

| Method | Endpoint               | Description                       |
| ------ | ---------------------- | --------------------------------- |
| GET    | `/`                    | Root endpoint with API info       |
| GET    | `/docs`                | OpenAPI interactive documentation |
| GET    | `/api/models`          | List available LLM models         |
| POST   | `/api/games`           | Start a new game                  |
| GET    | `/api/games`           | List all active game IDs          |
| GET    | `/api/games/{game_id}` | Get current game state            |
| DELETE | `/api/games/{game_id}` | Delete/abort a game               |
| WS     | `/ws/games/{game_id}`  | WebSocket for real-time updates   |

---

## 2. Detailed Endpoint Specifications

### 2.1 GET `/api/models`

**Purpose**: Retrieve list of available LLM models for configuration

**Request**: None

**Response**: `200 OK`

```json
[
  {
    "provider": "openai",
    "model": "gpt-4o"
  },
  {
    "provider": "openai",
    "model": "gpt-4o-mini"
  },
  {
    "provider": "mistral",
    "model": "mistral-large-latest"
  },
  {
    "provider": "mistral",
    "model": "mistral-medium-latest"
  }
]
```

**TypeScript Interface**:

```typescript
interface ModelInfo {
  provider: string;
  model: string;
}
```

---

### 2.2 POST `/api/games`

**Purpose**: Start a new Codenames game

**Request Body**:

```json
{
  "red_spymaster": {
    "provider": "openai",
    "model": "gpt-4o",
    "temperature": 0.6,
    "max_output_tokens": 320
  },
  "red_operative": {
    "provider": "openai",
    "model": "gpt-4o-mini",
    "temperature": 0.5,
    "max_output_tokens": 320
  },
  "blue_spymaster": {
    "provider": "mistral",
    "model": "mistral-large-latest",
    "temperature": 0.6,
    "max_output_tokens": 320
  },
  "blue_operative": {
    "provider": "mistral",
    "model": "mistral-medium-latest",
    "temperature": 0.5,
    "max_output_tokens": 320
  },
  "seed": 42
}
```

**Field Details**:

- `provider`: **Required** - LLM provider (`"openai"` or `"mistral"`)
- `model`: **Required** - Model name (see `/api/models` for options)
- `temperature`: **Optional** - Float (0.0-1.0), defaults: 0.6 for spymasters, 0.5 for operatives
- `max_output_tokens`: **Optional** - Integer, default: 320
- `seed`: **Optional** - Integer for reproducible games, null for random

**Response**: `200 OK`

```json
{
  "game_id": "550e8400-e29b-41d4-a716-446655440000",
  "phase": "await_clue",
  "current_team": "RED",
  "turn_number": 1,
  "red_remaining": 9,
  "blue_remaining": 8,
  "winner": null,
  "assassin_revealed": false
}
```

**TypeScript Interfaces**:

```typescript
interface AgentConfig {
  provider: "openai" | "mistral";
  model: string;
  temperature?: number;
  max_output_tokens?: number;
}

interface GameStartRequest {
  red_spymaster: AgentConfig;
  red_operative: AgentConfig;
  blue_spymaster: AgentConfig;
  blue_operative: AgentConfig;
  seed?: number | null;
}

interface GameStatus {
  game_id: string;
  phase: "await_clue" | "await_guess" | "finished";
  current_team: "RED" | "BLUE";
  turn_number: number;
  red_remaining: number;
  blue_remaining: number;
  winner: "RED" | "BLUE" | null;
  assassin_revealed: boolean;
}
```

---

### 2.3 GET `/api/games`

**Purpose**: List all active game IDs

**Request**: None

**Response**: `200 OK`

```json
["550e8400-e29b-41d4-a716-446655440000", "660e8400-e29b-41d4-a716-446655440001"]
```

**TypeScript Interface**:

```typescript
type GameIdList = string[];
```

---

### 2.4 GET `/api/games/{game_id}`

**Purpose**: Get full game state (board, status, last clue)

**Request**: None

**Response**: `200 OK`

```json
{
  "game_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": {
    "game_id": "550e8400-e29b-41d4-a716-446655440000",
    "phase": "await_guess",
    "current_team": "RED",
    "turn_number": 1,
    "red_remaining": 9,
    "blue_remaining": 8,
    "winner": null,
    "assassin_revealed": false
  },
  "board": [
    [
      {
        "word": "BATTERY",
        "revealed": false,
        "card_type": null
      },
      {
        "word": "COMPUTER",
        "revealed": true,
        "card_type": "RED"
      },
      {
        "word": "PHONE",
        "revealed": false,
        "card_type": null
      },
      {
        "word": "TREE",
        "revealed": false,
        "card_type": null
      },
      {
        "word": "OCEAN",
        "revealed": false,
        "card_type": null
      }
    ]
  ],
  "last_clue": {
    "word": "TECHNOLOGY",
    "number": 2
  }
}
```

**Response**: `404 Not Found` (if game doesn't exist)

**TypeScript Interfaces**:

```typescript
interface BoardCard {
  word: string;
  revealed: boolean;
  card_type: "RED" | "BLUE" | "NEUTRAL" | "ASSASSIN" | null;
}

interface Clue {
  word: string;
  number: number;
}

interface GameStateResponse {
  game_id: string;
  status: GameStatus;
  board: BoardCard[][]; // 5x5 grid
  last_clue: Clue | null;
}
```

---

### 2.5 DELETE `/api/games/{game_id}`

**Purpose**: Cancel/abort an active game

**Request**: None

**Response**: `200 OK`

```json
{
  "message": "Game deleted"
}
```

**Response**: `404 Not Found` (if game doesn't exist)

---

## 3. WebSocket Protocol

### 3.1 Connection

**URL**: `ws://localhost:8002/ws/games/{game_id}`

**Connection Flow**:

1. Client connects to WebSocket URL
2. Server immediately sends current `game_state` event
3. Server streams all game events as they occur
4. Connection auto-closes when game ends

### 3.2 Event Format

All WebSocket messages follow this structure:

```json
{
  "event_type": "string",
  "data": {}
}
```

### 3.3 Event Types

#### `game_state` (sent immediately on connect)

```json
{
  "event_type": "game_state",
  "data": {
    "game_id": "550e8400-e29b-41d4-a716-446655440000",
    "phase": "await_clue",
    "current_team": "RED",
    "turn_number": 1,
    "board": [
      /* 5x5 array of BoardCard */
    ],
    "red_remaining": 9,
    "blue_remaining": 8,
    "winner": null,
    "assassin_revealed": false
  }
}
```

#### `game_started` (when game begins)

```json
{
  "event_type": "game_started",
  "data": {
    "game_id": "550e8400-e29b-41d4-a716-446655440000",
    "starting_team": "RED",
    "board": [
      /* 5x5 array of BoardCard */
    ],
    "red_cards": 9,
    "blue_cards": 8
  }
}
```

#### `turn_started` (new turn begins)

```json
{
  "event_type": "turn_started",
  "data": {
    "turn_number": 1,
    "team": "RED",
    "red_remaining": 9,
    "blue_remaining": 8
  }
}
```

#### `clue_given` (spymaster provides clue)

```json
{
  "event_type": "clue_given",
  "data": {
    "team": "RED",
    "clue": "TECHNOLOGY",
    "number": 2,
    "reasoning": "Connects to COMPUTER and PHONE",
    "turn_number": 1
  }
}
```

#### `guess_made` (operative guesses a word)

```json
{
  "event_type": "guess_made",
  "data": {
    "team": "RED",
    "word": "COMPUTER",
    "card_type": "RED",
    "reasoning": "Relates to TECHNOLOGY clue",
    "ended_turn": false,
    "assassin_hit": false,
    "team_won": null,
    "guesses_left": 2,
    "turn_number": 1,
    "red_remaining": 8,
    "blue_remaining": 8
  }
}
```

#### `turn_ended` (turn ends voluntarily)

```json
{
  "event_type": "turn_ended",
  "data": {
    "team": "RED",
    "turn_number": 1,
    "reason": "voluntary",
    "reasoning": "Too risky to continue guessing"
  }
}
```

#### `game_ended` (game finishes)

```json
{
  "event_type": "game_ended",
  "data": {
    "winner": "RED",
    "assassin_revealed": false,
    "total_turns": 12,
    "red_remaining": 0,
    "blue_remaining": 3
  }
}
```

### 3.4 WebSocket TypeScript Interfaces

```typescript
type WebSocketEventType =
  | "game_state"
  | "game_started"
  | "turn_started"
  | "clue_given"
  | "guess_made"
  | "turn_ended"
  | "game_ended";

interface WebSocketMessage {
  event_type: WebSocketEventType;
  data: any; // Use specific interfaces below
}

interface GameStateEvent {
  game_id: string;
  phase: "await_clue" | "await_guess" | "finished";
  current_team: "RED" | "BLUE";
  turn_number: number;
  board: BoardCard[][];
  red_remaining: number;
  blue_remaining: number;
  winner: "RED" | "BLUE" | null;
  assassin_revealed: boolean;
}

interface GameStartedEvent {
  game_id: string;
  starting_team: "RED" | "BLUE";
  board: BoardCard[][];
  red_cards: number;
  blue_cards: number;
}

interface TurnStartedEvent {
  turn_number: number;
  team: "RED" | "BLUE";
  red_remaining: number;
  blue_remaining: number;
}

interface ClueGivenEvent {
  team: "RED" | "BLUE";
  clue: string;
  number: number;
  reasoning: string;
  turn_number: number;
}

interface GuessMadeEvent {
  team: "RED" | "BLUE";
  word: string;
  card_type: "RED" | "BLUE" | "NEUTRAL" | "ASSASSIN";
  reasoning: string;
  ended_turn: boolean;
  assassin_hit: boolean;
  team_won: "RED" | "BLUE" | null;
  guesses_left: number;
  turn_number: number;
  red_remaining: number;
  blue_remaining: number;
}

interface TurnEndedEvent {
  team: "RED" | "BLUE";
  turn_number: number;
  reason: "voluntary";
  reasoning: string;
}

interface GameEndedEvent {
  winner: "RED" | "BLUE" | null;
  assassin_revealed: boolean;
  total_turns: number;
  red_remaining: number;
  blue_remaining: number;
}
```

---

## 4. Game State Schema

### Board Representation

- **Size**: 5x5 grid (25 cards total)
- **Structure**: 2D array `BoardCard[][]`
- **Indexing**: `board[row][col]` where row, col ∈ [0, 4]

### Card Distribution (Standard Game)

- **Starting team** (random): 9 cards
- **Other team**: 8 cards
- **Neutral**: 7 cards
- **Assassin**: 1 card (instant loss if revealed)

### Game Phases

1. `await_clue` - Waiting for spymaster to give clue
2. `await_guess` - Waiting for operatives to guess
3. `finished` - Game over

### Win Conditions

- Team reveals all their cards → That team wins
- Team reveals assassin → Opponent wins
- Maximum turns reached (50) → Team with fewer remaining cards wins

### Turn Structure

1. Spymaster gives clue (word + number)
2. Operatives make up to (number + 1) guesses
3. Turn ends when:
   - Wrong card guessed (opponent/neutral)
   - All guesses used
   - Operatives choose to end turn
   - Assassin revealed
   - All team cards revealed

---

## 5. Environment Variables

### Required Environment Variable

```bash
NEXT_PUBLIC_CODENAMES_API_URL=http://localhost:8002
```

**Usage in Frontend**:

```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_CODENAMES_API_URL || "http://localhost:8002";
const WS_BASE_URL = API_BASE_URL.replace("http", "ws");
```

### Backend Environment Variables (Server-side only)

Backend requires LLM API keys (not exposed to frontend):

```bash
OPENAI_API_KEY=sk-...
MISTRAL_API_KEY=...
```

---

## 6. Game-Specific Details

### Player Types

**Only AI players** - No human or random players supported.

**Teams**:

- **Red Team**: 2 AI agents
  - Red Spymaster (gives clues)
  - Red Operative (makes guesses)
- **Blue Team**: 2 AI agents
  - Blue Spymaster (gives clues)
  - Blue Operative (makes guesses)

### LLM Configuration

**Supported Providers**:

- `openai` - OpenAI models (GPT-4, GPT-4o, GPT-3.5-turbo, etc.)
- `mistral` - Mistral AI models (mistral-large, mistral-medium, etc.)

**Configuration Options**:

- `model` - Specific model name (required)
- `temperature` - Creativity (0.0-1.0, optional)
- `max_output_tokens` - Response length limit (optional)

**Recommended Settings**:

- Spymasters: `temperature: 0.6` (more creative clues)
- Operatives: `temperature: 0.5` (more conservative guesses)

### Real-time Behavior

**Game Execution**:

- Fire-and-forget: Game runs automatically after creation
- No user intervention required
- Games typically take 30-120 seconds to complete
- Average: 10-20 turns per game

**Event Frequency**:

- Events arrive every 1-5 seconds during active play
- Clue generation: ~2-5 seconds
- Guess generation: ~1-3 seconds

### UI Requirements

**Board Visualization**:

```
Grid Size: 5x5
Total Cards: 25

Example Layout:
 A    B    C    D    E
1 [ ]  [ ]  [ ]  [ ]  [ ]
2 [ ]  [ ]  [ ]  [ ]  [ ]
3 [ ]  [ ]  [ ]  [ ]  [ ]
4 [ ]  [ ]  [ ]  [ ]  [ ]
5 [ ]  [ ]  [ ]  [ ]  [ ]
```

**Card States**:

1. **Hidden** - `revealed: false`
   - Show word only
   - No color indication
2. **Revealed** - `revealed: true`
   - Show word
   - Color based on `card_type`:
     - `RED` → Red background
     - `BLUE` → Blue background
     - `NEUTRAL` → Beige/tan background
     - `ASSASSIN` → Black background

**Suggested UI Elements**:

- Game status bar (turn number, current team, cards remaining)
- Current clue display (word + number)
- Clue/guess reasoning tooltips
- Turn history/log
- Team scores (cards remaining)
- Assassin warning indicator

**Color Palette Recommendations**:

- Red team: `#d32f2f` or similar
- Blue team: `#1976d2` or similar
- Neutral: `#e0d4c0` or similar
- Assassin: `#000000`
- Background: `#f5f5f5`

---

## 7. Code Examples

### 7.1 React Hook for Game Management

```typescript
import { useState, useEffect, useCallback } from "react";

const API_BASE_URL = process.env.NEXT_PUBLIC_CODENAMES_API_URL || "http://localhost:8002";
const WS_BASE_URL = API_BASE_URL.replace("http", "ws");

export function useCodenamesGame() {
  const [gameId, setGameId] = useState<string | null>(null);
  const [gameState, setGameState] = useState<GameStateEvent | null>(null);
  const [events, setEvents] = useState<WebSocketMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  const startGame = useCallback(async (config: GameStartRequest) => {
    const response = await fetch(`${API_BASE_URL}/api/games`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    });

    if (!response.ok) throw new Error("Failed to start game");

    const status: GameStatus = await response.json();
    setGameId(status.game_id);
    return status.game_id;
  }, []);

  const deleteGame = useCallback(async (id: string) => {
    await fetch(`${API_BASE_URL}/api/games/${id}`, {
      method: "DELETE",
    });
    setGameId(null);
    setGameState(null);
    setEvents([]);
  }, []);

  useEffect(() => {
    if (!gameId) return;

    const ws = new WebSocket(`${WS_BASE_URL}/ws/games/${gameId}`);

    ws.onopen = () => setIsConnected(true);

    ws.onmessage = (event) => {
      const message: WebSocketMessage = JSON.parse(event.data);

      if (message.event_type === "game_state") {
        setGameState(message.data as GameStateEvent);
      }

      setEvents((prev) => [...prev, message]);
    };

    ws.onclose = () => setIsConnected(false);

    return () => {
      ws.close();
    };
  }, [gameId]);

  return {
    gameId,
    gameState,
    events,
    isConnected,
    startGame,
    deleteGame,
  };
}
```

### 7.2 Fetching Available Models

```typescript
async function fetchAvailableModels(): Promise<ModelInfo[]> {
  const response = await fetch(`${API_BASE_URL}/api/models`);
  if (!response.ok) throw new Error("Failed to fetch models");
  return response.json();
}
```

### 7.3 Getting Game State

```typescript
async function getGameState(gameId: string): Promise<GameStateResponse> {
  const response = await fetch(`${API_BASE_URL}/api/games/${gameId}`);
  if (!response.ok) {
    if (response.status === 404) throw new Error("Game not found");
    throw new Error("Failed to fetch game state");
  }
  return response.json();
}
```

---

## 8. OpenAPI Documentation

**Interactive Docs**: http://localhost:8002/docs

The FastAPI server provides automatic OpenAPI/Swagger documentation at `/docs`. This includes:

- Complete schema definitions
- Request/response examples
- "Try it out" functionality
- Model schemas

**Alternative Docs**: http://localhost:8002/redoc (ReDoc format)

**OpenAPI JSON**: http://localhost:8002/openapi.json

---

## 9. Game Rules (for UI/UX)

### Objective

Two teams compete to identify their words on a 5x5 grid based on clues from their spymaster.

### Roles

- **Spymaster**: Sees which cards belong to which team, gives one-word clues
- **Operative**: Doesn't see card types, makes guesses based on clues

### Gameplay

1. Spymaster gives clue: ONE WORD + NUMBER
   - Word: Cannot be any word on the board
   - Number: How many cards relate to the clue (0-4)
2. Operatives guess up to (number + 1) cards
   - Correct (own team): Can continue guessing
   - Neutral: Turn ends
   - Opponent's card: Turn ends, helps opponent
   - Assassin: Instant loss for guessing team

3. Turn continues until:
   - Wrong card guessed
   - All guesses exhausted
   - Team voluntarily ends turn
   - Game ends

### Winning

- Reveal all your team's cards → WIN
- Opponent reveals assassin → WIN
- Game reaches turn limit → Team with fewer cards wins

---

## 10. Error Handling

### HTTP Errors

**404 Not Found**

```json
{
  "detail": "Game not found"
}
```

**500 Internal Server Error**

```json
{
  "detail": "Error message here"
}
```

### WebSocket Errors

**Connection Failures**:

- Game doesn't exist: Connection closes with code 1008
- Network issues: Standard WebSocket errors

**Recommended Error Handling**:

```typescript
ws.onerror = (error) => {
  console.error("WebSocket error:", error);
  // Show user-friendly error message
};

ws.onclose = (event) => {
  if (event.code === 1008) {
    // Game not found
  }
  // Handle disconnection
};
```

---

## 11. Testing Endpoints

### Quick Test with cURL

```bash
# List models
curl http://localhost:8002/api/models

# Start a game
curl -X POST http://localhost:8002/api/games \
  -H "Content-Type: application/json" \
  -d '{
    "red_spymaster": {"provider": "openai", "model": "gpt-4o"},
    "red_operative": {"provider": "openai", "model": "gpt-4o-mini"},
    "blue_spymaster": {"provider": "mistral", "model": "mistral-large-latest"},
    "blue_operative": {"provider": "mistral", "model": "mistral-medium-latest"}
  }'

# Get game state (replace {game_id})
curl http://localhost:8002/api/games/{game_id}

# List all games
curl http://localhost:8002/api/games

# Delete game
curl -X DELETE http://localhost:8002/api/games/{game_id}
```

---

## 12. Performance Considerations

### API Response Times

- `/api/models`: < 10ms
- `/api/games` (list): < 10ms
- `/api/games/{id}`: < 10ms
- `POST /api/games`: < 100ms (game creation only, not completion)

### Game Duration

- Typical: 30-120 seconds
- Turn interval: 3-8 seconds
- Total turns: 10-20 average

### Concurrent Games

- Backend supports multiple simultaneous games
- No practical limit on concurrent games
- Each game runs independently

### WebSocket

- Low bandwidth (~1-5 KB per event)
- Events arrive every 1-5 seconds during play
- Connection stays open for game duration

---

## 13. Deployment Notes

### CORS Configuration

Currently set to allow all origins (`allow_origins=["*"]`).

**Production recommendation**: Update in `api/app.py`:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://your-frontend-domain.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### WebSocket Considerations

- Ensure reverse proxy (nginx/etc.) supports WebSocket upgrades
- Set appropriate timeout values for long-running connections

---

## Support

For questions or issues:

1. Check OpenAPI docs: http://localhost:8002/docs
2. Review example client: `example_client.py`
3. Test with provided cURL commands

**API Version**: 1.0.0
**Last Updated**: 2025-10-07
