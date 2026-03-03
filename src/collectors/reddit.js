/**
 * reddit.js — Reddit Presence Collector
 *
 * Uses Reddit's public JSON API (no auth required) to find mentions
 * of the app, extract subreddits, sentiment signals, and top threads.
 */

import axios from 'axios';

const REDDIT_API = 'https://www.reddit.com/search.json';

// Words that signal positive/negative sentiment
const POSITIVE_WORDS = [
  'great', 'love', 'best', 'amazing', 'excellent', 'recommend', 'helpful',
  'perfect', 'awesome', 'fantastic', 'wonderful', 'brilliant', 'useful',
  'works', 'solved', 'fixed', 'improved', 'easy', 'simple', 'intuitive',
];

const NEGATIVE_WORDS = [
  'bad', 'terrible', 'hate', 'worst', 'broken', 'crash', 'useless', 'scam',
  'awful', 'horrible', 'garbage', 'trash', 'buggy', 'glitch', 'problem',
  'issue', 'fails', 'frustrating', 'disappointing', 'expensive', 'deleted',
];

export default async function collect(identity) {
  const query = encodeURIComponent(identity.appName);
  const url = `${REDDIT_API}?q=${query}&sort=relevance&t=year&limit=50&type=link`;

  const response = await axios.get(url, {
    headers: {
      'User-Agent': 'AppSpy/1.0 (competitor intelligence research; contact: research@appspy.local)',
    },
    timeout: 15000,
  });

  const posts = (response.data?.data?.children || []).map((c) => c.data);

  if (posts.length === 0) {
    return {
      postCount: 0,
      subreddits: [],
      sentiment: 'neutral',
      topPosts: [],
      officialPresence: false,
    };
  }

  // Aggregate subreddit counts
  const subredditCounts = {};
  for (const post of posts) {
    const sub = `r/${post.subreddit}`;
    subredditCounts[sub] = (subredditCounts[sub] || 0) + 1;
  }

  const subreddits = Object.entries(subredditCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([name]) => name);

  // Sentiment analysis via keyword scoring
  let positiveScore = 0;
  let negativeScore = 0;

  for (const post of posts) {
    const text = `${post.title} ${post.selftext || ''}`.toLowerCase();
    if (POSITIVE_WORDS.some((w) => text.includes(w))) positiveScore++;
    if (NEGATIVE_WORDS.some((w) => text.includes(w))) negativeScore++;
  }

  let sentiment = 'neutral';
  if (positiveScore > negativeScore * 1.5) sentiment = 'positive';
  else if (negativeScore > positiveScore * 1.5) sentiment = 'negative';

  // Top posts by score (upvotes)
  const topPosts = posts
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map((p) => ({
      title: p.title,
      subreddit: `r/${p.subreddit}`,
      score: p.score,
      commentCount: p.num_comments,
      url: `https://reddit.com${p.permalink}`,
      isOfficial: p.distinguished === 'moderator' || p.author_flair_text?.includes('Official'),
    }));

  // Detect if the app has any official subreddit presence
  const developerName = identity.developer?.toLowerCase() || '';
  const appNameLower = identity.appName.toLowerCase();
  const officialPresence = posts.some(
    (p) =>
      p.author.toLowerCase().includes(appNameLower.replace(/\s+/g, '')) ||
      p.author.toLowerCase().includes(developerName.replace(/\s+/g, ''))
  );

  return {
    postCount: posts.length,
    subreddits,
    sentiment,
    topPosts,
    officialPresence,
  };
}
