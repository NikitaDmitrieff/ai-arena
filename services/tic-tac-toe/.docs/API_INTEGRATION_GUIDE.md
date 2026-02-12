# Tic-Tac-Toe FastAPI Backend - Complete Integration Guide

**Version:** 1.0.0  
**Last Updated:** 2025-09-30  
**Base URL:** `http://localhost:8000`

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [Complete API Reference](#complete-api-reference)
4. [Data Models](#data-models)
5. [Integration Walkthrough](#integration-walkthrough)
6. [Common Workflows](#common-workflows)
7. [Frontend Implementation Examples](#frontend-implementation-examples)
8. [Error Handling](#error-handling)
9. [Testing Your Integration](#testing-your-integration)
10. [Advanced Topics](#advanced-topics)

---

## Overview

This guide provides everything you need to integrate with the Tic-Tac-Toe FastAPI backend. The API supports:

- **Random AI Players**: Simple random move selection
- **LLM-Powered Players**: GPT-4, GPT-3.5, Mistral models
- **Real-Time Game Management**: Create, play, reset, delete games
- **Move-by-Move or Auto-Play**: Granular control or full automation
- **Comprehensive Logging**: Track all moves and game outcomes

### Key Features

✅ RESTful JSON API  
✅ CORS enabled (works from any origin)  
✅ Type-safe with Pydantic models  
✅ OpenAPI/Swagger documentation  
✅ Real-time game state updates  
✅ Support for multiple concurrent games

---

## Quick Start

### 1. Start the Backend

```bash
# Option A: Using Docker
cd tic-tac-toe
docker-compose up

# Option B: Direct Python
cd tic-tac-toe
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 2. Verify It's Running

```bash
curl http://localhost:8000/
```

Expected response:
```json
{
  "message": "Tic-Tac-Toe API",
  "endpoints": {
    "POST /games": "Create a new game",
    "GET /games/{game_id}": "Get game state",
    "POST /games/{game_id}/move": "Make a move (random if no row/col provided)",
    "POST /games/{game_id}/auto": "Play entire game automatically",
    "POST /games/{game_id}/reset": "Reset a game",
    "DELETE /games/{game_id}": "Delete a game"
  }
}
```

### 3. Test with a Simple Game

```bash
# Create a game
curl -X POST http://localhost:8000/games \
  -H "Content-Type: application/json" \
  -d '{}'

# Make a move (using the game_id from previous response)
curl -X POST http://localhost:8000/games/{game_id}/move \
  -H "Content-Type: application/json" \
  -d '{}'
```

### 4. Access Interactive Documentation

Open in your browser:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **OpenAPI JSON**: http://localhost:8000/openapi.json

---

## Complete API Reference

### Endpoint Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | API information |
| POST | `/games` | Create new game |
| GET | `/games` | List all games |
| GET | `/games/{game_id}` | Get game state |
| POST | `/games/{game_id}/move` | Make a move |
| POST | `/games/{game_id}/auto` | Auto-play entire game |
| POST | `/games/{game_id}/reset` | Reset game |
| DELETE | `/games/{game_id}` | Delete game |
| GET | `/logs` | Get log file paths |
| GET | `/schema/typescript` | Get TypeScript types |

---

## Data Models

### Core Types

#### PlayerConfig

Configuration for a single player (X or O).

```typescript
interface PlayerConfig {
  use_llm: boolean;        // Use LLM (true) or random moves (false)
  provider: string;         // 'openai' or 'mistral'
  model: string;            // Model name (e.g., 'gpt-4o-mini')
  temperature: number;      // 0.0 to 2.0 (default: 0.7)
}
```

**Supported Models:**

**OpenAI:**
- `gpt-4o-mini` (recommended, fast & cheap)
- `gpt-4o`
- `gpt-4-turbo`
- `gpt-3.5-turbo`

**Mistral:**
- `mistral-small-latest`
- `mistral-medium-latest`
- `mistral-large-latest`

**Example:**
```json
{
  "use_llm": true,
  "provider": "openai",
  "model": "gpt-4o-mini",
  "temperature": 0.7
}
```

#### GameConfig

Configuration for creating a new game.

```typescript
interface GameConfig {
  player_x?: PlayerConfig;   // Optional config for Player X
  player_o?: PlayerConfig;   // Optional config for Player O
  enable_logging: boolean;   // Enable move/game logging (default: true)
}
```

**Examples:**

Random vs Random:
```json
{
  "player_x": {"use_llm": false},
  "player_o": {"use_llm": false},
  "enable_logging": true
}
```

LLM vs LLM:
```json
{
  "player_x": {
    "use_llm": true,
    "provider": "openai",
    "model": "gpt-4o-mini",
    "temperature": 0.7
  },
  "player_o": {
    "use_llm": true,
    "provider": "openai",
    "model": "gpt-4o-mini",
    "temperature": 0.9
  },
  "enable_logging": true
}
```

#### MoveRequest

Request to make a move.

```typescript
interface MoveRequest {
  row?: number;    // 0-2, optional (player chooses if omitted)
  col?: number;    // 0-2, optional (player chooses if omitted)
}
```

**Examples:**

Specific move:
```json
{"row": 1, "col": 1}
```

Let player choose (LLM or random):
```json
{}
```

#### GameState

Current state of a game.

```typescript
interface GameState {
  board: (string | null)[][];       // 3x3 board, 'X', 'O', or null
  current_player: string | null;     // 'X' or 'O', null if game over
  winner: string | null;             // 'X', 'O', or null
  is_draw: boolean;                  // True if draw
  game_over: boolean;                // True if game finished
  move_history: MoveHistoryEntry[];  // All moves made
  available_moves: [number, number][]; // Available (row, col) pairs
}

interface MoveHistoryEntry {
  player: string;        // 'X' or 'O'
  row: number;          // 0-2
  col: number;          // 0-2
  reasoning?: string;   // LLM reasoning (if available)
}
```

**Example:**
```json
{
  "board": [
    ["X", null, "O"],
    [null, "X", null],
    [null, null, "O"]
  ],
  "current_player": "X",
  "winner": null,
  "is_draw": false,
  "game_over": false,
  "move_history": [
    {"player": "X", "row": 0, "col": 0},
    {"player": "O", "row": 0, "col": 2}
  ],
  "available_moves": [[0, 1], [1, 0], [1, 2], [2, 0], [2, 1]]
}
```

#### MoveMetadata

Additional information about a move (returned with move responses).

```typescript
interface MoveMetadata {
  player_type: string;         // 'llm' or 'random'
  prompt?: string;             // Prompt sent to LLM
  response?: string;           // Raw LLM response
  reasoning?: string;          // Parsed reasoning from LLM
  response_time_ms?: number;   // LLM response time
  error?: string;              // Error message (if any)
}
```

---

## API Endpoints - Detailed Reference

### 1. Create Game

**POST** `/games`

Create a new tic-tac-toe game with optional player configurations.

#### Request

**Headers:**
```
Content-Type: application/json
```

**Body (optional):**
```json
{
  "player_x": {
    "use_llm": true,
    "provider": "openai",
    "model": "gpt-4o-mini",
    "temperature": 0.7
  },
  "player_o": {
    "use_llm": false
  },
  "enable_logging": true
}
```

**If body is omitted**, both players default to random move selection.

#### Response (200 OK)

```json
{
  "game_id": "550e8400-e29b-41d4-a716-446655440000",
  "message": "Game created successfully",
  "state": {
    "board": [[null, null, null], [null, null, null], [null, null, null]],
    "current_player": "X",
    "winner": null,
    "is_draw": false,
    "game_over": false,
    "move_history": [],
    "available_moves": [[0,0], [0,1], [0,2], [1,0], [1,1], [1,2], [2,0], [2,1], [2,2]]
  },
  "player_x": {
    "type": "llm",
    "model": "gpt-4o-mini"
  },
  "player_o": {
    "type": "random",
    "model": null
  }
}
```

#### Example (cURL)

```bash
curl -X POST http://localhost:8000/games \
  -H "Content-Type: application/json" \
  -d '{
    "player_x": {"use_llm": true, "provider": "openai", "model": "gpt-4o-mini"},
    "player_o": {"use_llm": true, "provider": "openai", "model": "gpt-4o-mini"}
  }'
```

#### Example (JavaScript/Fetch)

```javascript
const response = await fetch('http://localhost:8000/games', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    player_x: {
      use_llm: true,
      provider: 'openai',
      model: 'gpt-4o-mini',
      temperature: 0.7
    },
    player_o: {
      use_llm: true,
      provider: 'openai',
      model: 'gpt-4o-mini',
      temperature: 0.9
    },
    enable_logging: true
  })
});

const data = await response.json();
console.log('Game created:', data.game_id);
```

---

### 2. Get Game State

**GET** `/games/{game_id}`

Retrieve the current state of a specific game.

#### Request

**Path Parameters:**
- `game_id` (string): UUID of the game

**Example:** `GET /games/550e8400-e29b-41d4-a716-446655440000`

#### Response (200 OK)

```json
{
  "game_id": "550e8400-e29b-41d4-a716-446655440000",
  "state": {
    "board": [["X", "O", null], [null, "X", null], [null, null, "O"]],
    "current_player": "X",
    "winner": null,
    "is_draw": false,
    "game_over": false,
    "move_history": [
      {"player": "X", "row": 0, "col": 0, "reasoning": "Control center"},
      {"player": "O", "row": 0, "col": 1},
      {"player": "X", "row": 1, "col": 1}
    ],
    "available_moves": [[0, 2], [1, 0], [1, 2], [2, 0], [2, 1]]
  }
}
```

#### Response (404 Not Found)

```json
{
  "detail": "Game not found"
}
```

#### Example (cURL)

```bash
curl http://localhost:8000/games/550e8400-e29b-41d4-a716-446655440000
```

#### Example (JavaScript/Fetch)

```javascript
const gameId = '550e8400-e29b-41d4-a716-446655440000';
const response = await fetch(`http://localhost:8000/games/${gameId}`);
const data = await response.json();

console.log('Current player:', data.state.current_player);
console.log('Board:', data.state.board);
```

---

### 3. Make Move

**POST** `/games/{game_id}/move`

Make a single move in the game. Can specify exact coordinates or let the current player choose.

#### Request

**Path Parameters:**
- `game_id` (string): UUID of the game

**Headers:**
```
Content-Type: application/json
```

**Body (optional):**
```json
{
  "row": 1,
  "col": 1
}
```

**If `row` and `col` are omitted**, the current player will choose a move (LLM decision or random).

#### Response (200 OK)

**Successful move:**
```json
{
  "game_id": "550e8400-e29b-41d4-a716-446655440000",
  "success": true,
  "message": "Move successful",
  "board": [["X", "O", null], ["X", "X", null], [null, null, "O"]],
  "game_over": false,
  "current_player": "O",
  "move": {
    "row": 1,
    "col": 0,
    "player": "X"
  },
  "metadata": {
    "player_type": "llm",
    "prompt": "...",
    "response": "{\"row\": 1, \"col\": 0, \"reasoning\": \"Block opponent\"}",
    "reasoning": "Block opponent",
    "response_time_ms": 342,
    "error": null
  }
}
```

**Game over (winner):**
```json
{
  "game_id": "550e8400-e29b-41d4-a716-446655440000",
  "success": true,
  "message": "Player X wins!",
  "board": [["X", "O", "O"], ["X", "X", null], ["X", null, "O"]],
  "game_over": true,
  "winner": "X",
  "is_draw": false,
  "move": {
    "row": 2,
    "col": 0,
    "player": "X"
  },
  "metadata": {
    "player_type": "llm",
    "reasoning": "Winning move!",
    "response_time_ms": 298
  }
}
```

**Game over (draw):**
```json
{
  "success": true,
  "message": "It's a draw!",
  "board": [["X", "O", "X"], ["X", "O", "O"], ["O", "X", "X"]],
  "game_over": true,
  "winner": null,
  "is_draw": true,
  "move": {...}
}
```

**Invalid move:**
```json
{
  "success": false,
  "message": "Invalid move at (1, 1)",
  "board": [...],
  "game_over": false,
  "current_player": "X",
  "metadata": {...}
}
```

#### Response (404 Not Found)

```json
{
  "detail": "Game not found"
}
```

#### Example (cURL)

Specific move:
```bash
curl -X POST http://localhost:8000/games/{game_id}/move \
  -H "Content-Type: application/json" \
  -d '{"row": 1, "col": 1}'
```

Let player choose:
```bash
curl -X POST http://localhost:8000/games/{game_id}/move \
  -H "Content-Type: application/json" \
  -d '{}'
```

#### Example (JavaScript/Fetch)

```javascript
// Specific move
const response = await fetch(`http://localhost:8000/games/${gameId}/move`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ row: 1, col: 1 })
});

// Let player choose
const response = await fetch(`http://localhost:8000/games/${gameId}/move`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({})
});

