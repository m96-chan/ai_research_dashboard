import type { APIRoute } from 'astro';

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export const GET: APIRoute = async () => {
  const site = 'https://ai.m96-chan.dev';

  let arxivData: any = { papers: [], updatedAt: '' };
  let hfData: any = { models: { items: [] }, updatedAt: '' };
  let githubData: any = { repos: [], updatedAt: '' };
  let rssData: any = { categories: [], updatedAt: '' };

  try { arxivData = await import('../data/arxiv.json'); } catch {}
  try { hfData = await import('../data/huggingface.json'); } catch {}
  try { githubData = await import('../data/github.json'); } catch {}
  try { rssData = await import('../data/rss.json'); } catch {}

  interface FeedItem {
    title: string;
    link: string;
    description: string;
    pubDate: string;
    category: string;
  }

  const items: FeedItem[] = [];

  // arXiv papers
  for (const p of (arxivData.papers ?? []).slice(0, 10)) {
    items.push({
      title: `[arXiv] ${p.title}`,
      link: p.link,
      description: p.summary?.slice(0, 300) ?? '',
      pubDate: p.published ?? arxivData.updatedAt ?? '',
      category: 'arXiv',
    });
  }

  // HuggingFace models
  for (const m of (hfData.models?.items ?? []).slice(0, 5)) {
    items.push({
      title: `[HF Model] ${m.id}`,
      link: m.link,
      description: `${m.pipeline_tag ?? ''} | ♥${m.likes} ↓${m.downloads}`,
      pubDate: m.lastModified ?? hfData.updatedAt ?? '',
      category: 'HuggingFace',
    });
  }

  // GitHub repos
  for (const r of (githubData.repos ?? []).slice(0, 5)) {
    items.push({
      title: `[GitHub] ${r.fullName}`,
      link: r.url,
      description: r.description?.slice(0, 300) ?? '',
      pubDate: r.createdAt ?? githubData.updatedAt ?? '',
      category: 'GitHub',
    });
  }

  // RSS items from all categories
  for (const cat of (rssData.categories ?? [])) {
    for (const item of (cat.items ?? []).slice(0, 5)) {
      items.push({
        title: `[${cat.name}] ${item.title}`,
        link: item.link,
        description: item.description?.slice(0, 300) ?? '',
        pubDate: item.pubDate ?? rssData.updatedAt ?? '',
        category: cat.name,
      });
    }
  }

  // Sort by date descending
  items.sort((a, b) => {
    const da = a.pubDate ? new Date(a.pubDate).getTime() : 0;
    const db = b.pubDate ? new Date(b.pubDate).getTime() : 0;
    return db - da;
  });

  const lastBuildDate = new Date().toUTCString();

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>AI Research Dashboard</title>
    <description>Latest AI/ML papers, models, repos, and news — updated every hour</description>
    <link>${site}</link>
    <atom:link href="${site}/feed.xml" rel="self" type="application/rss+xml"/>
    <language>en</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
${items.slice(0, 50).map(item => `    <item>
      <title>${escapeXml(item.title)}</title>
      <link>${escapeXml(item.link)}</link>
      <description>${escapeXml(item.description)}</description>
      <category>${escapeXml(item.category)}</category>
      ${item.pubDate ? `<pubDate>${new Date(item.pubDate).toUTCString()}</pubDate>` : ''}
      <guid isPermaLink="true">${escapeXml(item.link)}</guid>
    </item>`).join('\n')}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  });
};
