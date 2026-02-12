"""Tic-Tac-Toe game manager using arena-core base."""

import asyncio
from typing import Any, Optional

from arena_core import GameManager, WebSocketManager

from game import Game
from player import Player

ws_manager = WebSocketManager()


class TicTacToeGameManager(GameManager):
    """Manages tic-tac-toe game lifecycle."""

    async def create_game(
        self,
        player_x_config: Optional[dict] = None,
        player_o_config: Optional[dict] = None,
        enable_logging: bool = True,
    ) -> str:
        game_id = self.generate_id()

        player_x = _build_player("X", player_x_config)
        player_o = _build_player("O", player_o_config)

        game = Game(
            game_id=game_id,
            player_x=player_x,
            player_o=player_o,
            enable_logging=enable_logging,
        )
        self.games[game_id] = game
        return game_id

    async def run_game(self, game_id: str) -> Any:
        game = self.get_game(game_id)
        if game is None:
            raise ValueError(f"Game {game_id} not found")

        # Set up event queue for WebSocket delivery
        ws_manager.create_game_queue(game_id)
        event_callback = ws_manager.create_event_callback(game_id)

        event_callback("game_started", {
            "game_id": game_id,
            "player_x": player_info(game.player_x),
            "player_o": player_info(game.player_o),
            "board": game.board.get_state(),
        })

        # Run game with event emission in executor (game logic is sync)
        loop = asyncio.get_running_loop()
        events_task = asyncio.create_task(ws_manager.process_events(game_id))

        def play_with_events():
            moves = []
            move_number = 0
            while not game.game_over:
                move_number += 1
                current_symbol = game.current_player.symbol
                current_name = game.current_player.name
                result = game.make_move()
                moves.append(result)

                # Emit move_made event
                event_callback("move_made", {
                    "game_id": game_id,
                    "move_number": move_number,
                    "player": current_symbol,
                    "player_name": current_name,
                    "position": result.get("move"),
                    "reasoning": result.get("metadata", {}).get("reasoning"),
                    "board": result.get("board"),
                    "game_over": result.get("game_over", False),
                })

                if game.game_over:
                    # Emit game_ended event
                    event_callback("game_ended", {
                        "game_id": game_id,
                        "winner": game.winner,
                        "is_draw": game.is_draw,
                        "board": game.board.get_state(),
                        "total_moves": len(game.move_history),
                    })

            return {
                "winner": game.winner,
                "is_draw": game.is_draw,
                "board": game.board.get_state(),
                "moves": moves,
                "total_moves": len(game.move_history),
            }

        result = await loop.run_in_executor(None, play_with_events)

        # Give events time to flush
        await asyncio.sleep(0.5)
        events_task.cancel()
        try:
            await events_task
        except asyncio.CancelledError:
            pass

        return result


def player_info(player: Player) -> dict:
    """Serialize a Player to a dict suitable for API responses and WS events."""
    return {
        "type": player.get_player_type(),
        "model": player.get_model_name(),
        "name": player.name,
    }


_PLAYER_DEFAULTS = {
    "use_llm": False,
    "provider": "openai",
    "model": "gpt-4o-mini",
    "temperature": 0.7,
}


def _build_player(symbol: str, config: Optional[dict]) -> Optional[Player]:
    if config is None:
        return None
    return Player(symbol=symbol, **{**_PLAYER_DEFAULTS, **config})
