const rawBaseUrl = process.env["NEXT_PUBLIC_ARENA_API_BASE_URL"] ?? "http://localhost:8000";

function getBaseUrl() {
  if (!rawBaseUrl) {
    throw new Error("Arena API base URL is not configured");
  }
  return rawBaseUrl.replace(/\/+$/, "");
}

export type ArenaHealthResponse = {
  status: string;
  [key: string]: unknown;
};

export type ArenaPing = {
  health: ArenaHealthResponse;
  hello: string;
};

export async function fetchArenaPing(signal?: AbortSignal): Promise<ArenaPing> {
  const root = getBaseUrl();

  const [healthResponse, helloResponse] = await Promise.all([
    fetch(`${root}/health`, { signal }),
    fetch(`${root}/hello`, { signal }),
  ]);

  if (!healthResponse.ok) {
    throw new Error(`Arena API health check failed (${healthResponse.status})`);
  }
  if (!helloResponse.ok) {
    throw new Error(`Arena API hello check failed (${helloResponse.status})`);
  }

  const health = (await healthResponse.json()) as ArenaHealthResponse;
  const hello = await helloResponse.text();

  return { health, hello };
}
