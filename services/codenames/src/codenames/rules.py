from __future__ import annotations

import re
from typing import Iterable

from .models import Clue

_ALLOWED_PATTERN = re.compile(r"^[A-Za-z]+$")


class ClueInvalidError(ValueError):
    """Raised when a clue fails validation."""


def validate_clue(clue: Clue, board_words: Iterable[str]) -> None:
    word = clue.word.strip()
    if not word:
        raise ClueInvalidError("Clue word cannot be empty")
    if " " in word:
        raise ClueInvalidError("Clue must be a single word")
    if "-" in word:
        raise ClueInvalidError("Hyphenated clues are not allowed")
    if not _ALLOWED_PATTERN.match(word):
        raise ClueInvalidError("Clue must contain only alphabetic characters")
    if clue.number < 0:
        raise ClueInvalidError("Clue number must be a non-negative integer")
    board_tokens = {w.lower() for w in board_words}
    if word.lower() in board_tokens:
        raise ClueInvalidError("Clue cannot match a word on the board")


__all__ = ["validate_clue", "ClueInvalidError"]
