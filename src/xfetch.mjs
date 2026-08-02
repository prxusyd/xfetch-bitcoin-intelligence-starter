export class XfetchRequestError extends Error {
  constructor(message, { status, code, helpUrl } = {}) {
    super(message);
    this.name = "XfetchRequestError";
    this.status = status;
    this.code = code;
    this.helpUrl = helpUrl;
  }
}

function assertEnrichedSearchEnvelope(body) {
  const valid =
    body &&
    typeof body === "object" &&
    body.data &&
    Array.isArray(body.data.tweets) &&
    Array.isArray(body.data.authors) &&
    body.meta &&
    body.meta.credits &&
    Number.isFinite(body.meta.credits.charged) &&
    Number.isFinite(body.meta.credits.remaining);

  if (!valid) {
    throw new XfetchRequestError("xfetch returned an unexpected response shape.");
  }
}

export async function fetchEnrichedSearch({
  apiKey,
  apiBaseUrl,
  query,
  limit,
  fetchImpl = globalThis.fetch
}) {
  const url = new URL("/v1/search/recent/enriched", apiBaseUrl);
  url.searchParams.set("query", query);
  url.searchParams.set("limit", String(limit));

  const response = await fetchImpl(url, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: "application/json"
    }
  });

  let body;
  try {
    body = await response.json();
  } catch {
    throw new XfetchRequestError(`xfetch returned HTTP ${response.status} without JSON.`, {
      status: response.status
    });
  }

  if (!response.ok) {
    const publicError = body?.error;
    throw new XfetchRequestError(
      publicError?.message ?? `xfetch request failed with HTTP ${response.status}.`,
      {
        status: response.status,
        code: publicError?.code,
        helpUrl: publicError?.help_url
      }
    );
  }

  assertEnrichedSearchEnvelope(body);
  return body;
}
