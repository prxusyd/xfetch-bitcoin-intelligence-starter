import test from "node:test";
import assert from "node:assert/strict";
import { fetchEnrichedSearch, XfetchRequestError } from "../src/xfetch.mjs";

const successBody = {
  data: { tweets: [], authors: [] },
  meta: { credits: { charged: 1, remaining: 999 } }
};

test("fetchEnrichedSearch sends the current /v1 query shape", async () => {
  let capturedUrl;
  let capturedHeaders;
  const body = await fetchEnrichedSearch({
    apiKey: "xf_test",
    apiBaseUrl: "https://api.xfetch.io",
    query: "bitcoin lang:en",
    limit: 20,
    fetchImpl: async (url, init) => {
      capturedUrl = url;
      capturedHeaders = init.headers;
      return { ok: true, status: 200, json: async () => successBody };
    }
  });

  assert.equal(capturedUrl.pathname, "/v1/search/recent/enriched");
  assert.equal(capturedUrl.searchParams.get("query"), "bitcoin lang:en");
  assert.equal(capturedUrl.searchParams.get("limit"), "20");
  assert.equal(capturedUrl.searchParams.has("max_results"), false);
  assert.equal(capturedHeaders.Authorization, "Bearer xf_test");
  assert.equal(body, successBody);
});

test("fetchEnrichedSearch keeps public API errors actionable", async () => {
  await assert.rejects(
    fetchEnrichedSearch({
      apiKey: "xf_test",
      apiBaseUrl: "https://api.xfetch.io",
      query: "bitcoin",
      limit: 20,
      fetchImpl: async () => ({
        ok: false,
        status: 402,
        json: async () => ({
          error: {
            code: "insufficient_credits",
            message: "Not enough credits for this request.",
            help_url: "https://xfetch.io/dashboard/billing"
          }
        })
      })
    }),
    (error) =>
      error instanceof XfetchRequestError &&
      error.status === 402 &&
      error.code === "insufficient_credits" &&
      error.helpUrl === "https://xfetch.io/dashboard/billing"
  );
});
