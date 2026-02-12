"""
Utility functions for prompt generation and formatting.

Contains helper functions used across different prompt templates.
"""

from __future__ import annotations

from typing import Sequence


def render_history(history: Sequence[str]) -> str:
    """
    Format the game history for inclusion in prompts.
    
    Args:
        history: A sequence of historical game events/turns
        
    Returns:
        A formatted string representation of recent game history,
        limited to the last 6 entries for brevity
    """
    if not history:
        return "No previous turns." 
    lines = "\n".join(f"- {entry}" for entry in history[-6:])
    return f"Recent turns:\n{lines}"
