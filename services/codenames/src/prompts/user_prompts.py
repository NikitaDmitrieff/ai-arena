"""
User prompt builders for dynamic game state communication.

These functions construct context-specific prompts that include
current game state, board information, and historical context.
"""

from __future__ import annotations

from typing import Mapping, Sequence

from .utils import render_history


def build_spymaster_user_prompt(
    team_name: str,
    unrevealed_team_words: Sequence[str],
    revealed_team_words: Sequence[str],
    opponent_words: Sequence[str],
    neutral_words: Sequence[str],
    assassin_word: str,
    remaining: Mapping[str, int],
    history: Sequence[str],
    feedback: str | None = None,
) -> str:
    """
    Build a user prompt for the spymaster with current game state.
    
    Args:
        team_name: The spymaster's team name
        unrevealed_team_words: Team words still on the board
        revealed_team_words: Team words already revealed
        opponent_words: All opponent team words (revealed and unrevealed)
        neutral_words: All neutral words (revealed and unrevealed)
        assassin_word: The assassin word
        remaining: Count of remaining cards by category
        history: Recent game history
        feedback: Optional feedback from previous actions
        
    Returns:
        A formatted prompt string with all relevant game state information
    """
    sections = [
        f"Team {team_name} unrevealed cards: {', '.join(unrevealed_team_words) if unrevealed_team_words else 'none'}.",
        f"Team {team_name} already revealed: {', '.join(revealed_team_words) if revealed_team_words else 'none'}.",
        f"Opponent cards (some may be revealed): {', '.join(opponent_words)}.",
        f"Neutral cards (some may be revealed): {', '.join(neutral_words)}.",
        f"Assassin word: {assassin_word}.",
        "Remaining cards counts: "
        + ", ".join(f"{k}: {v}" for k, v in remaining.items()),
        render_history(history),
    ]
    if feedback:
        sections.append(f"Feedback: {feedback}")
    sections.append(
        "Provide a new clue now. Remember, clue must be a single new word not present on the board and number between 0 and 4."
    )
    return "\n".join(sections)


def build_operative_user_prompt(
    team_name: str,
    visible_board_rows: Sequence[str],
    last_clue: str,
    guesses_left: int,
    remaining_self: int,
    remaining_opponent: int,
    history: Sequence[str],
    feedback: str | None = None,
) -> str:
    """
    Build a user prompt for operatives with current board state.
    
    Args:
        team_name: The operative team name
        visible_board_rows: Current board state as formatted strings
        last_clue: The most recent clue from the spymaster
        guesses_left: Number of guesses remaining this turn
        remaining_self: Number of own team cards still hidden
        remaining_opponent: Number of opponent cards still hidden
        history: Recent game history
        feedback: Optional feedback from previous actions
        
    Returns:
        A formatted prompt string with current board and game state
    """
    sections = [
        "Current board:",
        *visible_board_rows,
        f"Last clue: {last_clue}",
        f"Guesses remaining this turn: {guesses_left}",
        f"Team {team_name} cards still hidden: {remaining_self}",
        f"Opponent cards still hidden: {remaining_opponent}",
        render_history(history),
    ]
    if feedback:
        sections.append(f"Feedback: {feedback}")
    sections.append(
        "Decide whether to guess or end. If guessing, respond with the EXACT UPPERCASE WORD as displayed on the board (e.g., 'BATTERY', not 'A3' or 'battery')."
    )
    return "\n".join(sections)
