"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import { createMatch } from '@/services/matchService';
import type { Player } from '@/lib/types';

const MODELS = [
  { id: 'gpt-4o', label: 'GPT-4o' },
  { id: 'claude-2', label: 'Claude 2' },
  { id: 'llama-3', label: 'LLaMA 3' },
];

export default function CreateMatchForm({ gameId }: { gameId: string }) {
  const router = useRouter();
  const [modelA, setModelA] = React.useState('gpt-4o');
  const [modelB, setModelB] = React.useState('claude-2');
  const [isPublic, setIsPublic] = React.useState(true);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!modelA || !modelB) {
      setError('Select both models');
      return;
    }
    setLoading(true);
    try {
      const players: Player[] = [
        { id: 'p1', name: 'Model A', model: modelA },
        { id: 'p2', name: 'Model B', model: modelB },
      ];
      const match = await createMatch({ game_id: gameId, players, metadata: { public: isPublic } });
      router.push(`/matches/${match.id}`);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to create match');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <label className="block text-lg">
          <span className="text-black font-medium">Model A</span>
          <select
            value={modelA}
            onChange={(e) => setModelA(e.target.value)}
            className="mt-2 w-full border border-neutral-300 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-accent text-black"
          >
            {MODELS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-lg">
          <span className="text-black font-medium">Model B</span>
          <select
            value={modelB}
            onChange={(e) => setModelB(e.target.value)}
            className="mt-2 w-full border border-neutral-300 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-accent text-black"
          >
            {MODELS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="inline-flex items-center gap-3 text-lg">
        <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} className="w-5 h-5" />
        <span className="text-black font-medium">Public match</span>
      </label>

      {error && <p role="alert" className="text-lg text-red-600">{error}</p>}

      <div className="flex justify-center pt-4">
        <Button type="submit" disabled={loading} aria-busy={loading} aria-live="polite">
          {loading ? 'Starting…' : 'Start match'}
        </Button>
      </div>
    </form>
  );
}
