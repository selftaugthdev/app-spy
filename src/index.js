/**
 * index.js — AppSpy CLI Entry Point
 *
 * Usage:
 *   node src/index.js "App Name"
 *   node src/index.js "https://apps.apple.com/..."
 *   node src/index.js "App Name" --mock
 *   node src/index.js "App Name" --skip apify,youtube
 */

import 'dotenv/config';
import { resolveIdentity } from './resolver.js';
import collectAppStore from './collectors/appStore.js';
import collectReddit from './collectors/reddit.js';
import collectYouTube from './collectors/youtube.js';
import collectApify from './collectors/apify.js';
import collectMetaAds from './collectors/metaAds.js';
import collectWeb from './collectors/web.js';
import collectAstro from './collectors/astro.js';
import { synthesize } from './synthesizer.js';
import { generateReport } from './reporter.js';

// ---------------------------------------------------------------------------
// Argument parsing
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);

// First non-flag arg is the input (app name or URL)
const input = args.find((a) => !a.startsWith('--'));

const isMock = args.includes('--mock');

// --skip apify,youtube  OR  --skip=apify,youtube
const skipIdx = args.indexOf('--skip');
let skipCollectors = [];
if (skipIdx !== -1 && args[skipIdx + 1] && !args[skipIdx + 1].startsWith('--')) {
  skipCollectors = args[skipIdx + 1].split(',').map((s) => s.trim());
} else {
  const skipEq = args.find((a) => a.startsWith('--skip='));
  if (skipEq) {
    skipCollectors = skipEq.replace('--skip=', '').split(',').map((s) => s.trim());
  }
}

if (!input) {
  console.error('Usage: node src/index.js "App Name" [--mock] [--skip apify,youtube]');
  process.exit(1);
}

// ---------------------------------------------------------------------------
// All available collectors
// ---------------------------------------------------------------------------

const ALL_COLLECTORS = [
  { name: 'astro',    label: 'Astro ASO', fn: collectAstro },
  { name: 'appStore', label: 'App Store', fn: collectAppStore },
  { name: 'reddit',   label: 'Reddit',    fn: collectReddit },
  { name: 'youtube',  label: 'YouTube',   fn: collectYouTube },
  { name: 'apify',    label: 'Apify',     fn: collectApify },
  { name: 'metaAds',  label: 'Meta Ads',  fn: collectMetaAds },
  { name: 'web',      label: 'Web',       fn: collectWeb },
];

// ---------------------------------------------------------------------------
// Main pipeline
// ---------------------------------------------------------------------------

