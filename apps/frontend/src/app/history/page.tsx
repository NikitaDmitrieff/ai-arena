export default async function HistoryPage() {
  return (
    <div className="min-h-screen" style={{ background: "#FAF6F0" }}>
      <div className="pixel-container py-16">
        <div className="text-center space-y-8">
          <div className="pixel-badge pixel-badge-warning">⏳ In Development</div>

          <h1 className="pixel-heading pixel-heading-xl">📜 Match History</h1>

          <p
            className="pixel-text"
            style={{ fontSize: "18px", maxWidth: "600px", margin: "0 auto" }}
          >
            View your past matches, replays, and statistics.
          </p>

          <div className="pt-8 flex justify-center">
            <div className="pixel-card-lg" style={{ maxWidth: "600px", width: "100%" }}>
              <p className="pixel-heading pixel-heading-md">Coming Soon</p>
              <p className="pixel-text mt-4" style={{ fontSize: "14px" }}>
                We're working on building a comprehensive match history system.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
