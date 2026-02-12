// Codenames Game Type Definitions

export type Team = "RED" | "BLUE";
export type GamePhase = "await_clue" | "await_guess" | "finished";
export type CardType = "RED" | "BLUE" | "NEUTRAL" | "ASSASSIN";
export type LLMProvider = "openai" | "mistral";

// Model Configuration
export interface ModelInfo {
  provider: string;
  model: string;
}

export interface AgentConfig {
  provider: LLMProvider;
  model: string;
  temperature?: number;
  max_output_tokens?: number;
}

// Game Configuration
export interface GameStartRequest {
  red_spymaster: AgentConfig;
  red_operative: AgentConfig;
  blue_spymaster: AgentConfig;
  blue_operative: AgentConfig;
  seed?: number | null;
}

// Game Status
export interface GameStatus {
  game_id: string;
  phase: GamePhase;
  current_team: Team;
  turn_number: number;
  red_remaining: number;
  blue_remaining: number;
  winner: Team | null;
  assassin_revealed: boolean;
}

// Board Card
export interface BoardCard {
  word: string;
  revealed: boolean;
  card_type: CardType | null;
}

// Clue
export interface Clue {
  word: string;
  number: number;
}

// Game State
export interface GameStateResponse {
  game_id: string;
  status: GameStatus;
  board: BoardCard[][]; // 5x5 grid
  last_clue: Clue | null;
}

// WebSocket Event Types
export type WebSocketEventType =
  | "game_state"
  | "game_started"
  | "turn_started"
  | "clue_given"
  | "guess_made"
  | "turn_ended"
  | "game_ended";

export interface WebSocketMessage {
  event_type: WebSocketEventType;
  data: any;
}

// WebSocket Event Data
export interface GameStateEvent {
  game_id: string;
  phase: GamePhase;
  current_team: Team;
  turn_number: number;
  board: BoardCard[][];
  red_remaining: number;
  blue_remaining: number;
  winner: Team | null;
  assassin_revealed: boolean;
}

export interface GameStartedEvent {
  game_id: string;
  starting_team: Team;
  board: BoardCard[][];
  red_cards: number;
  blue_cards: number;
}

export interface TurnStartedEvent {
  turn_number: number;
  team: Team;
  red_remaining: number;
  blue_remaining: number;
}

export interface ClueGivenEvent {
  team: Team;
  clue: string;
  number: number;
  reasoning: string;
  turn_number: number;
}

export interface GuessMadeEvent {
  team: Team;
  word: string;
  card_type: CardType;
  reasoning: string;
  ended_turn: boolean;
  assassin_hit: boolean;
  team_won: Team | null;
  guesses_left: number;
  turn_number: number;
  red_remaining: number;
  blue_remaining: number;
}

export interface TurnEndedEvent {
  team: Team;
  turn_number: number;
  reason: "voluntary";
  reasoning: string;
}

export interface GameEndedEvent {
  winner: Team | null;
  assassin_revealed: boolean;
  total_turns: number;
  red_remaining: number;
  blue_remaining: number;
}

// UI State Types
export interface GameEvent {
  id: string;
  timestamp: number;
  event_type: WebSocketEventType;
  data: any;
  description: string;
}