const data = await response.json();
if (data.game_over) {
  console.log('Game over!', data.winner ? `Winner: ${data.winner}` : 'Draw!');
}
```

---

### 4. Auto-Play Game

**POST** `/games/{game_id}/auto`

Play the entire game automatically until completion. All moves are executed on the backend.

⚠️ **Note:** This returns only the final result. For real-time move-by-move display, call `/move` repeatedly instead.

#### Request

**Path Parameters:**
- `game_id` (string): UUID of the game

**No body required.**

#### Response (200 OK)

```json
{
  "game_id": "550e8400-e29b-41d4-a716-446655440000",
  "winner": "X",
  "is_draw": false,
  "board": [["X", "O", "X"], ["O", "X", "O"], [null, null, "X"]],
  "moves": [
    {
      "success": true,
      "message": "Move successful",
      "board": [["X", null, null], ...],
      "move": {"row": 0, "col": 0, "player": "X"},
      ...
    },
    ...
  ],
  "total_moves": 7
}
```

#### Example (cURL)

```bash
curl -X POST http://localhost:8000/games/{game_id}/auto
```

#### Example (JavaScript/Fetch)

```javascript
const response = await fetch(`http://localhost:8000/games/${gameId}/auto`, {
  method: 'POST'
});

const data = await response.json();
console.log(`Game finished in ${data.total_moves} moves`);
console.log(data.winner ? `Winner: ${data.winner}` : 'Draw!');
```

---

### 5. Reset Game

**POST** `/games/{game_id}/reset`

Reset an existing game to initial state (empty board).

#### Request

**Path Parameters:**
- `game_id` (string): UUID of the game

**No body required.**

#### Response (200 OK)

```json
{
  "game_id": "550e8400-e29b-41d4-a716-446655440000",
  "message": "Game reset successfully",
  "state": {
    "board": [[null, null, null], [null, null, null], [null, null, null]],
    "current_player": "X",
    "winner": null,
    "is_draw": false,
    "game_over": false,
    "move_history": [],
    "available_moves": [[0,0], [0,1], [0,2], [1,0], [1,1], [1,2], [2,0], [2,1], [2,2]]
  }
}
```

#### Example (cURL)

```bash
curl -X POST http://localhost:8000/games/{game_id}/reset
```

---

### 6. Delete Game

**DELETE** `/games/{game_id}`

Delete a game from memory.

#### Request

**Path Parameters:**
- `game_id` (string): UUID of the game

#### Response (200 OK)

```json
{
  "game_id": "550e8400-e29b-41d4-a716-446655440000",
  "message": "Game deleted successfully"
}
```

#### Example (cURL)

```bash
curl -X DELETE http://localhost:8000/games/{game_id}
```

---

### 7. List All Games

**GET** `/games`

Get a list of all active games.

#### Response (200 OK)

```json
{
  "total_games": 2,
  "games": [
    {
      "game_id": "550e8400-e29b-41d4-a716-446655440000",
      "player_x_type": "llm",
      "player_o_type": "random",
      "game_over": false,
      "winner": null
    },
    {
      "game_id": "660e8400-e29b-41d4-a716-446655440001",
      "player_x_type": "llm",
      "player_o_type": "llm",
      "game_over": true,
      "winner": "O"
    }
  ]
}
```

#### Example (cURL)

```bash
curl http://localhost:8000/games
```

---

## Integration Walkthrough

### Step 1: Set Up Your Project

**Prerequisites:**
- Backend running on `http://localhost:8000`
- API keys (if using LLM players):
  - `OPENAI_API_KEY` for OpenAI models
  - `MISTRAL_API_KEY` for Mistral models

