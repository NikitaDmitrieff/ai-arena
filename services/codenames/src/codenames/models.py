from __future__ import annotations

from dataclasses import dataclass
from enum import Enum, auto
from typing import Optional


class Team(Enum):
    RED = auto()
    BLUE = auto()

    def opponent(self) -> "Team":
        return Team.RED if self is Team.BLUE else Team.BLUE


class CardType(Enum):
    RED = auto()
    BLUE = auto()
    NEUTRAL = auto()
    ASSASSIN = auto()

    @property
    def team(self) -> Optional[Team]:
        if self is CardType.RED:
            return Team.RED
        if self is CardType.BLUE:
            return Team.BLUE
        return None


class Phase(Enum):
    AWAIT_CLUE = auto()
    AWAIT_GUESS = auto()
    FINISHED = auto()


@dataclass(frozen=True)
class Position:
    row: int  # 0-based
    col: int  # 0-based


@dataclass
class Card:
    word: str
    card_type: CardType
    revealed: bool = False


@dataclass(frozen=True)
class Clue:
    word: str
    number: int  # >= 0


@dataclass
class GuessResult:
    position: Position
    card: Card
    ended_turn: bool
    team_won: Optional[Team] = None
    assassin_hit: bool = False


__all__ = [
    "Team",
    "CardType",
    "Phase",
    "Position",
    "Card",
    "Clue",
    "GuessResult",
]
