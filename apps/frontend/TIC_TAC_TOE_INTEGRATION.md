# Tic-Tac-Toe Integration Guide

## Overview

This document explains how the Tic-Tac-Toe FastAPI backend is integrated into the Next.js frontend.

## Architecture

```
Frontend (Next.js)
    ↓ HTTP requests
Backend (FastAPI - localhost:8000)
    ↓
LLM APIs (OpenAI, Mistral)
```

## File Structure

```
src/
├── lib/types/
│   └── tictactoe.ts              # TypeScript types
├── services/
│   └── tictactoeApi.ts            # API client
├── hooks/
│   └── useTicTacToe.ts            # React hook for game state
├── components/tictactoe/
│   ├── GameBoard.tsx              # 3x3 game board
│   ├── PlayerConfigForm.tsx       # Player configuration
│   ├── MoveHistory.tsx            # Move log with reasoning
│   ├── GameControls.tsx           # Control buttons
│   └── GameInfo.tsx               # Game statistics
└── app/games/tic-tac-toe/
    └── page.tsx                   # Main game page
```

## Quick Start

### 1. Start Backend

```bash
cd ../ai-arena-back-tic-tac-toe

# Create .env file (optional for LLM players)
echo "OPENAI_API_KEY=your_key" > .env
echo "MISTRAL_API_KEY=your_key" >> .env

# Start backend
uvicorn main:app --reload --port 8000
```

### 2. Configure Frontend

```bash
# Create .env.local (optional - defaults to localhost:8000)
echo "NEXT_PUBLIC_TICTACTOE_API_URL=http://localhost:8000" > .env.local
```

### 3. Start Frontend

```bash
npm run dev
# Open http://localhost:3000/games/tic-tac-toe
```

## API Integration

### API Client (`tictactoeApi.ts`)

```typescript
// Create game
const response = await fetch(`${API_URL}/games`, {
  method: "POST",
  body: JSON.stringify({
    player_x: { use_llm: true, provider: "openai", model: "gpt-4" },
    player_o: { use_llm: false },
  }),
});

// Make move
await fetch(`${API_URL}/games/${gameId}/move`, {
  method: "POST",
  body: JSON.stringify({ row: 0, col: 0 }),
});

// Get game state
await fetch(`${API_URL}/games/${gameId}`);
```

### React Hook (`useTicTacToe.ts`)

Manages game state and provides methods:

```typescript
const {
  gameId, // Current game ID
  gameState, // Board state, winner, moves
  createGame, // (config) => void
  makeMove, // (row, col) => void
  autoPlay, // () => void - Play entire game
  resetGame, // () => void
  isLoading,
  error,
} = useTicTacToe();
```

## Components

### GameBoard

- Displays 3x3 grid
- Shows X/O positions
- Highlights winning line
- Click to make moves

### PlayerConfigForm

- Configure X and O players
- Choose: Human or LLM
- Select LLM provider (OpenAI/Mistral)
- Select model and temperature

### MoveHistory

- Shows all moves in order
- Displays LLM reasoning
- Shows move timings
- Expandable reasoning blocks

### GameControls

- Create Game button
- Auto-play button
- Reset button
- Loading states

### GameInfo

- Current player turn
- Game status (ongoing/won/draw)
- Winner display
- Move count

## Backend API Endpoints

| Endpoint            | Method | Description           |
| ------------------- | ------ | --------------------- |
| `/games`            | POST   | Create new game       |
| `/games/{id}`       | GET    | Get game state        |
| `/games/{id}/move`  | POST   | Make a move           |
| `/games/{id}/auto`  | POST   | Auto-play entire game |
| `/games/{id}/reset` | POST   | Reset game            |
| `/games/{id}`       | DELETE | Delete game           |
| `/health`           | GET    | Health check          |

## TypeScript Types

### Game Configuration

```typescript
interface PlayerConfig {
  use_llm: boolean;
  provider?: "openai" | "mistral";
  model?: string;
  temperature?: number;
}

interface GameConfig {
  player_x?: PlayerConfig;
  player_o?: PlayerConfig;
  enable_logging?: boolean;
}
```

### Game State

```typescript
interface GameState {
  board: string[][];
  current_player: "X" | "O";
  winner: "X" | "O" | "draw" | null;
  is_game_over: boolean;
  move_count: number;
  move_history: Move[];
}

interface Move {
  move_number: number;
  player: "X" | "O";
  position: [number, number];
  reasoning?: string;
  timestamp: string;
}
```

## Example Usage

### Human vs LLM

```typescript
createGame({
  player_x: { use_llm: false },
  player_o: { use_llm: true, provider: "openai", model: "gpt-4" },
});
```

### LLM vs LLM

```typescript
createGame({
  player_x: { use_llm: true, provider: "openai", model: "gpt-4" },
  player_o: { use_llm: true, provider: "mistral", model: "mistral-large" },
});
```

### Watch Auto-Play

```typescript
createGame({
  player_x: { use_llm: true, provider: "openai" },
  player_o: { use_llm: true, provider: "openai" },
});

autoPlay(); // Watch AI play against itself
```

## Features

- ✅ Human vs Human
- ✅ Human vs LLM
- ✅ LLM vs LLM
- ✅ Move history with reasoning
- ✅ Auto-play mode
- ✅ Real-time updates
- ✅ Error handling
- ✅ Loading states
- ✅ Game reset

## Environment Variables

```bash
# Frontend (.env.local)
NEXT_PUBLIC_TICTACTOE_API_URL=http://localhost:8000  # Default if not set

# Backend (.env)
OPENAI_API_KEY=sk-...
MISTRAL_API_KEY=...
```

## Deployment

In production, the backend runs as a separate container:

```yaml
# docker-compose.yml
backend-tictactoe:
  image: ghcr.io/user/ai-arena-back-tic-tac-toe:latest
  ports:
    - "8000:8000"
  environment:
    - OPENAI_API_KEY=${OPENAI_API_KEY}
    - MISTRAL_API_KEY=${MISTRAL_API_KEY}
```

Frontend connects via Docker network or public URL.

## Troubleshooting

### Backend not responding

```bash
# Check backend is running
curl http://localhost:8000/health

# Should return:
# {"status": "healthy", "service": "ai-arena-tictactoe"}
```

### CORS errors

- Backend has `allow_origins=["*"]` in CORS config
- Check browser console for specific error

### LLM not responding

- Verify API keys in backend `.env`
- Check backend logs: `docker logs ai-arena-backend-tictactoe`
- Try with `use_llm: false` first to test basic functionality

## Adding More Games

To add a new game (e.g., Chess):

1. Create similar file structure
2. Create API client in `services/chessApi.ts`
3. Create React hook `useChess.ts`
4. Create components in `components/chess/`
5. Create page at `app/games/chess/page.tsx`

Follow the same pattern as Tic-Tac-Toe!
