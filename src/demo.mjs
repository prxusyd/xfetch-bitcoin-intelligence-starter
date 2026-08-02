import { readFile } from "node:fs/promises";
import { buildRadar, renderConsoleSummary } from "./radar.mjs";
import { DEFAULT_QUERY } from "./config.mjs";

const fixtureUrl = new URL("../fixtures/enriched-search.synthetic.json", import.meta.url);
const body = JSON.parse(await readFile(fixtureUrl, "utf8"));
const radar = buildRadar({
  body,
  query: DEFAULT_QUERY,
  generatedAt: "2026-08-02T00:00:00.000Z"
});

console.log(renderConsoleSummary(radar));
console.log("\nDemo mode uses a synthetic fixture and does not call the API.");
