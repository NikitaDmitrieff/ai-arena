// Type definitions for Tic-Tac-Toe API
// Based on API_INTEGRATION_GUIDE.md

export interface PlayerConfig {
  use_llm: boolean;
  provider: "openai" | "mistral";
  model: string;
  temperature: number;
}

export interface GameConfig {
  player_x?: PlayerConfig;
  player_o?: PlayerConfig;
  enable_logging: boolean;
}

export interface MoveRequest {
  row?: number;
  col?: number;
}

export interface MoveHistoryEntry {
  player: string;
  row: number;
  col: number;
  reasoning?: string;
}

export interface GameState {
  board: (string | null)[][];
  current_player: string | null;
  winner: string | null;
  is_draw: boolean;
  game_over: boolean;
  move_history: MoveHistoryEntry[];
  available_moves: [number, number][];
}

export interface MoveMetadata {
  player_type: "llm" | "random";
  prompt?: string;
  response?: string;
  reasoning?: string;
  response_time_ms?: number;
  error?: string;
}

export interface PlayerInfo {
  type: string;
  model: string | null;
}

export interface CreateGameResponse {
  game_id: string;
  message: string;
  state: GameState;
  player_x: PlayerInfo;
  player_o: PlayerInfo;
}

export interface GetGameResponse {
  game_id: string;
  state: GameState;
}

export interface MakeMoveResponse {
  game_id: string;
  success: boolean;
  message: string;
  board: (string | null)[][];
  game_over: boolean;
  winner?: string | null;
  is_draw?: boolean;
  current_player?: string;
  move?: {
    row: number;
    col: number;
    player: string;
  };
  metadata?: MoveMetadata;
}

export interface ResetGameResponse {
  game_id: string;
  message: string;
  state: GameState;
}

export interface DeleteGameResponse {
  game_id: string;
  message: string;
}

// Available models by provider
export const AVAILABLE_MODELS = {
  openai: ["gpt-4o-mini", "gpt-4o", "gpt-4-turbo", "gpt-3.5-turbo"],
  mistral: ["mistral-small-latest", "mistral-medium-latest", "mistral-large-latest"],
} as const;

// Default player configurations
export const DEFAULT_PLAYER_CONFIG: PlayerConfig = {
  use_llm: false,
  provider: "openai",
  model: "gpt-4o-mini",
  temperature: 0.7,
};
