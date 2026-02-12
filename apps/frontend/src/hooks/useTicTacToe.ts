// Custom React hook for Tic-Tac-Toe game state management

import { useState, useCallback } from "react";
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

export interface UseTicTacToeReturn {
  gameId: string | null;
  gameState: GameState | null;
  playerXInfo: PlayerInfo | null;
  playerOInfo: PlayerInfo | null;
  moveHistory: MoveHistoryWithMetadata[];
  loading: boolean;
  error: string | null;
  isPlaying: boolean;
  createGame: (config?: GameConfig) => Promise<void>;
  makeMove: (row?: number, col?: number) => Promise<void>;
  playAuto: (delayMs?: number) => Promise<void>;
  resetGame: () => Promise<void>;
  deleteGame: () => Promise<void>;
  clearError: () => void;
  stopAutoPlay: () => void;
}

/**
 * Custom hook for managing tic-tac-toe game state
 * Handles all API interactions and state management
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
  const [shouldStopAutoPlay, setShouldStopAutoPlay] = useState(false);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const stopAutoPlay = useCallback(() => {
    setShouldStopAutoPlay(true);
  }, []);

  /**
   * Create a new game with optional configuration
   */
  const createGame = useCallback(async (config?: GameConfig) => {
    setLoading(true);
    setError(null);
    setShouldStopAutoPlay(false);
    try {
      const result = await TicTacToeApi.createGame(config);
      setGameId(result.game_id);
      setGameState(result.state);
      setPlayerXInfo(result.player_x);
      setPlayerOInfo(result.player_o);
      setMoveHistory([]);
    } catch (err) {
      const errorMessage = err instanceof TicTacToeApiError ? err.message : "Failed to create game";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Make a single move
   * If row/col are provided, makes specific move
   * If omitted, current player chooses
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

        // Update game state
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

        // If there's an error in metadata, show it
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
   * Play the game automatically with real-time move display
   * This implements the pattern from REALTIME_MOVES_UPDATE.md
   * @param delayMs Delay between moves in milliseconds (default: 1000)
   */
  const playAuto = useCallback(
    async (delayMs: number = 1000) => {
      if (!gameId) {
        setError("No active game");
        return;
      }

      setIsPlaying(true);
      setShouldStopAutoPlay(false);
      setError(null);

      try {
        let gameOver = false;

        while (!gameOver && !shouldStopAutoPlay) {
          setLoading(true);

          // Make a single move
          const result = await TicTacToeApi.makeMove(gameId, {});

          // Update game state
          setGameState({
            board: result.board,
            current_player: result.current_player || null,
            winner: result.winner || null,
            is_draw: result.is_draw || false,
            game_over: result.game_over,
            move_history: gameState?.move_history || [],
            available_moves: [],
          });

          // Add to move history
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

          gameOver = result.game_over;
          setLoading(false);

          // Add delay before next move (so user can see it)
          if (!gameOver && !shouldStopAutoPlay) {
            await new Promise((resolve) => setTimeout(resolve, delayMs));
          }
        }
      } catch (err) {
        const errorMessage =
          err instanceof TicTacToeApiError ? err.message : "Failed during auto-play";
        setError(errorMessage);
      } finally {
        setIsPlaying(false);
        setLoading(false);
        setShouldStopAutoPlay(false);
      }
    },
    [gameId, gameState, shouldStopAutoPlay]
  );

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
    setShouldStopAutoPlay(false);
    try {
      const result = await TicTacToeApi.resetGame(gameId);
      setGameState(result.state);
      setMoveHistory([]);
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

    setLoading(true);
    setError(null);
    try {
      await TicTacToeApi.deleteGame(gameId);
      setGameId(null);
      setGameState(null);
      setPlayerXInfo(null);
      setPlayerOInfo(null);
      setMoveHistory([]);
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
    createGame,
    makeMove,
    playAuto,
    resetGame,
    deleteGame,
    clearError,
    stopAutoPlay,
  };
}
