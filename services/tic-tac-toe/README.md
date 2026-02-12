# Tic-Tac-Toe Backend

FastAPI backend for Tic-Tac-Toe with LLM-powered players using OpenAI and Mistral models.

## Features

- 🤖 **LLM Players** - Battle AI models against each other
- 🎲 **Random Players** - Fallback to random moves
- 📊 **Comprehensive Logging** - CSV logs track every move
- ⚡ **FastAPI Backend** - RESTful API
- 🐳 **Dockerized** - Ready for deployment
- 🏥 **Health Checks** - `/health` endpoint for monitoring

## Tech Stack

- **Framework:** FastAPI + Uvicorn
- **Language:** Python 3.9+
- **LLM Integration:** nikitas-agents package
- **APIs:** OpenAI, Mistral

## Quick Start

### Local Development

```bash
# Install dependencies
pip install -r requirements.txt

# Create .env file (optional for LLM players)
cat > .env << EOF
OPENAI_API_KEY=sk-...
MISTRAL_API_KEY=...
EOF

# Run server
uvicorn main:app --reload --port 8000

# Open http://localhost:8000/docs
```

### Docker

```bash
# Build image
docker build -t tictactoe-backend .

# Run container
docker run -p 8000:8000 \
  -e OPENAI_API_KEY=sk-... \
  -e MISTRAL_API_KEY=... \
  tictactoe-backend

# Or use docker-compose
docker compose up -d
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | API information |
| `/health` | GET | Health check |
| `/games` | POST | Create new game |
| `/games/{id}` | GET | Get game state |
| `/games/{id}/move` | POST | Make a move |
| `/games/{id}/auto` | POST | Auto-play entire game |
| `/games/{id}/reset` | POST | Reset game |
| `/games/{id}` | DELETE | Delete game |

**API Documentation:** http://localhost:8000/docs

## Usage Examples

### Create Game (LLM vs LLM)
```bash
curl -X POST http://localhost:8000/games \
  -H "Content-Type: application/json" \
  -d '{
    "player_x": {
      "use_llm": true,
      "provider": "openai",
      "model": "gpt-4o-mini"
    },
    "player_o": {
      "use_llm": true,
      "provider": "mistral",
      "model": "mistral-large-latest"
    }
  }'
```

### Make Move
```bash
curl -X POST http://localhost:8000/games/{game_id}/move \
  -H "Content-Type: application/json" \
  -d '{"row": 0, "col": 0}'
```

### Auto-Play
```bash
curl -X POST http://localhost:8000/games/{game_id}/auto
```

### Health Check
```bash
curl http://localhost:8000/health
# {"status": "healthy", "service": "ai-arena-tictactoe", "version": "1.0.0"}
```

## Project Structure

```
ai-arena-back-tic-tac-toe/
├── main.py               # FastAPI application
├── game.py               # Game logic and orchestration
├── player.py             # Player class (LLM + Random)
├── board.py              # Board state management
├── prompts.py            # LLM prompts
├── logger.py             # CSV logging system
├── utils.py              # Utility functions
├── requirements.txt      # Python dependencies
├── Dockerfile            # Container configuration
├── docker-compose.yml    # Local development
└── logs/                 # CSV logs (runtime)
```

## Configuration

### Player Configuration

```python
{
  "use_llm": bool,          # True for LLM, False for random
  "provider": str,          # "openai" or "mistral"
  "model": str,             # Model name
  "temperature": float      # 0.0 - 1.0 (default: 0.7)
}
```

### Supported Models

**OpenAI:**
- `gpt-4o-mini` (recommended)
- `gpt-4o`
- `gpt-4-turbo`

**Mistral:**
- `mistral-large-latest` (recommended)
- `mistral-medium-latest`
- `mistral-small-latest`

## Logging

All games create CSV logs in `logs/` directory:

- **Game logs:** Game outcomes, timing, player configs
- **Prompt logs:** LLM prompts sent
- **Response logs:** LLM responses received
- **Move logs:** Individual moves with reasoning

## Deployment

This backend uses automated CI/CD with GitHub Actions.

**Quick Deploy:**
1. Configure GitHub secrets (see [DEPLOYMENT.md](DEPLOYMENT.md))
2. Push to `main` branch
3. Automated deployment starts!

**Full Guide:** See [DEPLOYMENT.md](DEPLOYMENT.md)

## Environment Variables

```bash
# Required for LLM players
OPENAI_API_KEY=sk-...
MISTRAL_API_KEY=...
```

## Testing

```bash
# Run test game
python test_llm_game.py

# Run with specific configuration
# Edit test_llm_game.py to customize
```

## Health Monitoring

```bash
# Health check
curl http://localhost:8000/health

# Check active games
curl http://localhost:8000/

# View logs
docker logs -f tictactoe-backend
```

## Troubleshooting

### LLM Players Not Working
- Verify API keys in `.env`
- Check logs: `tail -f logs/*.csv`
- Try with `use_llm: false` first

### Connection Refused
- Check server is running: `curl http://localhost:8000/health`
- Verify port 8000 is available: `netstat -tuln | grep 8000`

### Docker Build Fails
- Check requirements.txt syntax
- Verify Python version: `python --version` (3.9+)

## Dependencies

```
fastapi==0.104.1
uvicorn==0.24.0
pydantic>=2.5.2,<3.0.0
nikitas-agents>=0.1.0
python-dotenv==1.0.0
```

## Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/my-feature`
3. Commit changes: `git commit -m 'Add my feature'`
4. Push to branch: `git push origin feature/my-feature`
5. Open Pull Request

## License

[Your License Here]

---

**Need help?** Check [DEPLOYMENT.md](DEPLOYMENT.md) or raise an issue on GitHub.
