/**
 * fixtures/identity.js — Mock identity for --mock mode
 *
 * Represents a realistic app (Migraine Buddy-style) for testing
 * the synthesizer and reporter without real API calls.
 */

export const mockIdentity = {
  appName: 'Migraine Buddy',
  developer: 'NeuroStar AB',
  website: 'https://migrainebuddy.com',
  appStoreUrl: 'https://apps.apple.com/us/app/migraine-buddy/id1230291303',
  appId: '1230291303',
  handles: {
    instagram: '@migrainebuddy',
    tiktok: '@migrainebuddy',
    youtube: 'https://youtube.com/@MigraineBuddy',
    twitter: '@MigraineBuddy',
    facebook: 'https://facebook.com/migrainebuddy',
    reddit: null,
  },
};
