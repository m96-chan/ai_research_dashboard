import { fetchWithTimeout, saveJson, isoNow } from '../utils.js';

interface TrendItem {
  title: string;
  traffic: string;
  relatedQueries: string[];
  articles: {
    title: string;
    url: string;
    source: string;
  }[];
}

export async function fetchGoogleTrends(): Promise<void> {
  console.log('[Google Trends] Fetching AI-related trends...');

  // Use Google Trends RSS feed for daily trends
  // Also fetch trending searches related to AI
  const trendItems: TrendItem[] = [];

  // Google Trends daily trends RSS (US)
  try {
    const res = await fetchWithTimeout(
      'https://trends.google.com/trends/trendingsearches/daily/rss?geo=US',
      10000
    );
    if (res.ok) {
      const text = await res.text();
      // Simple extraction of trend titles from RSS
      const titleMatches = text.matchAll(/<title>(?!Daily Search Trends)(.+?)<\/title>/g);
      const trafficMatches = text.matchAll(/<ht:approx_traffic>(.+?)<\/ht:approx_traffic>/g);
      const newsMatches = text.matchAll(/<ht:news_item_title>(.+?)<\/ht:news_item_title>/g);
      const newsUrlMatches = text.matchAll(/<ht:news_item_url>(.+?)<\/ht:news_item_url>/g);
      const newsSourceMatches = text.matchAll(/<ht:news_item_source>(.+?)<\/ht:news_item_source>/g);

      const titles = [...titleMatches].map(m => m[1]);
      const traffics = [...trafficMatches].map(m => m[1]);
      const newsTitles = [...newsMatches].map(m => m[1]);
      const newsUrls = [...newsUrlMatches].map(m => m[1]);
      const newsSources = [...newsSourceMatches].map(m => m[1]);

      for (let i = 0; i < Math.min(titles.length, 20); i++) {
        trendItems.push({
          title: titles[i],
          traffic: traffics[i] ?? '',
          relatedQueries: [],
          articles: newsTitles[i]
            ? [{ title: newsTitles[i], url: newsUrls[i] ?? '', source: newsSources[i] ?? '' }]
            : [],
        });
      }
    }
  } catch (e) {
    console.warn('  Google Trends RSS error:', e);
  }

  // Filter for AI-related trends
  const aiKeywords = [
    'ai', 'artificial intelligence', 'chatgpt', 'openai', 'claude',
    'gemini', 'llm', 'gpt', 'machine learning', 'deep learning',
    'neural', 'robot', 'automation', 'copilot', 'model',
  ];

  const aiTrends = trendItems.filter(item => {
    const lower = item.title.toLowerCase();
    return aiKeywords.some(kw => lower.includes(kw));
  });

  saveJson('trends.json', {
    updatedAt: isoNow(),
    allTrends: { count: trendItems.length, items: trendItems.slice(0, 20) },
    aiTrends: { count: aiTrends.length, items: aiTrends },
  });
}
