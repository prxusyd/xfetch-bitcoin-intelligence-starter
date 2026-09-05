# Bitcoin X/Twitter intelligence starter

Turn a recent Bitcoin search into an analyst-ready JSON snapshot with one xfetch call. The starter joins public posts with author profiles, ranks observed engagement, shows usage, and saves a reusable output file.

[See the Bitcoin intelligence workflow](https://xfetch.io/use-cases/bitcoin-social-intelligence?utm_source=github&utm_medium=starter&utm_campaign=bitcoin_search_starter_2026q3&utm_content=readme_top) · [Inspect the Search API](https://xfetch.io/twitter-search-api?utm_source=github&utm_medium=starter&utm_campaign=bitcoin_search_starter_2026q3&utm_content=readme_top)

## What you get

- A real `GET /v1/search/recent/enriched` request.
- Posts and authors joined into one small report.
- Top posts ranked by the sum of observed likes, reposts, replies, and quotes.
- Active authors ranked by posts returned on the current page.
- Credits charged and whether another opaque page is available.
- No runtime dependencies and no scraper to maintain.

## Run it

Requirements: Node.js 20.6 or later and an xfetch API key.

```bash
git clone https://github.com/prxusyd/xfetch-bitcoin-intelligence-starter.git
cd xfetch-bitcoin-intelligence-starter
cp .env.example .env
```

Add your API key to `.env`, then run:

```bash
npm run legacy
```

The command prints a short readable summary and writes `output/bitcoin-radar.json`.

Need a key? [Create one through the Bitcoin workflow](https://xfetch.io/use-cases/bitcoin-social-intelligence?utm_source=github&utm_medium=starter&utm_campaign=bitcoin_search_starter_2026q3&utm_content=readme_quickstart#starter).

## Try the output without a key

```bash
npm run legacy:demo
```

Demo mode uses a clearly synthetic fixture. It makes no network request and spends no credits.

## Configure the radar

Edit `.env`:

```dotenv
XFETCH_API_KEY=xf_replace_me
XFETCH_QUERY=bitcoin min_faves:100 lang:en -filter:replies
XFETCH_LIMIT=20
XFETCH_OUTPUT=output/bitcoin-radar.json
```

`XFETCH_LIMIT` accepts 1–20. The default query removes replies, keeps English posts, and asks for posts with at least 100 likes. Broaden it when a narrow window returns too little data.

Examples:

```dotenv
XFETCH_QUERY=(bitcoin OR btc) lang:en -filter:replies
XFETCH_QUERY="bitcoin mining" min_faves:20 lang:en
XFETCH_QUERY=$BTC min_retweets:25 lang:en -filter:replies
```

## Output shape

```json
{
  "generated_at": "2026-08-02T00:00:00.000Z",
  "query": "bitcoin min_faves:100 lang:en -filter:replies",
  "fetched_post_count": 3,
  "top_posts": [],
  "active_authors": [],
  "has_next_page": true,
  "usage": {
    "credits_charged": 7,
    "credits_remaining": 993
  }
}
```

Values above are illustrative. A live response determines the returned count and credits charged. See the [workload calculator](https://xfetch.io/pricing?utm_source=github&utm_medium=starter&utm_campaign=bitcoin_search_starter_2026q3&utm_content=readme_pricing) before scheduling frequent searches.

## Test it

```bash
npm test
```

Tests lock the current `/v1` query names, the 1–20 limit, author joins, ranking logic, and public error handling.

## Next build

Use this JSON as input to your own brief, database, notebook, or LLM pipeline. If the job becomes recurring, keep the query and output contract stable before adding scheduling. For account-specific updates, use dashboard-configured [account monitors](https://xfetch.io/twitter-account-monitor?utm_source=github&utm_medium=starter&utm_campaign=bitcoin_search_starter_2026q3&utm_content=readme_monitor) instead of building a polling loop.

This project summarizes public-data observations. It does not produce trading signals or investment advice. xfetch is not affiliated with X.
