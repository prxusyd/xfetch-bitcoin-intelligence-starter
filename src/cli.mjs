import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { loadConfig } from "./config.mjs";
import { buildRadar, renderConsoleSummary } from "./radar.mjs";
import { fetchEnrichedSearch, XfetchRequestError } from "./xfetch.mjs";

async function main() {
  const config = loadConfig();
  const body = await fetchEnrichedSearch(config);
  const radar = buildRadar({ body, query: config.query });

  await mkdir(dirname(config.outputPath), { recursive: true });
  await writeFile(config.outputPath, `${JSON.stringify(radar, null, 2)}\n`, "utf8");

  console.log(renderConsoleSummary(radar));
  console.log(`\nSaved JSON: ${config.outputPath}`);
}

main().catch((error) => {
  if (error instanceof XfetchRequestError) {
    const code = error.code ? ` (${error.code})` : "";
    console.error(`Request failed${code}: ${error.message}`);
    if (error.helpUrl) console.error(`Next step: ${error.helpUrl}`);
  } else {
    console.error(error instanceof Error ? error.message : String(error));
  }
  process.exitCode = 1;
});
