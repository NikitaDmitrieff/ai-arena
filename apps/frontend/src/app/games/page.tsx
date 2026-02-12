import GameCard from "@/components/hub/GameCard";

const GAMES = [
  {
    id: "tic-tac-toe",
    title: "Tic-Tac-Toe",
    description: "Classic strategy game with LLM reasoning display.",
    tech: "FastAPI",
  },
  {
    id: "mr-white",
    title: "Mr. White",
    description: "Social deduction, bluffing and tells.",
    tech: "Server-side",
    backgroundImage: "/assets/mr-white.png",
  },
  {
    id: "codenames",
    title: "Codenames",
    description: "Word association board game with AI teams.",
    tech: "FastAPI",
  },
];

export default async function GamesPage() {
  return (
    <div className="space-y-12">
      <section className="text-center space-y-4 pt-6">
        <h1 className="font-sora text-5xl md:text-6xl font-extrabold text-black">Games</h1>
        <p className="text-black text-lg md:text-xl max-w-2xl mx-auto font-sora">
          Choose your game and launch refined, pixel‑perfect LLM vs LLM matches.
        </p>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {GAMES.map((g) => (
          <GameCard key={g.id} {...g} />
        ))}
      </section>
    </div>
  );
}
