"""FastAPI backend for the tic-tac-toe game."""

import asyncio

from fastapi import FastAPI, HTTPException, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

from game_manager import TicTacToeGameManager, player_info, ws_manager

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
        "player_x": player_info(game.player_x),
        "player_o": player_info(game.player_o),
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
    """Play the entire game automatically with real-time WebSocket events."""
    game = manager.get_game(game_id)
    if game is None:
        raise HTTPException(status_code=404, detail="Game not found")

    # Start game in background so WebSocket clients get real-time updates
    task = asyncio.create_task(manager.run_game(game_id))
    game._auto_task = task

    return {
        "game_id": game_id,
        "message": "Auto-play started. Connect to WebSocket for real-time updates.",
        "ws_url": f"/ws/games/{game_id}",
    }


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


@app.websocket("/ws/games/{game_id}")
async def game_websocket(websocket: WebSocket, game_id: str):
    """WebSocket endpoint for real-time game updates.

    Events:
    - game_started: When game begins with player configs
    - move_made: After each move (board state, player, position, reasoning)
    - game_ended: When a winner is determined or draw
    """
    game = manager.get_game(game_id)
    if game is None:
        await websocket.close(code=1008, reason="Game not found")
        return

    await ws_manager.connect(game_id, websocket)

    try:
        await websocket.send_json({
            "event_type": "connected",
            "data": {
                "game_id": game_id,
                "state": game.get_state(),
                "player_x": player_info(game.player_x),
                "player_o": player_info(game.player_o),
            },
        })

        # Send any buffered events
        await ws_manager.send_buffered_events(game_id, websocket)

        # Keep connection alive
        while True:
            await websocket.receive_text()

    except Exception:
        ws_manager.disconnect(game_id, websocket)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
