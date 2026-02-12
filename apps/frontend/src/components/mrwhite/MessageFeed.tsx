"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GameMessage } from "@/lib/types/mrwhite";

interface MessageFeedProps {
  messages: GameMessage[];
}

const messageColors: Record<string, { border: string; bg: string }> = {
  clue: { border: "#A8E6CF", bg: "#e8f5e9" },
  discussion: { border: "#FFD93D", bg: "#fff9e6" },
  vote: { border: "#FF6B6B", bg: "#ffebee" },
};

export function MessageFeed({ messages }: MessageFeedProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="pixel-card">
      <h3 className="pixel-heading pixel-heading-sm mb-4">Game Feed</h3>

      <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 pixel-scrollbar">
        {messages.length === 0 ? (
          <p className="pixel-text text-center py-8" style={{ opacity: 0.5 }}>
            No messages yet. Waiting for game to start...
          </p>
        ) : (
          <AnimatePresence>
            {messages.map((message, index) => {
              const colors = messageColors[message.type] || {
                border: "#000",
                bg: "#f9f9f9",
              };
              return (
                <motion.div
                  key={`${message.player}-${message.timestamp}-${index}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="pixel-panel"
                  style={{
                    borderLeft: `4px solid ${colors.border}`,
                    background: colors.bg,
                  }}
                >
                  {/* Message Header */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="pixel-text" style={{ fontWeight: 700 }}>
                        {message.player}
                      </span>
                      <span className="pixel-badge pixel-badge-info text-xs capitalize">
                        {message.type}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs pixel-text" style={{ opacity: 0.6 }}>
                      <span>Round {message.round}</span>
                      <span>·</span>
                      <span>
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>

                  {/* Message Content */}
                  <p className="pixel-text text-sm leading-relaxed">
                    {message.content}
                  </p>

                  {/* Phase Badge */}
                  <div className="mt-2">
                    <span className="pixel-badge pixel-badge-warning text-xs capitalize">
                      {message.phase}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
        <div ref={messagesEndRef} />
      </div>

      <style jsx>{`
        .pixel-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .pixel-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border: 3px solid #000;
        }
        .pixel-scrollbar::-webkit-scrollbar-thumb {
          background: #4ecdc4;
          border: 3px solid #000;
        }
        .pixel-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #3fbdb4;
        }
      `}</style>
    </div>
  );
}
