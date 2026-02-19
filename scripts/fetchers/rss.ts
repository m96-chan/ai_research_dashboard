import { readFileSync } from 'node:fs';
import { XMLParser } from 'fast-xml-parser';
import { parse as parseYaml } from 'yaml';
import { fetchWithTimeout, saveJson, isoNow } from '../utils.js';

interface FeedItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  source: string;
}

interface RSSCategory {
  name: string;
  id: string;
  icon: string;
  items: FeedItem[];
}

interface FeedConfig {
  categories: {
    name: string;
    id: string;
    icon: string;
    feeds: { name: string; url: string }[];
  }[];
}

export async function fetchRSS(): Promise<void> {
  console.log('[RSS] Fetching feeds from config...');

  const configPath = new URL('../../config/feeds.yml', import.meta.url).pathname;
  const config: FeedConfig = parseYaml(readFileSync(configPath, 'utf-8'));

  const parser = new XMLParser({
    ignoreAttributes: false,
    isArray: (name) => name === 'item' || name === 'entry',
  });

  const categories: RSSCategory[] = [];

  for (const cat of config.categories) {
    const items: FeedItem[] = [];

    const results = await Promise.allSettled(
      cat.feeds.map(async (feed) => {
        try {
          const res = await fetchWithTimeout(feed.url, 10000);
          if (!res.ok) {
            console.warn(`  RSS warning (${feed.name}): ${res.status}`);
            return [];
          }
          const xml = await res.text();
          const parsed = parser.parse(xml);

          // Handle both RSS 2.0 and Atom formats
          const rssItems = parsed.rss?.channel?.item ?? [];
          const atomEntries = parsed.feed?.entry ?? [];
          const entries = [...rssItems, ...atomEntries];

          return entries.slice(0, 10).map((e: any): FeedItem => {
            const link =
              e.link?.['@_href'] ?? // Atom
              e.link ??             // RSS
              e.guid ??
              '';

            const description =
              e.description ??
              e.summary ??
              e.content ??
              e['content:encoded'] ??
              '';

            const rawDesc = typeof description === 'string'
              ? description
              : description?.['#text'] ?? '';

            return {
              title: (e.title?.['#text'] ?? e.title ?? '').toString().trim(),
              link: typeof link === 'string' ? link : link?.['@_href'] ?? '',
              description: rawDesc
                .replace(/<[^>]*>/g, '')
                .replace(/\s+/g, ' ')
                .trim()
                .slice(0, 300),
              pubDate: e.pubDate ?? e.published ?? e.updated ?? '',
              source: feed.name,
            };
          });
        } catch (e) {
          console.warn(`  RSS error (${feed.name}):`, e);
          return [];
        }
      })
    );

    for (const result of results) {
      if (result.status === 'fulfilled') {
        items.push(...result.value);
      }
    }

    // Sort by date, newest first
    items.sort((a, b) => {
      const da = a.pubDate ? new Date(a.pubDate).getTime() : 0;
      const db = b.pubDate ? new Date(b.pubDate).getTime() : 0;
      return db - da;
    });

    categories.push({
      name: cat.name,
      id: cat.id,
      icon: cat.icon,
      items: items.slice(0, 20),
    });
  }

  saveJson('rss.json', {
    updatedAt: isoNow(),
    categories,
  });
}