**Test connectivity:**
```bash
curl http://localhost:8000/
```

### Step 2: Create Type Definitions

**TypeScript** (`types/api.ts`):
```typescript
// Exact types matching backend Pydantic models

export interface PlayerConfig {
  use_llm: boolean;
  provider: 'openai' | 'mistral';
  model: string;
  temperature: number;
}

export interface GameConfig {
  player_x?: PlayerConfig;
  player_o?: PlayerConfig;
  enable_logging: boolean;
}

export interface MoveRequest {
  row?: number;
  col?: number;
}

export interface GameState {
  board: (string | null)[][];
  current_player: string | null;
  winner: string | null;
  is_draw: boolean;
  game_over: boolean;
  move_history: Array<{
    player: string;
    row: number;
    col: number;
    reasoning?: string;
  }>;
  available_moves: [number, number][];
}

export interface MoveMetadata {
  player_type: 'llm' | 'random';
  prompt?: string;
  response?: string;
  reasoning?: string;
  response_time_ms?: number;
  error?: string;
}

export interface CreateGameResponse {
  game_id: string;
  message: string;
  state: GameState;
  player_x: {
    type: string;
    model: string | null;
  };
  player_o: {
    type: string;
    model: string | null;
  };
}

export interface GetGameResponse {
  game_id: string;
  state: GameState;
}

export interface MakeMoveResponse {
  game_id: string;
  success: boolean;
  message: string;
  board: (string | null)[][];
  game_over: boolean;
  winner?: string | null;
  is_draw?: boolean;
  current_player?: string;
  move?: {
    row: number;
    col: number;
    player: string;
  };
  metadata?: MoveMetadata;
}
```

