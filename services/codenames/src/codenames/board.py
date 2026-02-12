from __future__ import annotations

from dataclasses import dataclass
from random import Random
from typing import Dict, Iterable, List

from .models import Card, CardType, Position, Team
from .utils import BOARD_SIZE, all_positions

BOARD_WORD_COUNT = BOARD_SIZE * BOARD_SIZE

_TEAM_TO_CARD = {
    Team.RED: CardType.RED,
    Team.BLUE: CardType.BLUE,
}


@dataclass
class Board:
    cards: List[List[Card]]
    word_to_position: Dict[str, Position]

    @classmethod
    def from_words(cls, words: List[str], assignments: List[CardType]) -> "Board":
        if len(words) != BOARD_WORD_COUNT:
            raise ValueError("Expected 25 words for the board")
        if len(assignments) != BOARD_WORD_COUNT:
            raise ValueError("Expected 25 assignments for the board")
        cards: List[List[Card]] = []
        word_to_position: Dict[str, Position] = {}
        index = 0
        for row in range(BOARD_SIZE):
            row_cards: List[Card] = []
            for col in range(BOARD_SIZE):
                card = Card(word=words[index], card_type=assignments[index])
                row_cards.append(card)
                word_to_position[words[index].lower()] = Position(row, col)
                index += 1
            cards.append(row_cards)
        return cls(cards=cards, word_to_position=word_to_position)

    def iter_words(self) -> Iterable[str]:
        for row in self.cards:
            for card in row:
                yield card.word

    def get_card(self, position: Position) -> Card:
        return self.cards[position.row][position.col]

    def reveal(self, position: Position) -> Card:
        card = self.get_card(position)
        card.revealed = True
        return card

    def find_word(self, word: str) -> Position | None:
        return self.word_to_position.get(word.lower())

    def unrevealed_words(self) -> Iterable[str]:
        for row in self.cards:
            for card in row:
                if not card.revealed:
                    yield card.word

    def revealed_positions(self) -> Iterable[Position]:
        for position in all_positions():
            if self.get_card(position).revealed:
                yield position


def assign_card_types(starting_team: Team, rng: Random) -> List[CardType]:
    other_team = starting_team.opponent()
    distribution = (
        [_TEAM_TO_CARD[starting_team]] * 9
        + [_TEAM_TO_CARD[other_team]] * 8
        + [CardType.NEUTRAL] * 7
        + [CardType.ASSASSIN]
    )
    rng.shuffle(distribution)
    return distribution


__all__ = [
    "Board",
    "assign_card_types",
    "BOARD_WORD_COUNT",
]
