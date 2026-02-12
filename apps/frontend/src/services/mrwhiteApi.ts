import {
  CreateGameRequest,
  GameResponse,
  GameListResponse,
  HealthResponse,
  GameEvent,
} from "@/lib/types/mrwhite";

// Custom error class for Mr. White API errors
export class MrWhiteApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public details?: any
  ) {
    super(message);
    this.name = "MrWhiteApiError";
  }
}

class MrWhiteApiService {
  private baseUrl: string;
  private wsUrl: string;

  constructor() {
    const apiUrl = process.env["NEXT_PUBLIC_API_URL"] || "http://localhost:8080";
    this.baseUrl = `${apiUrl}/api/mr-white`;
    this.wsUrl = apiUrl.replace("http://", "ws://").replace("https://", "wss://");
  }

  // Helper method for fetch requests
  private async fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...options?.headers,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new MrWhiteApiError(
          errorData.detail || `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          errorData
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof MrWhiteApiError) {
        throw error;
      }
      throw new MrWhiteApiError(error instanceof Error ? error.message : "Network request failed");
    }
  }

  // Health check
  async healthCheck(): Promise<HealthResponse> {
    return this.fetchApi<HealthResponse>("/health");
  }

  // Create a new game
  async createGame(config: CreateGameRequest): Promise<GameResponse> {
    return this.fetchApi<GameResponse>("/games", {
      method: "POST",
      body: JSON.stringify(config),
    });
  }

  // Get game status
  async getGame(gameId: string): Promise<GameResponse> {
    return this.fetchApi<GameResponse>(`/games/${gameId}`);
  }

  // List all games
  async listGames(): Promise<GameListResponse> {
    return this.fetchApi<GameListResponse>("/games");
  }

  // Create WebSocket connection
  createWebSocket(
    gameId: string,
    callbacks: {
      onOpen?: () => void;
      onMessage?: (event: GameEvent) => void;
      onError?: (error: Event) => void;
      onClose?: () => void;
    }
  ): WebSocket {
    const ws = new WebSocket(`${this.wsUrl}/ws/mr-white/games/${gameId}/ws`);

    ws.onopen = () => {
      console.log(`WebSocket connected to game ${gameId}`);
      callbacks.onOpen?.();
    };

    ws.onmessage = (event) => {
      try {
        const gameEvent: GameEvent = JSON.parse(event.data);
        callbacks.onMessage?.(gameEvent);
      } catch (error) {
        console.error("Failed to parse WebSocket message:", error);
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      callbacks.onError?.(error);
    };

    ws.onclose = () => {
      console.log("WebSocket disconnected");
      callbacks.onClose?.();
    };

    return ws;
  }
}

// Export a singleton instance
export const mrWhiteApi = new MrWhiteApiService();
