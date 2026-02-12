// Tic-Tac-Toe API Service Layer

import type {
  GameConfig,
  CreateGameResponse,
  GetGameResponse,
  MoveRequest,
  MakeMoveResponse,
  ResetGameResponse,
  DeleteGameResponse,
} from "@/lib/types/tictactoe";

const API_URL = process.env["NEXT_PUBLIC_API_URL"] || "http://localhost:8080";
const API_BASE_URL = `${API_URL}/api/tic-tac-toe`;
const WS_BASE_URL = API_URL.replace("http://", "ws://").replace("https://", "wss://");

export class TicTacToeApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public data?: unknown
  ) {
    super(message);
    this.name = "TicTacToeApiError";
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorData: Record<string, string>;
    try {
      errorData = await response.json();
    } catch {
      errorData = { detail: response.statusText };
    }
    throw new TicTacToeApiError(
      errorData["detail"] || errorData["message"] || `HTTP ${response.status}`,
      response.status,
      errorData
    );
  }
  return response.json();
}

export interface WebSocketCallbacks {
  onOpen?: () => void;
  onMessage?: (event: unknown) => void;
  onError?: (error: Event) => void;
  onClose?: () => void;
}

/** Tic-Tac-Toe API Client */
export class TicTacToeApi {
  static async createGame(config?: GameConfig): Promise<CreateGameResponse> {
    const response = await fetch(`${API_BASE_URL}/games`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: config ? JSON.stringify(config) : undefined,
    });
    return handleResponse<CreateGameResponse>(response);
  }

  static async getGame(gameId: string): Promise<GetGameResponse> {
    const response = await fetch(`${API_BASE_URL}/games/${gameId}`);
    return handleResponse<GetGameResponse>(response);
  }

  /** If row/col are omitted, the current player (LLM or random) chooses. */
  static async makeMove(gameId: string, move?: MoveRequest): Promise<MakeMoveResponse> {
    const response = await fetch(`${API_BASE_URL}/games/${gameId}/move`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(move || {}),
    });
    return handleResponse<MakeMoveResponse>(response);
  }

  static async resetGame(gameId: string): Promise<ResetGameResponse> {
    const response = await fetch(`${API_BASE_URL}/games/${gameId}/reset`, {
      method: "POST",
    });
    return handleResponse<ResetGameResponse>(response);
  }

  static async deleteGame(gameId: string): Promise<DeleteGameResponse> {
    const response = await fetch(`${API_BASE_URL}/games/${gameId}`, {
      method: "DELETE",
    });
    return handleResponse<DeleteGameResponse>(response);
  }

  /** Trigger auto-play on the backend. Connect via WebSocket for real-time updates. */
  static async autoPlay(gameId: string): Promise<unknown> {
    const response = await fetch(`${API_BASE_URL}/games/${gameId}/auto`, {
      method: "POST",
    });
    return handleResponse(response);
  }

  static getWebSocketUrl(gameId: string): string {
    return `${WS_BASE_URL}/ws/tic-tac-toe/games/${gameId}`;
  }

  static createWebSocket(gameId: string, callbacks: WebSocketCallbacks): WebSocket {
    const ws = new WebSocket(TicTacToeApi.getWebSocketUrl(gameId));

    ws.onopen = () => callbacks.onOpen?.();

    ws.onmessage = (event) => {
      try {
        callbacks.onMessage?.(JSON.parse(event.data));
      } catch (error) {
        console.error("Failed to parse WebSocket message:", error);
      }
    };

    ws.onerror = (error) => callbacks.onError?.(error);
    ws.onclose = () => callbacks.onClose?.();

    return ws;
  }
}
