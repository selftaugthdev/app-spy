# CLAUDE.md — AppSpy Project Memory

Read this file at the start of every session. It contains the full project context, architecture decisions, and conventions.

---

## What This Project Is

**AppSpy** is a competitor intelligence CLI tool for app developers and SaaS founders. Input a competitor's app name or App Store URL, get a full marketing + ASO intelligence report covering social media strategy, Meta ads, Reddit presence, YouTube, Instagram, TikTok, App Store metadata, and keyword intelligence via Astro MCP.

Primary user is an indie iOS developer building MigraineCast (weather-based migraine forecasting app). Tool will eventually be productized as a SaaS or OpenClaw workflow template for any indie dev or agency.

---

## Architecture Principles

1. **Identity Resolver is the foundation.** App name → developer info, website, numeric App Store ID, all social handles. Claude API extracts handles from website HTML. The numeric `appId` is required for Astro MCP.

2. **Collectors run in parallel.** `Promise.allSettled()` always. One failure never kills the run.

3. **Graceful degradation.** Missing API keys = skip + warn in report. Never throw to top level.

4. **Astro MCP is the ASO secret weapon.** It runs locally and gives keyword intelligence no public API provides. Always run it if Astro is available.

5. **Claude synthesizes, doesn't scrape.** Claude API only called in `synthesizer.js`. Collectors handle all HTTP.

6. **Always two output formats.** `.md` (human) + `.json` (machine) every run.

---

## Tech Stack

| Layer | Tool |
|-------|------|
| Runtime | Node.js (ES modules) |
| HTTP | `axios` |
| JS-heavy scraping | `puppeteer` |
| AI synthesis | `@anthropic-ai/sdk` |
| ASO intelligence | Astro MCP (local HTTP, port 8089) |
| Instagram/TikTok | Apify REST API |
| YouTube | YouTube Data API v3 |
| Reddit | Public JSON API (no key) |
| Meta Ads | Puppeteer scrape of Ad Library |
| App Store | iTunes Search API (no key) |

---

## Astro MCP Integration

**Server:** `http://127.0.0.1:8089/mcp` — localhost only, no auth, runs with the Astro desktop app.

**Registration (one-time):**
```bash
claude mcp add --transport http astro http://127.0.0.1:8089/mcp
```

**Tools used by AppSpy:**

| Tool | Purpose in AppSpy |
|------|-------------------|
| `add_app` | Add competitor to Astro tracking |
| `extract_competitors_keywords` | NLP keyword extraction from competitor rankings |
| `get_keyword_suggestions` | AI keyword ideas inspired by the competitor |
| `search_app_store` | Discover similar apps in the same category |
| `get_app_ratings` | Ratings history for trend analysis |

**Tools available but not yet used (future):**

| Tool | Potential use |
|------|---------------|
| `get_app_keywords` | Track YOUR own keyword rankings vs. competitor |
| `search_rankings` | Compare keyword rank positions side by side |
| `add_keywords` | Auto-add competitor keywords to your own Astro tracking |
| `set_keyword_tag` | Tag competitor keywords by theme/priority |
| `manage_tag` | Create tag categories (e.g. "steal from competitor") |

**MCP HTTP call pattern:**
```javascript
const response = await axios.post(process.env.ASTRO_MCP_URL, {
  jsonrpc: "2.0",
  method: "tools/call",
  id: 1,
  params: {
    name: "tool_name",
    arguments: { /* tool inputs */ }
  }
});
```

---

## File Responsibilities

```
src/index.js                — CLI, orchestrates pipeline, progress logging
src/resolver.js             — App name/URL → identity object (handles + appId)
src/collectors/astro.js     — Astro MCP: keywords, suggestions, ratings, similar apps
src/collectors/metaAds.js   — Puppeteer scrape of Meta Ad Library
src/collectors/reddit.js    — Reddit public JSON API
src/collectors/youtube.js   — YouTube Data API v3
src/collectors/apify.js     — Apify actors for Instagram + TikTok
src/collectors/appStore.js  — iTunes Search API
src/collectors/web.js       — Website crawler (optional)
src/synthesizer.js          — Claude API synthesis → structured JSON report
src/reporter.js             — JSON → Markdown + saves both formats
reports/                    — Output dir, gitignored
```

---

## Identity Object Schema

