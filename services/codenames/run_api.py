"""
Run the FastAPI server for Codenames AI Arena.

Usage:
    python run_api.py

Or with custom settings:
    python run_api.py --host 0.0.0.0 --port 8002
"""

import argparse
import uvicorn
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from .env file
env_path = Path(__file__).parent / ".env"
load_dotenv(dotenv_path=env_path)


def main():
    parser = argparse.ArgumentParser(description="Run Codenames AI Arena API")
    parser.add_argument("--host", default="127.0.0.1", help="Host to bind to")
    parser.add_argument("--port", type=int, default=8002, help="Port to bind to")
    parser.add_argument("--reload", action="store_true", help="Enable auto-reload")
    
    args = parser.parse_args()
    
    print(f"🎮 Starting Codenames AI Arena API on {args.host}:{args.port}")
    print(f"📚 API docs available at http://{args.host}:{args.port}/docs")
    print(f"🔌 WebSocket endpoint: ws://{args.host}:{args.port}/ws/games/{{game_id}}")
    
    uvicorn.run(
        "api.app:app",
        host=args.host,
        port=args.port,
        reload=args.reload
    )


if __name__ == "__main__":
    main()