async function run() {
  console.log('');
  console.log(`🕵️  AppSpy — analyzing "${input}"`);
  console.log('');

  let identity, collectorData, report;

  // ------------------------------------------------------------------
  // Mock mode: load fixture data, skip all API calls
  // ------------------------------------------------------------------
  if (isMock) {
    console.log('🎭 Mock mode — using fixture data (no API calls)\n');

    const { mockIdentity } = await import('./fixtures/identity.js');
    const { mockCollectors } = await import('./fixtures/collectors.js');
    const { mockSynthesis } = await import('./fixtures/synthesis.js');

    identity = mockIdentity;
    collectorData = mockCollectors;
    report = mockSynthesis;

    console.log(`✅ Identity — ${identity.appName} by ${identity.developer}`);
    for (const c of ALL_COLLECTORS) {
      const hasData = collectorData[c.name] != null;
      console.log(`${hasData ? '✅' : '⚠️ '} ${c.label} — ${hasData ? 'fixture loaded' : 'no fixture data'}`);
    }
    console.log('✅ Synthesis — fixture loaded\n');

  // ------------------------------------------------------------------
  // Live mode: real API calls
  // ------------------------------------------------------------------
  } else {
    // 1. Resolve identity
    try {
      identity = await resolveIdentity(input);
      console.log(`✅ Identity — ${identity.appName} by ${identity.developer}`);
    } catch (err) {
      console.error(`❌ Identity resolution failed: ${err.message}`);
      process.exit(1);
    }

    console.log('');

    // 2. Run collectors in parallel
    const activeCollectors = ALL_COLLECTORS.filter(
      (c) => !skipCollectors.includes(c.name)
    );

    for (const c of ALL_COLLECTORS) {
      if (skipCollectors.includes(c.name)) {
        console.log(`⏭️  ${c.label} — skipped (--skip flag)`);
      }
    }

    const results = await Promise.allSettled(
      activeCollectors.map((c) =>
        c.fn(identity)
          .then((data) => ({ name: c.name, label: c.label, data }))
          .catch((err) => {
            console.warn(`⚠️  ${c.label} — failed: ${err.message}`);
            return { name: c.name, label: c.label, data: null };
          })
      )
    );

    collectorData = {};
    for (const result of results) {
      if (result.status === 'fulfilled') {
        const { name, label, data } = result.value;
        collectorData[name] = data;
        if (data != null) {
          const summary = summarizeCollectorResult(name, data);
          console.log(`✅ ${label} — ${summary}`);
        }
        // Warnings for null results were already logged in the catch above
      }
    }

    // Fill in skipped collectors as null
    for (const c of ALL_COLLECTORS) {
      if (!(c.name in collectorData)) {
        collectorData[c.name] = null;
      }
    }

    // 3. Synthesize with Claude
    console.log('');
    console.log('🧠 Synthesizing report with Claude (claude-sonnet-4-6)...');

    try {
      report = await synthesize(identity, collectorData);
      console.log('✅ Synthesis — complete');
    } catch (err) {
      console.error(`❌ Synthesis failed: ${err.message}`);
      process.exit(1);
    }
  }

  // 4. Generate report files
  console.log('');
  try {
    const { mdPath, jsonPath, pdfPath } = await generateReport(report, identity.appName);
    console.log(`📄 Report saved to ${mdPath}`);
    console.log(`📊 JSON saved to  ${jsonPath}`);
    console.log(`📋 PDF saved to   ${pdfPath}`);
  } catch (err) {
    console.error(`❌ Report generation failed: ${err.message}`);
    process.exit(1);
  }

  console.log('');
  console.log('✅ Done.');
}

// ---------------------------------------------------------------------------
// Collector result summaries for console output
// ---------------------------------------------------------------------------

function summarizeCollectorResult(name, data) {
  if (!data) return 'no data';

  switch (name) {
    case 'appStore':
      return `${data.rating ?? '?'}⭐ · ${(data.ratingCount ?? 0).toLocaleString()} reviews · ${data.category ?? 'unknown'}`;
    case 'reddit':
      return `${data.postCount} mentions · ${data.subreddits.slice(0, 2).join(', ')} · ${data.sentiment}`;
    case 'youtube':
      return `${(data.subscriberCount ?? 0).toLocaleString()} subs · ${data.postsPerWeek ?? '?'}/wk · ${data.topFormat}`;
    case 'apify': {
      const parts = [];
      if (data.instagram) parts.push(`Instagram: ${(data.instagram.followers ?? 0).toLocaleString()}`);
      if (data.tiktok) parts.push(`TikTok: ${(data.tiktok.followers ?? 0).toLocaleString()}`);
      return parts.join(' · ') || 'no profiles found';
    }
    case 'metaAds':
      return data.runningAds
        ? `${data.adCount} active ads · longestRunning: ${data.longestRunningDays ?? '?'}d`
        : 'no active ads';
    case 'astro': {
      const kw = data.competitorKeywords?.length ?? 0;
      const sg = data.keywordSuggestions?.length ?? 0;
      const sim = data.similarApps?.length ?? 0;
      return `${kw} keywords · ${sg} suggestions · ${sim} similar apps`;
    }
    case 'web':
      return `${data.title?.slice(0, 50) ?? 'N/A'} · blog: ${data.hasBlog ? 'yes' : 'no'}`;
    default:
      return 'done';
  }
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------

run().catch((err) => {
  console.error('\n❌ Fatal error:', err.message);
  if (process.env.DEBUG) console.error(err.stack);
  process.exit(1);
});
