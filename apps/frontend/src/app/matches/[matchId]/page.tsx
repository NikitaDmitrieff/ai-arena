"use client";

import React from "react";
import { useParams } from "next/navigation";
import Button from "@/components/ui/Button";
import {
  fetchEventsSince,
  getMatch,
  updateMatchStatus,
  watchMatchEvents,
} from "@/services/matchService";
import type { Match, MatchEvent } from "@/lib/types";

export default function MatchViewerPage() {
  const params = useParams();
  const matchId = String(params?.["matchId"] ?? "");
  const [match, setMatch] = React.useState<Match | null>(null);
  const [events, setEvents] = React.useState<MatchEvent[]>([]);
  const [lastSeq, setLastSeq] = React.useState<number>(0);
  const [loading, setLoading] = React.useState(true);
  const [statusUpdating, setStatusUpdating] = React.useState<
    null | "paused" | "running" | "aborted"
  >(null);

  React.useEffect(() => {
    let unsub: (() => void) | null = null;
    let mounted = true;

    const bootstrap = async () => {
      try {
        const m = await getMatch(matchId);
        if (!mounted) return;
        setMatch(m);
        setLoading(false);
      } catch (e) {
        setLoading(false);
      }

      const sub = watchMatchEvents(matchId, (evt) => {
        setEvents((prev) => {
          if (prev.some((p) => p.seq === evt.seq)) return prev; // dedupe
          const next = [...prev, evt].sort((a, b) => a.seq - b.seq);
          setLastSeq(next[next.length - 1]?.seq ?? 0);
          return next;
        });
      });
      unsub = sub.unsubscribe;
    };

    bootstrap();

    const onReconnect = async () => {
      if (!matchId) return;
      const missing = await fetchEventsSince(matchId, lastSeq);
      if (missing.length) {
        setEvents((prev) => {
          const merged = [...prev, ...missing]
            .filter((v, i, a) => a.findIndex((x) => x.seq === v.seq) === i)
            .sort((a, b) => a.seq - b.seq);
          setLastSeq(merged[merged.length - 1]?.seq ?? lastSeq);
          return merged;
        });
      }
    };

    const visHandler = () => {
      if (document.visibilityState === "visible") onReconnect();
    };
    document.addEventListener("visibilitychange", visHandler);

    return () => {
      mounted = false;
      document.removeEventListener("visibilitychange", visHandler);
      unsub?.();
    };
  }, [matchId, lastSeq]);

  const setStatus = async (status: "paused" | "running" | "aborted") => {
    setStatusUpdating(status);
    try {
      const updated = await updateMatchStatus(matchId, status);
      setMatch(updated);
    } finally {
      setStatusUpdating(null);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-pixel text-lg">Match {matchId}</h1>
          <p className="text-sm text-neutral-600">Status: {match?.status ?? "unknown"}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setStatus("paused")}
            disabled={statusUpdating !== null}
            variant="soft"
          >
            Pause
          </Button>
          <Button
            onClick={() => setStatus("running")}
            disabled={statusUpdating !== null}
            variant="soft"
          >
            Resume
          </Button>
          <Button
            onClick={() => setStatus("aborted")}
            disabled={statusUpdating !== null}
            className="bg-red-600 hover:bg-red-500"
          >
            Abort
          </Button>
        </div>
      </header>

      <section className="rounded-lg border border-neutral-200 p-5 min-h-[240px] flex items-center justify-center text-neutral-500">
        Game UI will mount here
      </section>

      <section className="rounded-lg border border-neutral-200 p-5">
        <h2 className="font-pixel text-xs mb-3">Timeline</h2>
        {loading ? (
          <p className="text-sm text-neutral-600">Loading…</p>
        ) : events.length === 0 ? (
          <p className="text-sm text-neutral-600">No events yet.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {events.map((e) => (
              <li key={e.seq} className="flex items-start gap-3">
                <span className="text-[10px] text-neutral-500 mt-1">#{e.seq}</span>
                <div>
                  <div className="text-neutral-800 font-medium">{e.type}</div>
                  <div className="text-neutral-600">
                    <time dateTime={e.created_at}>
                      {new Date(e.created_at).toLocaleTimeString()}
                    </time>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