### Step 3: Create API Service Layer

```typescript
// services/api.ts

import type {
  GameConfig,
  CreateGameResponse,
  GetGameResponse,
  MoveRequest,
  MakeMoveResponse
} from '../types/api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public data?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorData: any;
    try {
      errorData = await response.json();
    } catch {
      errorData = { detail: response.statusText };
    }
    throw new ApiError(
      errorData.detail || `HTTP ${response.status}`,
      response.status,
      errorData
    );
  }
  return response.json();
}

export class TicTacToeApi {
  static async createGame(config?: GameConfig): Promise<CreateGameResponse> {
    const response = await fetch(`${API_BASE_URL}/games`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: config ? JSON.stringify(config) : undefined,
    });
    return handleResponse<CreateGameResponse>(response);
  }

  static async getGame(gameId: string): Promise<GetGameResponse> {
    const response = await fetch(`${API_BASE_URL}/games/${gameId}`);
    return handleResponse<GetGameResponse>(response);
  }

  static async makeMove(
    gameId: string,
    move?: MoveRequest
  ): Promise<MakeMoveResponse> {
    const response = await fetch(`${API_BASE_URL}/games/${gameId}/move`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(move || {}),
    });
    return handleResponse<MakeMoveResponse>(response);
  }

  static async resetGame(gameId: string): Promise<GetGameResponse> {
    const response = await fetch(`${API_BASE_URL}/games/${gameId}/reset`, {
      method: 'POST',
    });
    return handleResponse<GetGameResponse>(response);
  }

  static async deleteGame(gameId: string): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/games/${gameId}`, {
      method: 'DELETE',
    });
    return handleResponse<{ message: string }>(response);
  }
}
```

### Step 4: Build Your UI Components

**React Component Example:**

```typescript
// components/TicTacToeGame.tsx

import { useState, useEffect } from 'react';
import { TicTacToeApi } from '../services/api';
import type { GameState } from '../types/api';

export function TicTacToeGame() {
  const [gameId, setGameId] = useState<string | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createNewGame = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await TicTacToeApi.createGame({
        player_x: {
          use_llm: true,
          provider: 'openai',
          model: 'gpt-4o-mini',
          temperature: 0.7
        },
        player_o: {
          use_llm: true,
          provider: 'openai',
          model: 'gpt-4o-mini',
          temperature: 0.9
        },
        enable_logging: true
      });
      setGameId(result.game_id);
      setGameState(result.state);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create game');
    } finally {
      setLoading(false);
    }
  };

  const makeMove = async (row?: number, col?: number) => {
    if (!gameId) return;
    
    setLoading(true);
    setError(null);
    try {
      const result = await TicTacToeApi.makeMove(gameId, { row, col });
      setGameState({
        board: result.board,
        current_player: result.current_player || null,
        winner: result.winner || null,
        is_draw: result.is_draw || false,
        game_over: result.game_over,
        move_history: gameState?.move_history || [],
        available_moves: []
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to make move');
    } finally {
      setLoading(false);
    }
  };

  const handleCellClick = (row: number, col: number) => {
    if (!gameState?.game_over && gameState?.board[row][col] === null) {
      makeMove(row, col);
    }
  };

  return (
    <div>
      <h1>Tic-Tac-Toe</h1>
      
      {!gameId && (
        <button onClick={createNewGame} disabled={loading}>
          Create New Game
        </button>
      )}

      {error && <div style={{ color: 'red' }}>{error}</div>}

      {gameState && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 100px)', gap: '4px' }}>
            {gameState.board.map((row, rowIndex) =>
              row.map((cell, colIndex) => (
                <button
                  key={`${rowIndex}-${colIndex}`}
                  onClick={() => handleCellClick(rowIndex, colIndex)}
                  disabled={loading || gameState.game_over || cell !== null}
                  style={{
                    width: '100px',
                    height: '100px',
                    fontSize: '32px',
                    fontWeight: 'bold'
                  }}
                >
                  {cell}
                </button>
              ))
            )}
          </div>

          {gameState.game_over && (
            <div>
              <h2>
                {gameState.winner ? `Winner: ${gameState.winner}!` : "It's a draw!"}
              </h2>
              <button onClick={createNewGame}>New Game</button>
            </div>
          )}

          {!gameState.game_over && (
            <p>Current player: {gameState.current_player}</p>
          )}
        </>
      )}
    </div>
  );
}
```

---

## Common Workflows

### Workflow 1: Random vs Random Game

```javascript
// 1. Create game with default (random) players
const game = await TicTacToeApi.createGame();
const gameId = game.game_id;

