from random import Random

from codenames.board import BOARD_WORD_COUNT, Board, assign_card_types
from codenames.models import CardType, Position, Team


def test_assign_card_types_counts():
    rng = Random(1)
    assignments = assign_card_types(Team.RED, rng)
    assert len(assignments) == BOARD_WORD_COUNT
    assert assignments.count(CardType.RED) == 9
    assert assignments.count(CardType.BLUE) == 8
    assert assignments.count(CardType.NEUTRAL) == 7
    assert assignments.count(CardType.ASSASSIN) == 1


def test_board_maps_words_to_positions():
    words = [f"WORD{i}" for i in range(BOARD_WORD_COUNT)]
    assignments = [CardType.RED] * BOARD_WORD_COUNT
    board = Board.from_words(words, assignments)
    for index, word in enumerate(words):
        position = board.find_word(word)
        assert position is not None
        card = board.get_card(position)
        assert card.word == word
        assert card.card_type is CardType.RED
        assert not card.revealed
    first_position = Position(0, 0)
    board.reveal(first_position)
    assert board.get_card(first_position).revealed
