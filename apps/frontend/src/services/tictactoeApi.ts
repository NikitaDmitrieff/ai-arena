// Tic-Tac-Toe API Service Layer
// Provides typed API calls to the FastAPI backend

import type {
  GameConfig,
  CreateGameResponse,
  GetGameResponse,
  MoveRequest,
  MakeMoveResponse,
  ResetGameResponse,
  DeleteGameResponse,
} from "@/lib/types/tictactoe";

const API_BASE_URL = process.env["NEXT_PUBLIC_TICTACTOE_API_URL"] || "http://localhost:8000";

// Custom error class for API errors
export class TicTacToeApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public data?: any
  ) {
    super(message);
    this.name = "TicTacToeApiError";
  }
}

// Generic response handler
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorData: any;
    try {
      errorData = await response.json();
    } catch {
      errorData = { detail: response.statusText };
    }
    throw new TicTacToeApiError(
      errorData.detail || errorData.message || `HTTP ${response.status}`,
      response.status,
      errorData
    );
  }
  return response.json();
}

/**
 * Tic-Tac-Toe API Client
 * All methods follow the API specification from API_INTEGRATION_GUIDE.md
 */
export class TicTacToeApi {
  /**
   * Create a new tic-tac-toe game
   * @param config Optional game configuration (player settings, logging)
   * @returns Game creation response with game_id and initial state
   */
  static async createGame(config?: GameConfig): Promise<CreateGameResponse> {
    const response = await fetch(`${API_BASE_URL}/games`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: config ? JSON.stringify(config) : undefined,
    });
    return handleResponse<CreateGameResponse>(response);
  }

  /**
   * Get current state of a game
   * @param gameId UUID of the game
   * @returns Current game state
   */
  static async getGame(gameId: string): Promise<GetGameResponse> {
    const response = await fetch(`${API_BASE_URL}/games/${gameId}`);
    return handleResponse<GetGameResponse>(response);
  }

  /**
   * Make a move in the game
   * If row/col are provided, makes a specific move
   * If omitted, the current player (LLM or random) chooses
   * @param gameId UUID of the game
   * @param move Optional move coordinates
   * @returns Move response with updated board and game state
   */
  static async makeMove(gameId: string, move?: MoveRequest): Promise<MakeMoveResponse> {
    const response = await fetch(`${API_BASE_URL}/games/${gameId}/move`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(move || {}),
    });
    return handleResponse<MakeMoveResponse>(response);
  }

  /**
   * Reset a game to initial state
   * @param gameId UUID of the game
   * @returns Reset confirmation with fresh game state
   */
  static async resetGame(gameId: string): Promise<ResetGameResponse> {
    const response = await fetch(`${API_BASE_URL}/games/${gameId}/reset`, {
      method: "POST",
    });
    return handleResponse<ResetGameResponse>(response);
  }

  /**
   * Delete a game
   * @param gameId UUID of the game
   * @returns Deletion confirmation
   */
  static async deleteGame(gameId: string): Promise<DeleteGameResponse> {
    const response = await fetch(`${API_BASE_URL}/games/${gameId}`, {
      method: "DELETE",
    });
    return handleResponse<DeleteGameResponse>(response);
  }

  /**
   * Play an entire game automatically (returns only final result)
   * Note: For real-time move display, use makeMove() repeatedly instead
   * @param gameId UUID of the game
   * @returns Complete game result
   */
  static async autoPlay(gameId: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/games/${gameId}/auto`, {
      method: "POST",
    });
    return handleResponse(response);
  }
}
