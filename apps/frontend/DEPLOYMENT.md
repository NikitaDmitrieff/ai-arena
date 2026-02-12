# Deployment Guide

## Overview

This repository uses GitHub Actions for automated CI/CD. Push to `main` automatically builds and deploys to your VM.

## Quick Setup (30 minutes)

### 1. Configure GitHub Secrets

Go to: `Settings → Secrets and variables → Actions`

Add these secrets:

```
VM_HOST=your.vm.ip.address
VM_USERNAME=root
VM_SSH_KEY=-----BEGIN OPENSSH PRIVATE KEY-----...
VM_SSH_PORT=22
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

### 2. Set Up VM

```bash
# SSH into VM
ssh root@your-vm

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Create directory
sudo mkdir -p /opt/ai-arena
sudo chown $USER:$USER /opt/ai-arena
cd /opt/ai-arena

# Create docker-compose.yml
nano docker-compose.yml
```

Paste this (replace `your-username` with your GitHub username):

```yaml
version: "3.8"

services:
  frontend:
    image: ghcr.io/your-username/ai-arena-front:latest
    container_name: ai-arena-frontend
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
    networks:
      - ai-arena-network
    restart: always

  backend-tictactoe:
    image: ghcr.io/your-username/ai-arena-back-tic-tac-toe:latest
    container_name: ai-arena-backend-tictactoe
    ports:
      - "8000:8000"
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - MISTRAL_API_KEY=${MISTRAL_API_KEY}
    volumes:
      - ./logs/tictactoe:/app/logs
    networks:
      - ai-arena-network
    restart: always

networks:
  ai-arena-network:
    driver: bridge
```

Create `.env` file:

```bash
nano .env
```

Add:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
OPENAI_API_KEY=sk-...
MISTRAL_API_KEY=...
```

Secure it:

```bash
chmod 600 .env
```

### 3. Deploy

```bash
# Push to main branch
git push origin main

# Watch deployment in GitHub Actions tab
# ✅ Completes in ~3 minutes
```

### 4. Verify

```bash
curl http://your-vm-ip:3000
```

## Workflows

### `ci.yml` - Quality Checks

- **Triggers:** Pull requests, pushes to `develop`
- **Actions:** Lint, typecheck, test, build
- **Purpose:** Fast feedback on code quality

### `deploy.yml` - Production Deployment

- **Triggers:** Pushes to `main` only
- **Actions:** Build Docker image, push to registry, deploy to VM
- **Purpose:** Automatic production deployment

## Daily Workflow

```bash
# Create feature branch
git checkout -b feature/my-feature

# Make changes, commit
git add .
git commit -m "feat: my feature"

# Push and create PR
git push origin feature/my-feature
# GitHub Actions runs CI checks ✅

# After review, merge to main
# GitHub Actions automatically deploys 🚀
```

## Monitoring

### GitHub Actions

- View builds: `Actions` tab in GitHub
- Check logs for errors
- Monitor deployment time

### VM

```bash
# View logs
docker logs -f ai-arena-frontend

# Check status
docker ps
docker compose ps

# View all logs
docker compose logs -f
```

## Troubleshooting

### Build Fails

- Check GitHub Actions logs
- Verify all secrets are configured
- Ensure Dockerfile syntax is correct

### Deploy Fails

- Verify VM is accessible: `ssh root@your-vm`
- Check Docker is running: `systemctl status docker`
- Verify `/opt/ai-arena/docker-compose.yml` exists

### Container Won't Start

- Check logs: `docker logs ai-arena-frontend`
- Verify environment variables in `.env`
- Check port availability: `netstat -tuln | grep 3000`

## Rollback

```bash
# SSH to VM
ssh root@your-vm
cd /opt/ai-arena

# Find previous image
docker images ghcr.io/your-username/ai-arena-front

# Edit docker-compose.yml to use specific SHA:
# image: ghcr.io/your-username/ai-arena-front:main-abc123

# Restart
docker compose up -d frontend
```

## Local Development

```bash
# Without Docker
npm install
npm run dev

# With Docker
docker build -t ai-arena-front .
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL=your-url \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key \
  ai-arena-front
```

## Architecture

```
Push to main
     ↓
GitHub Actions (ci.yml skipped on main)
     ↓
GitHub Actions (deploy.yml runs)
     ↓
Build Docker image → Push to ghcr.io
     ↓
SSH to VM → Pull image → Restart container
     ↓
Live at http://your-vm-ip:3000
```

## Performance

- **Build time:** 2-3 minutes (with cache: 20-30 seconds)
- **Deploy time:** 30 seconds
- **Total:** ~3 minutes from push to live
- **Zero downtime:** Only frontend restarts

## Security

- ✅ Secrets stored in GitHub (never in code)
- ✅ SSH key-based authentication
- ✅ Docker runs as non-root user
- ✅ Environment variables isolated
- ✅ `.dockerignore` excludes sensitive files

## Adding More Services

To add a new game backend, update VM's `docker-compose.yml`:

```yaml
backend-chess:
  image: ghcr.io/your-username/ai-arena-back-chess:latest
  container_name: ai-arena-backend-chess
  ports:
    - "8001:8000"
  environment:
    - OPENAI_API_KEY=${OPENAI_API_KEY}
  volumes:
    - ./logs/chess:/app/logs
  networks:
    - ai-arena-network
  restart: always
```

Then push backend repo to deploy it automatically!