// 2. Play moves until game ends
let gameOver = false;
while (!gameOver) {
  const result = await TicTacToeApi.makeMove(gameId);
  console.log(`${result.move.player} played at (${result.move.row}, ${result.move.col})`);
  console.log('Board:', result.board);
  gameOver = result.game_over;
}

console.log('Game finished!');
```

### Workflow 2: LLM vs LLM with Real-Time Display

```javascript
// 1. Create game with LLM players
const game = await TicTacToeApi.createGame({
  player_x: { use_llm: true, provider: 'openai', model: 'gpt-4o-mini', temperature: 0.7 },
  player_o: { use_llm: true, provider: 'openai', model: 'gpt-4o-mini', temperature: 0.9 },
  enable_logging: true
});

const gameId = game.game_id;

// 2. Play with delays for visualization
let gameOver = false;
while (!gameOver) {
  const result = await TicTacToeApi.makeMove(gameId);
  
  // Update UI
  updateBoard(result.board);
  
  // Show LLM reasoning
  if (result.metadata?.reasoning) {
    console.log(`${result.move.player} reasoning: ${result.metadata.reasoning}`);
  }
  
  gameOver = result.game_over;
  
  // Add delay for visual effect
  if (!gameOver) {
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

if (result.winner) {
  console.log(`${result.winner} wins!`);
} else {
  console.log("It's a draw!");
}
```

### Workflow 3: Human vs LLM

```javascript
// 1. Create game with human as X, LLM as O
const game = await TicTacToeApi.createGame({
  player_x: { use_llm: false },  // Human controls X
  player_o: { use_llm: true, provider: 'openai', model: 'gpt-4o-mini', temperature: 0.7 },
  enable_logging: true
});

const gameId = game.game_id;

// 2. Human makes specific move
const humanMove = await TicTacToeApi.makeMove(gameId, { row: 1, col: 1 });
updateBoard(humanMove.board);

// 3. LLM responds automatically
const llmMove = await TicTacToeApi.makeMove(gameId);  // No coordinates = LLM chooses
console.log(`LLM played at (${llmMove.move.row}, ${llmMove.move.col})`);
console.log(`Reasoning: ${llmMove.metadata.reasoning}`);
updateBoard(llmMove.board);
```

### Workflow 4: Testing Multiple Games

```javascript
// Create and track multiple games
const games = [];

for (let i = 0; i < 5; i++) {
  const game = await TicTacToeApi.createGame({
    player_x: { use_llm: true, provider: 'openai', model: 'gpt-4o-mini' },
    player_o: { use_llm: true, provider: 'openai', model: 'gpt-4o-mini' }
  });
  
  games.push(game.game_id);
}

// List all active games
const gamesList = await fetch('http://localhost:8000/games').then(r => r.json());
console.log(`Total active games: ${gamesList.total_games}`);
```

---

## Frontend Implementation Examples

### Vanilla JavaScript (HTML + Fetch)

```html
<!DOCTYPE html>
<html>
<head>
  <title>Tic-Tac-Toe</title>
  <style>
    .board { display: grid; grid-template-columns: repeat(3, 100px); gap: 4px; }
    .cell { width: 100px; height: 100px; font-size: 32px; font-weight: bold; }
  </style>
</head>
<body>
  <div id="app">
    <button id="createGame">Create Game</button>
    <div id="board" class="board"></div>
    <div id="status"></div>
  </div>

  <script>
    const API_URL = 'http://localhost:8000';
    let gameId = null;

    document.getElementById('createGame').onclick = async () => {
      const response = await fetch(`${API_URL}/games`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          player_x: { use_llm: true, provider: 'openai', model: 'gpt-4o-mini' },
          player_o: { use_llm: true, provider: 'openai', model: 'gpt-4o-mini' }
        })
      });
      
      const data = await response.json();
      gameId = data.game_id;
      renderBoard(data.state.board);
      playAuto();
    };

    async function playAuto() {
      while (true) {
        const response = await fetch(`${API_URL}/games/${gameId}/move`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({})
        });
        
        const data = await response.json();
        renderBoard(data.board);
        
        if (data.game_over) {
          document.getElementById('status').textContent = 
            data.winner ? `${data.winner} wins!` : "Draw!";
          break;
        }
        
        await new Promise(r => setTimeout(r, 1000));
      }
    }

    function renderBoard(board) {
      const boardEl = document.getElementById('board');
      boardEl.innerHTML = '';
      
      for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 3; col++) {
          const cell = document.createElement('button');
          cell.className = 'cell';
          cell.textContent = board[row][col] || '';
          boardEl.appendChild(cell);
        }
      }
    }
  </script>
</body>
</html>
```

### React with Hooks

```typescript
// hooks/useTicTacToe.ts

import { useState, useCallback } from 'react';
import { TicTacToeApi } from '../services/api';
import type { GameState, MoveMetadata } from '../types/api';

