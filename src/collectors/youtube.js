/**
 * youtube.js — YouTube Channel Collector
 *
 * Uses YouTube Data API v3 to find the app's channel (via handle from
 * identity resolver) and collect subscriber count, video frequency,
 * and top content format signals.
 *
 * Requires: YOUTUBE_API_KEY in .env
 */

import axios from 'axios';

const YT_BASE = 'https://www.googleapis.com/youtube/v3';

export default async function collect(identity) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    console.warn('⚠️  YouTube — skipped (no YOUTUBE_API_KEY)');
    return null;
  }

  // Determine the search query — prefer handle from identity resolver
  const rawHandle = identity.handles?.youtube;
  const searchQuery = rawHandle
    ? normalizeYouTubeHandle(rawHandle)
    : identity.appName;

  // Step 1: Find the channel ID
  const channelId = await findChannelId(searchQuery, apiKey);
  if (!channelId) {
    console.warn(`⚠️  YouTube — no channel found for "${searchQuery}"`);
    return null;
  }

  // Step 2: Get channel statistics and snippet
  const channelData = await getChannelData(channelId, apiKey);
  if (!channelData) return null;

  // Step 3: Get recent videos for frequency + format analysis
  const recentVideos = await getRecentVideos(channelId, apiKey);

  const postsPerWeek = calcPostsPerWeek(recentVideos);
  const topFormat = detectTopFormat(recentVideos);

  return {
    channelId,
    channelName: channelData.snippet.title,
    channelHandle: channelData.snippet.customUrl || null,
    subscriberCount: parseInt(channelData.statistics.subscriberCount || '0'),
    videoCount: parseInt(channelData.statistics.videoCount || '0'),
    totalViewCount: parseInt(channelData.statistics.viewCount || '0'),
    postsPerWeek,
    topFormat,
    description: channelData.snippet.description?.slice(0, 300) || null,
    country: channelData.snippet.country || null,
    publishedAt: channelData.snippet.publishedAt?.split('T')[0] || null,
    recentVideoTitles: recentVideos.slice(0, 5).map((v) => v.snippet.title),
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function normalizeYouTubeHandle(handle) {
  // Strip URL prefix: https://youtube.com/@handle → handle
  return handle
    .replace(/^https?:\/\/(www\.)?youtube\.com\/@?/, '')
    .replace(/^@/, '')
    .replace(/\/$/, '')
    .trim();
}

async function findChannelId(query, apiKey) {
  // First try searching as a channel
  const res = await axios.get(`${YT_BASE}/search`, {
    params: {
      part: 'snippet',
      q: query,
      type: 'channel',
      maxResults: 3,
      key: apiKey,
    },
    timeout: 15000,
  });

  const items = res.data.items || [];
  if (!items.length) return null;

  // Prefer an exact name match
  const exact = items.find(
    (i) => i.snippet.channelTitle.toLowerCase().includes(query.toLowerCase())
  );
  return exact ? exact.snippet.channelId : items[0].snippet.channelId;
}

async function getChannelData(channelId, apiKey) {
  const res = await axios.get(`${YT_BASE}/channels`, {
    params: {
      part: 'statistics,snippet',
      id: channelId,
      key: apiKey,
    },
    timeout: 15000,
  });

  return res.data.items?.[0] || null;
}

async function getRecentVideos(channelId, apiKey) {
  const res = await axios.get(`${YT_BASE}/search`, {
    params: {
      part: 'snippet',
      channelId,
      type: 'video',
      order: 'date',
      maxResults: 30,
      key: apiKey,
    },
    timeout: 15000,
  });

  return res.data.items || [];
}

function calcPostsPerWeek(videos) {
  if (videos.length < 2) return null;

  const dates = videos
    .map((v) => new Date(v.snippet.publishedAt))
    .sort((a, b) => b - a);

  const oldest = dates[dates.length - 1];
  const newest = dates[0];
  const daySpan = (newest - oldest) / (1000 * 60 * 60 * 24);

  if (daySpan < 1) return null;

  return parseFloat((videos.length / (daySpan / 7)).toFixed(1));
}

function detectTopFormat(videos) {
  if (!videos.length) return 'Unknown';

  const titles = videos.map((v) => v.snippet.title.toLowerCase());
  const shortsCount = titles.filter(
    (t) => t.includes('#shorts') || t.includes('short')
  ).length;

  const ratio = shortsCount / videos.length;
  if (ratio > 0.6) return 'Shorts-heavy';
  if (ratio > 0.3) return 'Mixed (Shorts + Long-form)';
  return 'Long-form';
}
