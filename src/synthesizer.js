/**
 * synthesizer.js — Claude API Synthesis Layer
 *
 * Takes all raw collector data and uses Claude (claude-opus-4-6) to produce
 * a structured JSON intelligence report. Streams the response to handle
 * large outputs without hitting request timeouts.
 *
 * Claude synthesizes — it never makes HTTP requests. All data collection
 * happens in the collectors before this module is called.
 */

import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

const REPORT_SCHEMA = `{
  "appName": "string",
  "generatedAt": "ISO 8601 date string",
  "identityCard": {
    "developer": "string",
    "website": "string or null",
    "confirmedHandles": {
      "instagram": "string or null",
      "tiktok": "string or null",
      "youtube": "string or null",
      "twitter": "string or null",
      "facebook": "string or null",
      "reddit": "string or null"
    },
    "appRating": "number or null",
    "reviewCount": "number or null",
    "lastUpdated": "string or null"
  },
  "asoIntelligence": {
    "keywordClusters": [
      {
        "theme": "string — a named theme for this cluster (e.g. 'symptom tracking', 'weather triggers')",
        "keywords": ["array of keyword strings in this cluster"],
        "avgPopularity": "number — average popularity score across keywords in cluster"
      }
    ],
    "highPriorityTargets": [
      {
        "keyword": "string",
        "popularity": "number",
        "reason": "string — why this specific keyword is worth targeting"
      }
    ],
    "keywordGaps": ["string — keywords the competitor ranks for that the user likely isn't targeting yet"],
    "ratingsDirection": "rising | stable | declining",
    "ratingsInterpretation": "string — what the ratings trend means competitively"
  },
  "socialMatrix": [
    {
      "platform": "string (e.g. Instagram, TikTok, YouTube, Twitter, Facebook, Reddit)",
      "active": "boolean",
      "estimatedFollowers": "number or null",
      "postsPerWeek": "number or null",
      "topFormat": "string describing their main content format",
      "notes": "string with key observation about this platform"
    }
  ],
  "adsIntelligence": {
    "runningAds": "boolean",
    "adCount": "number (0 if none)",
    "themes": ["array of strings — main ad copy themes"],
    "ctaPatterns": ["array of strings — CTAs used"],
    "longestRunningDays": "number or null",
    "signal": "string — your 1-2 sentence interpretation of their ad strategy"
  },
  "contentStrategy": {
    "topics": ["array of strings — main content topics across platforms"],
    "tone": "string describing their brand voice (e.g. clinical, friendly, aspirational)",
    "hooks": ["array of strings — opening hooks or content patterns they use"],
    "whatIsWorking": "string — 2-3 sentence analysis of their strongest content plays"
  },
  "appStorePresence": {
    "rating": "number or null",
    "reviewCount": "number or null",
    "lastUpdated": "string or null",
    "category": "string or null",
    "descriptionKeywords": ["array of strings"],
    "updateCadence": "string — assessment of how frequently they update (e.g. monthly, quarterly, rarely)"
  },
  "redditPresence": {
    "active": "boolean",
    "subreddits": ["array of subreddit names where they appear"],
    "sentiment": "positive | neutral | negative",
    "organic": "boolean — true if community-driven, false if marketing-driven",
    "topThreadSummary": "string — 1-2 sentence summary of what people say about them on Reddit"
  },
  "gapsAndOpportunities": [
    "string — each is a specific, actionable opportunity you can exploit (min 5 items)"
  ]
}`;

const SYSTEM_PROMPT = `You are a competitor intelligence analyst specializing in mobile apps.
Your job is to analyze raw data collected about a competitor app and produce a structured intelligence report.

Be specific and tactical — avoid generic observations. Every insight should be actionable for an indie iOS developer.

For the asoIntelligence section:
- Group competitor keywords into named thematic clusters (e.g. "symptom tracking", "weather triggers", "medication management")
- Flag keywords with popularity > 30 as high-priority targets — include a specific reason for each
- Identify keyword gaps: terms the competitor ranks for that a challenger app is likely missing
- Assess ratingsDirection from the ratings history data (rising / stable / declining) and explain what it means strategically

Return ONLY a valid JSON object matching the schema exactly. No markdown code fences, no preamble, no commentary after the JSON. Just the raw JSON object.`;

/**
 * @param {Object} identity - From resolver.js
 * @param {Object} collectorData - Map of collector name → data (nulls allowed)
 * @returns {Promise<Object>} Structured report JSON
 */
export async function synthesize(identity, collectorData) {
  const allData = {
    identity,
    appStore: collectorData.appStore || null,
    reddit: collectorData.reddit || null,
    youtube: collectorData.youtube || null,
    apify: collectorData.apify || null,
    metaAds: collectorData.metaAds || null,
    web: collectorData.web || null,
    astro: collectorData.astro || null,
  };

  const userPrompt = [
    `Analyze this competitor app data for "${identity.appName}" and return a JSON report matching this exact schema:`,
    '',
    REPORT_SCHEMA,
    '',
    '---',
    '',
    'RAW COLLECTED DATA:',
    '',
    JSON.stringify(allData, null, 2),
  ].join('\n');

  // Stream to avoid timeout on large outputs; use adaptive thinking for
  // deeper competitive analysis. Retry up to 3 times on overloaded errors.
  // Retry up to 3 times on overloaded errors; fall back to sonnet on attempt 3.
  const ATTEMPTS = [
    { model: 'claude-opus-4-6',   thinking: { type: 'adaptive' }, delay: 0 },
    { model: 'claude-opus-4-6',   thinking: { type: 'adaptive' }, delay: 20000 },
    { model: 'claude-sonnet-4-6', thinking: { type: 'adaptive' }, delay: 10000 },
  ];

  let message;
  for (let i = 0; i < ATTEMPTS.length; i++) {
    const { model, thinking, delay } = ATTEMPTS[i];
    if (delay > 0) {
      console.log(`   ↳ Claude overloaded, retrying in ${delay / 1000}s (attempt ${i + 1}/${ATTEMPTS.length}, model: ${model})...`);
      await new Promise((r) => setTimeout(r, delay));
    }
    try {
      const stream = await client.messages.stream({
        model,
        max_tokens: 8192,
        thinking,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userPrompt }],
      });
      message = await stream.finalMessage();
      if (i > 0) console.log(`   ↳ Synthesis succeeded on attempt ${i + 1} using ${model}`);
      break;
    } catch (err) {
      const isOverloaded = err.status === 529 || (err.message && err.message.includes('overloaded'));
      if (isOverloaded && i < ATTEMPTS.length - 1) continue;
      throw err;
    }
  }

  // Filter to text blocks only (skip thinking blocks)
  const text = message.content
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('');

  // Extract the JSON object
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error(
      'Synthesizer returned no JSON object. Raw response:\n' + text.slice(0, 500)
    );
  }

  try {
    return JSON.parse(jsonMatch[0]);
  } catch (err) {
    throw new Error(`Failed to parse synthesizer JSON: ${err.message}`);
  }
}
