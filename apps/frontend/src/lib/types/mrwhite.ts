// Mr. White Game Types

export type Provider = "openai" | "mistral";

export type GameStatus = "pending" | "running" | "completed" | "failed";

export type GamePhase = "setup" | "clue" | "discussion" | "voting" | "results";

export type WinnerSide = "citizens" | "mister_white";

export type MessageType = "clue" | "discussion" | "vote";

export type EventType =
  | "connected"
  | "phase_change"
  | "message"
  | "discussion_round"
  | "game_complete"
  | "error";

export interface ModelConfig {
  provider: Provider;
  model: string;
}

export interface CreateGameRequest {
  models: ModelConfig[];
  verbose?: boolean;
  secret_word?: string | null;
}

export interface PlayerInfo {
  name: string;
  provider: string;
  model: string;
  is_mister_white: boolean;
  word: string | null;
  survived: boolean | null;
  votes_received: number | null;
}

export interface GameMessage {
  player: string;
  type: MessageType;
  content: string;
  round: number;
  phase: string;
  timestamp: string;
}

export interface GameResponse {
  game_id: string;
  status: GameStatus;
  phase: GamePhase | null;
  created_at: string;
  updated_at: string;
  models: ModelConfig[];
  players: PlayerInfo[] | null;
  messages: GameMessage[] | null;
  winner_side: WinnerSide | null;
  eliminated_player: string | null;
  mister_white_player: string | null;
  secret_word: string | null;
  vote_counts: Record<string, number> | null;
  error: string | null;
}

export interface GameEvent<T = any> {
  event_type: EventType;
  data: T;
  timestamp: string;
}

export interface ConnectedEvent {
  game_id: string;
  status: string;
  phase: string | null;
}

export interface PhaseChangeEvent {
  phase: GamePhase;
  message: string;
}

export interface MessageEvent {
  player: string;
  type: MessageType;
  content: string;
  round: number;
  phase: string;
}

export interface DiscussionRoundEvent {
  round: number;
  message: string;
}

export interface GameCompleteEvent {
  winner_side: WinnerSide;
  secret_word: string;
  mister_white_player: string;
  eliminated_player: string;
  vote_counts: Record<string, number>;
}

export interface ErrorEvent {
  message: string;
}

export interface GameListResponse {
  games: GameResponse[];
  total: number;
}

export interface HealthResponse {
  status: "healthy" | "unhealthy";
  version: string;
  timestamp: string;
}

// Available model configurations
export const OPENAI_MODELS = [
  { value: "gpt-4o-mini", label: "GPT-4o Mini (Recommended)", recommended: true },
  { value: "gpt-4o", label: "GPT-4o" },
  { value: "gpt-4-turbo", label: "GPT-4 Turbo" },
  { value: "gpt-4", label: "GPT-4" },
  { value: "gpt-3.5-turbo", label: "GPT-3.5 Turbo" },
] as const;

export const MISTRAL_MODELS = [
  { value: "mistral-small-latest", label: "Mistral Small (Recommended)", recommended: true },
  { value: "mistral-medium-latest", label: "Mistral Medium" },
  { value: "mistral-large-latest", label: "Mistral Large" },
  { value: "mistral-tiny", label: "Mistral Tiny" },
  { value: "open-mistral-7b", label: "Open Mistral 7B" },
  { value: "open-mixtral-8x7b", label: "Open Mixtral 8x7B" },
  { value: "open-mixtral-8x22b", label: "Open Mixtral 8x22B" },
] as const;
