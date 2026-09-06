import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { lockState } from "../src/storage.mjs";
const exec = promisify(execFile);
for (const template of ["topic", "accounts-demo"])
  test(`${template}: runnable CLI, exports and persistent dedup`, async () => {
    const dir = await mkdtemp(join(tmpdir(), "xfetch-starter-"));
    try {
      const args = [
        "src/cli.mjs",
        "--demo",
        "--config",
        `config/${template}.json`,
        "--state",
        join(dir, "progress.json"),
        "--out",
        join(dir, "report")
      ];
      const first = JSON.parse((await exec(process.execPath, args)).stdout);
      assert.ok(first.posts > 0);
      assert.equal(first.synthetic, true);
      const second = JSON.parse(
        (await exec(process.execPath, [...args, "--require-state"])).stdout
      );
      assert.equal(second.newPosts, 0);
      for (const name of [
        "report.html",
        "report.json",
        "posts.csv",
        "authors.csv",
        "new-posts.csv"
      ])
        assert.ok((await readFile(join(dir, "report", name), "utf8")).length > 0);
      const release = await lockState(join(dir, "progress.json"));
      await assert.rejects(exec(process.execPath, args), /run lock exists/);
      await release();
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
test("a schedule cannot silently start without its state", async () => {
  const dir = await mkdtemp(join(tmpdir(), "xfetch-missing-state-"));
  try {
    await assert.rejects(
      exec(process.execPath, [
        "src/cli.mjs",
        "--demo",
        "--require-state",
        "--state",
        join(dir, "missing.json")
      ]),
      /Expected progress is missing/
    );
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("standard API transport paginates without a capability probe and reports actual usage", async () => {
  const { createServer } = await import("node:http");
  const dir = await mkdtemp(join(tmpdir(), "xfetch-http-fixture-"));
  const { writeFile } = await import("node:fs/promises");
  const requests = [];
  const server = createServer((request, response) => {
    response.setHeader("content-type", "application/json");
    requests.push({
      url: request.url,
      auth: request.headers.authorization
    });
    const second = request.url.includes("next_token=");
    const ids = second ? ["2", "3"] : ["1", "2"];
    response.end(
      JSON.stringify({
        data: {
          tweets: ids.map((id) => ({ id, text: `Fixture post ${id}`, author_id: "10" })),
          authors: [{ id: "10", username: "fixture", follower_count: 5 }]
        },
        meta: {
          credits: { charged: 150 },
          ...(!second ? { pagination: { next_token: "opaque-fixture" } } : {})
        }
      })
    );
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  try {
    await writeFile(
      join(dir, "config.json"),
      JSON.stringify({ template: "topic", query: "fixture", pageSize: 2 })
    );
    const args = [
      "src/cli.mjs",
      "--config",
      join(dir, "config.json"),
      "--state",
      join(dir, "state.json"),
      "--out",
      join(dir, "report")
    ];
    const env = {
      ...process.env,
      XFETCH_API_KEY: "local-fixture-key",
      XFETCH_API_BASE_URL: `http://127.0.0.1:${server.address().port}`
    };
    const result = JSON.parse((await exec(process.execPath, args, { env })).stdout);
    assert.equal(result.posts, 3);
    assert.equal(result.credits, 300);
    assert.equal(result.synthetic, false);
    assert.equal(requests.length, 2);
    assert.ok(requests.every((r) => r.url.startsWith("/v1/search/recent/enriched?")));
    assert.ok(requests[1].url.includes("next_token=opaque-fixture"));
    assert.equal(requests[0].auth, "Bearer local-fixture-key");
    const next = JSON.parse((await exec(process.execPath, [...args, "--require-state"], { env })).stdout);
    assert.equal(next.newPosts, 0);
    assert.equal(requests.length, 4);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    await rm(dir, { recursive: true, force: true });
  }
});
