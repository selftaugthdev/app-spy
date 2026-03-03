# AppSpy

Competitor intelligence CLI for app developers. Given a competitor's app name or App Store URL, generates a full marketing intelligence report covering social media, ads, Reddit, YouTube, App Store metadata, and Claude-synthesized gaps & opportunities.

## Setup

```bash
npm install
cp .env.example .env
# Fill in your API keys in .env
```

## Usage

```bash
# By app name
node src/index.js "Migraine Buddy"

# By App Store URL
node src/index.js "https://apps.apple.com/us/app/migraine-buddy/id1230291303"

# Mock mode (no API calls, uses fixture data)
node src/index.js "Migraine Buddy" --mock

# Skip specific collectors
node src/index.js "Migraine Buddy" --skip apify,youtube
```

## Reports

Reports are saved to `reports/` as both `APPNAME_YYYY-MM-DD.md` (human-readable) and `APPNAME_YYYY-MM-DD.json` (machine-readable).

## Environment Variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `ANTHROPIC_API_KEY` | Yes | Identity resolution & synthesis |
| `YOUTUBE_API_KEY` | Optional | YouTube channel data |
| `APIFY_API_TOKEN` | Optional | Instagram & TikTok profiles |
| `SERPAPI_KEY` | Optional | Extended Google footprint |

## Architecture

```
resolver.js      → App name/URL → identity object with all social handles
collectors/      → Parallel data collection from each platform
synthesizer.js   → Claude synthesizes all data into structured JSON report
reporter.js      → Formats JSON into Markdown + saves both files
index.js         → CLI orchestration
```
