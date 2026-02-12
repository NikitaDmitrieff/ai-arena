from __future__ import annotations

from dataclasses import dataclass
from random import Random
from typing import Dict, List, Optional

from .board import BOARD_WORD_COUNT, Board, assign_card_types
from .models import CardType, Clue, GuessResult, Phase, Position, Team
from .rules import ClueInvalidError, validate_clue
from .utils import BOARD_SIZE, all_positions
from .words import sample_words


class GameError(RuntimeError):
    """Raised when a game operation is not allowed."""


@dataclass
class GameStatus:
    current_team: Team
    phase: Phase
    remaining: Dict[Team, int]
    last_clue: Optional[Clue]
    guesses_left: int
    winner: Optional[Team]
    assassin_revealed: bool


class Game:
    def __init__(self, board: Board, starting_team: Team):
        self.board = board
        self.starting_team = starting_team
        self.current_team = starting_team
        self.phase = Phase.AWAIT_CLUE
        self.last_clue: Optional[Clue] = None
        self.current_clue: Optional[Clue] = None
        self.guess_limit = 0
        self.guesses_made_this_turn = 0
        self.remaining: Dict[Team, int] = {
            Team.RED: self._count_cards(CardType.RED),
            Team.BLUE: self._count_cards(CardType.BLUE),
        }
        self.winner: Optional[Team] = None
        self.assassin_revealed = False

    @classmethod
    def new_standard(cls, words_pool: List[str], rng: Random) -> "Game":
        starting_team = rng.choice([Team.RED, Team.BLUE])
        selected_words = sample_words(words_pool, BOARD_WORD_COUNT, rng)
        assignments = assign_card_types(starting_team, rng)
        board = Board.from_words(selected_words, assignments)
        return cls(board=board, starting_team=starting_team)

    def _count_cards(self, card_type: CardType) -> int:
        return sum(
            1 for row in self.board.cards for card in row if card.card_type is card_type
        )

    def submit_clue(self, clue: Clue) -> None:
        if self.phase is not Phase.AWAIT_CLUE:
            raise GameError("Cannot give a clue right now")
        if self.winner is not None:
            raise GameError("Game is already finished")
        stripped_word = clue.word.strip()
        candidate = Clue(stripped_word, clue.number)
        try:
            validate_clue(candidate, self.board.iter_words())
        except ClueInvalidError as exc:
            raise GameError(str(exc)) from exc
        normalized_clue = Clue(stripped_word.upper(), clue.number)
        self.current_clue = normalized_clue
        self.last_clue = normalized_clue
        self.phase = Phase.AWAIT_GUESS
        self.guess_limit = clue.number + 1
        self.guesses_made_this_turn = 0

    def guesses_left(self) -> int:
        if self.phase is not Phase.AWAIT_GUESS or self.current_clue is None:
            return 0
        return max(0, self.guess_limit - self.guesses_made_this_turn)

    def make_guess(self, position: Position) -> GuessResult:
        if self.phase is not Phase.AWAIT_GUESS:
            raise GameError("No active clue to guess on")
        card = self.board.get_card(position)
        if card.revealed:
            raise GameError("Card is already revealed")
        self.guesses_made_this_turn += 1
        revealed_card = self.board.reveal(position)
        card_type = revealed_card.card_type
        ended_turn = False
        team_won: Optional[Team] = None
        assassin_hit = False

        if card_type is CardType.ASSASSIN:
            self.assassin_revealed = True
            self.winner = self.current_team.opponent()
            team_won = self.winner
            assassin_hit = True
            ended_turn = True
            self.phase = Phase.FINISHED
            self.current_clue = None
        else:
            card_team = card_type.team
            if card_team is not None:
                self.remaining[card_team] -= 1
                if self.remaining[card_team] == 0:
                    self.winner = card_team
                    team_won = card_team
                    ended_turn = True
                    self.phase = Phase.FINISHED
                    self.current_clue = None
            if self.winner is None:
                if card_type.team is self.current_team:
                    if self.guesses_made_this_turn >= self.guess_limit:
                        ended_turn = True
                elif card_type is CardType.NEUTRAL or card_type.team is self.current_team.opponent():
                    ended_turn = True

        result = GuessResult(
            position=position,
            card=revealed_card,
            ended_turn=ended_turn,
            team_won=team_won,
            assassin_hit=assassin_hit,
        )

        if ended_turn and self.phase is not Phase.FINISHED:
            self._advance_turn()
        return result

    def guess_by_word(self, word: str) -> GuessResult:
        position = self.board.find_word(word)
        if position is None:
            raise GameError("Word is not on the board")
        return self.make_guess(position)

    def end_turn(self) -> None:
        if self.phase is not Phase.AWAIT_GUESS:
            raise GameError("No active turn to end")
        self._advance_turn()

    def _advance_turn(self) -> None:
        self.current_team = self.current_team.opponent()
        self.phase = Phase.AWAIT_CLUE
        self.current_clue = None
        self.guess_limit = 0
        self.guesses_made_this_turn = 0

    def board_snapshot(self, spymaster: bool = False) -> List[List[dict]]:
        snapshot: List[List[dict]] = []
        for row in range(BOARD_SIZE):
            row_view: List[dict] = []
            for col in range(BOARD_SIZE):
                card = self.board.cards[row][col]
                visible_type = card.card_type if (card.revealed or spymaster) else None
                row_view.append(
                    {
                        "word": card.word,
                        "revealed": card.revealed,
                        "card_type": visible_type,
                    }
                )
            snapshot.append(row_view)
        return snapshot

    def status(self) -> GameStatus:
        return GameStatus(
            current_team=self.current_team,
            phase=self.phase,
            remaining=dict(self.remaining),
            last_clue=self.last_clue,
            guesses_left=self.guesses_left(),
            winner=self.winner,
            assassin_revealed=self.assassin_revealed,
        )


__all__ = ["Game", "GameStatus", "GameError"]
