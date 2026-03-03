/**
 * metaAds.js — Meta Ad Library Collector
 *
 * Uses Puppeteer to scrape the public Meta Ad Library page (no auth required).
 * Extracts: ad count, running status, CTA patterns, longevity signals.
 *
 * URL pattern:
 *   https://www.facebook.com/ads/library/?active_status=active&ad_type=all
 *   &country=ALL&q=QUERY&search_type=keyword_unordered
 */

import puppeteer from 'puppeteer';

const AD_LIBRARY_BASE =
  'https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=ALL&search_type=keyword_unordered';

// Common CTA phrases found in Meta ads
const KNOWN_CTAS = [
  'Sign Up', 'Sign up', 'Download', 'Try Free', 'Try Now', 'Get Started',
  'Get the App', 'Learn More', 'Shop Now', 'Book Now', 'Subscribe',
  'Start Free Trial', 'Install Now', 'Open App', 'Order Now', 'Contact Us',
];

export default async function collect(identity) {
  const query = identity.appName;
  const url = `${AD_LIBRARY_BASE}&q=${encodeURIComponent(query)}`;

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
    });

    const page = await browser.newPage();
    await page.setUserAgent(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
        '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    // Navigate and wait for content to render
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 45000 });

    // Give React time to hydrate
    await page.waitForTimeout(4000);

    // Extract all visible text from the page
    const pageText = await page.evaluate(() => document.body.innerText || '');

    return parseAdLibraryText(pageText);
  } finally {
    if (browser) await browser.close();
  }
}

// ---------------------------------------------------------------------------
// Text parsing — resilient to DOM changes since we work on plain text
// ---------------------------------------------------------------------------

function parseAdLibraryText(text) {
  // Detect result count: "23 results", "1 result", "No results"
  const countMatch = text.match(/(\d[\d,]*)\s+results?/i);
  const adCount = countMatch ? parseInt(countMatch[1].replace(/,/g, ''), 10) : 0;

  const hasNoResults =
    text.toLowerCase().includes('no results') ||
    text.toLowerCase().includes('no ads found');

  const runningAds = !hasNoResults && adCount > 0;

  // Extract "Started running" dates
  const dateRegex = /[Ss]tarted running\s+([A-Za-z]+\s+\d{1,2},?\s+\d{4}|\d{1,2}\s+[A-Za-z]+\s+\d{4})/g;
  const rawDates = [];
  let m;
  while ((m = dateRegex.exec(text)) !== null) {
    rawDates.push(m[1].trim());
  }

  // Calculate longestRunningDays from earliest date found
  let longestRunningDays = null;
  if (rawDates.length > 0) {
    const parsedDates = rawDates
      .map((d) => new Date(d))
      .filter((d) => !isNaN(d.getTime()));

    if (parsedDates.length > 0) {
      const earliest = new Date(Math.min(...parsedDates.map((d) => d.getTime())));
      longestRunningDays = Math.floor(
        (Date.now() - earliest.getTime()) / (1000 * 60 * 60 * 24)
      );
    }
  }

  // Detect CTA patterns from page text
  const ctaPatterns = KNOWN_CTAS.filter((cta) =>
    text.includes(cta)
  );

  // Extract a sample of ad copy (first 2000 chars of meaningful content)
  const textSample = text
    .split('\n')
    .filter((line) => line.trim().length > 20)
    .slice(0, 20)
    .join('\n')
    .slice(0, 2000);

  return {
    runningAds,
    adCount,
    ctaPatterns: [...new Set(ctaPatterns)],
    longestRunningDays,
    rawDates: rawDates.slice(0, 10),
    textSample,
  };
}
