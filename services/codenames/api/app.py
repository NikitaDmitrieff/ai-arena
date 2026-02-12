"""FastAPI application for Codenames AI Arena."""

from __future__ import annotations

import asyncio
import json
import sys
from contextlib import asynccontextmanager
from pathlib import Path
from typing import List

# Add src directory to path for imports (needed for game_logging, prompts, etc.)
ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "src"
if str(SRC) not in sys.path:
    sys.path.insert(0, str(SRC))

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from api.game_manager import GameManager
from api.models import (
    BoardCard,
    ErrorResponse,
    GamePhase,
    GameStartRequest,
    GameStateResponse,
    GameStatus,
    ModelInfo,
)
from api.websocket_manager import WebSocketManager
from codenames.models import Phase

# Initialize managers
WORD_LIST_PATH = ROOT / "words.txt"

game_manager: GameManager
ws_manager: WebSocketManager


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup/shutdown."""
    global game_manager, ws_manager
    game_manager = GameManager(WORD_LIST_PATH)
    ws_manager = WebSocketManager()
    yield
    # Cleanup on shutdown
    for game_id in list(game_manager.games.keys()):
        game_manager.delete_game(game_id)
        ws_manager.cleanup_game(game_id)


app = FastAPI(
    title="Codenames AI Arena API",
    description="API for running AI vs AI Codenames games",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure this properly in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "Codenames AI Arena API",
        "version": "1.0.0",
        "endpoints": {
            "POST /api/games": "Start a new game",
            "GET /api/games/{game_id}": "Get game state",
            "GET /api/games": "List all active games",
            "WS /ws/games/{game_id}": "WebSocket for real-time updates",
            "GET /api/models": "List available LLM models"
        }
    }


@app.get("/api/models", response_model=List[ModelInfo])
async def list_models():
    """List available LLM models."""
    # Load from simulation_config.json
    config_path = ROOT / "simulation_config.json"
    if config_path.exists():
        config = json.loads(config_path.read_text())
        models = config.get("all_available_models", [])
        return [ModelInfo(**m) for m in models]
    
    # Fallback to basic models
    return [
        ModelInfo(provider="openai", model="gpt-4o"),
        ModelInfo(provider="openai", model="gpt-4o-mini"),
        ModelInfo(provider="mistral", model="mistral-large-latest"),
        ModelInfo(provider="mistral", model="mistral-medium-latest"),
    ]


@app.post("/api/games", response_model=GameStatus)
async def start_game(request: GameStartRequest):
    """Start a new game."""
    try:
        # Convert request to config dict
        agent_configs = {
            "red_spymaster": request.red_spymaster.model_dump(),
            "red_operative": request.red_operative.model_dump(),
            "blue_spymaster": request.blue_spymaster.model_dump(),
            "blue_operative": request.blue_operative.model_dump(),
        }
        
        # Create the game
        game_id = game_manager.create_game(
            agent_configs=agent_configs,
            seed=request.seed,
        )
        
        # Create event queue for this game BEFORE starting the game
        ws_manager.create_game_queue(game_id)
        
        # Set up event callback after game creation
        instance = game_manager.get_game(game_id)
        if instance:
            event_callback = ws_manager.create_event_callback(game_id)
            instance.event_callback = event_callback
        
        # Start the game in the background
        async def run_game_with_events():
            """Run game and process events concurrently."""
            # Emit initial game state
            await emit_initial_state(game_id)
            
            # Run game and process events concurrently
            game_task = asyncio.create_task(game_manager.run_game(game_id))
            events_task = asyncio.create_task(ws_manager.process_events(game_id))
            
            # Wait for game to complete
            await game_task
            
            # Give events a moment to finish
            await asyncio.sleep(0.5)
            events_task.cancel()
            try:
                await events_task
            except asyncio.CancelledError:
                pass
        
        # Create background task
        task = asyncio.create_task(run_game_with_events())
        instance.task = task
        
        # Return initial status
        return get_game_status(game_id)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/games", response_model=List[str])
async def list_games():
    """List all active game IDs."""
    return game_manager.list_games()


@app.get("/api/games/{game_id}", response_model=GameStateResponse)
async def get_game_state(game_id: str):
    """Get the current state of a game."""
    instance = game_manager.get_game(game_id)
    if not instance:
        raise HTTPException(status_code=404, detail="Game not found")
    
    game = instance.game
    
    # Build board representation (operative view - no hidden card types)
    board = []
    for row in game.board.cards:
        board_row = []
        for card in row:
            board_row.append(BoardCard(
                word=card.word,
                revealed=card.revealed,
                card_type=card.card_type.name if card.revealed else None
            ))
        board.append(board_row)
    
    # Get status
    status = get_game_status(game_id)
    
    # Get last clue
    last_clue = None
    if game.last_clue:
        last_clue = {
            "word": game.last_clue.word,
            "number": game.last_clue.number
        }
    
    return GameStateResponse(
        game_id=game_id,
        status=status,
        board=board,
        last_clue=last_clue
    )


@app.delete("/api/games/{game_id}")
async def delete_game(game_id: str):
    """Delete/abort a game."""
    if game_manager.delete_game(game_id):
        ws_manager.cleanup_game(game_id)
        return {"message": "Game deleted"}
    raise HTTPException(status_code=404, detail="Game not found")


@app.websocket("/ws/games/{game_id}")
async def websocket_endpoint(websocket: WebSocket, game_id: str):
    """WebSocket endpoint for real-time game updates."""
    instance = game_manager.get_game(game_id)
    if not instance:
        await websocket.close(code=1008, reason="Game not found")
        return
    
    await ws_manager.connect(game_id, websocket)
    
    try:
        # Send initial state first
        await send_initial_state(websocket, game_id)
        
        # Then send any buffered events (events that occurred before connection)
        await ws_manager.send_buffered_events(game_id, websocket)
        
        # Keep connection alive and listen for close
        while True:
            try:
                # Just wait for messages (we don't expect any from client)
                await websocket.receive_text()
            except WebSocketDisconnect:
                break
            except Exception:
                break
    finally:
        ws_manager.disconnect(game_id, websocket)


# Helper functions

def get_game_status(game_id: str) -> GameStatus:
    """Get game status."""
    instance = game_manager.get_game(game_id)
    if not instance:
        raise HTTPException(status_code=404, detail="Game not found")
    
    game = instance.game
    
    # Map phase
    phase_map = {
        Phase.AWAIT_CLUE: GamePhase.AWAIT_CLUE,
        Phase.AWAIT_GUESS: GamePhase.AWAIT_GUESS,
        Phase.FINISHED: GamePhase.FINISHED,
    }
    
    return GameStatus(
        game_id=game_id,
        phase=phase_map[game.phase],
        current_team=game.current_team.name,
        turn_number=instance.match.turn_counter,
        red_remaining=game.remaining[instance.game.starting_team] if instance.game.starting_team.name == "RED" else game.remaining[instance.game.starting_team.opponent()],
        blue_remaining=game.remaining[instance.game.starting_team] if instance.game.starting_team.name == "BLUE" else game.remaining[instance.game.starting_team.opponent()],
        winner=game.winner.name if game.winner else None,
        assassin_revealed=game.assassin_revealed
    )


async def emit_initial_state(game_id: str):
    """Emit initial game state."""
    instance = game_manager.get_game(game_id)
    if not instance:
        return
    
    game = instance.game
    
    # Build board for initial state
    board_data = []
    for row in game.board.cards:
        row_data = []
        for card in row:
            row_data.append({
                "word": card.word,
                "revealed": card.revealed,
                "card_type": card.card_type.name if card.revealed else None
            })
        board_data.append(row_data)
    
    await ws_manager.emit_event(game_id, "game_started", {
        "game_id": game_id,
        "starting_team": game.starting_team.name,
        "board": board_data,
        "red_cards": game.remaining[game.starting_team] if game.starting_team.name == "RED" else game.remaining[game.starting_team.opponent()],
        "blue_cards": game.remaining[game.starting_team] if game.starting_team.name == "BLUE" else game.remaining[game.starting_team.opponent()],
    })


async def send_initial_state(websocket: WebSocket, game_id: str):
    """Send initial state to a newly connected websocket."""
    instance = game_manager.get_game(game_id)
    if not instance:
        return
    
    game = instance.game
    
    # Build board
    board_data = []
    for row in game.board.cards:
        row_data = []
        for card in row:
            row_data.append({
                "word": card.word,
                "revealed": card.revealed,
                "card_type": card.card_type.name if card.revealed else None
            })
        board_data.append(row_data)
    
    message = {
        "event_type": "game_state",
        "data": {
            "game_id": game_id,
            "phase": game.phase.name.lower(),
            "current_team": game.current_team.name,
            "turn_number": instance.match.turn_counter,
            "board": board_data,
            "red_remaining": game.remaining[game.starting_team] if game.starting_team.name == "RED" else game.remaining[game.starting_team.opponent()],
            "blue_remaining": game.remaining[game.starting_team] if game.starting_team.name == "BLUE" else game.remaining[game.starting_team.opponent()],
            "winner": game.winner.name if game.winner else None,
            "assassin_revealed": game.assassin_revealed
        }
    }
    
    await websocket.send_text(json.dumps(message))

