/**
 * fixtures/collectors.js — Mock collector outputs for --mock mode
 *
 * Realistic data representing a well-established health-tracking app.
 */

export const mockCollectors = {
  appStore: {
    appName: 'Migraine Buddy',
    rating: 4.7,
    ratingCount: 14823,
    currentVersionRating: 4.8,
    lastUpdated: '2024-12-01',
    price: 'Free',
    category: 'Medical',
    contentRating: '4+',
    descriptionKeywords: [
      'migraine', 'tracker', 'headache', 'trigger', 'diary', 'analysis',
      'forecast', 'weather', 'medication', 'pain', 'relief', 'neurologist',
    ],
    version: '8.6.1',
    minimumOsVersion: '15.0',
    screenshotCount: 8,
    supportsIPad: true,
  },

  reddit: {
    postCount: 62,
    subreddits: ['r/migraine', 'r/ChronicPain', 'r/migrinheads', 'r/TwoXChromosomes', 'r/sleep'],
    sentiment: 'positive',
    topPosts: [
      {
        title: 'Migraine Buddy has been the most helpful thing I\'ve tried in years',
        subreddit: 'r/migraine',
        score: 412,
        commentCount: 89,
        url: 'https://reddit.com/r/migraine/comments/example1',
        isOfficial: false,
      },
      {
        title: 'Does anyone else use Migraine Buddy? Any alternatives?',
        subreddit: 'r/ChronicPain',
        score: 187,
        commentCount: 54,
        url: 'https://reddit.com/r/ChronicPain/comments/example2',
        isOfficial: false,
      },
      {
        title: 'Finally showed my neurologist my Migraine Buddy report — she was impressed',
        subreddit: 'r/migraine',
        score: 298,
        commentCount: 47,
        url: 'https://reddit.com/r/migraine/comments/example3',
        isOfficial: false,
      },
    ],
    officialPresence: false,
  },

  youtube: {
    channelId: 'UCexampleChannelId123',
    channelName: 'Migraine Buddy',
    channelHandle: '@MigraineBuddy',
    subscriberCount: 48200,
    videoCount: 203,
    totalViewCount: 4100000,
    postsPerWeek: 1.1,
    topFormat: 'Long-form',
    description: 'Official Migraine Buddy channel. Tips, tutorials, and migraine science.',
    country: 'SE',
    publishedAt: '2017-03-14',
    recentVideoTitles: [
      'How to Set Up Your Migraine Diary in 5 Minutes',
      'Understanding Your Trigger Report',
      'Barometric Pressure and Migraines — What the Data Says',
      'Showing Your Migraine Data to Your Doctor',
      '5 Tracking Habits That Reduce Migraine Frequency',
    ],
  },

  apify: {
    instagram: {
      username: 'migrainebuddy',
      followers: 31400,
      following: 412,
      posts: 487,
      avgLikes: 1340,
      avgComments: 52,
      biography: 'Track. Understand. Reduce. ✨ The #1 migraine tracking app. Download free 👇',
      isVerified: false,
      isPrivate: false,
      externalUrl: 'https://migrainebuddy.com',
    },
    tiktok: {
      username: 'migrainebuddy',
      followers: 18700,
      following: 87,
      totalLikes: 234000,
      videoCount: 94,
      bio: 'Migraine tracking made easy 🧠 Tips & community for migraine warriors',
      isVerified: false,
    },
  },

  metaAds: {
    runningAds: true,
    adCount: 31,
    ctaPatterns: ['Download', 'Try Free', 'Learn More', 'Sign Up'],
    longestRunningDays: 214,
    rawDates: ['April 1, 2024', 'May 15, 2024', 'June 3, 2024'],
    textSample: [
      '31 results · Migraine Buddy · "Do you know your migraine triggers?"',
      'Track every headache. Find your patterns. Live better. Download free.',
      'Used by 12 million migraine sufferers worldwide.',
      '"My neurologist said my Migraine Buddy report was the best data she\'d ever seen" — real user',
    ].join('\n'),
  },

  astro: {
    competitorKeywords: [
      { keyword: 'migraine tracker', popularity: 62 },
      { keyword: 'headache diary', popularity: 44 },
      { keyword: 'migraine log', popularity: 38 },
      { keyword: 'headache tracker app', popularity: 51 },
      { keyword: 'migraine diary', popularity: 47 },
      { keyword: 'chronic migraine app', popularity: 29 },
      { keyword: 'migraine triggers', popularity: 55 },
      { keyword: 'weather headache', popularity: 33 },
      { keyword: 'barometric pressure migraine', popularity: 27 },
      { keyword: 'migraine symptom tracker', popularity: 41 },
      { keyword: 'pain diary app', popularity: 36 },
      { keyword: 'medication tracker', popularity: 58 },
      { keyword: 'pill reminder', popularity: 72 },
      { keyword: 'headache relief app', popularity: 43 },
    ],
    keywordSuggestions: [
      { keyword: 'migraine prediction', popularity: 39 },
      { keyword: 'aura tracker', popularity: 22 },
      { keyword: 'cluster headache app', popularity: 18 },
      { keyword: 'period migraine tracker', popularity: 31 },
      { keyword: 'migraine journal', popularity: 46 },
      { keyword: 'headache pattern analysis', popularity: 28 },
      { keyword: 'neurology appointment prep', popularity: 14 },
    ],
    similarApps: [
      { appId: '1234567890', appName: 'N1-Headache', developer: 'Curelator' },
      { appId: '9876543210', appName: 'Healow', developer: 'eClinicalWorks' },
      { appId: '1122334455', appName: 'Bearable', developer: 'Bearable Ltd' },
      { appId: '5544332211', appName: 'Cara Care', developer: 'cara.care' },
    ],
    ratingsHistory: [
      { date: '2024-06-01', rating: 4.5 },
      { date: '2024-08-01', rating: 4.6 },
      { date: '2024-10-01', rating: 4.7 },
      { date: '2024-12-01', rating: 4.7 },
      { date: '2025-02-01', rating: 4.8 },
    ],
  },

  web: {
    title: 'Migraine Buddy — The #1 Migraine Tracker App',
    description: 'Track headaches, find triggers, and share reports with your doctor. Free on iOS & Android.',
    hasBlog: true,
    internalLinkCount: 24,
    sampleInternalLinks: [
      '/blog', '/features', '/science', '/testimonials', '/for-doctors',
      '/press', '/about', '/privacy', '/terms', '/download',
    ],
    textSample: [
      'Migraine Buddy is the world\'s most comprehensive migraine tracking app.',
      'Used by over 12 million people to track triggers, find patterns, and reduce attacks.',
      'Our AI-powered analysis identifies your personal triggers from barometric pressure to sleep.',
      'Share detailed PDF reports with your neurologist.',
      'Blog: Understanding the link between hormones and migraines.',
    ].join(' '),
    finalUrl: 'https://migrainebuddy.com',
  },
};
