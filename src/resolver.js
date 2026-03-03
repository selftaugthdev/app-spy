/**
 * resolver.js — Identity Resolver
 *
 * Given an app name or App Store URL, resolves a full identity object
 * including developer info, website, and all social media handles.
 *
 * Flow:
 *   1. Fetch app metadata from iTunes Search/Lookup API
 *   2. Fetch the developer's website HTML
 *   3. Use Claude API to extract all social handles from the HTML
 *   4. Return structured identity object
 */

import Anthropic from '@anthropic-ai/sdk';
import axios from 'axios';

const client = new Anthropic();

const NULL_HANDLES = {
  instagram: null,
  tiktok: null,
  youtube: null,
  twitter: null,
  facebook: null,
  reddit: null,
};

/**
 * Main export — resolves app name or URL → full identity object.
 * @param {string} input  App name (e.g. "Migraine Buddy") or App Store URL
 * @returns {Promise<Object>} Identity object matching the schema in CLAUDE.md
 */
export async function resolveIdentity(input) {
  console.log('🔍 Resolving identity...');

  const appData = await fetchAppData(input);
  console.log(`   Found: "${appData.appName}" by ${appData.developer}`);

  if (appData.website) {
    console.log(`   Website: ${appData.website}`);
  } else {
    console.log('   No website found in App Store listing');
  }

  const handles = appData.website
    ? await extractHandlesFromWebsite(appData.website)
    : { ...NULL_HANDLES };

  return {
    appName: appData.appName,
    developer: appData.developer,
    website: appData.website,
    appStoreUrl: appData.appStoreUrl,
    appId: appData.appId,
    handles,
  };
}

// ---------------------------------------------------------------------------
// iTunes API helpers
// ---------------------------------------------------------------------------

async function fetchAppData(input) {
  if (input.startsWith('http')) {
    return fetchFromUrl(input);
  }
  return fetchFromSearch(input);
}

async function fetchFromUrl(url) {
  // Extract numeric app ID from URL like:
  //   https://apps.apple.com/us/app/app-name/id1234567890
  const match = url.match(/\/id(\d+)/);
  if (!match) {
    throw new Error(`Cannot parse App Store URL — expected ".../id{number}" in: ${url}`);
  }

  const appId = match[1];
  const response = await axios.get(
    `https://itunes.apple.com/lookup?id=${appId}`,
    { timeout: 15000 }
  );

  if (!response.data.results?.length) {
    throw new Error(`No app found for App Store ID: ${appId}`);
  }

  return normalizeAppData(response.data.results[0]);
}

async function fetchFromSearch(name) {
  const response = await axios.get(
    `https://itunes.apple.com/search?term=${encodeURIComponent(name)}&entity=software&limit=5`,
    { timeout: 15000 }
  );

  if (!response.data.results?.length) {
    throw new Error(`No app found for name: "${name}"`);
  }

  // Return the first result (best match)
  return normalizeAppData(response.data.results[0]);
}

function normalizeAppData(app) {
  return {
    appName: app.trackName,
    developer: app.sellerName || app.artistName,
    website: app.sellerUrl || null,
    appStoreUrl: app.trackViewUrl,
    appId: String(app.trackId),
  };
}

// ---------------------------------------------------------------------------
// Handle extraction via Claude
// ---------------------------------------------------------------------------

async function extractHandlesFromWebsite(websiteUrl) {
  let html;

  try {
    const response = await axios.get(websiteUrl, {
      timeout: 15000,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
          '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      maxRedirects: 5,
    });
    html = response.data;
  } catch (err) {
    console.warn(`⚠️  Resolver — could not fetch website (${err.message}), skipping handle extraction`);
    return { ...NULL_HANDLES };
  }

  // Strip scripts/styles, keep link hrefs + text — easier for Claude to parse
  const stripped = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .slice(0, 40000); // Hard cap to avoid token overflow

  try {
    const stream = await client.messages.stream({
      model: 'claude-opus-4-6',
      max_tokens: 512,
      system: [
        'You are a web scraper that extracts social media links from HTML.',
        'Respond with ONLY a valid JSON object — no markdown fences, no explanation.',
        'Keys: instagram, tiktok, youtube, twitter, facebook, reddit.',
        'Values: the handle (like @username) or full profile URL, or null if not found.',
        'For reddit, use "r/subreddit" or "u/username" format.',
      ].join(' '),
      messages: [
        {
          role: 'user',
          content: `Extract social media handles/links from this website HTML.\n\n${stripped}`,
        },
      ],
    });

    const message = await stream.finalMessage();

    // Grab only text blocks (ignore thinking blocks if any)
    const text = message.content
      .filter((b) => b.type === 'text')
      .map((b) => b.text)
      .join('');

    // Extract the JSON object from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.warn('⚠️  Resolver — Claude did not return valid JSON for handles');
      return { ...NULL_HANDLES };
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return {
      instagram: parsed.instagram || null,
      tiktok: parsed.tiktok || null,
      youtube: parsed.youtube || null,
      twitter: parsed.twitter || null,
      facebook: parsed.facebook || null,
      reddit: parsed.reddit || null,
    };
  } catch (err) {
    console.warn(`⚠️  Resolver — handle extraction failed: ${err.message}`);
    return { ...NULL_HANDLES };
  }
}
