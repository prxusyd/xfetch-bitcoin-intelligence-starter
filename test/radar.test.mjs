import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { buildRadar } from "../src/radar.mjs";

const fixture = JSON.parse(
  await readFile(new URL("../fixtures/enriched-search.synthetic.json", import.meta.url), "utf8")
);

test("buildRadar joins authors and ranks descriptive engagement", () => {
  const radar = buildRadar({
    body: fixture,
    query: "bitcoin",
    generatedAt: "2026-08-02T00:00:00.000Z"
  });

  assert.equal(radar.fetched_post_count, 3);
  assert.equal(radar.top_posts[0].tweet_id, "1001");
  assert.equal(radar.top_posts[0].author.username, "sample_analyst");
  assert.equal(radar.top_posts[0].engagement.total, 64);
  assert.deepEqual(radar.active_authors[0], {
    author_id: "a1",
    username: "sample_analyst",
    name: "Sample Analyst",
    post_count: 2,
    total_engagement: 76
  });
  assert.equal(radar.has_next_page, true);
  assert.deepEqual(radar.usage, { credits_charged: 7, credits_remaining: 993 });
});
