#!/bin/bash

# Codenames AI Arena API Runner
# Usage: ./run_api.sh [options]
# Options:
#   --dev     Run in development mode with auto-reload
#   --prod    Run in production mode (0.0.0.0:8002)
#   --port    Specify custom port (default: 8002)

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
HOST="127.0.0.1"
PORT="8002"
RELOAD=""

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --dev)
            RELOAD="--reload"
            echo -e "${BLUE}🔧 Running in development mode with auto-reload${NC}"
            shift
            ;;
        --prod)
            HOST="0.0.0.0"
            echo -e "${BLUE}🚀 Running in production mode${NC}"
            shift
            ;;
        --port)
            PORT="$2"
            shift 2
            ;;
        *)
            echo "Unknown option: $1"
            echo "Usage: ./run_api.sh [--dev] [--prod] [--port PORT]"
            exit 1
            ;;
    esac
done

echo -e "${GREEN}🎮 Starting Codenames AI Arena API${NC}"
echo -e "${GREEN}📍 Host: $HOST${NC}"
echo -e "${GREEN}🔌 Port: $PORT${NC}"
echo ""

# Run the API
python3 run_api.py --host "$HOST" --port "$PORT" $RELOAD

