/**
 * reporter.js — Report Formatter
 *
 * Takes the synthesizer's JSON output and produces:
 *   1. A clean Markdown report  → reports/APPNAME_YYYY-MM-DD.md
 *   2. The raw JSON             → reports/APPNAME_YYYY-MM-DD.json
 *
 * Both files are always written. Returns paths to both.
 */

import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { marked } from 'marked';
import puppeteer from 'puppeteer';

/**
 * @param {Object} report - Output from synthesizer.js
 * @param {string} appName - Used to generate the filename
 * @returns {Promise<{mdPath: string, jsonPath: string}>}
 */
export async function generateReport(report, appName) {
  const date = new Date().toISOString().split('T')[0];
  const safeName = appName.replace(/[^a-zA-Z0-9]/g, '');
  const baseName = `${safeName}_${date}`;

  await mkdir('reports', { recursive: true });

  const jsonPath = join('reports', `${baseName}.json`);
  const mdPath = join('reports', `${baseName}.md`);

  const markdown = toMarkdown(report);
  await writeFile(jsonPath, JSON.stringify(report, null, 2), 'utf-8');
  await writeFile(mdPath, markdown, 'utf-8');

  const pdfPath = join('reports', `${baseName}.pdf`);
  await writePdf(markdown, pdfPath);

  return { mdPath, jsonPath, pdfPath };
}

// ---------------------------------------------------------------------------
// Markdown formatter
// ---------------------------------------------------------------------------

