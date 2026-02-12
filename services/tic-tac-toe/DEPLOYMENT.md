# AI Arena TicTacToe Backend - Deployment Guide

## Overview

This repository contains the FastAPI backend for TicTacToe game logic. It automatically builds and deploys to your VM whenever changes are pushed to the `main` branch.

## Architecture

```
GitHub Repo (ai-arena-back-tic-tac-toe)
    │
    ├─ Push to main
    │
    ▼
GitHub Actions Workflow
    │
    ├─ Build Docker image
    ├─ Push to ghcr.io/your-username/ai-arena-back-tic-tac-toe:latest
    │
    ▼
SSH into VM
    │
    ├─ Pull latest image
    ├─ Restart backend-tictactoe container
    │
    ▼
Live on VM (/opt/ai-arena)
```

## Prerequisites

### 1. GitHub Repository Secrets

Configure these secrets in your GitHub repo settings (`Settings > Secrets and variables > Actions`):

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `VM_HOST` | Your VM's IP address or hostname | `123.456.789.0` |
| `VM_USERNAME` | SSH username | `root` |
| `VM_SSH_KEY` | Private SSH key for authentication | `-----BEGIN OPENSSH PRIVATE KEY-----...` |
| `VM_SSH_PORT` | SSH port (optional, defaults to 22) | `22` |

**Note:** API keys (OpenAI, Mistral) are configured on the VM, not in GitHub Secrets.

### 2. VM Setup

On your VM, you need a `docker-compose.yml` file at `/opt/ai-arena/`. See the **VM Orchestration** section below.

## Local Development

### Run without Docker:
```bash
# Install dependencies
pip install -r requirements.txt

# Run with uvicorn
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Access at http://localhost:8000
# API docs at http://localhost:8000/docs
```

### Run with Docker:
```bash
docker build -t ai-arena-tictactoe .
docker run -p 8000:8000 \
  -e OPENAI_API_KEY=your_key \
  -e MISTRAL_API_KEY=your_key \
  ai-arena-tictactoe
```

### Run with docker-compose (local):
```bash
# Create .env file
echo "OPENAI_API_KEY=your_key" > .env
echo "MISTRAL_API_KEY=your_key" >> .env

# Start services
docker compose up -d

# View logs
docker compose logs -f backend

# Stop services
docker compose down
```

## VM Orchestration

On your VM at `/opt/ai-arena/docker-compose.yml`, include this service:

```yaml
services:
  backend-tictactoe:
    image: ghcr.io/your-username/ai-arena-back-tic-tac-toe:latest
    container_name: ai-arena-backend-tictactoe
    ports:
      - "8000:8000"
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - MISTRAL_API_KEY=${MISTRAL_API_KEY}
    volumes:
      - /var/log/ai-arena/tictactoe:/app/logs
    networks:
      - ai-arena-network
    restart: always
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

networks:
  ai-arena-network:
    driver: bridge
```

And create/update `.env` file at `/opt/ai-arena/.env`:

```bash
OPENAI_API_KEY=sk-...
MISTRAL_API_KEY=...
```

## API Endpoints

This backend provides the following endpoints:

- `GET /` - Root endpoint
- `GET /health` - Health check
- `POST /game/start` - Start new game
- `POST /game/move` - Make a move
- `GET /game/{game_id}` - Get game state
- See full API docs at: `http://your-vm-ip:8000/docs`

## Deployment Flow

1. **Developer pushes to main:**
   ```bash
   git add .
   git commit -m "feat: improve game logic"
   git push origin main
   ```

2. **GitHub Actions automatically:**
   - Builds Docker image
   - Pushes to GitHub Container Registry
   - SSHs into VM
   - Pulls latest image
   - Restarts backend-tictactoe container
   - Runs health check
   - Cleans up old images

3. **Backend is live** at `http://your-vm-ip:8000`

## Initial VM Setup

