/**
 * astro.js — Astro MCP Collector
 *
 * ASO intelligence via the local Astro desktop app MCP server.
 * Astro must be running with MCP enabled in Settings → MCP Server (port 8089).
 *
 * Server: http://127.0.0.1:8089/mcp — localhost only, no auth.
 *
 * Tools called:
 *   add_app                     — Register competitor in Astro tracking
 *   extract_competitors_keywords — NLP keyword extraction (popularity > 5 only)
 *   get_keyword_suggestions      — AI keyword ideas inspired by the app
 *   search_app_store             — Discover similar apps in same category
 *   get_app_ratings              — Ratings history for trend analysis
 */

import axios from 'axios';

const ASTRO_URL = process.env.ASTRO_MCP_URL || 'http://127.0.0.1:8089/mcp';

async function callAstro(toolName, args, requestId = 1) {
  const response = await axios.post(
    ASTRO_URL,
    {
      jsonrpc: '2.0',
      method: 'tools/call',
      id: requestId,
      params: {
        name: toolName,
        arguments: args,
      },
    },
    { timeout: 30000 }
  );
  return response.data?.result;
}

export default async function collect(identity) {
  const { appId, appName } = identity;

  if (!appId) {
    console.warn('⚠️  Astro MCP — skipped (no appId resolved)');
    return null;
  }

  try {
    // 1. Add competitor to Astro tracking (idempotent — safe to repeat)
    await callAstro('add_app', { appId }, 1);
    console.log('   ↳ Competitor added to Astro tracking');

    // 2. NLP keyword extraction — only keywords with popularity > 5 (Astro constraint)
    const keywordsResult = await callAstro('extract_competitors_keywords', { appId }, 2);

    // 3. AI keyword suggestions inspired by this competitor
    const suggestionsResult = await callAstro('get_keyword_suggestions', { appId }, 3);

    // 4. Discover similar apps in the same category
    const similarResult = await callAstro('search_app_store', { query: appName, limit: 20 }, 4);

    // 5. Ratings history for trend signal
    const ratingsResult = await callAstro('get_app_ratings', { appId, includeHistory: true }, 5);

    const data = {
      competitorKeywords: keywordsResult?.keywords || [],
      keywordSuggestions: suggestionsResult?.suggestions || [],
      similarApps: similarResult?.apps || [],
      ratingsHistory: ratingsResult?.history || [],
    };

    console.log(
      `✅ Astro ASO — ${data.competitorKeywords.length} keywords, ${data.keywordSuggestions.length} suggestions`
    );
    return data;
  } catch (err) {
    if (err.code === 'ECONNREFUSED') {
      console.warn('⚠️  Astro MCP — skipped (Astro not running or MCP not enabled in Settings → MCP Server)');
    } else {
      console.warn(`⚠️  Astro MCP — failed: ${err.message}`);
    }
    return null;
  }
}