function toMarkdown(r) {
  const lines = [];

  // Header
  lines.push(`# AppSpy Report: ${r.appName}`);
  lines.push(`**Generated:** ${r.generatedAt}`);
  lines.push('');
  lines.push('---');
  lines.push('');

  // Identity Card
  lines.push('## 🪪 Identity');
  const id = r.identityCard || {};
  lines.push(`| Field | Value |`);
  lines.push(`|-------|-------|`);
  lines.push(`| Developer | ${id.developer || 'N/A'} |`);
  lines.push(`| Website | ${id.website ? `[${id.website}](${id.website})` : 'N/A'} |`);
  lines.push(`| App Rating | ${id.appRating != null ? `${id.appRating} ⭐` : 'N/A'} |`);
  lines.push(`| Review Count | ${id.reviewCount != null ? id.reviewCount.toLocaleString() : 'N/A'} |`);
  lines.push(`| Last Updated | ${id.lastUpdated || 'N/A'} |`);
  lines.push('');

  // Confirmed Handles
  const handles = id.confirmedHandles || {};
  const activeHandles = Object.entries(handles).filter(([, v]) => v);
  if (activeHandles.length > 0) {
    lines.push('### Social Handles');
    for (const [platform, handle] of activeHandles) {
      lines.push(`- **${capitalize(platform)}:** ${handle}`);
    }
    lines.push('');
  }

  // Social Matrix
  if (r.socialMatrix?.length) {
    lines.push('## 📊 Social Media Matrix');
    lines.push('');
    lines.push('| Platform | Active | Followers | Posts/Wk | Top Format | Notes |');
    lines.push('|----------|:------:|----------:|:--------:|------------|-------|');
    for (const p of r.socialMatrix) {
      lines.push(
        `| ${p.platform} | ${p.active ? '✅' : '❌'} | ${fmt(p.estimatedFollowers)} | ${fmt(p.postsPerWeek)} | ${p.topFormat || '—'} | ${p.notes || '—'} |`
      );
    }
    lines.push('');
  }

  // Ads Intelligence
  lines.push('## 📣 Advertising Intelligence');
  const ads = r.adsIntelligence || {};
  lines.push(`**Running Ads:** ${ads.runningAds ? `Yes — ${ads.adCount ?? 0} active ads` : 'No active ads'}`);
  if (ads.longestRunningDays) {
    lines.push(`**Longest Running:** ${ads.longestRunningDays} days`);
  }
  if (ads.themes?.length) {
    lines.push(`**Themes:** ${ads.themes.join(' · ')}`);
  }
  if (ads.ctaPatterns?.length) {
    lines.push(`**CTAs:** ${ads.ctaPatterns.join(' · ')}`);
  }
  if (ads.signal) {
    lines.push('');
    lines.push(`> ${ads.signal}`);
  }
  lines.push('');

  // Content Strategy
  lines.push('## 🎬 Content Strategy');
  const content = r.contentStrategy || {};
  if (content.tone) lines.push(`**Tone:** ${content.tone}`);
  if (content.topics?.length) lines.push(`**Topics:** ${content.topics.join(', ')}`);
  if (content.hooks?.length) {
    lines.push('');
    lines.push('**Common Hooks:**');
    for (const hook of content.hooks) {
      lines.push(`- ${hook}`);
    }
  }
  if (content.whatIsWorking) {
    lines.push('');
    lines.push(`**What's Working:** ${content.whatIsWorking}`);
  }
  lines.push('');

  // App Store Presence
  if (r.appStorePresence) {
    lines.push('## 📱 App Store Presence');
    const app = r.appStorePresence;
    if (app.rating != null) lines.push(`**Rating:** ${app.rating} ⭐`);
    if (app.reviewCount != null) lines.push(`**Reviews:** ${app.reviewCount.toLocaleString()}`);
    if (app.category) lines.push(`**Category:** ${app.category}`);
    if (app.lastUpdated) lines.push(`**Last Updated:** ${app.lastUpdated}`);
    if (app.updateCadence) lines.push(`**Update Cadence:** ${app.updateCadence}`);
    if (app.descriptionKeywords?.length) {
      lines.push(`**Description Keywords:** ${app.descriptionKeywords.join(', ')}`);
    }
    lines.push('');
  }

  // Reddit Presence
  lines.push('## 💬 Reddit Presence');
  const reddit = r.redditPresence || {};
  lines.push(`**Active:** ${reddit.active ? 'Yes' : 'No'}`);
  if (reddit.sentiment) lines.push(`**Sentiment:** ${sentimentEmoji(reddit.sentiment)} ${reddit.sentiment}`);
  if (reddit.organic != null) lines.push(`**Community Type:** ${reddit.organic ? 'Organic (user-driven)' : 'Marketing-driven'}`);
  if (reddit.subreddits?.length) {
    lines.push(`**Subreddits:** ${reddit.subreddits.join(', ')}`);
  }
  if (reddit.topThreadSummary) {
    lines.push('');
    lines.push(`> ${reddit.topThreadSummary}`);
  }
  lines.push('');

  // ASO Intelligence
  if (r.asoIntelligence) {
    const aso = r.asoIntelligence;
    lines.push('## 🔑 ASO Intelligence');
    lines.push('');

    if (aso.ratingsDirection) {
      const dirEmoji = { rising: '📈', stable: '➡️', declining: '📉' }[aso.ratingsDirection] || '❓';
      lines.push(`**Ratings Trend:** ${dirEmoji} ${aso.ratingsDirection}`);
      if (aso.ratingsInterpretation) {
        lines.push('');
        lines.push(`> ${aso.ratingsInterpretation}`);
      }
      lines.push('');
    }

    if (aso.highPriorityTargets?.length) {
      lines.push('### 🎯 High-Priority Keyword Targets');
      lines.push('');
      lines.push('| Keyword | Popularity | Theme | Why Target It |');
      lines.push('|---------|:----------:|-------|---------------|');
      for (const t of aso.highPriorityTargets) {
        const cluster = aso.keywordClusters?.find((c) => c.keywords?.includes(t.keyword));
        const theme = cluster?.theme || '—';
        lines.push(`| ${t.keyword} | ${t.popularity} | ${theme} | ${t.reason} |`);
      }
      lines.push('');
    }

    if (aso.keywordClusters?.length) {
      lines.push('### 📦 Keyword Clusters');
      lines.push('');
      for (const cluster of aso.keywordClusters) {
        lines.push(`**${cluster.theme}** _(avg popularity: ${cluster.avgPopularity ?? '?'})_`);
        if (cluster.keywords?.length) {
          lines.push(cluster.keywords.map((k) => `\`${k}\``).join(', '));
        }
        lines.push('');
      }
    }

    if (aso.keywordGaps?.length) {
      lines.push('### 🕳️ Keyword Gaps (they rank, you don\'t)');
      lines.push('');
      for (const gap of aso.keywordGaps) {
        lines.push(`- ${gap}`);
      }
      lines.push('');
    }
  }

  // Gaps & Opportunities
  lines.push('## 🎯 Gaps & Opportunities');
  lines.push('');
  if (r.gapsAndOpportunities?.length) {
    for (const gap of r.gapsAndOpportunities) {
      lines.push(`- ${gap}`);
    }
  } else {
    lines.push('_No opportunities identified._');
  }
  lines.push('');

  lines.push('---');
  lines.push('_Generated by AppSpy_');

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// PDF generation
// ---------------------------------------------------------------------------

async function writePdf(markdown, outputPath) {
  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 13px; line-height: 1.6; color: #1a1a1a; max-width: 900px; margin: 0 auto; padding: 32px 40px; }
  h1 { font-size: 24px; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px; margin-bottom: 4px; }
  h2 { font-size: 17px; margin-top: 28px; margin-bottom: 8px; color: #111; }
  h3 { font-size: 14px; margin-top: 20px; margin-bottom: 6px; color: #333; }
  table { border-collapse: collapse; width: 100%; margin: 12px 0; font-size: 12px; }
  th { background: #f3f4f6; text-align: left; padding: 6px 10px; border: 1px solid #d1d5db; }
  td { padding: 5px 10px; border: 1px solid #e5e7eb; vertical-align: top; }
  tr:nth-child(even) td { background: #fafafa; }
  blockquote { border-left: 3px solid #6366f1; margin: 8px 0; padding: 4px 14px; color: #444; background: #f9f9ff; }
  code { background: #f3f4f6; padding: 1px 5px; border-radius: 3px; font-size: 11px; }
  hr { border: none; border-top: 1px solid #e5e7eb; margin: 24px 0; }
  ul { margin: 6px 0; padding-left: 20px; }
  li { margin-bottom: 4px; }
  strong { color: #111; }
</style>
</head>
<body>
${marked(markdown)}
</body>
</html>`;

  const browser = await puppeteer.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'domcontentloaded' });
    await page.pdf({
      path: outputPath,
      format: 'A4',
      margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' },
      printBackground: true,
    });
  } finally {
    await browser.close();
  }
}

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

function fmt(value) {
  if (value == null) return '—';
  if (typeof value === 'number') return value.toLocaleString();
  return value;
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function sentimentEmoji(sentiment) {
  const map = { positive: '😊', neutral: '😐', negative: '😠' };
  return map[sentiment] || '❓';
}