```bash
# SSH into your VM
ssh root@your-vm-ip

# Create directory and logs
sudo mkdir -p /opt/ai-arena
sudo mkdir -p /var/log/ai-arena/tictactoe
cd /opt/ai-arena

# Create docker-compose.yml (see VM Orchestration section)
sudo nano docker-compose.yml

# Create .env file with API keys
sudo nano .env

# Login to GitHub Container Registry
echo $GITHUB_TOKEN | docker login ghcr.io -u your-username --password-stdin

# Pull and start services
docker compose pull
docker compose up -d

# Verify
docker ps
curl http://localhost:8000/health
```

## Health Check

Add this endpoint to `main.py` if not already present:

```python
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "ai-arena-tictactoe",
        "version": "1.0.0"
    }
```

## Logs

View logs:
```bash
# Container logs
docker logs -f ai-arena-backend-tictactoe

# Application logs (if mounted volume)
tail -f /var/log/ai-arena/tictactoe/game.log
```

## Rollback

If a deployment fails:

```bash
# SSH into VM
ssh root@your-vm-ip
cd /opt/ai-arena

# List available images
docker images ghcr.io/your-username/ai-arena-back-tic-tac-toe

# Update docker-compose.yml to use specific SHA:
# image: ghcr.io/your-username/ai-arena-back-tic-tac-toe:main-abc123

# Restart
docker compose up -d backend-tictactoe
```

## Monitoring

### Container status:
```bash
docker ps --filter "name=backend-tictactoe"
docker stats backend-tictactoe --no-stream
```

### Health check:
```bash
curl http://localhost:8000/health
```

### Resource usage:
```bash
docker stats backend-tictactoe
```

## Troubleshooting

### Build fails in GitHub Actions
- Check requirements.txt syntax
- Verify all Python files have correct syntax
- Check GitHub Actions logs

### Deployment fails
- Verify SSH credentials in GitHub Secrets
- Check `/opt/ai-arena/docker-compose.yml` exists on VM
- Ensure Docker is running: `systemctl status docker`

### Container won't start
- Check logs: `docker logs ai-arena-backend-tictactoe`
- Verify API keys in `/opt/ai-arena/.env`
- Check port 8000 availability: `netstat -tuln | grep 8000`
- Verify dependencies installed: `docker exec ai-arena-backend-tictactoe pip list`

### API errors
- Check if LLM API keys are valid
- Verify external API connectivity: `docker exec ai-arena-backend-tictactoe curl https://api.openai.com`
- Check application logs in `/app/logs/` inside container

## Adding More Game Backends

When you add new game backends (chess, poker, etc.), follow this pattern:

1. Copy this repo structure
2. Change ports in docker-compose.yml (8001, 8002, etc.)
3. Update GitHub workflow service names
4. Add to VM's docker-compose.yml

Example for chess backend:
```yaml
backend-chess:
  image: ghcr.io/your-username/ai-arena-back-chess:latest
  container_name: ai-arena-backend-chess
  ports:
    - "8001:8000"  # Different external port
  environment:
    - OPENAI_API_KEY=${OPENAI_API_KEY}
  volumes:
    - /var/log/ai-arena/chess:/app/logs
  networks:
    - ai-arena-network
  restart: always
```

## Security Notes

1. **API Keys**: Never commit API keys to Git. Use `.env` files.
2. **SSH Key**: Keep private SSH key secure in GitHub Secrets only.
3. **Firewall**: Configure VM firewall rules appropriately.
4. **CORS**: Configure CORS in FastAPI for your frontend domain.

## Performance Tuning

### Optimize Docker image:
- Current image uses Python 3.9-slim (lightweight)
- Dependencies cached in layer
- Consider adding health checks to all endpoints

### Scale horizontally:
- Run multiple instances behind a load balancer
- Use different ports: 8000, 8001, 8002...
- Update nginx to distribute load

## Additional Resources

- [FastAPI Deployment](https://fastapi.tiangolo.com/deployment/)
- [Docker Python Best Practices](https://docs.docker.com/language/python/build-images/)
- [GitHub Container Registry](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)