```json
{
  "appName": "string",
  "developer": "string",
  "website": "string",
  "appStoreUrl": "string",
  "appId": "string (numeric App Store ID)",
  "handles": {
    "instagram": "@handle or null",
    "tiktok": "@handle or null",
    "youtube": "channel URL or handle or null",
    "twitter": "@handle or null",
    "facebook": "page name or URL or null",
    "reddit": "u/username or r/subreddit or null"
  }
}
```

---

## Synthesizer Report Schema

```json
{
  "appName": "string",
  "generatedAt": "ISO date",
  "identityCard": {
    "developer": "string",
    "website": "string",
    "confirmedHandles": {},
    "appRating": 0,
    "reviewCount": 0,
    "lastUpdated": "string"
  },
  "asoIntelligence": {
    "keywordClusters": [
      { "theme": "string", "keywords": ["string"], "avgPopularity": 0 }
    ],
    "highPriorityTargets": [
      { "keyword": "string", "popularity": 0, "reason": "string" }
    ],
    "keywordGaps": ["string"],
    "ratingsInterpretation": "string",
    "ratingsDirection": "rising | stable | declining"
  },
  "socialMatrix": [
    {
      "platform": "string",
      "active": true,
      "estimatedFollowers": 0,
      "postsPerWeek": 0,
      "topFormat": "string",
      "notes": "string"
    }
  ],
  "adsIntelligence": {
    "runningAds": true,
    "adCount": 0,
    "themes": ["string"],
    "ctaPatterns": ["string"],
    "longestRunningDays": 0,
    "signal": "string"
  },
  "contentStrategy": {
    "topics": ["string"],
    "tone": "string",
    "hooks": ["string"],
    "whatIsWorking": "string"
  },
  "redditPresence": {
    "active": true,
    "subreddits": ["string"],
    "sentiment": "positive | neutral | negative",
    "organic": true,
    "topThreadSummary": "string"
  },
  "gapsAndOpportunities": ["string"]
}
```

---

## Environment Variables

```
ANTHROPIC_API_KEY     required
YOUTUBE_API_KEY       required for YouTube
APIFY_API_TOKEN       required for Instagram/TikTok
SERPAPI_KEY           optional
ASTRO_MCP_URL         http://127.0.0.1:8089/mcp (local only)
```

---

## CLI Usage

```bash
node src/index.js "Migraine Buddy"
node src/index.js "https://apps.apple.com/us/app/migraine-buddy/id..."
node src/index.js "Migraine Buddy" --mock
node src/index.js "Migraine Buddy" --skip apify,youtube
```

---

## Coding Conventions

- ES modules (`import/export`), no CommonJS
- `async/await` only, no `.then()` chains
- Each collector exports: `async function collect(identity) → data object | null`
- Progress log format:
  - `🔍 Resolving identity...`
  - `✅ Astro ASO — 47 keywords, 23 suggestions`
  - `⚠️  Apify — skipped (no APIFY_API_TOKEN)`
  - `❌ YouTube — failed: quota exceeded`
  - `📄 Report saved → reports/MigraineBuddy_2026-03-03.md`
- Collector errors: catch, log as warning, return `null` — never throw upward

---

## Future Ideas for Astro MCP (don't build yet)

- **Keyword theft mode:** after a spy run, auto-call `add_keywords` to add all competitor high-priority keywords directly into YOUR Astro tracking
- **Side-by-side ranking:** use `search_rankings` to compare your keyword positions vs. competitor's
- **Tag pipeline:** auto-tag competitor keywords with themes using `set_keyword_tag` + `manage_tag`
- **Weekly diff:** run AppSpy on a schedule, compare keyword lists week-over-week to catch when a competitor starts ranking for new terms

---

## Current Build Status

- [x] Project scaffold
- [x] Identity Resolver
- [x] Astro MCP collector
- [x] Meta Ads collector
- [x] Reddit collector
- [x] YouTube collector
- [x] Apify collector
- [x] App Store collector
- [x] Synthesizer
- [x] Reporter
- [x] CLI entry point
- [x] Mock mode / fixtures
- [x] README

Update this checklist as modules are completed.

---

## Productization Roadmap (don't build yet)

- Web frontend: React app, input box → report dashboard
- Scheduled monitoring + diff alerts
- OpenClaw workflow template for resale
- SaaS: $29–49/mo, 5 reports/mo free tier
- Email report delivery
- Agency tier: unlimited scans, white-label PDF

---

## github

- The repo lives at: https://github.com/selftaugthdev/app-spy
- Don't add "co-authored by OPUS..." to the commit messages