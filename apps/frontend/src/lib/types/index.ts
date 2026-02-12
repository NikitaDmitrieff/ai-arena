export type Player = {
  id: string;
  name: string;
  model: string; // e.g., gpt-4o, claude-2
};

export type MatchStatus = 'pending' | 'running' | 'paused' | 'completed' | 'aborted' | 'failed';

export type Match = {
  id: string;
  game_id: string;
  status: MatchStatus;
  players: Player[];
  created_at: string;
  metadata?: Record<string, unknown> | null;
};

export type MatchEvent = {
  id: string;
  match_id: string;
  seq: number;
  type: string;
  payload: Record<string, unknown> | null;
  created_at: string;
};
