/**
 * astro.js — Astro MCP Collector
 *
 * ASO intelligence via the local Astro desktop app MCP server.
 * Astro must be running with MCP enabled in Settings → MCP Server (port 8089).
 *
 * Server: http://127.0.0.1:8089/mcp — localhost only, no auth.
 *
 * Tools called:
 *   list_apps               — Find existing Astro ID (may differ from iTunes ID)
 *   add_app                 — Register competitor if not already tracked
 *   get_app_keywords        — Tracked keywords with positions, popularity, difficulty
 *   get_keyword_suggestions — AI keyword ideas (requires store param)
 *   search_app_store        — Discover similar apps in same category
 *   get_app_ratings         — Current ratings per store/country
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

  const result = response.data?.result;
  const text = result?.content?.[0]?.text;
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export default async function collect(identity) {
  const { appId: itunesAppId, appName } = identity;

  if (!itunesAppId) {
    console.warn('⚠️  Astro MCP — skipped (no appId resolved)');
    return null;
  }

  try {
    // 1. Check if app already exists in Astro (it may have a different ID than iTunes)
    const appList = await callAstro('list_apps', {}, 1);
    const coreInput = appName.split(/[:\-–|]/)[0].trim().toLowerCase();
    const astroApp = Array.isArray(appList)
      ? appList.find((a) => {
          const coreAstro = (a.name || '').split(/[:\-–|]/)[0].trim().toLowerCase();
          return coreAstro === coreInput || coreAstro.includes(coreInput) || coreInput.includes(coreAstro);
        })
      : null;

    // Use Astro's own ID if found — avoids iTunes ID mismatch
    const appId = astroApp?.appId || itunesAppId;

    if (astroApp) {
      console.log(`   ↳ Found in Astro: "${astroApp.name}" — ${astroApp.keywordCount} keywords tracked`);
    } else {
      await callAstro('add_app', { appId: itunesAppId }, 2);
      console.log('   ↳ Competitor added to Astro tracking');
    }

    // 2. Tracked keywords with positions, popularity, difficulty
    const keywordsRaw = await callAstro('get_app_keywords', { appId }, 3);
    const competitorKeywords = Array.isArray(keywordsRaw) ? keywordsRaw : [];

    // 3. AI keyword suggestions — store param required
    const suggestionsRaw = await callAstro('get_keyword_suggestions', { appId, store: 'us' }, 4);
    const keywordSuggestions = Array.isArray(suggestionsRaw) ? suggestionsRaw : [];

    // 4. Similar apps in same category
    const query = appName.split(/[:\-–|]/)[0].trim();
    const similarRaw = await callAstro('search_app_store', { query, limit: 20 }, 5);
    const similarApps = Array.isArray(similarRaw) ? similarRaw : (similarRaw?.apps || []);

    // 5. Ratings — returns object keyed by index; extract US entry
    const ratingsRaw = await callAstro('get_app_ratings', { appId }, 6);
    const ratingsArr = ratingsRaw ? Object.values(ratingsRaw) : [];
    const usRating = ratingsArr.find((r) => r.store === 'us') || ratingsArr[0] || null;

    // Trim to the most signal-rich entries to stay within Claude's context budget:
    // Keywords: top 40 by current ranking position (already proven to rank)
    const topKeywords = competitorKeywords
      .filter((k) => k.currentRanking != null)
      .sort((a, b) => a.currentRanking - b.currentRanking)
      .slice(0, 40);

    // Suggestions: top 30 by popularity score
    const topSuggestions = keywordSuggestions
      .sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0))
      .slice(0, 30);

    const data = {
      competitorKeywords: topKeywords,
      keywordSuggestions: topSuggestions,
      similarApps: similarApps.slice(0, 10),
      ratingsHistory: usRating ? [usRating] : [],
    };

    console.log(
      `✅ Astro ASO — ${topKeywords.length} keywords · ${topSuggestions.length} suggestions · ${similarApps.length} similar apps`
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
