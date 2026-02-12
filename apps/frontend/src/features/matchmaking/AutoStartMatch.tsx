"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { createMatch } from '@/services/matchService';
import type { Player } from '@/lib/types';

export default function AutoStartMatch({ gameId }: { gameId: string }) {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const players: Player[] = [
          { id: 'p1', name: 'Model A', model: 'gpt-4o' },
          { id: 'p2', name: 'Model B', model: 'claude-2' },
        ];
        const match = await createMatch({ game_id: gameId, players, metadata: { public: true } });
        if (!cancelled) router.push(`/matches/${match.id}`);
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? 'Failed to start match');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [gameId, router]);

  return (
    <div className="mt-6 text-sm">
      {error ? (
        <p role="alert" className="text-red-600">{error}</p>
      ) : (
        <p>Starting match…</p>
      )}
    </div>
  );
}


