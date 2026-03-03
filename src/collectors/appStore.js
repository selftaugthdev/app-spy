/**
 * appStore.js — App Store Metadata Collector
 *
 * Uses the iTunes Search API (no key required) to fetch app metadata:
 * rating, review count, last updated date, price, category, keyword themes.
 */

import axios from 'axios';

export default async function collect(identity) {
  const term = encodeURIComponent(identity.appName);
  const url = `https://itunes.apple.com/search?term=${term}&entity=software&limit=5`;

  const response = await axios.get(url, { timeout: 15000 });

  if (!response.data.results?.length) {
    return null;
  }

  // Find the best matching result (exact name match preferred)
  const results = response.data.results;
  const exact = results.find(
    (r) => r.trackName.toLowerCase() === identity.appName.toLowerCase()
  );
  const app = exact || results[0];

  // Extract keyword themes from description
  const description = app.description || '';
  const keywords = extractKeywords(description);

  return {
    appName: app.trackName,
    rating: app.averageUserRating ?? null,
    ratingCount: app.userRatingCount ?? null,
    currentVersionRating: app.averageUserRatingForCurrentVersion ?? null,
    lastUpdated: app.currentVersionReleaseDate
      ? app.currentVersionReleaseDate.split('T')[0]
      : null,
    price: app.price === 0 ? 'Free' : `$${app.price}`,
    category: app.primaryGenreName || null,
    contentRating: app.contentAdvisoryRating || null,
    descriptionKeywords: keywords,
    version: app.version || null,
    minimumOsVersion: app.minimumOsVersion || null,
    screenshotCount: app.screenshotUrls?.length ?? 0,
    supportsIPad: app.ipadScreenshotUrls?.length > 0,
  };
}

function extractKeywords(text) {
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'is', 'are', 'was', 'were', 'this', 'that', 'it', 'be',
    'you', 'your', 'our', 'we', 'app', 'use', 'can', 'from', 'have', 'has',
    'will', 'get', 'all', 'more', 'now', 'new', 'also', 'its', 'not', 'any',
    'when', 'what', 'how', 'just', 'they', 'their', 'been', 'so', 'up',
  ]);

  const wordFreq = {};
  const words = text.toLowerCase().match(/[a-z]{4,}/g) || [];

  for (const word of words) {
    if (!stopWords.has(word)) {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    }
  }

  return Object.entries(wordFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([word]) => word);
}
