from __future__ import annotations

from collections.abc import Iterable, Sized
from random import Random
from typing import List


def load_words(path: str) -> List[str]:
    with open(path, "r", encoding="utf-8") as handle:
        raw_words = [line.strip() for line in handle]
    words: List[str] = []
    seen = set()
    for word in raw_words:
        if not word:
            continue
        normalized = word.strip()
        key = normalized.lower()
        if key in seen:
            continue
        seen.add(key)
        words.append(normalized)
    return words


def ensure_word_count(words: Iterable[str], minimum: int) -> None:
    if isinstance(words, Sized):
        count = len(words)
    else:
        count = sum(1 for _ in words)
    if count < minimum:
        raise ValueError(f"Need at least {minimum} unique words to build a board")


def sample_words(words: List[str], count: int, rng: Random) -> List[str]:
    if len(words) < count:
        raise ValueError("Not enough words to sample from")
    return rng.sample(words, count)


__all__ = [
    "load_words",
    "ensure_word_count",
    "sample_words",
]
