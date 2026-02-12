from __future__ import annotations

import string
from random import Random
from typing import Iterable, Iterator

from .models import Position

BOARD_SIZE = 5
COL_LABELS = tuple(string.ascii_uppercase[:BOARD_SIZE])
ROW_LABELS = tuple(str(i + 1) for i in range(BOARD_SIZE))


def all_positions() -> Iterator[Position]:
    for row in range(BOARD_SIZE):
        for col in range(BOARD_SIZE):
            yield Position(row, col)


def position_to_label(position: Position) -> str:
    return f"{COL_LABELS[position.col]}{position.row + 1}"


def label_to_position(label: str) -> Position:
    label = label.strip().upper()
    if len(label) < 2:
        raise ValueError("Cell label must include column letter and row number")
    col_letter, row_digits = label[0], label[1:]
    if col_letter not in COL_LABELS:
        raise ValueError("Column must be between A and E")
    if row_digits not in ROW_LABELS:
        raise ValueError("Row must be between 1 and 5")
    return Position(ROW_LABELS.index(row_digits), COL_LABELS.index(col_letter))


def normalize_token(token: str) -> str:
    return token.strip().lower()


def shuffled(iterable: Iterable, rng: Random):
    items = list(iterable)
    rng.shuffle(items)
    return items


__all__ = [
    "BOARD_SIZE",
    "COL_LABELS",
    "ROW_LABELS",
    "all_positions",
    "position_to_label",
    "label_to_position",
    "normalize_token",
    "shuffled",
]
