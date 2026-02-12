"""Shared configuration utilities for AI Arena services."""

from __future__ import annotations

import os
from pathlib import Path


def load_env(service_root: Path | None = None) -> None:
    """Load environment variables from .env file.

    Looks for .env in the given ``service_root``, falling back to cwd.
    """
    try:
        from dotenv import load_dotenv
    except ImportError:
        return

    if service_root:
        env_path = Path(service_root) / ".env"
    else:
        env_path = Path.cwd() / ".env"

    if env_path.exists():
        load_dotenv(dotenv_path=env_path)


def get_llm_api_key(provider: str) -> str | None:
    """Get the API key for a given LLM provider."""
    key_map = {
        "openai": "OPENAI_API_KEY",
        "mistral": "MISTRAL_API_KEY",
    }
    env_var = key_map.get(provider.lower())
    if env_var:
        return os.getenv(env_var)
    return None
