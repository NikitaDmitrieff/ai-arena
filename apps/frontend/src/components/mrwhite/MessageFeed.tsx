"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GameMessage } from "@/lib/types/mrwhite";

interface MessageFeedProps {
  messages: GameMessage[];
}

const messageIcons = {
  clue: "💡",
  discussion: "💬",
  vote: "🗳️",
};

const messageColors = {
  clue: "border-l-green-500 bg-green-900/10",
  discussion: "border-l-yellow-500 bg-yellow-900/10",
  vote: "border-l-red-500 bg-red-900/10",
};

export function MessageFeed({ messages }: MessageFeedProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
      <h3 className="text-xl font-semibold text-white mb-4">Game Feed</h3>

      <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
        {messages.length === 0 ? (
          <p className="text-zinc-500 text-center py-8">
            No messages yet. Waiting for game to start...
          </p>
        ) : (
          <AnimatePresence>
            {messages.map((message, index) => (
              <motion.div
                key={`${message.player}-${message.timestamp}-${index}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`border-l-4 rounded-lg p-4 ${messageColors[message.type]}`}
              >
                {/* Message Header */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{messageIcons[message.type]}</span>
                    <span className="text-white font-semibold">{message.player}</span>
                    <span className="text-xs bg-zinc-800 px-2 py-1 rounded text-zinc-400 capitalize">
                      {message.type}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-zinc-500">
                    <span>Round {message.round}</span>
                    <span>•</span>
                    <span>{new Date(message.timestamp).toLocaleTimeString()}</span>
                  </div>
                </div>

                {/* Message Content */}
                <p className="text-zinc-300 leading-relaxed">{message.content}</p>

                {/* Phase Badge */}
                <div className="mt-2">
                  <span className="text-xs text-zinc-500 capitalize">Phase: {message.phase}</span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Custom Scrollbar Styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #27272a;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #52525b;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #71717a;
        }
      `}</style>
    </div>
  );
}
