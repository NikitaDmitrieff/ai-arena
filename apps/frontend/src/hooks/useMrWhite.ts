import { useState, useEffect, useCallback, useRef } from "react";
import { mrWhiteApi, MrWhiteApiError } from "@/services/mrwhiteApi";
import {
  CreateGameRequest,
  GameResponse,
  GameEvent,
  GameCompleteEvent,
  PhaseChangeEvent,
  MessageEvent,
} from "@/lib/types/mrwhite";

interface UseMrWhiteReturn {
  // Game state
  game: GameResponse | null;
  events: GameEvent[];
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  createGame: (config: CreateGameRequest) => Promise<void>;
  fetchGameStatus: (gameId: string) => Promise<void>;
  clearError: () => void;
  disconnect: () => void;
}

export function useMrWhite(initialGameId?: string): UseMrWhiteReturn {
  const [game, setGame] = useState<GameResponse | null>(null);
  const [events, setEvents] = useState<GameEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const currentGameIdRef = useRef<string | null>(initialGameId || null);

  // Fetch game status
  const fetchGameStatus = useCallback(async (gameId: string) => {
    try {
      console.log("[fetchGameStatus] Fetching game status for:", gameId);
      setIsLoading(true);
      setError(null);
      const gameData = await mrWhiteApi.getGame(gameId);
      console.log("[fetchGameStatus] Received game data:", {
        status: gameData.status,
        phase: gameData.phase,
        playerCount: gameData.players?.length || 0,
        messageCount: gameData.messages?.length || 0,
        players: gameData.players?.map((p) => p.name) || [],
      });
      setGame(gameData);
    } catch (err) {
      const errorMessage =
        err instanceof MrWhiteApiError ? err.message : "Failed to fetch game status";
      setError(errorMessage);
      console.error("[fetchGameStatus] Error fetching game status:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Connect to WebSocket
  const connectWebSocket = useCallback(
    (gameId: string) => {
      // Clean up existing connection
      if (wsRef.current) {
        wsRef.current.close();
      }

      const ws = mrWhiteApi.createWebSocket(gameId, {
        onOpen: () => {
          console.log("[WebSocket] Connection opened");
          setIsConnected(true);
          setError(null);
        },
        onMessage: (event: GameEvent) => {
          console.log("[WebSocket] Event received:", event.event_type, event.data);
          setEvents((prev) => [...prev, event]);

          // Handle different event types
          switch (event.event_type) {
            case "connected":
              // Fetch initial game state
              console.log("[WebSocket] Connected event - fetching initial game state");
              fetchGameStatus(gameId);
              break;

            case "phase_change":
              const phaseData = event.data as PhaseChangeEvent;
              console.log("[WebSocket] Phase changed to:", phaseData.phase);
              setGame((prev) => (prev ? { ...prev, phase: phaseData.phase } : null));
              // Fetch game status on phase change to ensure we have updated player data
              if (phaseData.phase === "clue" || phaseData.phase === "discussion") {
                console.log("[WebSocket] Phase change to active phase - fetching game status");
                fetchGameStatus(gameId);
              }
              break;

            case "message":
              const messageData = event.data as MessageEvent;
              console.log(
                `[WebSocket] Message from ${messageData.player}:`,
                messageData.content.substring(0, 50)
              );
              setGame((prev) => {
                if (!prev) {
                  console.warn("[WebSocket] No game state to add message to!");
                  return null;
                }
                const newMessages = [
                  ...(prev.messages || []),
                  {
                    player: messageData.player,
                    type: messageData.type,
                    content: messageData.content,
                    round: messageData.round,
                    phase: messageData.phase,
                    timestamp: event.timestamp,
                  },
                ];
                console.log(`[WebSocket] Updated messages array, total: ${newMessages.length}`);
                return {
                  ...prev,
                  messages: newMessages,
                };
              });
              break;

            case "game_complete":
              const completeData = event.data as GameCompleteEvent;
              console.log("[WebSocket] Game completed:", completeData);
              setGame((prev) => {
                if (!prev) return null;
                return {
                  ...prev,
                  status: "completed",
                  winner_side: completeData.winner_side,
                  secret_word: completeData.secret_word,
                  mister_white_player: completeData.mister_white_player,
                  eliminated_player: completeData.eliminated_player,
                  vote_counts: completeData.vote_counts,
                };
              });
              // Fetch final game state for complete data
              console.log("[WebSocket] Fetching final game state");
              fetchGameStatus(gameId);
              break;

            case "error":
              console.error("[WebSocket] Error event:", event.data.message);
              setError(event.data.message);
              break;

            case "discussion_round":
              // Just log or display discussion round info
              console.log("[WebSocket] Discussion round:", event.data);
              break;

            default:
              console.log("[WebSocket] Unknown event type:", event.event_type);
          }
        },
        onError: (error) => {
          setError("WebSocket connection error");
          setIsConnected(false);
        },
        onClose: () => {
          setIsConnected(false);
        },
      });

      wsRef.current = ws;
    },
    [fetchGameStatus]
  );

  // Create a new game
  const createGame = useCallback(
    async (config: CreateGameRequest) => {
      try {
        setIsLoading(true);
        setError(null);
        setEvents([]); // Clear previous events

        const newGame = await mrWhiteApi.createGame(config);
        setGame(newGame);
        currentGameIdRef.current = newGame.game_id;

        // Connect to WebSocket for real-time updates
        connectWebSocket(newGame.game_id);
      } catch (err) {
        const errorMessage = err instanceof MrWhiteApiError ? err.message : "Failed to create game";
        setError(errorMessage);
        console.error("Error creating game:", err);
      } finally {
        setIsLoading(false);
      }
    },
    [connectWebSocket]
  );

  // Disconnect WebSocket
  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Connect to WebSocket if initial game ID is provided
  useEffect(() => {
    if (initialGameId) {
      fetchGameStatus(initialGameId);
      connectWebSocket(initialGameId);
    }

    // Cleanup on unmount
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [initialGameId, fetchGameStatus, connectWebSocket]);

  return {
    game,
    events,
    isConnected,
    isLoading,
    error,
    createGame,
    fetchGameStatus,
    clearError,
    disconnect,
  };
}
