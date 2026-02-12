// Codenames Game State Management Hook

import { useState, useEffect, useCallback, useRef } from "react";
import { codenamesApi, CodenamesApiError } from "@/services/codenamesApi";
import {
  GameStartRequest,
  GameStateEvent,
  WebSocketMessage,
  GameEvent,
  ModelInfo,
  BoardCard,
  Clue,
  Team,
  GamePhase,
} from "@/lib/types/codenames";

interface UseCodenamesState {
  // Game state
  gameId: string | null;
  gameState: GameStateEvent | null;
  board: BoardCard[][] | null;
  lastClue: Clue | null;
  phase: GamePhase | null;
  currentTeam: Team | null;
  turnNumber: number;
  redRemaining: number;
  blueRemaining: number;
  winner: Team | null;
  assassinRevealed: boolean;

  // WebSocket state
  isConnected: boolean;
  events: GameEvent[];

  // UI state
  isLoading: boolean;
  error: string | null;

  // Available models
  availableModels: ModelInfo[];

  // Actions
  startGame: (config: GameStartRequest) => Promise<void>;
  deleteGame: () => Promise<void>;
  clearError: () => void;
  fetchModels: () => Promise<void>;
}

export function useCodenames(): UseCodenamesState {
  // Game state
  const [gameId, setGameId] = useState<string | null>(null);
  const [gameState, setGameState] = useState<GameStateEvent | null>(null);
  const [board, setBoard] = useState<BoardCard[][] | null>(null);
  const [lastClue, setLastClue] = useState<Clue | null>(null);

  // WebSocket state
  const [isConnected, setIsConnected] = useState(false);
  const [events, setEvents] = useState<GameEvent[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableModels, setAvailableModels] = useState<ModelInfo[]>([]);

  // Fetch available models
  const fetchModels = useCallback(async () => {
    try {
      const models = await codenamesApi.getModels();
      setAvailableModels(models);
    } catch (err) {
      console.error("Failed to fetch models:", err);
      setError(err instanceof CodenamesApiError ? err.message : "Failed to fetch models");
    }
  }, []);

  // Start a new game
  const startGame = useCallback(async (config: GameStartRequest) => {
    setIsLoading(true);
    setError(null);

    try {
      const status = await codenamesApi.createGame(config);
      setGameId(status.game_id);
    } catch (err) {
      const errorMessage = err instanceof CodenamesApiError ? err.message : "Failed to start game";
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Delete game
  const deleteGame = useCallback(async () => {
    if (!gameId) return;

    setIsLoading(true);
    setError(null);

    try {
      await codenamesApi.deleteGame(gameId);

      // Close WebSocket connection
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }

      // Reset state
      setGameId(null);
      setGameState(null);
      setBoard(null);
      setLastClue(null);
      setEvents([]);
      setIsConnected(false);
    } catch (err) {
      const errorMessage = err instanceof CodenamesApiError ? err.message : "Failed to delete game";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [gameId]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Format event for display
  const formatEvent = useCallback((message: WebSocketMessage): GameEvent => {
    let description = "";

    switch (message.event_type) {
      case "game_started":
        description = `Game started! ${message.data.starting_team} team goes first.`;
        break;
      case "turn_started":
        description = `Turn ${message.data.turn_number}: ${message.data.team} team's turn`;
        break;
      case "clue_given":
        description = `${message.data.team} Spymaster: "${message.data.clue}" for ${message.data.number}`;
        break;
      case "guess_made":
        description = `${message.data.team} Operative guessed "${message.data.word}" (${message.data.card_type})`;
        break;
      case "turn_ended":
        description = `${message.data.team} team ended their turn`;
        break;
      case "game_ended":
        if (message.data.assassin_revealed) {
          description = `Game Over! ${message.data.winner} team wins (Assassin revealed)`;
        } else {
          description = `Game Over! ${message.data.winner} team wins!`;
        }
        break;
      default:
        description = `${message.event_type}`;
    }

    return {
      id: `${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
      event_type: message.event_type,
      data: message.data,
      description,
    };
  }, []);

  // WebSocket connection
  useEffect(() => {
    if (!gameId) return;

    const wsUrl = codenamesApi.getWebSocketUrl(gameId);
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);

        // Handle game state updates
        if (message.event_type === "game_state") {
          const stateData = message.data as GameStateEvent;
          setGameState(stateData);
          setBoard(stateData.board);
        }

        // Handle guess made - update board and reveal card with correct color
        if (message.event_type === "guess_made") {
          const guessData = message.data;

          setBoard((prevBoard) => {
            if (!prevBoard) return prevBoard;

            return prevBoard.map((row) =>
              row.map((card) =>
                card.word === guessData.word
                  ? { ...card, revealed: true, card_type: guessData.card_type }
                  : card
              )
            );
          });

          setGameState((prevState) => {
            if (!prevState) return prevState;
            return {
              ...prevState,
              red_remaining: guessData.red_remaining,
              blue_remaining: guessData.blue_remaining,
            };
          });
        }

        // Handle clue given
        if (message.event_type === "clue_given") {
          setLastClue({
            word: message.data.clue,
            number: message.data.number,
          });
        }

        // Handle game started
        if (message.event_type === "game_started") {
          const startData = message.data;
          if (startData.board) {
            setBoard(startData.board);
          }
        }

        // Handle turn started
        if (message.event_type === "turn_started") {
          const turnData = message.data;
          setGameState((prevState) => {
            if (!prevState) return prevState;
            return {
              ...prevState,
              current_team: turnData.team,
              turn_number: turnData.turn_number,
              red_remaining: turnData.red_remaining,
              blue_remaining: turnData.blue_remaining,
            };
          });
        }

        // Handle game ended
        if (message.event_type === "game_ended") {
          const endData = message.data;
          setGameState((prevState) => {
            if (!prevState) return prevState;
            return {
              ...prevState,
              phase: "finished",
              winner: endData.winner,
              assassin_revealed: endData.assassin_revealed,
              red_remaining: endData.red_remaining,
              blue_remaining: endData.blue_remaining,
            };
          });
        }

        // Add event to log
        const gameEvent = formatEvent(message);
        setEvents((prev) => [...prev, gameEvent]);
      } catch (err) {
        console.error("Failed to parse WebSocket message:", err);
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      setError("WebSocket connection error");
    };

    ws.onclose = (event) => {
      setIsConnected(false);

      if (event.code === 1008) {
        setError("Game not found");
      }
    };

    // Cleanup on unmount
    return () => {
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close();
      }
    };
  }, [gameId, formatEvent]);

  // Extract derived state from gameState
  const phase = gameState?.phase ?? null;
  const currentTeam = gameState?.current_team ?? null;
  const turnNumber = gameState?.turn_number ?? 0;
  const redRemaining = gameState?.red_remaining ?? 0;
  const blueRemaining = gameState?.blue_remaining ?? 0;
  const winner = gameState?.winner ?? null;
  const assassinRevealed = gameState?.assassin_revealed ?? false;

  return {
    // Game state
    gameId,
    gameState,
    board,
    lastClue,
    phase,
    currentTeam,
    turnNumber,
    redRemaining,
    blueRemaining,
    winner,
    assassinRevealed,

    // WebSocket state
    isConnected,
    events,

    // UI state
    isLoading,
    error,
    availableModels,

    // Actions
    startGame,
    deleteGame,
    clearError,
    fetchModels,
  };
}
