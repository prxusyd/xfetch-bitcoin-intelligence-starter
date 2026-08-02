# Distribution kit

This is the launch kit for the `bitcoin_search_starter_2026q3` experiment. Tailor every post to the community; do not cross-post identical copy or present synthetic output as a customer result.

## Measurement contract

Primary outcome: a new, non-owner/Demo signup with a captured source that reaches a first successful REST call within seven days.

Keep these parameters stable:

| Field | Rule | Example |
| --- | --- | --- |
| `utm_source` | Platform or referring partner | `github`, `hackernews`, `reddit`, `devto`, `x` |
| `utm_medium` | Distribution mechanism | `starter`, `community`, `content`, `social`, `referral` |
| `utm_campaign` | One experiment identifier | `bitcoin_search_starter_2026q3` |
| `utm_content` | Exact placement or creative | `readme_top`, `hn_show`, `reddit_dataengineering`, `devto_tutorial`, `x_demo` |

Do not change the campaign value during the 14-day run. Use a new `utm_content` for every placement.

## Tracked landing links

GitHub README:

```text
https://xfetch.io/use-cases/bitcoin-social-intelligence?utm_source=github&utm_medium=starter&utm_campaign=bitcoin_search_starter_2026q3&utm_content=readme_top
```

Show HN:

```text
https://xfetch.io/use-cases/bitcoin-social-intelligence?utm_source=hackernews&utm_medium=community&utm_campaign=bitcoin_search_starter_2026q3&utm_content=hn_show
```

Developer community tutorial:

```text
https://xfetch.io/twitter-search-api?utm_source=devto&utm_medium=content&utm_campaign=bitcoin_search_starter_2026q3&utm_content=devto_tutorial
```

X demo post:

```text
https://xfetch.io/use-cases/bitcoin-social-intelligence?utm_source=x&utm_medium=social&utm_campaign=bitcoin_search_starter_2026q3&utm_content=x_demo
```

## Launch copy

### GitHub description

Dependency-free Bitcoin X/Twitter intelligence starter: one Search API call to joined posts and authors, observed engagement, usage, and reusable JSON.

### Show HN

**Title**

Show HN: A dependency-free Bitcoin X/Twitter intelligence starter

**Body**

I built a small Node.js starter that turns one recent public X/Twitter search into reusable JSON. It joins posts with author profiles, surfaces observed engagement, shows the credits charged, and keeps the output ready for a brief, notebook, database, or LLM pipeline.

The repository includes a synthetic offline demo and contract tests, so you can inspect the output before adding an API key. I would value feedback on which recurring research output would make this worth running again tomorrow.

### Technical community

**Title**

From a Bitcoin search to analyst-ready JSON in one API call

**Body**

This starter shows a bounded social-listening workflow rather than a generic endpoint sample: query recent public posts, join authors, rank descriptive engagement, save JSON, and preserve usage metadata. It uses Node's built-in `fetch`, has no runtime dependencies, and includes an offline fixture plus tests.

What would you add first: query scheduling, narrative clustering, or a daily brief?

### Short social post

Built a runnable Bitcoin X/Twitter intelligence starter: one enriched Search API call, joined authors, observed engagement, reusable JSON, and an offline synthetic demo. No runtime dependencies. Looking for feedback from people who run recurring market or narrative research.

## 14-day decision gate

Review by source and placement:

1. Landing visits to signup.
2. Signup to API key.
3. Signup to first successful REST call within seven days.
4. Second active day within 14 days when the cohort matures.

If qualified visits arrive but registration does not, change the offer or landing copy. If registration rises but first calls do not, change onboarding and Quickstart. If first calls happen but second-day use does not, add a repeatable saved workflow before increasing distribution.
