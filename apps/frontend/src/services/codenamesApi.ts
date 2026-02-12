// Codenames API Service

import { GameStartRequest, GameStatus, GameStateResponse, ModelInfo } from "@/lib/types/codenames";

const API_URL = process.env["NEXT_PUBLIC_API_URL"] || "http://localhost:8080";
const API_BASE_URL = `${API_URL}/api/codenames`;

export class CodenamesApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public details?: any
  ) {
    super(message);
    this.name = "CodenamesApiError";
  }
}

export class CodenamesApi {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Get list of available LLM models
   */
  async getModels(): Promise<ModelInfo[]> {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new CodenamesApiError("Failed to fetch models", response.status);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof CodenamesApiError) throw error;
      throw new CodenamesApiError(
        `Network error: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * Start a new Codenames game
   */
  async createGame(config: GameStartRequest): Promise<GameStatus> {
    try {
      const response = await fetch(`${this.baseUrl}/games`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new CodenamesApiError(
          errorData.detail || "Failed to create game",
          response.status,
          errorData
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof CodenamesApiError) throw error;
      throw new CodenamesApiError(
        `Network error: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * Get list of all active game IDs
   */
  async listGames(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/games`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new CodenamesApiError("Failed to fetch games", response.status);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof CodenamesApiError) throw error;
      throw new CodenamesApiError(
        `Network error: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * Get current game state
   */
  async getGame(gameId: string): Promise<GameStateResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/games/${gameId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new CodenamesApiError("Game not found", 404);
        }
        throw new CodenamesApiError("Failed to fetch game state", response.status);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof CodenamesApiError) throw error;
      throw new CodenamesApiError(
        `Network error: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * Delete/abort a game
   */
  async deleteGame(gameId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/games/${gameId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new CodenamesApiError("Game not found", 404);
        }
        throw new CodenamesApiError("Failed to delete game", response.status);
      }
    } catch (error) {
      if (error instanceof CodenamesApiError) throw error;
      throw new CodenamesApiError(
        `Network error: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * Get WebSocket URL for a game
   */
  getWebSocketUrl(gameId: string): string {
    const wsBaseUrl = API_URL.replace("http://", "ws://").replace("https://", "wss://");
    return `${wsBaseUrl}/ws/codenames/games/${gameId}`;
  }

  /**
   * Check if API is accessible
   */
  async healthCheck(): Promise<boolean> {
    try {
      const apiUrl = process.env["NEXT_PUBLIC_API_URL"] || "http://localhost:8080";
      const response = await fetch(`${apiUrl}/health`, {
        method: "GET",
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const codenamesApi = new CodenamesApi();
