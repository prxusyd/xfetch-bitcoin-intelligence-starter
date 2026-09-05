# xfetch: two runnable data workflows

Collect a usable report from a topic query or account list. Preview the people and posts, export the full records, and run the same job again to identify newly seen posts.

This extends the [Bitcoin intelligence starter](https://github.com/prxusyd/xfetch-bitcoin-intelligence-starter): the Bitcoin query remains available through `npm start`. Both templates share the same collection engine as the xfetch browser workflow. Node.js 20.6+; no dependency installation or application code required in the downloaded starter.

## See the output first

```sh
npm run demo
npm run demo:accounts
npm test
```

Open `output/demo-topic/report.html` and `output/demo-accounts/report.html`. These are explicitly synthetic examples with simulated charges, duplicate posts and an unavailable author/account. The reported duration measures this local fixture run, not live API latency. From an xfetch source checkout, run `pnpm build:starter` at the repository root first; the download already includes the generated engine.

## Run with your own data

1. Copy `.env.example` to `.env` and set your xfetch API key from the existing dashboard.
2. Edit the query in `config/topic.json`, or the usernames in `config/accounts.json`.
3. Review the post target, request limit and credit budget, then run:

```sh
npm run topic
npm run accounts
# Existing Bitcoin preset:
npm start
```

Open `output/topic/report.html` or `output/accounts/report.html`. No code changes are needed to join authors, follow pages, remove duplicates, or write the exports. The console reports actual collected records, credits and collection duration. Measure sign-in-to-first-export separately before making an onboarding time claim.

## What is delivered

| File | Contents |
| --- | --- |
| `report.html` | Standalone readable account and post report; no JavaScript or external assets |
| `report.json` | Full returned post/author fields, run input, cost, timing, stop reason and new post IDs |
| `posts.csv` | All unique posts in this run, full text, author fields and a `record_json` column preserving every original field |
| `authors.csv` | Full author records, including unavailable statuses, with a `record_json` column |
| `new-posts.csv` | Only posts not seen in prior runs of this query/account list; use for append workflows |
| `state/*.json` | Progress, opaque pagination token, dedup history and accounting; no API key |

Missing metrics stay blank/unknown. IDs remain strings in JSON; import CSV ID columns as text in spreadsheets to preserve long numbers. CSV text that could become a spreadsheet formula is prefixed with an apostrophe; JSON retains the exact original text. Public text is HTML-escaped. The preview shows the collected source material; it does not infer sentiment or invent summaries.

## Scope, pagination and cost

- Topic uses enriched recent search and joins authors by ID. `pageSize` stays fixed while following an opaque token. A full page must fit the remaining budget before the next search request is sent.
- Accounts use a profile snapshot followed by Timeline when more posts are needed. The first Timeline page can overlap the snapshot; dedup removes repeated post IDs. Timeline does not accept a page-size limit.
- `maxPosts` is a target, per account for the accounts template. The complete final page is retained, so the target can be exceeded. `maxPages` bounds all HTTP request attempts, including profile calls and rate-limit retries. It is displayed as the request limit in the browser.
- `budgetCredits` caps confirmed charges across the run. Each request sends `x-xfetch-max-credits`; the API checks the actual page cost before debiting. An oversized page returns `409 budget_exceeded`, with no data and no charge for that failed request. Prices come from xfetch's current shared catalog, not a separate starter price table.
- The starter first checks the free `/healthz` capability header. If budget protection is unavailable, it sends no paid request. The budget-capable API must be fully deployed before enabling templates.
- An empty page with no token ends the stream. An empty page with a token can continue within the limits. Repeated tokens stop the run. Protected or unavailable accounts remain in the author output with their status.
- A periodic run collects a bounded snapshot, not a guaranteed complete historical archive. The post target, request limit, changing search results and available pagination all affect coverage. These scheduled reports are distinct from xfetch Monitor webhook delivery.

## Run again or resume

```sh
# A new run starts from the newest data, with a fresh budget and remembered IDs:
npm run topic
# Continue this run's cursor and cumulative budget; raise limits in config if needed:
npm run topic -- --resume
```

Progress is written atomically before and after requests. Across-run dedup remembers the most recent 100,000 post IDs for the same query/account list and search page size. Changing those inputs starts a new history; changing budgets and targets does not. Use separate `--state` files for separate jobs (including Bitcoin versus another topic). `posts.csv` is the current snapshot; append only `new-posts.csv`, using post ID as an additional destination-side uniqueness key.

Press Ctrl+C to stop after the current request. Paid requests are not blindly retried. A known, uncharged rate limit can retry twice with bounded waiting. If a connection is lost or the process crashes with a pending request, the state reserves its possible charge and blocks further runs. Check dashboard Usage, keep the exported report, and explicitly archive/remove that progress file before starting a fresh budget. A malformed paid response records its known charge and cannot automatically resume the same page.

If a `.lock` remains after a hard crash, confirm its recorded process is no longer active before deleting only the lock. Keep the progress JSON; deleting a lock does not resolve an uncertain charge. Do not run the same state on multiple hosts or sync it concurrently. Browser progress can be imported/exported as the same `progress.json` format.

## Schedule it

For a persistent machine, run each live template once, then adapt `schedules/cron.example`. Keep the same absolute state path and `--require-state`; a missing file stops the task. Cron uses the machine timezone. It replaces the latest report files, so archive them separately if you need history.

For GitHub Actions, place this starter at a private repository's root and copy `schedules/github-actions.yml.example` to `.github/workflows/xfetch-reports.yml`. Set `XFETCH_API_KEY` as a repository secret. Review both config files and run manually with `initialize_or_reset=true` once; then opt in by uncommenting the schedule. The workflow serializes runs, restores the immediately previous run's exact state artifact and saves progress even on collection failure. Expired/missing artifacts and interrupted runs fail closed; inspect Usage before an explicit manual reset. Use a new manual run rather than GitHub's Re-run jobs. Artifacts contain queries and collected public data; choose repository access and retention accordingly.

The budgets apply **per run**. Two templates and repeated scheduled runs have separate budgets; this is not a monthly spending cap. Set your frequency accordingly. GitHub's schedule can be delayed and artifacts expire; see [scheduled workflow behavior](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule) and [artifact retention](https://docs.github.com/en/actions/how-tos/writing-workflows/choosing-what-your-workflow-does/storing-and-sharing-data-from-a-workflow).

## Existing Bitcoin starter users

`npm start` now runs the bounded Bitcoin workflow and writes HTML/JSON/CSV into `output/bitcoin/`. Configure it in `config/bitcoin.json`. The original `.env` query/limit settings and `bitcoin-radar.json` format remain available with `npm run legacy`; `npm run legacy:demo` keeps the original offline radar. See [LEGACY.md](LEGACY.md) for that entry point. New scripts use the current budget-protected engine.

The distribution experiment and its existing campaign links remain in [DISTRIBUTION.md](DISTRIBUTION.md). [Open the Bitcoin workflow](https://xfetch.io/use-cases/bitcoin-social-intelligence?utm_source=github&utm_medium=starter&utm_campaign=bitcoin_search_starter_2026q3&utm_content=readme_top) or [try both runnable templates](https://xfetch.io/templates).

Maintainers: `lib/` is generated from the xfetch repository's shared workflow engine. Update the canonical TypeScript and rebuild the starter before copying an update; do not maintain a second engine here.
