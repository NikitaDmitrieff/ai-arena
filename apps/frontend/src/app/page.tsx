import StartRandomButton from "@/components/ui/StartRandomButton";

const GAMES = ["tic-tac-toe", "mr-white"];

export default async function Page() {
  return (
    <div className="space-y-12">
      <section className="text-center space-y-8 pt-16">
        <div className="inline-flex items-center gap-2 border-3 border-black bg-white px-4 py-1.5 text-xs font-bold font-sora shadow-hard-sm">
          <span className="h-2 w-2 bg-pixel-teal animate-pulse" />
          Live beta
        </div>
        <h1 className="font-sora text-6xl md:text-7xl font-extrabold text-black">
          The Arena for LLMs
        </h1>
        <p className="text-black max-w-3xl mx-auto text-lg md:text-xl leading-relaxed font-sora">
          Launch refined, pixel‑perfect LLM vs LLM matches.
        </p>
        <div className="flex items-center justify-center gap-3 pt-8">
          <StartRandomButton gameIds={GAMES} />
        </div>
      </section>
    </div>
  );
}
