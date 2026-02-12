import pytest

from codenames.models import Clue
from codenames.rules import ClueInvalidError, validate_clue


def test_validate_clue_accepts_basic():
    validate_clue(Clue("River", 2), ["Apple", "Table"])


def test_validate_clue_rejects_board_word():
    with pytest.raises(ClueInvalidError):
        validate_clue(Clue("Apple", 1), ["Apple", "Table"])


def test_validate_clue_rejects_negative_number():
    with pytest.raises(ClueInvalidError):
        validate_clue(Clue("Sky", -1), ["Cloud", "Sun"])


def test_validate_clue_rejects_hyphenated_word():
    with pytest.raises(ClueInvalidError):
        validate_clue(Clue("Space-Ship", 1), ["Galaxy", "Star"])


def test_validate_clue_rejects_non_alpha_characters():
    with pytest.raises(ClueInvalidError):
        validate_clue(Clue("Sky3", 1), ["Cloud", "Sun"])
