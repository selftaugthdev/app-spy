/**
 * apify.js — Apify REST API Wrapper (Instagram + TikTok)
 *
 * Uses Apify actors to scrape Instagram and TikTok profile data:
 *   - Instagram: apify/instagram-profile-scraper
 *   - TikTok:    clockworks/free-tiktok-scraper
 *
 * Requires: APIFY_API_TOKEN in .env
 */

import axios from 'axios';

const APIFY_BASE = 'https://api.apify.com/v2';
const POLL_INTERVAL_MS = 8000;
const MAX_WAIT_MS = 5 * 60 * 1000; // 5 minutes

export default async function collect(identity) {
  const token = process.env.APIFY_API_TOKEN;
  if (!token) {
    console.warn('⚠️  Apify — skipped (no APIFY_API_TOKEN)');
    return null;
  }

  const results = {};

  // Instagram
  const igHandle = identity.handles?.instagram;
  if (igHandle) {
    try {
      const username = normalizeHandle(igHandle, 'instagram');
      const data = await runInstagramScraper(username, token);
      if (data) results.instagram = data;
      console.log(`   Apify/Instagram: @${username} — ${data?.followers ?? 'n/a'} followers`);
    } catch (err) {
      console.warn(`⚠️  Apify/Instagram — ${err.message}`);
    }
  }

  // TikTok
  const ttHandle = identity.handles?.tiktok;
  if (ttHandle) {
    try {
      const username = normalizeHandle(ttHandle, 'tiktok');
      const data = await runTikTokScraper(username, token);
      if (data) results.tiktok = data;
      console.log(`   Apify/TikTok: @${username} — ${data?.followers ?? 'n/a'} followers`);
    } catch (err) {
      console.warn(`⚠️  Apify/TikTok — ${err.message}`);
    }
  }

  if (Object.keys(results).length === 0) return null;
  return results;
}

// ---------------------------------------------------------------------------
// Actor runners
// ---------------------------------------------------------------------------

async function runInstagramScraper(username, token) {
  const items = await runActor(
    'apify~instagram-profile-scraper',
    { usernames: [username] },
    token
  );

  if (!items.length) return null;
  const p = items[0];

  return {
    username,
    followers: p.followersCount ?? null,
    following: p.followsCount ?? null,
    posts: p.postsCount ?? null,
    avgLikes: p.avgLikes ?? null,
    avgComments: p.avgComments ?? null,
    biography: p.biography?.slice(0, 200) ?? null,
    isVerified: p.verified ?? false,
    isPrivate: p.isPrivate ?? false,
    externalUrl: p.externalUrl ?? null,
  };
}

async function runTikTokScraper(username, token) {
  const items = await runActor(
    'clockworks~free-tiktok-scraper',
    { profiles: [`@${username}`], resultsPerPage: 1 },
    token
  );

  if (!items.length) return null;
  const p = items[0];

  return {
    username,
    followers: p.authorStats?.followerCount ?? null,
    following: p.authorStats?.followingCount ?? null,
    totalLikes: p.authorStats?.heartCount ?? null,
    videoCount: p.authorStats?.videoCount ?? null,
    bio: p.authorMeta?.signature?.slice(0, 200) ?? null,
    isVerified: p.authorMeta?.verified ?? false,
  };
}

// ---------------------------------------------------------------------------
// Apify REST API helpers
// ---------------------------------------------------------------------------

async function runActor(actorId, input, token) {
  // Start the actor run
  const startRes = await axios.post(
    `${APIFY_BASE}/acts/${encodeURIComponent(actorId)}/runs?token=${token}`,
    input,
    {
      timeout: 30000,
      headers: { 'Content-Type': 'application/json' },
    }
  );

  const runId = startRes.data.data.id;

  // Poll until SUCCEEDED or timeout
  const deadline = Date.now() + MAX_WAIT_MS;

  while (Date.now() < deadline) {
    await sleep(POLL_INTERVAL_MS);

    const statusRes = await axios.get(
      `${APIFY_BASE}/actor-runs/${runId}?token=${token}`,
      { timeout: 15000 }
    );

    const status = statusRes.data.data.status;

    if (status === 'SUCCEEDED') break;
    if (status === 'FAILED' || status === 'ABORTED' || status === 'TIMED-OUT') {
      throw new Error(`Actor run ${status}: ${runId}`);
    }
  }

  // Retrieve results
  const itemsRes = await axios.get(
    `${APIFY_BASE}/actor-runs/${runId}/dataset/items?token=${token}&limit=10`,
    { timeout: 15000 }
  );

  return itemsRes.data;
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function normalizeHandle(handle, platform) {
  let h = handle
    .replace(/^@/, '')
    .replace(/\/$/, '')
    .trim();

  if (platform === 'instagram') {
    h = h.replace(/^https?:\/\/(www\.)?instagram\.com\//, '');
  } else if (platform === 'tiktok') {
    h = h.replace(/^https?:\/\/(www\.)?tiktok\.com\/@?/, '');
  }

  return h;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
