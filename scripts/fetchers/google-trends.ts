import { fetchWithTimeout, saveJson, isoNow } from '../utils.js';

interface TrendItem {
  title: string;
  traffic: string;
  articles: {
    title: string;
    url: string;
    source: string;
  }[];
}

interface RegionTrends {
  region: string;
  label: string;
  icon: string;
  items: TrendItem[];
}

const REGIONS = [
  { geo: 'US', label: 'United States', icon: '🇺🇸' },
  { geo: 'JP', label: 'Japan', icon: '🇯🇵' },
  { geo: 'KR', label: 'South Korea', icon: '🇰🇷' },
];

// Technology / AI keywords for filtering
const TECH_KEYWORDS = [
  // Products & Companies
  'ai', 'openai', 'chatgpt', 'gpt', 'claude', 'anthropic',
  'gemini', 'copilot', 'midjourney', 'stable diffusion', 'sora',
  'perplexity', 'cursor', 'devin', 'nvidia', 'tesla',
  'apple', 'google', 'microsoft', 'meta', 'amazon', 'samsung',
  // Tech terms
  'llm', 'machine learning', 'deep learning', 'neural',
  'transformer', 'diffusion', 'agent', 'rag', 'fine-tun',
  'artificial intelligence', 'generative ai', 'gen ai',
  'robot', 'autonomous', 'automation', 'quantum',
  'blockchain', 'crypto', 'bitcoin', 'ethereum',
  'chip', 'semiconductor', 'gpu', 'cpu',
  'cloud', 'saas', 'api', 'software', 'app',
  'cyber', 'hack', 'security', 'privacy',
  'vr', 'ar', 'metaverse', 'spatial',
  '5g', '6g', 'starlink', 'satellite',
  // Japanese tech terms
  '人工知能', '機械学習', '深層学習', '生成ai', '生成ＡＩ',
  'ロボット', '半導体', '量子', 'アプリ', 'スマホ',
  // Korean tech terms
  '인공지능', '머신러닝', '딥러닝', '반도체', '삼성',
  '로봇', '자율주행', 'ai', '챗봇',
];

function isTechRelated(title: string): boolean {
  const lower = title.toLowerCase();
  return TECH_KEYWORDS.some(kw => lower.includes(kw));
}

async function fetchRegionTrends(geo: string): Promise<TrendItem[]> {
  const url = `https://trends.google.com/trending/rss?geo=${geo}`;
  const res = await fetchWithTimeout(url, 10000);
  if (!res.ok) {
    console.warn(`  Google Trends (${geo}): ${res.status}`);
    return [];
  }

  const text = await res.text();

  // Parse each <item> block individually for correct article association
  const items: TrendItem[] = [];
  const itemBlocks = text.split('<item>').slice(1); // skip preamble

  for (const block of itemBlocks) {
    const titleMatch = block.match(/<title>(.+?)<\/title>/);
    const trafficMatch = block.match(/<ht:approx_traffic>(.+?)<\/ht:approx_traffic>/);
    const newsTitles = [...block.matchAll(/<ht:news_item_title>(.+?)<\/ht:news_item_title>/g)];
    const newsUrls = [...block.matchAll(/<ht:news_item_url>(.+?)<\/ht:news_item_url>/g)];
    const newsSources = [...block.matchAll(/<ht:news_item_source>(.+?)<\/ht:news_item_source>/g)];

    if (!titleMatch) continue;

    const articles = newsTitles.map((m, i) => ({
      title: m[1],
      url: newsUrls[i]?.[1] ?? '',
      source: newsSources[i]?.[1] ?? '',
    }));

    items.push({
      title: titleMatch[1],
      traffic: trafficMatch?.[1] ?? '',
      articles,
    });
  }

  return items;
}

export async function fetchGoogleTrends(): Promise<void> {
  console.log('[Google Trends] Fetching tech trends (US/JP/CN)...');

  const results = await Promise.allSettled(
    REGIONS.map(async (r) => {
      try {
        const allItems = await fetchRegionTrends(r.geo);
        const techItems = allItems.filter(item => isTechRelated(item.title));
        console.log(`  ${r.icon} ${r.geo}: ${allItems.length} total, ${techItems.length} tech-related`);
        return {
          region: r.geo,
          label: r.label,
          icon: r.icon,
          items: techItems,
        } satisfies RegionTrends;
      } catch (e) {
        console.warn(`  Google Trends error (${r.geo}):`, e);
        return { region: r.geo, label: r.label, icon: r.icon, items: [] } satisfies RegionTrends;
      }
    })
  );

  const regions: RegionTrends[] = results.map(r =>
    r.status === 'fulfilled' ? r.value : { region: '??', label: 'Unknown', icon: '?', items: [] }
  );

  saveJson('trends.json', {
    updatedAt: isoNow(),
    regions,
  });
}
