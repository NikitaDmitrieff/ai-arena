"""Tic-Tac-Toe game manager using arena-core base."""

from typing import Any, Optional

from arena_core import GameManager, GameStatus

from game import Game
from player import Player


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
        return game.play_auto()


def _build_player(symbol: str, config: Optional[dict]) -> Optional[Player]:
    if config is None:
        return None
    return Player(
        symbol=symbol,
        use_llm=config.get("use_llm", False),
        provider=config.get("provider", "openai"),
        model=config.get("model", "gpt-4o-mini"),
        temperature=config.get("temperature", 0.7),
    )
