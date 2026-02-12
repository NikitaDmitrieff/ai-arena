// Custom React hook for Tic-Tac-Toe game state management
// Uses WebSocket for real-time game updates (matching mr-white/codenames pattern)

import { useState, useCallback, useRef, useEffect } from "react";
import { TicTacToeApi, TicTacToeApiError } from "@/services/tictactoeApi";
import type {
  GameConfig,
  GameState,
  MoveMetadata,
  PlayerInfo,
  MoveHistoryEntry,
} from "@/lib/types/tictactoe";

export interface MoveHistoryWithMetadata extends MoveHistoryEntry {
  metadata?: MoveMetadata;
}

export interface GameEvent {
  id: string;
  event_type: string;
  data: any;
  description: string;
  timestamp: number;
}

export interface UseTicTacToeReturn {
  gameId: string | null;
  gameState: GameState | null;
  playerXInfo: PlayerInfo | null;
  playerOInfo: PlayerInfo | null;
  moveHistory: MoveHistoryWithMetadata[];
  loading: boolean;
  error: string | null;
  isPlaying: boolean;
  isConnected: boolean;
  events: GameEvent[];
  createGame: (config?: GameConfig) => Promise<void>;
  makeMove: (row?: number, col?: number) => Promise<void>;
  playAuto: () => Promise<void>;
  resetGame: () => Promise<void>;
  deleteGame: () => Promise<void>;
  clearError: () => void;
  stopAutoPlay: () => void;
}

function formatEvent(eventType: string, data: any): string {
  switch (eventType) {
    case "connected":
      return "Connected to game";
    case "game_started":
      return `Game started! ${data.player_x?.name || "X"} vs ${data.player_o?.name || "O"}`;
    case "move_made":
      return `${data.player} played at (${data.position?.row ?? "?"}, ${data.position?.col ?? "?"})`;
    case "game_ended":
      if (data.is_draw) return "Game ended in a draw!";
      return `Game over! ${data.winner} wins!`;
    default:
      return eventType;
  }
}

/**
 * Custom hook for managing tic-tac-toe game state
 * Uses WebSocket for real-time updates during auto-play
 */
