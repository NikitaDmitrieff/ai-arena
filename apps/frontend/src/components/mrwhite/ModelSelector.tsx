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
    <div className="space-y-6">
      {/* Model Selection */}
      <div className="pixel-card">
        <h3 className="pixel-heading pixel-heading-sm mb-4">Add Player Models</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Provider Selection */}
          <div>
            <label className="block text-sm pixel-text mb-2" style={{ fontWeight: 700 }}>
              Provider
            </label>
            <select
              value={provider}
              onChange={(e) => handleProviderChange(e.target.value as Provider)}
              className="pixel-select"
            >
              <option value="openai">OpenAI</option>
              <option value="mistral">Mistral AI</option>
            </select>
          </div>

          {/* Model Selection */}
          <div>
            <label className="block text-sm pixel-text mb-2" style={{ fontWeight: 700 }}>
              Model
            </label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="pixel-select"
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
          className="w-full pixel-btn"
        >
          {canAddMore ? "Add Model" : `Maximum ${maxModels} Players`}
        </button>
      </div>

      {/* Selected Models List */}
      <div className="pixel-card">
        <div className="flex justify-between items-center mb-4">
          <h3 className="pixel-heading pixel-heading-sm" style={{ margin: 0 }}>
            Selected Players ({selectedModels.length}/{maxModels})
          </h3>
          {!hasEnough && (
            <span className="pixel-badge pixel-badge-warning">
              Min {minModels} players
            </span>
          )}
        </div>

        {selectedModels.length === 0 ? (
          <p className="pixel-text text-center py-8" style={{ opacity: 0.5 }}>
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
                  className="pixel-panel flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div
                      style={{
                        width: "36px",
                        height: "36px",
                        border: "2px solid #000",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: "bold",
                        fontSize: "16px",
                        color: "#fff",
                        background: m.provider === "openai" ? "#4ECDC4" : "#FF6B6B",
                      }}
                    >
                      {m.provider === "openai" ? "O" : "M"}
                    </div>
                    <div>
                      <p className="pixel-text text-sm" style={{ fontWeight: 700 }}>
                        {m.model}
                      </p>
                      <p className="pixel-text text-xs capitalize" style={{ opacity: 0.6 }}>
                        {m.provider}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveModel(index)}
                    className="pixel-btn pixel-btn-danger pixel-btn-sm"
                  >
                    Remove
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
