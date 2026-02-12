"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { GameResponse, PlayerInfo, GameMessage } from "@/lib/types/mrwhite";
import "@/styles/mrwhite-canvas.css";

interface MrWhiteCanvasProps {
  game: GameResponse;
}

interface SpeechBubble {
  text: string;
  timestamp: number;
  opacity: number;
}

interface Character {
  name: string;
  x: number;
  y: number;
  direction: string;
  sprites: {
    face: HTMLImageElement | null;
    "top-left": HTMLImageElement | null;
    "top-right": HTMLImageElement | null;
    "bot-left": HTMLImageElement | null;
    "bot-right": HTMLImageElement | null;
  };
  speechBubbles: SpeechBubble[];
  playerInfo: PlayerInfo;
}

export function MrWhiteCanvas({ game }: MrWhiteCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const charactersRef = useRef<Map<string, Character>>(new Map());
  const overlayImageRef = useRef<HTMLImageElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const processedMessageCountRef = useRef(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [charactersInitialized, setCharactersInitialized] = useState(false);

  const CANVAS_WIDTH = 1200;
  const CANVAS_HEIGHT = 800;
  const BUBBLE_DURATION = 5000; // 5 seconds
  const MESSAGE_DELAY = 500; // 500ms between messages
  const MAX_BUBBLES = 5;

  // Load overlay image
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      overlayImageRef.current = img;
      setIsLoaded(true);
    };
    img.onerror = () => {
      console.log("Overlay image not found, continuing without it");
      setIsLoaded(true);
    };
    img.src = "/assets/mrwhite/overlay.png";
  }, []);

  // Load sprite images for a character
  const loadCharacterSprites = useCallback(
    async (characterName: string, spriteIndex: number): Promise<Character["sprites"]> => {
      const spriteNames = ["face", "top-left", "top-right", "bot-left", "bot-right"];
      const spriteName = spriteNames[spriteIndex % spriteNames.length];

      const sprites: Character["sprites"] = {
        face: null,
        "top-left": null,
        "top-right": null,
        "bot-left": null,
        "bot-right": null,
      };

      // Load all sprite directions
      for (const dir of spriteNames) {
        const img = new Image();
        await new Promise<void>((resolve) => {
          img.onload = () => {
            sprites[dir as keyof Character["sprites"]] = img;
            resolve();
          };
          img.onerror = () => {
            console.error(`Failed to load sprite: ${dir}`);
            resolve();
          };
          img.src = `/assets/mrwhite/sprites/${dir}.png`;
        });
      }

      return sprites;
    },
    []
  );

  // Initialize characters when players are available
  useEffect(() => {
    console.log("[Canvas] Players effect triggered:", {
      hasPlayers: !!game.players,
      playerCount: game.players?.length || 0,
      gameStatus: game.status,
      gamePhase: game.phase,
    });

    if (!game.players || game.players.length === 0) {
      console.log("[Canvas] No players yet, waiting...");
      return;
    }

    console.log(
      "[Canvas] Initializing characters for players:",
      game.players.map((p) => p.name)
    );

    const initializeCharacters = async () => {
      const characters = new Map<string, Character>();
      const playerCount = game.players!.length;
      const centerX = CANVAS_WIDTH / 2;
      const centerY = CANVAS_HEIGHT / 2;
      const radius = Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) * 0.3;

      for (let i = 0; i < playerCount; i++) {
        const player = game.players![i];
        if (!player) continue;

        // Arrange in a semi-circle arc
        const angle = Math.PI - (Math.PI / (playerCount + 1)) * (i + 1);
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle) * 0.6 + 100; // Compress Y axis

        console.log(`[Canvas] Loading sprites for player ${i}: ${player.name}`);
        const sprites = await loadCharacterSprites(player.name, i);

        characters.set(player.name, {
          name: player.name,
          x,
          y,
          direction: i % 2 === 0 ? "bot-right" : "bot-left",
          sprites,
          speechBubbles: [],
          playerInfo: player,
        });
      }

      charactersRef.current = characters;
      console.log("[Canvas] Characters initialized:", Array.from(characters.keys()));
      setIsLoaded(true);
      setCharactersInitialized(true);
    };

    initializeCharacters();
  }, [game.players, loadCharacterSprites]);

  // Add speech bubble to a character
  const addSpeechBubble = useCallback(
    (playerName: string, text: string) => {
      console.log(
        `[Canvas] addSpeechBubble called for ${playerName}:`,
        text.substring(0, 50) + "..."
      );
      console.log(`[Canvas] Characters available:`, Array.from(charactersRef.current.keys()));

      const character = charactersRef.current.get(playerName);
      if (!character) {
        console.error(`[Canvas] Character "${playerName}" not found! Cannot add speech bubble.`);
        return;
      }

      console.log(
        `[Canvas] Adding bubble to ${playerName}, current bubbles: ${character.speechBubbles.length}`
      );

      const bubble: SpeechBubble = {
        text,
        timestamp: Date.now(),
        opacity: 1,
      };

      // Set character to face forward when speaking
      character.direction = "face";

      // Add bubble to front of array (newest first)
      character.speechBubbles.unshift(bubble);

      // Limit number of bubbles
      if (character.speechBubbles.length > MAX_BUBBLES) {
        character.speechBubbles = character.speechBubbles.slice(0, MAX_BUBBLES);
      }

      // Remove bubble after duration and restore direction
      setTimeout(() => {
        const index = character.speechBubbles.indexOf(bubble);
        if (index > -1) {
          character.speechBubbles.splice(index, 1);
        }
        // Return to previous direction if no more bubbles
        if (character.speechBubbles.length === 0) {
          const playerIndex = game.players?.findIndex((p) => p.name === playerName) ?? 0;
          character.direction = playerIndex % 2 === 0 ? "bot-right" : "bot-left";
        }
      }, BUBBLE_DURATION);
    },
    [game.players]
  );

  // Process new messages with delays
  useEffect(() => {
    console.log("[Canvas] Messages effect triggered:", {
      totalMessages: game.messages?.length || 0,
      processedCount: processedMessageCountRef.current,
      charactersInitialized: charactersInitialized,
      charactersCount: charactersRef.current.size,
    });

    if (!charactersInitialized) {
      console.log("[Canvas] Characters not initialized yet, waiting...");
      return;
    }

    if (!game.messages || game.messages.length === 0) {
      console.log("[Canvas] No messages yet");
      return;
    }

    const newMessages = game.messages.slice(processedMessageCountRef.current);
    if (newMessages.length === 0) {
      console.log("[Canvas] No new messages to process");
      return;
    }

    console.log(
      `[Canvas] Processing ${newMessages.length} new messages:`,
      newMessages.map((m) => `${m.player}: ${m.content.substring(0, 30)}...`)
    );

    newMessages.forEach((message, index) => {
      setTimeout(() => {
        console.log(
          `[Canvas] [Delayed ${index * MESSAGE_DELAY}ms] Processing message from ${message.player}`
        );
        addSpeechBubble(message.player, message.content);
        processedMessageCountRef.current++;
      }, index * MESSAGE_DELAY);
    });
  }, [game.messages, addSpeechBubble, charactersInitialized]);

  // Drawing functions adapted from Agora game.js

  const drawSpeechBubble = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      text: string,
      x: number,
      y: number,
      opacity: number,
      isNewest: boolean
    ) => {
      const padding = 12;
      const maxWidth = 300;
      const fontSize = 18;
      const lineHeight = fontSize * 1.3;
      const radius = 10;

      ctx.font = `${fontSize}px Arial`;
      const words = text.split(" ");
      const lines: string[] = [];
      let currentLine = "";

      // Word wrap
      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const metrics = ctx.measureText(testLine);

        if (metrics.width > maxWidth && currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }
      lines.push(currentLine);

      // Calculate bubble dimensions
      const bubbleHeight = lines.length * lineHeight + padding * 2;
      let bubbleWidth = 0;

      for (const line of lines) {
        const metrics = ctx.measureText(line);
        bubbleWidth = Math.max(bubbleWidth, metrics.width);
      }
      bubbleWidth += padding * 2;

      const bubbleX = x - bubbleWidth / 2;
      const bubbleY = y - bubbleHeight;

      ctx.globalAlpha = opacity;

      // Draw bubble background
      ctx.fillStyle = "white";
      ctx.strokeStyle = "#333";
      ctx.lineWidth = 2;

      // Bubble with rounded corners
      ctx.beginPath();
      ctx.moveTo(bubbleX + radius, bubbleY);
      ctx.lineTo(bubbleX + bubbleWidth - radius, bubbleY);
      ctx.quadraticCurveTo(bubbleX + bubbleWidth, bubbleY, bubbleX + bubbleWidth, bubbleY + radius);
      ctx.lineTo(bubbleX + bubbleWidth, bubbleY + bubbleHeight - radius);
      ctx.quadraticCurveTo(
        bubbleX + bubbleWidth,
        bubbleY + bubbleHeight,
        bubbleX + bubbleWidth - radius,
        bubbleY + bubbleHeight
      );

      // Draw tail for newest bubble only
      if (isNewest) {
        ctx.lineTo(x + 10, bubbleY + bubbleHeight);
        ctx.lineTo(x, bubbleY + bubbleHeight + 10);
        ctx.lineTo(x - 10, bubbleY + bubbleHeight);
      }

      ctx.lineTo(bubbleX + radius, bubbleY + bubbleHeight);
      ctx.quadraticCurveTo(
        bubbleX,
        bubbleY + bubbleHeight,
        bubbleX,
        bubbleY + bubbleHeight - radius
      );
      ctx.lineTo(bubbleX, bubbleY + radius);
      ctx.quadraticCurveTo(bubbleX, bubbleY, bubbleX + radius, bubbleY);
      ctx.closePath();

      ctx.fill();
      ctx.stroke();

      // Draw text
      ctx.fillStyle = "#000";
      ctx.font = `${fontSize}px Arial`;
      lines.forEach((line, lineIndex) => {
        const textX = bubbleX + padding;
        const textY = bubbleY + padding + lineIndex * lineHeight + fontSize * 0.75;
        ctx.fillText(line, textX, textY);
      });

      ctx.globalAlpha = 1;

      return { bubbleWidth, bubbleHeight, bubbleX, bubbleY };
    },
    []
  );

  const drawCharacter = useCallback((ctx: CanvasRenderingContext2D, character: Character) => {
    const sprite = character.sprites[character.direction as keyof Character["sprites"]];
    if (!sprite) return;

    const spriteScale = 0.25; // Larger than Agora for visibility
    const drawWidth = sprite.width * spriteScale;
    const drawHeight = sprite.height * spriteScale;

    ctx.drawImage(
      sprite,
      character.x - drawWidth / 2,
      character.y - drawHeight / 2,
      drawWidth,
      drawHeight
    );
  }, []);

  const drawNameTag = useCallback((ctx: CanvasRenderingContext2D, character: Character) => {
    const fontSize = 14;
    const padding = 6;
    const radius = 3;

    ctx.font = `bold ${fontSize}px 'Sora', sans-serif`;
    const metrics = ctx.measureText(character.name);
    const tagWidth = metrics.width + padding * 2;
    const tagHeight = fontSize + padding * 2;

    const tagX = character.x - tagWidth / 2;
    const tagY = character.y + 60; // Below character

    // Shadow
    ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
    ctx.beginPath();
    ctx.roundRect(tagX + 2, tagY + 2, tagWidth, tagHeight, radius);
    ctx.fill();

    // Background
    ctx.fillStyle = "rgba(255, 255, 255, 1)";
    ctx.strokeStyle = "rgba(0, 0, 0, 0.5)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(tagX, tagY, tagWidth, tagHeight, radius);
    ctx.fill();
    ctx.stroke();

    // Text
    ctx.fillStyle = "#000";
    ctx.fillText(character.name, tagX + padding, tagY + padding + fontSize * 0.75);
  }, []);

  // Main render function
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw overlay background
    if (overlayImageRef.current) {
      ctx.globalAlpha = 0.8;
      ctx.drawImage(overlayImageRef.current, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.globalAlpha = 1;
    }

    // Get all characters sorted by Y position for depth
    const characters = Array.from(charactersRef.current.values()).sort((a, b) => a.y - b.y);

    // Draw characters and name tags
    for (const character of characters) {
      drawCharacter(ctx, character);
      drawNameTag(ctx, character);
    }

    // Draw all speech bubbles with collision detection
    const allBubbles: Array<{
      character: Character;
      bubble: SpeechBubble;
      index: number;
    }> = [];

    for (const character of characters) {
      character.speechBubbles.forEach((bubble, index) => {
        allBubbles.push({ character, bubble, index });
      });
    }

    // Track occupied regions
    const occupiedRegions: Array<{ x: number; y: number; width: number; height: number }> = [];

    // Sort bubbles by character Y position for depth
    allBubbles.sort((a, b) => a.character.y - b.character.y);

    for (const { character, bubble, index } of allBubbles) {
      const age = Date.now() - bubble.timestamp;
      const fadeStart = BUBBLE_DURATION - 1000;
      let opacity = 1;
      if (age > fadeStart) {
        opacity = Math.max(0, 1 - (age - fadeStart) / 1000);
      }

      let bubbleY = character.y - 85 - index * 80; // Stack vertically
      const isNewest = index === 0;

      // Simple collision avoidance - move up if overlapping
      let adjusted = true;
      while (adjusted) {
        adjusted = false;
        for (const region of occupiedRegions) {
          if (Math.abs(character.x - region.x) < 200 && Math.abs(bubbleY - region.y) < 80) {
            bubbleY -= 85;
            adjusted = true;
            break;
          }
        }
      }

      const result = drawSpeechBubble(ctx, bubble.text, character.x, bubbleY, opacity, isNewest);

      occupiedRegions.push({
        x: character.x,
        y: bubbleY,
        width: result.bubbleWidth,
        height: result.bubbleHeight,
      });
    }
  }, [drawCharacter, drawNameTag, drawSpeechBubble]);

  // Animation loop
  useEffect(() => {
    if (!isLoaded) return;

    const animate = () => {
      render();
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isLoaded, render]);

  return (
    <div className="mrwhite-canvas-container">
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="mrwhite-game-canvas"
      />
    </div>
  );
}
