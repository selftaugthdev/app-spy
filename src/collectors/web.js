/**
 * web.js — Website / Blog Crawler
 *
 * Fetches the competitor's official website and extracts light SEO + content
 * signals: title, meta description, blog presence, and a text sample for
 * Claude to analyze content themes and tone.
 */

import axios from 'axios';

export default async function collect(identity) {
  if (!identity.website) return null;

  const response = await axios.get(identity.website, {
    timeout: 20000,
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
        '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
    maxRedirects: 5,
    maxContentLength: 5 * 1024 * 1024, // 5 MB cap
  });

  const html = response.data;

  // Extract <title>
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : null;

  // Extract meta description
  const descMatch =
    html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i) ||
    html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i);
  const metaDescription = descMatch ? descMatch[1].trim() : null;

  // Extract og:description as fallback
  const ogDescMatch = html.match(
    /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i
  );
  const ogDescription = ogDescMatch ? ogDescMatch[1].trim() : null;

  // Detect blog by checking for blog-related links
  const blogLinkCount =
    (html.match(/\/blog\//gi) || []).length +
    (html.match(/\/articles?\//gi) || []).length +
    (html.match(/\/news\//gi) || []).length;
  const hasBlog = blogLinkCount >= 3;

  // Extract all internal links for crawl signal
  const linkMatches = html.match(/href=["'](\/[^"'?#]{3,})/g) || [];
  const internalLinks = [...new Set(linkMatches.map((l) => l.replace(/href=["']/, '')))]
    .slice(0, 30);

  // Strip HTML to readable text for Claude's content theme analysis
  const textContent = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
    .slice(0, 4000);

  return {
    title,
    description: metaDescription || ogDescription,
    hasBlog,
    internalLinkCount: internalLinks.length,
    sampleInternalLinks: internalLinks.slice(0, 10),
    textSample: textContent,
    finalUrl: response.request?.res?.responseUrl || identity.website,
  };
}
