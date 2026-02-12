"""Shared configuration utilities for AI Arena services."""

from __future__ import annotations

import os
from pathlib import Path

_API_KEY_ENV_VARS = {
    "openai": "OPENAI_API_KEY",
    "mistral": "MISTRAL_API_KEY",
}


def load_env(service_root: Path | None = None) -> None:
    """Load environment variables from .env file.

    Looks for .env in the given ``service_root``, falling back to cwd.
    """
    try:
        from dotenv import load_dotenv
    except ImportError:
        return

    env_path = (service_root or Path.cwd()) / ".env"
    if env_path.exists():
        load_dotenv(dotenv_path=env_path)


def get_llm_api_key(provider: str) -> str | None:
    """Get the API key for a given LLM provider."""
    env_var = _API_KEY_ENV_VARS.get(provider.lower())
    return os.getenv(env_var) if env_var else None
