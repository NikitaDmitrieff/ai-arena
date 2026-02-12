"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Button from "@/components/ui/Button";
import { AgentConfig, ModelInfo, LLMProvider } from "@/lib/types/codenames";

interface PlayerConfigFormProps {
  availableModels: ModelInfo[];
  onStartGame: (config: {
    red_spymaster: AgentConfig;
    red_operative: AgentConfig;
    blue_spymaster: AgentConfig;
    blue_operative: AgentConfig;
    seed?: number | null;
  }) => void;
  isLoading: boolean;
  onFetchModels: () => void;
}

interface AgentFormState extends AgentConfig {
  provider: LLMProvider;
  model: string;
}

export function PlayerConfigForm({
  availableModels,
  onStartGame,
  isLoading,
  onFetchModels,
}: PlayerConfigFormProps) {
  const [redSpymaster, setRedSpymaster] = useState<AgentFormState>({
    provider: "openai",
    model: "gpt-4o",
    temperature: 0.6,
    max_output_tokens: 320,
  });

  const [redOperative, setRedOperative] = useState<AgentFormState>({
    provider: "openai",
    model: "gpt-4o-mini",
    temperature: 0.5,
    max_output_tokens: 320,
  });

  const [blueSpymaster, setBlueSpymaster] = useState<AgentFormState>({
    provider: "mistral",
    model: "mistral-large-latest",
    temperature: 0.6,
    max_output_tokens: 320,
  });

  const [blueOperative, setBlueOperative] = useState<AgentFormState>({
    provider: "mistral",
    model: "mistral-medium-latest",
    temperature: 0.5,
    max_output_tokens: 320,
  });

  const [seed, setSeed] = useState<string>("");
  const [useRandomSeed, setUseRandomSeed] = useState(true);

  // Fetch models on mount
  useEffect(() => {
    if (availableModels.length === 0) {
      onFetchModels();
    }
  }, [availableModels.length, onFetchModels]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const parsedSeed = useRandomSeed ? null : seed ? parseInt(seed, 10) : null;

    onStartGame({
      red_spymaster: redSpymaster,
      red_operative: redOperative,
      blue_spymaster: blueSpymaster,
      blue_operative: blueOperative,
      seed: parsedSeed,
    });
  };

  const getModelsByProvider = (provider: LLMProvider) => {
    return availableModels.filter((m) => m.provider === provider);
  };

  const AgentSelector = ({
    label,
    value,
    onChange,
    teamColor,
  }: {
    label: string;
    value: AgentFormState;
    onChange: (value: AgentFormState) => void;
    teamColor: "red" | "blue";
  }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="pixel-panel"
      style={{
        borderLeft: `4px solid ${teamColor === "red" ? "#FF6B6B" : "#4ECDC4"}`,
      }}
    >
      <h3
        className="pixel-heading pixel-heading-sm mb-3"
        style={{ color: teamColor === "red" ? "#FF6B6B" : "#4ECDC4" }}
      >
        {label}
      </h3>

      <div className="space-y-3">
        {/* Provider */}
        <div>
          <label className="block text-sm pixel-text mb-1">Provider</label>
          <select
            value={value.provider}
            onChange={(e) => {
              const newProvider = e.target.value as LLMProvider;
              const modelsForProvider = getModelsByProvider(newProvider);
              onChange({
                ...value,
                provider: newProvider,
                model: modelsForProvider[0]?.model || "",
              });
            }}
            className="pixel-select"
          >
            <option value="openai">OpenAI</option>
            <option value="mistral">Mistral</option>
          </select>
        </div>

        {/* Model */}
        <div>
          <label className="block text-sm pixel-text mb-1">Model</label>
          <select
            value={value.model}
            onChange={(e) => onChange({ ...value, model: e.target.value })}
            className="pixel-select"
          >
            {getModelsByProvider(value.provider).map((model) => (
              <option key={model.model} value={model.model}>
                {model.model}
              </option>
            ))}
          </select>
        </div>

        {/* Temperature */}
        <div>
          <label className="block text-sm pixel-text mb-1">Temperature: {value.temperature}</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={value.temperature}
            onChange={(e) => onChange({ ...value, temperature: parseFloat(e.target.value) })}
            className="pixel-range"
          />
        </div>

        {/* Max Tokens */}
        <div>
          <label className="block text-sm pixel-text mb-1">Max Tokens</label>
          <input
            type="number"
            value={value.max_output_tokens}
            onChange={(e) => onChange({ ...value, max_output_tokens: parseInt(e.target.value) })}
            className="pixel-input"
          />
        </div>
      </div>
    </motion.div>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full max-w-6xl mx-auto"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <h2 className="pixel-heading pixel-heading-lg mb-2">Configure AI Agents</h2>
          <p className="pixel-text" style={{ fontSize: "14px" }}>
            Set up 4 AI agents (2 per team) to compete in Codenames
          </p>
        </div>

        {/* Red Team */}
        <div className="space-y-4">
          <h3
            className="pixel-heading pixel-heading-sm flex items-center gap-2"
            style={{ color: "#FF6B6B" }}
          >
            🔴 Red Team
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AgentSelector
              label="Red Spymaster"
              value={redSpymaster}
              onChange={setRedSpymaster}
              teamColor="red"
            />
            <AgentSelector
              label="Red Operative"
              value={redOperative}
              onChange={setRedOperative}
              teamColor="red"
            />
          </div>
        </div>

        {/* Blue Team */}
        <div className="space-y-4">
          <h3
            className="pixel-heading pixel-heading-sm flex items-center gap-2"
            style={{ color: "#4ECDC4" }}
          >
            🔵 Blue Team
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AgentSelector
              label="Blue Spymaster"
              value={blueSpymaster}
              onChange={setBlueSpymaster}
              teamColor="blue"
            />
            <AgentSelector
              label="Blue Operative"
              value={blueOperative}
              onChange={setBlueOperative}
              teamColor="blue"
            />
          </div>
        </div>

        {/* Game Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="pixel-panel-info"
        >
          <h3 className="pixel-heading pixel-heading-sm mb-3">Game Settings</h3>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={useRandomSeed}
                onChange={(e) => setUseRandomSeed(e.target.checked)}
                className="pixel-checkbox"
              />
              <span className="text-sm pixel-text">Random seed</span>
            </label>

            {!useRandomSeed && (
              <input
                type="number"
                value={seed}
                onChange={(e) => setSeed(e.target.value)}
                placeholder="Enter seed number"
                className="pixel-input"
                style={{ width: "auto" }}
              />
            )}
          </div>
        </motion.div>

        {/* Submit Button */}
        <div className="flex justify-center">
          <button
            type="submit"
            disabled={isLoading || availableModels.length === 0}
            className="pixel-btn pixel-btn-lg"
          >
            {isLoading ? "Starting Game..." : "Start Game"}
          </button>
        </div>

        {availableModels.length === 0 && (
          <p className="text-center pixel-text text-sm" style={{ color: "#FFD93D" }}>
            Loading available models...
          </p>
        )}
      </form>
    </motion.div>
  );
}
