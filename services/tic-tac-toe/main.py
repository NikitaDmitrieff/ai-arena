"""FastAPI backend for the tic-tac-toe game."""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import os

# Load environment variables
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

from game_manager import TicTacToeGameManager

app = FastAPI(
    title="Tic-Tac-Toe API",
    description="API for LLM-powered tic-tac-toe games with comprehensive logging",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Game manager replaces raw dict storage
manager = TicTacToeGameManager()


class MoveRequest(BaseModel):
    """Request model for making a move."""
    row: Optional[int] = None
    col: Optional[int] = None


class PlayerConfig(BaseModel):
    """Configuration for a player."""
    use_llm: bool = False
    provider: str = "openai"
    model: str = "gpt-4o-mini"
    temperature: float = 0.7


class GameConfig(BaseModel):
    """Configuration for creating a game."""
    player_x: Optional[PlayerConfig] = None
    player_o: Optional[PlayerConfig] = None
    enable_logging: bool = True


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "Tic-Tac-Toe API",
        "endpoints": {
            "POST /games": "Create a new game",
            "GET /games/{game_id}": "Get game state",
            "POST /games/{game_id}/move": "Make a move (random if no row/col provided)",
            "POST /games/{game_id}/auto": "Play entire game automatically",
            "POST /games/{game_id}/reset": "Reset a game",
            "DELETE /games/{game_id}": "Delete a game",
        },
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "ai-arena-tictactoe",
        "version": "1.0.0",
        "active_games": len(manager.list_games()),
    }


@app.post("/games")
async def create_game(config: Optional[GameConfig] = None):
    """Create a new game with optional player configurations."""
    px = config.player_x.model_dump() if config and config.player_x else None
    po = config.player_o.model_dump() if config and config.player_o else None
    enable_logging = config.enable_logging if config else True

    game_id = await manager.create_game(
        player_x_config=px,
        player_o_config=po,
        enable_logging=enable_logging,
    )
    game = manager.get_game(game_id)
    state = game.get_state()

    return {
        "game_id": game_id,
        "message": "Game created successfully",
        "state": state,
        "player_x": {
            "type": game.player_x.get_player_type(),
            "model": game.player_x.get_model_name(),
        },
        "player_o": {
            "type": game.player_o.get_player_type(),
            "model": game.player_o.get_model_name(),
        },
    }


@app.get("/games/{game_id}")
async def get_game(game_id: str):
    """Get current game state."""
    game = manager.get_game(game_id)
    if game is None:
        raise HTTPException(status_code=404, detail="Game not found")
    return {"game_id": game_id, "state": game.get_state()}


@app.post("/games/{game_id}/move")
async def make_move(game_id: str, move: MoveRequest):
    """Make a move in the game."""
    game = manager.get_game(game_id)
    if game is None:
        raise HTTPException(status_code=404, detail="Game not found")
    result = game.make_move(move.row, move.col)
    return {"game_id": game_id, **result}


@app.post("/games/{game_id}/auto")
async def play_auto(game_id: str):
    """Play the entire game automatically."""
    game = manager.get_game(game_id)
    if game is None:
        raise HTTPException(status_code=404, detail="Game not found")
    result = await manager.run_game(game_id)
    return {"game_id": game_id, **result}


@app.post("/games/{game_id}/reset")
async def reset_game(game_id: str):
    """Reset a game."""
    game = manager.get_game(game_id)
    if game is None:
        raise HTTPException(status_code=404, detail="Game not found")
    game.reset()
    return {
        "game_id": game_id,
        "message": "Game reset successfully",
        "state": game.get_state(),
    }


@app.delete("/games/{game_id}")
async def delete_game(game_id: str):
    """Delete a game."""
    if not manager.delete_game(game_id):
        raise HTTPException(status_code=404, detail="Game not found")
    return {"game_id": game_id, "message": "Game deleted successfully"}


@app.get("/games")
async def list_games():
    """List all active games."""
    game_list = []
    for gid in manager.list_games():
        game = manager.get_game(gid)
        game_list.append({
            "game_id": gid,
            "player_x_type": game.player_x.get_player_type(),
            "player_o_type": game.player_o.get_player_type(),
            "game_over": game.game_over,
            "winner": game.winner,
        })
    return {"total_games": len(game_list), "games": game_list}


@app.get("/logs")
async def get_logs():
    """Get paths to log files."""
    from logger import get_logger

    logger = get_logger()
    paths = logger.get_log_paths()
    return {
        "moves_log": str(paths["moves"]),
        "games_log": str(paths["games"]),
        "note": "Log files are stored on the server filesystem",
    }


@app.get("/schema/typescript")
async def get_typescript_schema():
    """Get TypeScript type definitions for the API."""
    typescript_schema = """
// Auto-generated TypeScript types from FastAPI backend
// Last updated: {timestamp}

export interface PlayerConfig {{
  use_llm: boolean;
  provider: 'openai' | 'mistral';
  model: string;
  temperature: number;
}}

export interface GameConfig {{
  player_x?: PlayerConfig;
  player_o?: PlayerConfig;
  enable_logging: boolean;
}}

export interface MoveRequest {{
  row?: number;
  col?: number;
}}

// See /openapi.json for complete schema
"""
    from datetime import datetime

    return {
        "typescript": typescript_schema.format(timestamp=datetime.now().isoformat()),
        "note": "For complete schema, use OpenAPI tools to generate from /openapi.json",
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
