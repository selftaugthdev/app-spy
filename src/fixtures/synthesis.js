/**
 * fixtures/synthesis.js — Mock synthesizer output for --mock mode
 *
 * A fully-populated report object matching the schema in CLAUDE.md.
 * Used to test reporter.js without calling the Claude API.
 */

export const mockSynthesis = {
  appName: 'Migraine Buddy',
  generatedAt: '2026-03-03T00:00:00.000Z',

  identityCard: {
    developer: 'NeuroStar AB',
    website: 'https://migrainebuddy.com',
    confirmedHandles: {
      instagram: '@migrainebuddy',
      tiktok: '@migrainebuddy',
      youtube: 'https://youtube.com/@MigraineBuddy',
      twitter: '@MigraineBuddy',
      facebook: 'https://facebook.com/migrainebuddy',
      reddit: null,
    },
    appRating: 4.7,
    reviewCount: 14823,
    lastUpdated: '2024-12-01',
  },

  asoIntelligence: {
    keywordClusters: [
      {
        theme: 'Core tracking',
        keywords: ['migraine tracker', 'headache diary', 'migraine log', 'migraine diary', 'migraine symptom tracker'],
        avgPopularity: 46,
      },
      {
        theme: 'Trigger identification',
        keywords: ['migraine triggers', 'weather headache', 'barometric pressure migraine', 'headache pattern analysis'],
        avgPopularity: 36,
      },
      {
        theme: 'Medication & treatment',
        keywords: ['medication tracker', 'pill reminder', 'headache relief app'],
        avgPopularity: 58,
      },
      {
        theme: 'Search & discovery',
        keywords: ['headache tracker app', 'chronic migraine app', 'pain diary app'],
        avgPopularity: 39,
      },
    ],
    highPriorityTargets: [
      {
        keyword: 'pill reminder',
        popularity: 72,
        reason: 'Highest popularity in the entire keyword set — far exceeds core migraine terms. Capturing medication-focused searchers expands TAM beyond chronic migraine sufferers.',
      },
      {
        keyword: 'migraine tracker',
        popularity: 62,
        reason: 'The primary category-defining keyword. Top rank here means owning the default search result for anyone entering the space.',
      },
      {
        keyword: 'medication tracker',
        popularity: 58,
        reason: 'Broad appeal (not migraine-specific) with high volume. A ranking here pulls in users from adjacent health-tracking categories.',
      },
      {
        keyword: 'migraine triggers',
        popularity: 55,
        reason: 'Intent-rich keyword — users searching for triggers are in active problem-solving mode and highly likely to download and engage.',
      },
      {
        keyword: 'headache tracker app',
        popularity: 51,
        reason: 'People who search "headache" instead of "migraine" are an underserved segment — less competitive than the migraine keyword cluster.',
      },
    ],
    keywordGaps: [
      'period migraine tracker — hormonal migraine is a growing niche they rank for but most competitors ignore',
      'migraine journal — journaling-framed users may not search "tracker"; capturing both framings matters',
      'migraine prediction — forward-looking feature keyword they surface in suggestions but underuse in metadata',
      'aura tracker — specific symptom keyword with lower competition, high intent',
    ],
    ratingsDirection: 'rising',
    ratingsInterpretation:
      'Ratings have climbed steadily from 4.5 → 4.8 over 9 months, signaling a product that is actively improving and retaining happy users. This is a warning sign: they are not stagnating. A competitor entering now faces a product that is getting better faster, not coasting on legacy reviews.',
  },

  socialMatrix: [
    {
      platform: 'Instagram',
      active: true,
      estimatedFollowers: 31400,
      postsPerWeek: 3.5,
      topFormat: 'Carousel infographics + patient testimonials',
      notes: 'Strong educational content with high saves. Leverages user stories as social proof.',
    },
    {
      platform: 'TikTok',
      active: true,
      estimatedFollowers: 18700,
      postsPerWeek: 2.0,
      topFormat: 'Short explainer videos + "did you know" hooks',
      notes: 'Growing channel. Content leans into migraine education, not product features.',
    },
    {
      platform: 'YouTube',
      active: true,
      estimatedFollowers: 48200,
      postsPerWeek: 1.1,
      topFormat: 'Long-form tutorials and science explainers',
      notes: 'Highest authority content. Doctor-to-patient framing builds trust.',
    },
    {
      platform: 'Twitter/X',
      active: true,
      estimatedFollowers: null,
      postsPerWeek: null,
      topFormat: 'Community engagement + awareness days',
      notes: 'Handle confirmed but limited data. Likely low-effort maintenance.',
    },
    {
      platform: 'Facebook',
      active: true,
      estimatedFollowers: null,
      postsPerWeek: null,
      topFormat: 'Long-form posts, community groups',
      notes: 'Active ad presence suggests strong Facebook/Meta investment.',
    },
    {
      platform: 'Reddit',
      active: false,
      estimatedFollowers: null,
      postsPerWeek: null,
      topFormat: 'N/A — no official presence',
      notes: 'Organic community mentions are very positive but the company has no official presence.',
    },
  ],

  adsIntelligence: {
    runningAds: true,
    adCount: 31,
    themes: [
      'Trigger identification ("Do you know your triggers?")',
      'Doctor-patient relationship ("Show your neurologist")',
      'Social proof (12 million users)',
      'Pain-point hook ("Track every headache")',
    ],
    ctaPatterns: ['Download', 'Try Free', 'Learn More', 'Sign Up'],
    longestRunningDays: 214,
    signal:
      'They are running a sustained, multi-creative ad campaign (214+ days) with 31 simultaneous ads. ' +
      'The long run duration signals these creatives are profitable. Their messaging emphasizes credibility ' +
      '(doctors, 12M users) over features — a trust-first ad strategy that works well for health apps.',
  },

  contentStrategy: {
    topics: [
      'Migraine trigger identification',
      'Weather and barometric pressure',
      'Hormonal migraines',
      'Sleep and migraines',
      'Doctor-patient communication',
      'Medication tracking',
      'Migraine diet triggers',
    ],
    tone: 'Empathetic and clinical — they speak the language of the chronic illness community while maintaining medical credibility.',
    hooks: [
      '"Do you know what triggers your migraines?"',
      '"Your neurologist will thank you for this"',
      '"12 million migraine sufferers can\'t be wrong"',
      '"Track one migraine. Understand them all."',
    ],
    whatIsWorking:
      'Their strongest play is the "show your doctor" angle — positioning the app as a medical tool rather ' +
      'than a consumer app. This differentiates them from generic trackers and creates a clinical validation ' +
      'loop. YouTube long-form content with educational depth is building strong SEO and channel authority.',
  },

  appStorePresence: {
    rating: 4.7,
    reviewCount: 14823,
    lastUpdated: '2024-12-01',
    category: 'Medical',
    descriptionKeywords: [
      'migraine', 'tracker', 'headache', 'trigger', 'diary', 'analysis',
      'forecast', 'weather', 'medication', 'pain', 'neurologist',
    ],
    updateCadence: 'Monthly — consistent updates signal active development and help App Store rankings.',
  },

  redditPresence: {
    active: true,
    subreddits: ['r/migraine', 'r/ChronicPain', 'r/migrinheads', 'r/TwoXChromosomes', 'r/sleep'],
    sentiment: 'positive',
    organic: true,
    topThreadSummary:
      'Reddit users spontaneously recommend Migraine Buddy, often citing the neurologist report feature as life-changing. ' +
      'No official company presence — this is entirely organic community advocacy, which is a powerful trust signal.',
  },

  gapsAndOpportunities: [
    'Reddit is a wide-open channel — they have zero official presence despite strong organic advocacy. Creating an official r/migrainebuddy community or regularly engaging in r/migraine could capture highly motivated users at almost zero cost.',
    'Their TikTok following (18K) is disproportionately small given their Instagram (31K) and YouTube (48K). Short-form video on TikTok is under-invested — a competitor with strong TikTok content could steal their next wave of growth.',
    'They are absent from the #hormonal migraine and #periodmigraines conversation on Instagram and TikTok — a large, underserved audience. Owning this niche would capture users before they find Migraine Buddy.',
    'Their ad creative relies heavily on text/static. No video ads detected in their Meta Library. A competitor with strong video ad creative could outperform at similar or lower CPAs.',
    'No podcast or audio content visible. The chronic illness community is heavy podcast consumers. A branded podcast or podcast advertising strategy could establish thought leadership they have not claimed.',
    'The "show your doctor" positioning is their main differentiator but it requires app usage before the value is realized. An onboarding-focused content series showing the first 7-day experience could reduce early churn.',
    'Their description keywords focus on tracking features, not outcomes (pain reduction, fewer attacks). An ASO strategy targeting outcome keywords could capture higher-intent searchers looking for solutions, not features.',
  ],
};
