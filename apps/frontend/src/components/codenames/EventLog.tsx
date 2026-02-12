"use client";

import { motion, AnimatePresence } from "framer-motion";
import { GameEvent } from "@/lib/types/codenames";

interface EventLogProps {
  events: GameEvent[];
  maxHeight?: string;
}

export function EventLog({ events, maxHeight = "400px" }: EventLogProps) {
  const getEventIcon = (eventType: string): string => {
    switch (eventType) {
      case "game_started":
        return "🎮";
      case "turn_started":
        return "▶️";
      case "clue_given":
        return "💭";
      case "guess_made":
        return "🎯";
      case "turn_ended":
        return "⏸️";
      case "game_ended":
        return "🏁";
      default:
        return "📝";
    }
  };


  if (events.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 pixel-card">
        <p className="pixel-text text-sm" style={{ opacity: 0.7 }}>
          No events yet
        </p>
      </div>
    );
  }

  return (
    <div className="pixel-card p-4 overflow-y-auto custom-scrollbar" style={{ maxHeight }}>
      <AnimatePresence initial={false}>
        {events.map((event, index) => (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ delay: index * 0.05 }}
            className="mb-3 pixel-panel"
            style={{
              borderLeft: `3px solid ${
                event.event_type === "game_started"
                  ? "#A8E6CF"
                  : event.event_type === "turn_started"
                    ? "#4ECDC4"
                    : event.event_type === "clue_given"
                      ? "#FFD93D"
                      : event.event_type === "guess_made"
                        ? "#C7CEEA"
                        : event.event_type === "turn_ended"
                          ? "#FFD93D"
                          : event.event_type === "game_ended"
                            ? "#FF6B6B"
                            : "#000"
              }`,
            }}
          >
            <div className="flex items-start gap-3">
              {/* Event Icon */}
              <div className="text-xl mt-0.5">{getEventIcon(event.event_type)}</div>

              {/* Event Content */}
              <div className="flex-1 min-w-0">
                <p className="text-sm pixel-text mb-1" style={{ fontWeight: 600 }}>
                  {event.description}
                </p>

                {/* Additional reasoning if available */}
                {event.data.reasoning && (
                  <p className="text-xs pixel-text italic mt-1" style={{ opacity: 0.7 }}>
                    "{event.data.reasoning}"
                  </p>
                )}

                {/* Timestamp */}
                <p className="text-xs pixel-text mt-1" style={{ opacity: 0.6 }}>
                  {new Date(event.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border: 3px solid #000;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #4ecdc4;
          border: 3px solid #000;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #3fbdb4;
        }
      `}</style>
    </div>
  );
}
