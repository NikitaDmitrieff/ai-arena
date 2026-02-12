"use client";

import React, { useState } from "react";
import type { PlayerConfig } from "@/lib/types/tictactoe";
import { AVAILABLE_MODELS, DEFAULT_PLAYER_CONFIG } from "@/lib/types/tictactoe";

interface PlayerConfigFormProps {
  onSubmit: (playerX: PlayerConfig, playerO: PlayerConfig) => void;
  loading?: boolean;
}

/**
 * Form for configuring both players (X and O)
 * Allows choosing between LLM and random players
 */
export default function PlayerConfigForm({ onSubmit, loading = false }: PlayerConfigFormProps) {
  const [playerX, setPlayerX] = useState<PlayerConfig>({ ...DEFAULT_PLAYER_CONFIG });
  const [playerO, setPlayerO] = useState<PlayerConfig>({ ...DEFAULT_PLAYER_CONFIG });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(playerX, playerO);
  };

  const updatePlayerX = (updates: Partial<PlayerConfig>) => {
    setPlayerX((prev) => ({ ...prev, ...updates }));
  };

  const updatePlayerO = (updates: Partial<PlayerConfig>) => {
    setPlayerO((prev) => ({ ...prev, ...updates }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Player X Configuration */}
        <div className="pixel-panel pixel-card-red">
          <h3 className="pixel-heading pixel-heading-sm" style={{ color: "#FF6B6B" }}>
            ⚔️ Player X (Red)
          </h3>

          <div className="space-y-4 mt-4">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={playerX.use_llm}
                onChange={(e) => updatePlayerX({ use_llm: e.target.checked })}
                className="pixel-checkbox"
              />
              <span className="text-sm pixel-text">Use LLM</span>
            </label>

            {playerX.use_llm && (
              <div className="space-y-3 pl-7" style={{ borderLeft: "3px solid #FF6B6B" }}>
                <div>
                  <label className="block text-sm pixel-text mb-1">Provider</label>
                  <select
                    value={playerX.provider}
                    onChange={(e) =>
                      updatePlayerX({
                        provider: e.target.value as "openai" | "mistral",
                        model: AVAILABLE_MODELS[e.target.value as "openai" | "mistral"][0],
                      })
                    }
                    className="pixel-select"
                  >
                    <option value="openai">OpenAI</option>
                    <option value="mistral">Mistral</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm pixel-text mb-1">Model</label>
                  <select
                    value={playerX.model}
                    onChange={(e) => updatePlayerX({ model: e.target.value })}
                    className="pixel-select"
                  >
                    {AVAILABLE_MODELS[playerX.provider].map((model) => (
                      <option key={model} value={model}>
                        {model}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm pixel-text mb-1">
                    Temperature: {playerX.temperature.toFixed(1)}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.1"
                    value={playerX.temperature}
                    onChange={(e) => updatePlayerX({ temperature: parseFloat(e.target.value) })}
                    className="pixel-range"
                  />
                  <div className="flex justify-between text-xs pixel-text mt-1">
                    <span>Deterministic</span>
                    <span>Creative</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Player O Configuration */}
        <div className="pixel-panel pixel-card-blue">
          <h3 className="pixel-heading pixel-heading-sm" style={{ color: "#4ECDC4" }}>
            🛡️ Player O (Blue)
          </h3>

          <div className="space-y-4 mt-4">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={playerO.use_llm}
                onChange={(e) => updatePlayerO({ use_llm: e.target.checked })}
                className="pixel-checkbox"
              />
              <span className="text-sm pixel-text">Use LLM</span>
            </label>

            {playerO.use_llm && (
              <div className="space-y-3 pl-7" style={{ borderLeft: "3px solid #4ECDC4" }}>
                <div>
                  <label className="block text-sm pixel-text mb-1">Provider</label>
                  <select
                    value={playerO.provider}
                    onChange={(e) =>
                      updatePlayerO({
                        provider: e.target.value as "openai" | "mistral",
                        model: AVAILABLE_MODELS[e.target.value as "openai" | "mistral"][0],
                      })
                    }
                    className="pixel-select"
                  >
                    <option value="openai">OpenAI</option>
                    <option value="mistral">Mistral</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm pixel-text mb-1">Model</label>
                  <select
                    value={playerO.model}
                    onChange={(e) => updatePlayerO({ model: e.target.value })}
                    className="pixel-select"
                  >
                    {AVAILABLE_MODELS[playerO.provider].map((model) => (
                      <option key={model} value={model}>
                        {model}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm pixel-text mb-1">
                    Temperature: {playerO.temperature.toFixed(1)}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.1"
                    value={playerO.temperature}
                    onChange={(e) => updatePlayerO({ temperature: parseFloat(e.target.value) })}
                    className="pixel-range"
                  />
                  <div className="flex justify-between text-xs pixel-text mt-1">
                    <span>Deterministic</span>
                    <span>Creative</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <button type="submit" disabled={loading} className="w-full pixel-btn pixel-btn-lg">
        {loading ? "Creating Game..." : "🎯 Create New Game"}
      </button>
    </form>
  );
}
