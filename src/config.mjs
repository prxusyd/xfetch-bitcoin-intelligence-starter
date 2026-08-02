export const DEFAULT_QUERY = "bitcoin min_faves:100 lang:en -filter:replies";
export const DEFAULT_LIMIT = 20;
export const DEFAULT_OUTPUT = "output/bitcoin-radar.json";
export const DEFAULT_API_BASE_URL = "https://api.xfetch.io";

function optionalText(value) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function parseLimit(value) {
  if (value === undefined || value === "") return DEFAULT_LIMIT;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 20) {
    throw new Error("XFETCH_LIMIT must be an integer from 1 to 20.");
  }
  return parsed;
}

export function loadConfig(env = process.env) {
  const apiKey = optionalText(env.XFETCH_API_KEY);
  if (!apiKey) {
    throw new Error("Set XFETCH_API_KEY in .env before running npm start.");
  }

  return {
    apiKey,
    apiBaseUrl: optionalText(env.XFETCH_API_BASE_URL) ?? DEFAULT_API_BASE_URL,
    query: optionalText(env.XFETCH_QUERY) ?? DEFAULT_QUERY,
    limit: parseLimit(env.XFETCH_LIMIT),
    outputPath: optionalText(env.XFETCH_OUTPUT) ?? DEFAULT_OUTPUT
  };
}
