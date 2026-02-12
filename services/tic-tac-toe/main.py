"""FastAPI backend for the tic-tac-toe game."""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict
import uuid
import os
from pathlib import Path

# Load environment variables
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

from game import Game
from player import Player


app = FastAPI(
    title="Tic-Tac-Toe API",
    description="API for LLM-powered tic-tac-toe games with comprehensive logging",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Store active games in memory (in production, use a database)
games: Dict[str, Game] = {}


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
            "DELETE /games/{game_id}": "Delete a game"
        }
    }


@app.get("/health")
async def health_check():
    """Health check endpoint for monitoring and deployment verification."""
    return {
        "status": "healthy",
        "service": "ai-arena-tictactoe",
        "version": "1.0.0",
        "active_games": len(games)
    }


@app.post("/games")
async def create_game(config: Optional[GameConfig] = None):
    """
    Create a new game with optional player configurations.
    
    Example request body for LLM vs LLM:
    {
        "player_x": {"use_llm": true, "provider": "openai", "model": "gpt-4o-mini"},
        "player_o": {"use_llm": true, "provider": "openai", "model": "gpt-4o-mini"}
    }
    """
    game_id = str(uuid.uuid4())
    
    # Create players based on config
    player_x = None
    player_o = None
    
    if config:
        if config.player_x:
            player_x = Player(
                symbol='X',
                use_llm=config.player_x.use_llm,
                provider=config.player_x.provider,
                model=config.player_x.model,
                temperature=config.player_x.temperature
            )
        
        if config.player_o:
            player_o = Player(
                symbol='O',
                use_llm=config.player_o.use_llm,
                provider=config.player_o.provider,
                model=config.player_o.model,
                temperature=config.player_o.temperature
            )
        
        enable_logging = config.enable_logging
    else:
        enable_logging = True
    
    games[game_id] = Game(
        game_id=game_id,
        player_x=player_x,
        player_o=player_o,
        enable_logging=enable_logging
    )
    
    state = games[game_id].get_state()
    
    return {
        "game_id": game_id,
        "message": "Game created successfully",
        "state": state,
        "player_x": {
            "type": games[game_id].player_x.get_player_type(),
            "model": games[game_id].player_x.get_model_name()
        },
        "player_o": {
            "type": games[game_id].player_o.get_player_type(),
            "model": games[game_id].player_o.get_model_name()
        }
    }


@app.get("/games/{game_id}")
async def get_game(game_id: str):
    """Get current game state."""
    if game_id not in games:
        raise HTTPException(status_code=404, detail="Game not found")
    
    return {
        "game_id": game_id,
        "state": games[game_id].get_state()
    }


@app.post("/games/{game_id}/move")
async def make_move(game_id: str, move: MoveRequest):
    """Make a move in the game."""
    if game_id not in games:
        raise HTTPException(status_code=404, detail="Game not found")
    
    game = games[game_id]
    result = game.make_move(move.row, move.col)
    
    return {
        "game_id": game_id,
        **result
    }


@app.post("/games/{game_id}/auto")
async def play_auto(game_id: str):
    """Play the entire game automatically."""
    if game_id not in games:
        raise HTTPException(status_code=404, detail="Game not found")
    
    game = games[game_id]
    result = game.play_auto()
    
    return {
        "game_id": game_id,
        **result
    }


@app.post("/games/{game_id}/reset")
async def reset_game(game_id: str):
    """Reset a game."""
    if game_id not in games:
        raise HTTPException(status_code=404, detail="Game not found")
    
    games[game_id].reset()
    
    return {
        "game_id": game_id,
        "message": "Game reset successfully",
        "state": games[game_id].get_state()
    }


@app.delete("/games/{game_id}")
async def delete_game(game_id: str):
    """Delete a game."""
    if game_id not in games:
        raise HTTPException(status_code=404, detail="Game not found")
    
    del games[game_id]
    
    return {
        "game_id": game_id,
        "message": "Game deleted successfully"
    }


@app.get("/games")
async def list_games():
    """List all active games."""
    game_list = []
    for game_id, game in games.items():
        game_list.append({
            "game_id": game_id,
            "player_x_type": game.player_x.get_player_type(),
            "player_o_type": game.player_o.get_player_type(),
            "game_over": game.game_over,
            "winner": game.winner
        })
    
    return {
        "total_games": len(games),
        "games": game_list
    }


@app.get("/logs")
async def get_logs():
    """Get paths to log files."""
    from logger import get_logger
    logger = get_logger()
    paths = logger.get_log_paths()
    
    return {
        "moves_log": str(paths['moves']),
        "games_log": str(paths['games']),
        "note": "Log files are stored on the server filesystem"
    }


@app.get("/schema/typescript")
async def get_typescript_schema():
    """
    Get TypeScript type definitions for the API.
    This endpoint helps maintain type alignment between frontend and backend.
    """
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
        "note": "For complete schema, use OpenAPI tools to generate from /openapi.json"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
