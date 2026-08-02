import test from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_QUERY, loadConfig } from "../src/config.mjs";

test("loadConfig applies bounded Search defaults", () => {
  assert.deepEqual(loadConfig({ XFETCH_API_KEY: "xf_test" }), {
    apiKey: "xf_test",
    apiBaseUrl: "https://api.xfetch.io",
    query: DEFAULT_QUERY,
    limit: 20,
    outputPath: "output/bitcoin-radar.json"
  });
});

test("loadConfig rejects a limit outside the public endpoint contract", () => {
  assert.throws(
    () => loadConfig({ XFETCH_API_KEY: "xf_test", XFETCH_LIMIT: "21" }),
    /integer from 1 to 20/
  );
});