export function useTicTacToe() {
  const [gameId, setGameId] = useState<string | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [moveHistory, setMoveHistory] = useState<Array<{
    player: string;
    row: number;
    col: number;
    reasoning?: string;
    metadata?: MoveMetadata;
  }>>([]);

  const createGame = useCallback(async (config?) => {
    setLoading(true);
    setError(null);
    try {
      const result = await TicTacToeApi.createGame(config);
      setGameId(result.game_id);
      setGameState(result.state);
      setMoveHistory([]);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create game');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const makeMove = useCallback(async (row?: number, col?: number) => {
    if (!gameId) throw new Error('No active game');
    
    setLoading(true);
    setError(null);
    try {
      const result = await TicTacToeApi.makeMove(gameId, { row, col });
      
      // Update state
      setGameState({
        board: result.board,
        current_player: result.current_player || null,
        winner: result.winner || null,
        is_draw: result.is_draw || false,
        game_over: result.game_over,
        move_history: gameState?.move_history || [],
        available_moves: []
      });
      
      // Add to move history
      if (result.move) {
        setMoveHistory(prev => [...prev, {
          player: result.move.player,
          row: result.move.row,
          col: result.move.col,
          reasoning: result.metadata?.reasoning,
          metadata: result.metadata
        }]);
      }
      
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to make move');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [gameId, gameState]);

  const resetGame = useCallback(async () => {
    if (!gameId) return;
    
    setLoading(true);
    setError(null);
    try {
      const result = await TicTacToeApi.resetGame(gameId);
      setGameState(result.state);
      setMoveHistory([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset game');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [gameId]);

  return {
    gameId,
    gameState,
    moveHistory,
    loading,
    error,
    createGame,
    makeMove,
    resetGame
  };
}
```

### Python Client

```python
import requests
from typing import Optional, Dict, Any

class TicTacToeClient:
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
    
    def create_game(self, config: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Create a new game."""
        response = requests.post(
            f"{self.base_url}/games",
            json=config or {}
        )
        response.raise_for_status()
        return response.json()
    
    def get_game(self, game_id: str) -> Dict[str, Any]:
        """Get game state."""
        response = requests.get(f"{self.base_url}/games/{game_id}")
        response.raise_for_status()
        return response.json()
    
    def make_move(
        self,
        game_id: str,
        row: Optional[int] = None,
        col: Optional[int] = None
    ) -> Dict[str, Any]:
        """Make a move."""
        payload = {}
        if row is not None:
            payload['row'] = row
        if col is not None:
            payload['col'] = col
        
        response = requests.post(
            f"{self.base_url}/games/{game_id}/move",
            json=payload
        )
        response.raise_for_status()
        return response.json()
    
    def play_game(self, config: Optional[Dict[str, Any]] = None):
        """Play a complete game."""
        # Create game
        game = self.create_game(config)
        game_id = game['game_id']
        print(f"Created game: {game_id}")
        
        # Play until game over
        while True:
            result = self.make_move(game_id)
            
            print(f"\n{result['move']['player']} played at "
                  f"({result['move']['row']}, {result['move']['col']})")
            
            if result.get('metadata', {}).get('reasoning'):
                print(f"Reasoning: {result['metadata']['reasoning']}")
            
            self._print_board(result['board'])
            
            if result['game_over']:
                if result.get('winner'):
                    print(f"\n{result['winner']} wins!")
                else:
                    print("\nIt's a draw!")
                break
    
    @staticmethod
    def _print_board(board):
        """Print board to console."""
        print("\nBoard:")
        for row in board:
            print(' | '.join([cell or ' ' for cell in row]))
            print('-' * 9)

# Example usage
if __name__ == '__main__':
    client = TicTacToeClient()
    
    # Play LLM vs LLM
    client.play_game({
        'player_x': {
            'use_llm': True,
            'provider': 'openai',
            'model': 'gpt-4o-mini',
            'temperature': 0.7
        },
        'player_o': {
            'use_llm': True,
            'provider': 'openai',
            'model': 'gpt-4o-mini',
            'temperature': 0.9
        }
    })
```

---

## Error Handling

### Common Errors

#### 1. Game Not Found (404)

**Response:**
```json
{
  "detail": "Game not found"
}
```

**Cause:** Invalid `game_id` or game was deleted

**Solution:** Check `game_id`, create new game if needed

#### 2. Invalid Move

**Response:**
```json
{
  "success": false,
  "message": "Invalid move at (1, 1)",
  "game_over": false,
  "current_player": "X"
}
```

**Cause:** Cell already occupied or invalid coordinates

**Solution:** Check available moves before making move

#### 3. LLM API Error

**Response:**
```json
{
  "success": true,
  "message": "Move successful",
  "metadata": {
    "error": "LLM move invalid, used random fallback",
    "player_type": "llm"
  }
}
```

**Cause:** LLM API key missing, quota exceeded, or invalid response

**Solution:** 
- Check API keys in backend `.env`
- Verify API quotas
- Game continues with random fallback

#### 4. CORS Error

**Error:** `CORS policy: No 'Access-Control-Allow-Origin' header`

**Cause:** Frontend origin not allowed

**Solution:** Backend already allows all origins (`allow_origins=["*"]`). If issue persists:
- Check backend is running
- Verify URL is correct
- Check browser console for details

### Error Handling Best Practices

```typescript
async function safeApiCall<T>(
  apiCall: () => Promise<T>,
  errorMessage: string = 'API call failed'
): Promise<T | null> {
  try {
    return await apiCall();
  } catch (error) {
    if (error instanceof ApiError) {
      console.error(`API Error ${error.status}:`, error.message);
      // Handle specific status codes
      if (error.status === 404) {
        alert('Game not found. Please create a new game.');
      } else if (error.status === 500) {
        alert('Server error. Please try again later.');
      }
    } else {
      console.error(errorMessage, error);
      alert(errorMessage);
    }
    return null;
  }
}

// Usage
const game = await safeApiCall(
  () => TicTacToeApi.createGame(config),
  'Failed to create game'
);

if (game) {
  // Continue with game
}
```

---

## Testing Your Integration

### Manual Testing Checklist

- [ ] Backend starts successfully
- [ ] Can access Swagger docs at `/docs`
- [ ] Create game returns valid `game_id`
- [ ] Board renders correctly (3x3 grid)
- [ ] Can make moves
- [ ] Board updates after each move
- [ ] Game detects winners correctly
- [ ] Game detects draws correctly
- [ ] Can reset game
- [ ] Can delete game
- [ ] LLM reasoning displays (if using LLM)
- [ ] Error messages display properly

### Automated Tests

**Jest/Testing Library (React):**

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TicTacToeGame } from './TicTacToeGame';
import { TicTacToeApi } from '../services/api';

jest.mock('../services/api');

describe('TicTacToeGame', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates game on button click', async () => {
    const mockGame = {
      game_id: 'test-123',
      state: {
        board: [[null, null, null], [null, null, null], [null, null, null]],
        current_player: 'X',
        game_over: false,
        winner: null,
        is_draw: false,
        move_history: [],
        available_moves: []
      }
    };

    (TicTacToeApi.createGame as jest.Mock).mockResolvedValue(mockGame);

    render(<TicTacToeGame />);
    
    const button = screen.getByText('Create New Game');
    fireEvent.click(button);

    await waitFor(() => {
      expect(TicTacToeApi.createGame).toHaveBeenCalled();
    });
  });

  it('makes move when cell clicked', async () => {
    // Setup mock game state
    const mockGame = { /* ... */ };
    (TicTacToeApi.createGame as jest.Mock).mockResolvedValue(mockGame);
    
    const mockMove = {
      success: true,
      board: [['X', null, null], [null, null, null], [null, null, null]],
      game_over: false
    };
    (TicTacToeApi.makeMove as jest.Mock).mockResolvedValue(mockMove);

    render(<TicTacToeGame />);
    
    // Create game first
    fireEvent.click(screen.getByText('Create New Game'));
    await waitFor(() => expect(TicTacToeApi.createGame).toHaveBeenCalled());

    // Click cell
    const cells = screen.getAllByRole('button');
    fireEvent.click(cells[0]); // Click top-left cell

    await waitFor(() => {
      expect(TicTacToeApi.makeMove).toHaveBeenCalledWith(
        'test-123',
        { row: 0, col: 0 }
      );
    });
  });
});
```

### Integration Testing

```bash
#!/bin/bash
# test-integration.sh

echo "Starting backend..."
docker-compose up -d backend

echo "Waiting for backend..."
sleep 3

echo "Testing endpoints..."

# Test 1: Create game
RESPONSE=$(curl -s -X POST http://localhost:8000/games \
  -H "Content-Type: application/json" \
  -d '{"player_x": {"use_llm": false}, "player_o": {"use_llm": false}}')

GAME_ID=$(echo $RESPONSE | jq -r '.game_id')
echo "✓ Created game: $GAME_ID"

# Test 2: Make move
RESPONSE=$(curl -s -X POST "http://localhost:8000/games/$GAME_ID/move" \
  -H "Content-Type: application/json" \
  -d '{"row": 1, "col": 1}')

SUCCESS=$(echo $RESPONSE | jq -r '.success')
if [ "$SUCCESS" = "true" ]; then
  echo "✓ Move successful"
else
  echo "✗ Move failed"
  exit 1
fi

# Test 3: Get game state
RESPONSE=$(curl -s "http://localhost:8000/games/$GAME_ID")
CURRENT_PLAYER=$(echo $RESPONSE | jq -r '.state.current_player')
echo "✓ Current player: $CURRENT_PLAYER"

# Test 4: Reset game
curl -s -X POST "http://localhost:8000/games/$GAME_ID/reset" > /dev/null
echo "✓ Game reset"

# Test 5: Delete game
curl -s -X DELETE "http://localhost:8000/games/$GAME_ID" > /dev/null
echo "✓ Game deleted"

echo ""
echo "All tests passed! ✓"

docker-compose down
```

---

## Advanced Topics

### Real-Time Updates with Polling

```typescript
// Poll for game state updates
function useGamePolling(gameId: string | null, interval: number = 1000) {
  const [gameState, setGameState] = useState<GameState | null>(null);

  useEffect(() => {
    if (!gameId) return;

    const poll = async () => {
      try {
        const result = await TicTacToeApi.getGame(gameId);
        setGameState(result.state);
      } catch (error) {
        console.error('Polling error:', error);
      }
    };

    poll(); // Initial fetch
    const intervalId = setInterval(poll, interval);

    return () => clearInterval(intervalId);
  }, [gameId, interval]);

  return gameState;
}
```

### Batch Operations

```typescript
// Create multiple games simultaneously
async function createMultipleGames(count: number, config: GameConfig) {
  const promises = Array(count).fill(null).map(() => 
    TicTacToeApi.createGame(config)
  );
  
  const games = await Promise.all(promises);
  return games.map(g => g.game_id);
}

// Usage
const gameIds = await createMultipleGames(5, {
  player_x: { use_llm: true, provider: 'openai', model: 'gpt-4o-mini' },
  player_o: { use_llm: true, provider: 'openai', model: 'gpt-4o-mini' },
  enable_logging: true
});

console.log(`Created ${gameIds.length} games`);
```

### Caching Strategies

```typescript
// Simple in-memory cache
class GameCache {
  private cache = new Map<string, { state: GameState; timestamp: number }>();
  private ttl = 5000; // 5 seconds

  set(gameId: string, state: GameState) {
    this.cache.set(gameId, {
      state,
      timestamp: Date.now()
    });
  }

  get(gameId: string): GameState | null {
    const cached = this.cache.get(gameId);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > this.ttl) {
      this.cache.delete(gameId);
      return null;
    }

    return cached.state;
  }

  clear() {
    this.cache.clear();
  }
}

// Usage with API
const cache = new GameCache();

async function getGameWithCache(gameId: string): Promise<GameState> {
  const cached = cache.get(gameId);
  if (cached) return cached;

  const result = await TicTacToeApi.getGame(gameId);
  cache.set(gameId, result.state);
  return result.state;
}
```

### Performance Optimization

```typescript
// Debounced move execution
function useDebouncedMove(gameId: string, delay: number = 300) {
  const timeoutRef = useRef<NodeJS.Timeout>();

  const debouncedMove = useCallback((row: number, col: number) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(async () => {
      await TicTacToeApi.makeMove(gameId, { row, col });
    }, delay);
  }, [gameId, delay]);

  return debouncedMove;
}
```

### Analytics and Tracking

```typescript
// Track game analytics
interface GameAnalytics {
  totalGames: number;
  totalMoves: number;
  averageMovesPerGame: number;
  winRates: { X: number; O: number; draws: number };
  llmResponseTimes: number[];
}

class AnalyticsTracker {
  private analytics: GameAnalytics = {
    totalGames: 0,
    totalMoves: 0,
    averageMovesPerGame: 0,
    winRates: { X: 0, O: 0, draws: 0 },
    llmResponseTimes: []
  };

  trackMove(metadata?: MoveMetadata) {
    this.analytics.totalMoves++;
    
    if (metadata?.response_time_ms) {
      this.analytics.llmResponseTimes.push(metadata.response_time_ms);
    }
  }

  trackGameEnd(winner: string | null, moveCount: number) {
    this.analytics.totalGames++;
    
    if (winner === 'X') this.analytics.winRates.X++;
    else if (winner === 'O') this.analytics.winRates.O++;
    else this.analytics.winRates.draws++;

    this.analytics.averageMovesPerGame = 
      this.analytics.totalMoves / this.analytics.totalGames;
  }

  getReport() {
    const avgResponseTime = this.analytics.llmResponseTimes.length > 0
      ? this.analytics.llmResponseTimes.reduce((a, b) => a + b, 0) / 
        this.analytics.llmResponseTimes.length
      : 0;

    return {
      ...this.analytics,
      averageLLMResponseTime: avgResponseTime
    };
  }
}
```

---

## Troubleshooting Guide

### Issue: Backend not accessible

**Symptoms:** Cannot connect to API

**Solutions:**
1. Check backend is running: `curl http://localhost:8000/`
2. Verify port 8000 is not in use: `lsof -i :8000`
3. Check Docker logs: `docker-compose logs backend`
4. Try different port: `uvicorn main:app --port 8001`

### Issue: LLM not working

**Symptoms:** Games fall back to random moves

**Solutions:**
1. Check API keys are set in backend `.env`:
   ```bash
   echo $OPENAI_API_KEY
   echo $MISTRAL_API_KEY
   ```
2. Verify API quota/billing
3. Check backend logs for errors
4. Test API keys with curl:
   ```bash
   curl https://api.openai.com/v1/models \
     -H "Authorization: Bearer $OPENAI_API_KEY"
   ```

### Issue: CORS errors

**Symptoms:** Browser console shows CORS error

**Solutions:**
1. Verify backend CORS middleware is enabled
2. Check request headers include `Content-Type: application/json`
3. For development, ensure `allow_origins=["*"]` in backend
4. For production, specify exact frontend origin

### Issue: Slow response times

**Symptoms:** Moves take > 5 seconds

**Solutions:**
1. Use faster models: `gpt-4o-mini` instead of `gpt-4o`
2. Lower temperature for faster generation
3. Check network latency
4. Implement request timeout
5. Cache game states locally

---

## Summary Checklist

Before deploying your integration:

- [ ] Backend running and accessible
- [ ] API keys configured (if using LLM)
- [ ] Type definitions match backend models
- [ ] API service layer implemented
- [ ] Error handling in place
- [ ] Board renders correctly
- [ ] Moves update in real-time
- [ ] Game end conditions work
- [ ] Reset functionality works
- [ ] Tests written and passing
- [ ] CORS configured correctly
- [ ] Production environment variables set
- [ ] Performance acceptable
- [ ] Documentation updated

---

## Additional Resources

### Official Documentation

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **OpenAPI Schema**: http://localhost:8000/openapi.json
- **TypeScript Types**: http://localhost:8000/schema/typescript

### Example Projects

- **Reference Frontend**: See `/tic-tac-toe/frontend/index.html`
- **Python Client**: See Python example above
- **React Integration**: See React examples above

### Support

For issues or questions:
1. Check Swagger documentation
2. Review example implementations
3. Check backend logs
4. Test with cURL first
5. Verify API keys and configuration

---

**End of Guide**

This guide covers everything needed to integrate with the Tic-Tac-Toe FastAPI backend. Follow the examples, test thoroughly, and refer back to specific sections as needed. Happy coding! 🎮
