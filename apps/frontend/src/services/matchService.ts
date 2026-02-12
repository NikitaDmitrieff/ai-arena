import { supabase, isSupabaseConfigured } from '@/services/supabaseClient';
import type { Match, MatchEvent, Player, MatchStatus } from '@/lib/types';
import type { RealtimePostgresInsertPayload } from '@supabase/supabase-js';

export async function createMatch(input: {
  game_id: string;
  players: Player[];
  metadata?: Record<string, unknown> | null;
}): Promise<Match> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase not configured');
  }
  const { data, error } = await supabase
    .from('matches')
    .insert({ game_id: input.game_id, players: input.players, metadata: input.metadata ?? {}, status: 'pending' })
    .select()
    .single();
  if (error) throw error;
  return data as Match;
}

export async function getMatch(matchId: string): Promise<Match | null> {
  const { data, error } = await supabase.from('matches').select('*').eq('id', matchId).single();
  if (error) throw error;
  return data as Match;
}

export async function updateMatchStatus(matchId: string, status: MatchStatus): Promise<Match> {
  const { data, error } = await supabase.from('matches').update({ status }).eq('id', matchId).select().single();
  if (error) throw error;
  return data as Match;
}

export async function fetchEventsSince(matchId: string, lastSeqExclusive: number): Promise<MatchEvent[]> {
  const { data, error } = await supabase
    .from('match_events')
    .select('*')
    .eq('match_id', matchId)
    .gt('seq', lastSeqExclusive)
    .order('seq', { ascending: true });
  if (error) throw error;
  return (data ?? []) as MatchEvent[];
}

export function watchMatchEvents(
  matchId: string,
  onEvent: (event: MatchEvent) => void,
): { unsubscribe: () => void } {
  const channel = supabase
    .channel(`match_events:${matchId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'match_events', filter: `match_id=eq.${matchId}` },
      (payload: RealtimePostgresInsertPayload<any>) => {
        const record = payload.new as unknown as MatchEvent;
        onEvent(record);
      },
    )
    .subscribe();

  return {
    unsubscribe: () => {
      supabase.removeChannel(channel);
    },
  };
}
