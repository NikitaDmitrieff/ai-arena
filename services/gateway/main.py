"""Unified API Gateway for AI Arena.

Reverse proxy that routes frontend requests to the appropriate game service.
REST requests are proxied via httpx, WebSocket connections via raw forwarding.
"""

import asyncio
import logging
import os

import httpx
from fastapi import FastAPI, Request, Response, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

# Service URLs (configurable via env vars, defaulting to Docker Compose hostnames)
TIC_TAC_TOE_URL = os.getenv("TIC_TAC_TOE_URL", "http://tic-tac-toe:8000")
MR_WHITE_URL = os.getenv("MR_WHITE_URL", "http://mr-white:8001")
CODENAMES_URL = os.getenv("CODENAMES_URL", "http://codenames:8002")

# Route mapping: gateway prefix -> (backend base URL, backend path prefix)
# Mr. White backend mounts routes under /api/v1, codenames under /api
ROUTE_MAP = {
    "tic-tac-toe": (TIC_TAC_TOE_URL, ""),
    "mr-white": (MR_WHITE_URL, "/api/v1"),
    "codenames": (CODENAMES_URL, "/api"),
}

# WebSocket route mapping: gateway prefix -> backend base URL
# Tic-tac-toe: /ws/games/{id}, Mr. White: /api/v1/games/{id}/ws, Codenames: /ws/games/{id}
WS_MAP = {
    "tic-tac-toe": TIC_TAC_TOE_URL,
    "mr-white": MR_WHITE_URL,
    "codenames": CODENAMES_URL,
}

WS_PATH_MAP = {
    "tic-tac-toe": lambda path: f"/ws/{path}" if path else "/ws",
    "mr-white": lambda path: f"/api/v1/{path}" if path else "/api/v1",
    "codenames": lambda path: f"/ws/{path}" if path else "/ws",
}

app = FastAPI(title="AI Arena Gateway", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

http_client: httpx.AsyncClient


@app.on_event("startup")
async def startup():
    global http_client
    http_client = httpx.AsyncClient(timeout=httpx.Timeout(120.0, connect=10.0))
    logger.info("Gateway started — routing to %s, %s, %s", TIC_TAC_TOE_URL, MR_WHITE_URL, CODENAMES_URL)


@app.on_event("shutdown")
async def shutdown():
    await http_client.aclose()


# ─── Health ────────────────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    """Aggregate health check across all services."""
    results = {}
    for name, (url, _prefix) in ROUTE_MAP.items():
        health_path = "/health" if name == "tic-tac-toe" else f"{_prefix}/health"
        try:
            resp = await http_client.get(f"{url}{health_path}", timeout=5.0)
            results[name] = resp.json() if resp.status_code == 200 else {"status": "unhealthy"}
        except Exception:
            results[name] = {"status": "unreachable"}
    return {"status": "healthy", "services": results}


# ─── Models endpoint ───────────────────────────────────────────────────────────

@app.get("/api/models")
async def list_models():
    """Proxy model list from codenames (all services share providers)."""
    try:
        resp = await http_client.get(f"{CODENAMES_URL}/api/models")
        return resp.json()
    except Exception:
        return []


# ─── REST proxy ────────────────────────────────────────────────────────────────

@app.api_route("/api/{service}/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
async def proxy_rest(service: str, path: str, request: Request):
    """Proxy REST requests to the appropriate game service."""
    if service not in ROUTE_MAP:
        return Response(content='{"detail":"Unknown service"}', status_code=404, media_type="application/json")

    base_url, prefix = ROUTE_MAP[service]
    target = f"{base_url}{prefix}/{path}"

    # Forward request
    body = await request.body()
    headers = dict(request.headers)
    headers.pop("host", None)

    try:
        resp = await http_client.request(
            method=request.method,
            url=target,
            content=body,
            headers=headers,
            params=dict(request.query_params),
        )
        return Response(
            content=resp.content,
            status_code=resp.status_code,
            media_type=resp.headers.get("content-type", "application/json"),
        )
    except httpx.ConnectError:
        return Response(
            content=f'{{"detail":"Service {service} is unavailable"}}',
            status_code=503,
            media_type="application/json",
        )


# ─── WebSocket proxy ──────────────────────────────────────────────────────────

@app.websocket("/ws/{service}/{path:path}")
async def proxy_websocket(websocket: WebSocket, service: str, path: str):
    """Proxy WebSocket connections to the appropriate game service."""
    if service not in WS_MAP:
        await websocket.close(code=1008, reason="Unknown service")
        return

    await websocket.accept()

    base_url = WS_MAP[service]
    backend_path = WS_PATH_MAP[service](path)
    ws_url = base_url.replace("http://", "ws://").replace("https://", "wss://")
    target = f"{ws_url}{backend_path}"

    try:
        import websockets
        async with websockets.connect(target) as backend_ws:
            async def forward_to_backend():
                try:
                    while True:
                        data = await websocket.receive_text()
                        await backend_ws.send(data)
                except (WebSocketDisconnect, Exception):
                    pass

            async def forward_to_client():
                try:
                    async for message in backend_ws:
                        await websocket.send_text(message)
                except (WebSocketDisconnect, Exception):
                    pass

            # Run both directions concurrently
            done, pending = await asyncio.wait(
                [asyncio.create_task(forward_to_backend()), asyncio.create_task(forward_to_client())],
                return_when=asyncio.FIRST_COMPLETED,
            )
            for task in pending:
                task.cancel()

    except Exception as e:
        logger.error("WebSocket proxy error for %s: %s", service, e)
    finally:
        try:
            await websocket.close()
        except Exception:
            pass


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)
