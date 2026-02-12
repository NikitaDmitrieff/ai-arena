"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ModelConfig, Provider, OPENAI_MODELS, MISTRAL_MODELS } from "@/lib/types/mrwhite";

interface ModelSelectorProps {
  selectedModels: ModelConfig[];
  onModelsChange: (models: ModelConfig[]) => void;
  minModels?: number;
  maxModels?: number;
}

export function ModelSelector({
  selectedModels,
  onModelsChange,
  minModels = 3,
  maxModels = 10,
}: ModelSelectorProps) {
  const [provider, setProvider] = useState<Provider>("openai");
  const [model, setModel] = useState<string>(OPENAI_MODELS[0].value);

  const handleAddModel = () => {
    if (selectedModels.length >= maxModels) return;

    const newModel: ModelConfig = { provider, model };
    onModelsChange([...selectedModels, newModel]);
  };

  const handleRemoveModel = (index: number) => {
    onModelsChange(selectedModels.filter((_, i) => i !== index));
  };

  const handleProviderChange = (newProvider: Provider) => {
    setProvider(newProvider);
    const models = newProvider === "openai" ? OPENAI_MODELS : MISTRAL_MODELS;
    setModel(models[0].value);
  };

  const currentModels = provider === "openai" ? OPENAI_MODELS : MISTRAL_MODELS;
  const canAddMore = selectedModels.length < maxModels;
  const hasEnough = selectedModels.length >= minModels;

  return (
    <div className="space-y-6" style={{ fontFamily: "'Sora', sans-serif" }}>
      {/* Model Selection */}
      <div className="mrwhite-panel-card">
        <h3 style={{ fontSize: "20px", fontWeight: 800 }}>🎮 Add Player Models</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Provider Selection */}
          <div>
            <label className="block text-sm font-bold mb-2" style={{ color: "#000" }}>
              Provider
            </label>
            <select
              value={provider}
              onChange={(e) => handleProviderChange(e.target.value as Provider)}
              className="w-full"
              style={{
                padding: "8px",
                border: "3px solid #000",
                borderRadius: "0",
                fontSize: "14px",
                background: "white",
                fontFamily: "'Sora', sans-serif",
                fontWeight: 600,
              }}
            >
              <option value="openai">OpenAI</option>
              <option value="mistral">Mistral AI</option>
            </select>
          </div>

          {/* Model Selection */}
          <div>
            <label className="block text-sm font-bold mb-2" style={{ color: "#000" }}>
              Model
            </label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full"
              style={{
                padding: "8px",
                border: "3px solid #000",
                borderRadius: "0",
                fontSize: "14px",
                background: "white",
                fontFamily: "'Sora', sans-serif",
                fontWeight: 600,
              }}
            >
              {currentModels.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={handleAddModel}
          disabled={!canAddMore}
          className="mrwhite-btn w-full"
          style={{
            opacity: !canAddMore ? 0.5 : 1,
            cursor: !canAddMore ? "not-allowed" : "pointer",
          }}
        >
          {canAddMore ? "➕ Add Model" : `Maximum ${maxModels} Players`}
        </button>
      </div>

      {/* Selected Models List */}
      <div className="mrwhite-panel-card">
        <div className="flex justify-between items-center mb-4">
          <h3 style={{ fontSize: "20px", fontWeight: 800, margin: 0 }}>
            👥 Selected Players ({selectedModels.length}/{maxModels})
          </h3>
          {!hasEnough && (
            <span
              className="text-sm font-bold"
              style={{
                color: "#FF6B6B",
                background: "#FFD93D",
                padding: "4px 8px",
                border: "2px solid #000",
              }}
            >
              Minimum {minModels} players required
            </span>
          )}
        </div>

        {selectedModels.length === 0 ? (
          <p style={{ color: "#666", textAlign: "center", padding: "32px 0" }}>
            No models selected. Add at least {minModels} players to start.
          </p>
        ) : (
          <div className="space-y-2">
            <AnimatePresence>
              {selectedModels.map((m, index) => (
                <motion.div
                  key={`${m.provider}-${m.model}-${index}`}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  className="mrwhite-player-item"
                >
                  <div className="mrwhite-player-info">
                    <div className={`mrwhite-player-avatar ${m.provider}`}>
                      {m.provider === "openai" ? "O" : "M"}
                    </div>
                    <div>
                      <p className="mrwhite-player-name">{m.model}</p>
                      <p className="mrwhite-player-model capitalize">{m.provider}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveModel(index)}
                    className="mrwhite-btn danger"
                    style={{
                      width: "auto",
                      padding: "6px 12px",
                      fontSize: "12px",
                    }}
                  >
                    ✕ Remove
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