export function useTicTacToe(): UseTicTacToeReturn {
  const [gameId, setGameId] = useState<string | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [playerXInfo, setPlayerXInfo] = useState<PlayerInfo | null>(null);
  const [playerOInfo, setPlayerOInfo] = useState<PlayerInfo | null>(null);
  const [moveHistory, setMoveHistory] = useState<MoveHistoryWithMetadata[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [events, setEvents] = useState<GameEvent[]>([]);

  const wsRef = useRef<WebSocket | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const stopAutoPlay = useCallback(() => {
    // Just disconnect WS — the game stops sending events
    setIsPlaying(false);
  }, []);

  // Connect WebSocket for real-time updates
  const connectWebSocket = useCallback((gId: string) => {
    // Clean up existing connection
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    const ws = TicTacToeApi.createWebSocket(gId, {
      onOpen: () => {
        setIsConnected(true);
        setError(null);
      },
      onMessage: (data: any) => {
        const eventType = data.event_type || data.type || "unknown";

        // Add to events log
        const event: GameEvent = {
          id: `${Date.now()}-${Math.random()}`,
          event_type: eventType,
          data: data.data || data,
          description: formatEvent(eventType, data.data || data),
          timestamp: Date.now(),
        };
        setEvents((prev) => [...prev, event]);

        const payload = data.data || data;

        switch (eventType) {
          case "connected":
            // Initial state from server
            if (payload.state) {
              setGameState(payload.state);
            }
            break;

          case "game_started":
            if (payload.board) {
              setGameState((prev) => prev ? { ...prev, board: payload.board } : prev);
            }
            break;

          case "move_made":
            // Update board and move history from WebSocket event
            if (payload.board) {
              setGameState((prev) => {
                if (!prev) return prev;
                return {
                  ...prev,
                  board: payload.board,
                  current_player: payload.game_over ? null : (payload.player === "X" ? "O" : "X"),
                  game_over: payload.game_over || false,
                };
              });
            }

            if (payload.position || (payload.player)) {
              setMoveHistory((prev) => [
                ...prev,
                {
                  player: payload.player,
                  row: payload.position?.row ?? 0,
                  col: payload.position?.col ?? 0,
                  reasoning: payload.reasoning,
                  metadata: payload.reasoning ? { player_type: "llm" as const, reasoning: payload.reasoning } : undefined,
                },
              ]);
            }
            break;

          case "game_ended":
            setGameState((prev) => {
              if (!prev) return prev;
              return {
                ...prev,
                board: payload.board || prev.board,
                winner: payload.winner || null,
                is_draw: payload.is_draw || false,
                game_over: true,
                current_player: null,
              };
            });
            setIsPlaying(false);
            setLoading(false);
            break;

          case "error":
            setError(payload.message || "Game error");
            break;
        }
      },
      onError: () => {
        setError("WebSocket connection error");
        setIsConnected(false);
      },
      onClose: () => {
        setIsConnected(false);
      },
    });

    wsRef.current = ws;
  }, []);

  // Cleanup WebSocket on unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, []);

  /**
   * Create a new game with optional configuration
   */
  const createGame = useCallback(async (config?: GameConfig) => {
    setLoading(true);
    setError(null);
    setEvents([]);
    try {
      const result = await TicTacToeApi.createGame(config);
      setGameId(result.game_id);
      setGameState(result.state);
      setPlayerXInfo(result.player_x);
      setPlayerOInfo(result.player_o);
      setMoveHistory([]);

      // Connect WebSocket for real-time updates
      connectWebSocket(result.game_id);
    } catch (err) {
      const errorMessage = err instanceof TicTacToeApiError ? err.message : "Failed to create game";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [connectWebSocket]);

  /**
   * Make a single move via REST API
   * Board updates come via WebSocket if connected
   */
  const makeMove = useCallback(
    async (row?: number, col?: number) => {
      if (!gameId) {
        setError("No active game");
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const result = await TicTacToeApi.makeMove(gameId, { row, col });

        // Update state from REST response (WebSocket will also send the update,
        // but REST response is immediate for single moves)
        setGameState({
          board: result.board,
          current_player: result.current_player || null,
          winner: result.winner || null,
          is_draw: result.is_draw || false,
          game_over: result.game_over,
          move_history: gameState?.move_history || [],
          available_moves: [],
        });

        // Add to move history with metadata
        if (result.move) {
          setMoveHistory((prev) => [
            ...prev,
            {
              player: result.move!.player,
              row: result.move!.row,
              col: result.move!.col,
              reasoning: result.metadata?.reasoning,
              metadata: result.metadata,
            },
          ]);
        }

        if (result.metadata?.error) {
          setError(result.metadata.error);
        }
      } catch (err) {
        const errorMessage = err instanceof TicTacToeApiError ? err.message : "Failed to make move";
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [gameId, gameState]
  );

  /**
   * Play the game automatically via the backend auto endpoint.
   * Updates come in real-time through WebSocket — no polling needed.
   */
  const playAuto = useCallback(async () => {
    if (!gameId) {
      setError("No active game");
      return;
    }

    setIsPlaying(true);
    setError(null);
    setLoading(true);

    try {
      // Ensure WebSocket is connected before starting
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        connectWebSocket(gameId);
      }

      // Trigger auto-play on the backend — it runs the game and emits WS events
      await TicTacToeApi.autoPlay(gameId);
      // The game is now running on the backend.
      // WebSocket events (move_made, game_ended) will update the UI in real-time.
      // isPlaying will be set to false when game_ended event arrives.
    } catch (err) {
      const errorMessage = err instanceof TicTacToeApiError ? err.message : "Failed to start auto-play";
      setError(errorMessage);
      setIsPlaying(false);
      setLoading(false);
    }
  }, [gameId, connectWebSocket]);

  /**
   * Reset the current game to initial state
   */
  const resetGame = useCallback(async () => {
    if (!gameId) {
      setError("No active game");
      return;
    }

    setLoading(true);
    setError(null);
    setIsPlaying(false);
    try {
      const result = await TicTacToeApi.resetGame(gameId);
      setGameState(result.state);
      setMoveHistory([]);
      setEvents([]);
    } catch (err) {
      const errorMessage = err instanceof TicTacToeApiError ? err.message : "Failed to reset game";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [gameId]);

  /**
   * Delete the current game
   */
  const deleteGame = useCallback(async () => {
    if (!gameId) return;

    // Close WebSocket
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setLoading(true);
    setError(null);
    try {
      await TicTacToeApi.deleteGame(gameId);
      setGameId(null);
      setGameState(null);
      setPlayerXInfo(null);
      setPlayerOInfo(null);
      setMoveHistory([]);
      setEvents([]);
      setIsConnected(false);
    } catch (err) {
      const errorMessage = err instanceof TicTacToeApiError ? err.message : "Failed to delete game";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [gameId]);

  return {
    gameId,
    gameState,
    playerXInfo,
    playerOInfo,
    moveHistory,
    loading,
    error,
    isPlaying,
    isConnected,
    events,
    createGame,
    makeMove,
    playAuto,
    resetGame,
    deleteGame,
    clearError,
    stopAutoPlay,
  };
}
