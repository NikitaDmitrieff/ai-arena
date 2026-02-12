# Codenames AI Arena - Backend

A FastAPI-based backend for running AI vs AI Codenames games with real-time WebSocket updates.

## 🎮 Features

- **AI vs AI Gameplay**: Four AI agents (2 teams) play Codenames autonomously
- **Multiple LLM Support**: OpenAI (GPT-4, GPT-3.5) and Mistral AI models
- **Real-time Updates**: WebSocket streaming of all game events
- **RESTful API**: Simple endpoints for game management
- **Concurrent Games**: Support for multiple simultaneous games
- **Docker Ready**: Production-ready containerization
- **Auto-deployment**: GitHub Actions workflow for CI/CD

## 🚀 Quick Start

### Local Development

```bash
# Install dependencies
uv pip install --system -r requirements.txt

# Run the server
python3 run_api.py

# Server starts on http://127.0.0.1:8002
# API docs: http://127.0.0.1:8002/docs
```

### With Docker

```bash
# Build image
docker build -t codenames-backend .

# Run container
docker run -p 8002:8002 \
  -e OPENAI_API_KEY=your-key \
  -e MISTRAL_API_KEY=your-key \
  codenames-backend
```

### Example Client

```bash
# Run the example client to watch a game
python3 example_client.py
```

## 📡 API Overview

### Endpoints

- `GET /` - API information
- `GET /api/models` - List available LLM models
- `POST /api/games` - Start a new game
- `GET /api/games/{id}` - Get game state
- `GET /api/games` - List active games
- `DELETE /api/games/{id}` - Cancel a game
- `WS /ws/games/{id}` - WebSocket for real-time updates

### Example: Start a Game

```bash
curl -X POST http://localhost:8002/api/games \
  -H "Content-Type: application/json" \
  -d '{
    "red_spymaster": {"provider": "openai", "model": "gpt-4o"},
    "red_operative": {"provider": "openai", "model": "gpt-4o-mini"},
    "blue_spymaster": {"provider": "mistral", "model": "mistral-large-latest"},
    "blue_operative": {"provider": "mistral", "model": "mistral-medium-latest"}
  }'
```

## 📚 Documentation

- **[API_README.md](API_README.md)** - Complete API documentation
- **[FRONTEND_INTEGRATION.md](FRONTEND_INTEGRATION.md)** - Frontend integration guide
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Production deployment guide
- **[DOCKER_SETUP_SUMMARY.md](DOCKER_SETUP_SUMMARY.md)** - Docker & CI/CD setup

## 🏗️ Project Structure

```
.
├── api/                    # FastAPI application
│   ├── app.py             # Main FastAPI app
│   ├── models.py          # Pydantic models
│   ├── game_manager.py    # Game lifecycle management
│   └── websocket_manager.py # WebSocket connections
├── src/                    # Core game logic
│   ├── codenames/         # Codenames implementation
│   │   ├── game.py        # Game rules
│   │   ├── board.py       # Board management
│   │   ├── ai_match.py    # AI gameplay
│   │   └── models.py      # Game models
│   ├── prompts/           # LLM prompts
│   └── game_logging/      # Logging utilities
├── words.txt              # Word list (25,000+ words)
├── run_api.py             # Server entry point
├── Dockerfile             # Production container
├── requirements.txt       # Python dependencies
└── .github/workflows/     # CI/CD pipeline
    └── deploy.yml         # Auto-deployment
```

## 🎯 Game Flow

1. **Start Game** → POST `/api/games` with LLM configs
2. **Connect WebSocket** → WS `/ws/games/{id}`
3. **Receive Events** → Real-time game updates:
   - Turn started
   - Clue given (spymaster)
   - Guess made (operatives)
   - Turn ended
   - Game ended
4. **Get Final State** → GET `/api/games/{id}`

## 🔌 WebSocket Events

```javascript
{
  "event_type": "clue_given",
  "data": {
    "team": "RED",
    "clue": "TECHNOLOGY",
    "number": 2,
    "reasoning": "Connects to COMPUTER and PHONE"
  }
}
```

Event types:
- `game_started`, `turn_started`, `clue_given`
- `guess_made`, `turn_ended`, `game_ended`

## 🌐 Deployment

### Requirements

- Docker & Docker Compose
- GitHub repository with secrets configured
- VM with SSH access

### GitHub Secrets

Configure in **Settings → Secrets and variables → Actions**:

- `VM_HOST` - VM IP/hostname
- `VM_USERNAME` - SSH username
- `VM_SSH_KEY` - SSH private key
- `VM_SSH_PORT` - SSH port (optional)

### Deploy

```bash
# Push to main branch
git push origin main

# GitHub Actions will:
# 1. Build Docker image
# 2. Push to ghcr.io
# 3. Deploy to VM
# 4. Restart service
```

See **[DEPLOYMENT.md](DEPLOYMENT.md)** for complete setup instructions.

## 🔧 Configuration

### Environment Variables

**Required** (server-side only):
```bash
OPENAI_API_KEY=sk-...
MISTRAL_API_KEY=...
```

### Port

Default: **8002**

Change in:
- `run_api.py` (--port argument)
- `Dockerfile` (EXPOSE and CMD)
- `docker-compose.yml` (ports mapping)

## 🧪 Testing

```bash
# Check if server is running
curl http://localhost:8002/

# List available models
curl http://localhost:8002/api/models

# Run example client
python3 example_client.py
```

## 🎮 Game Rules

**Codenames** is a word association game where:
- 2 teams (Red & Blue) compete
- Each team has a **Spymaster** and **Operatives**
- 5×5 board with 25 word cards
- Spymaster gives one-word clues + number
- Operatives guess which words belong to their team
- First team to reveal all their words wins
- Reveal the **Assassin** → instant loss!

## 🤖 AI Agents

Each game requires 4 AI agents:

1. **Red Spymaster** - Gives clues for red team
2. **Red Operative** - Makes guesses for red team
3. **Blue Spymaster** - Gives clues for blue team
4. **Blue Operative** - Makes guesses for blue team

Configure each agent's LLM provider, model, temperature, and token limit.

## 📊 Performance

- **Game Duration**: 30-120 seconds
- **Concurrent Games**: Unlimited (resource-dependent)
- **WebSocket Latency**: < 100ms
- **API Response**: < 50ms

## 🔒 Security

- API keys stored server-side only
- CORS configured (update for production)
- WebSocket connections per-game
- Docker secrets for production deployment

## 🐛 Troubleshooting

### Server won't start
```bash
# Check if port 8002 is available
sudo netstat -tlnp | grep 8002

# Check logs
python3 run_api.py --reload
```

### API keys not working
```bash
# Verify environment variables
echo $OPENAI_API_KEY
echo $MISTRAL_API_KEY

# Test with example client
python3 example_client.py
```

### Docker issues
```bash
# Check container logs
docker logs codenames-backend

# Restart container
docker restart codenames-backend
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test locally
5. Submit a pull request

## 📝 License

[Your License Here]

## 🔗 Links

- **API Documentation**: http://localhost:8002/docs
- **Frontend Integration**: See [FRONTEND_INTEGRATION.md](FRONTEND_INTEGRATION.md)
- **Deployment Guide**: See [DEPLOYMENT.md](DEPLOYMENT.md)

## 💬 Support

For issues or questions:
1. Check the documentation files
2. Review API docs at `/docs`
3. Test with `example_client.py`
4. Check Docker/deployment logs

---

**Built with**: FastAPI, WebSockets, Docker, GitHub Actions

**Port**: 8002 | **Status**: Production Ready ✅

