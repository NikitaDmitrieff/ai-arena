"""
Prompt templates and utilities for the Codenames AI system.

This module provides organized prompt templates for different game roles
and utilities for building dynamic prompts during gameplay.
"""

from .system_prompts import operative_system_prompt, spymaster_system_prompt
from .user_prompts import build_operative_user_prompt, build_spymaster_user_prompt
from .utils import render_history

__all__ = [
    "spymaster_system_prompt",
    "operative_system_prompt", 
    "render_history",
    "build_spymaster_user_prompt",
    "build_operative_user_prompt",
]
