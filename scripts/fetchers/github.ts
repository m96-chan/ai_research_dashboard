import { fetchWithTimeout, saveJson, isoNow } from '../utils.js';

interface GHRepo {
  name: string;
  fullName: string;
  description: string;
  stars: number;
  forks: number;
  language: string;
  topics: string[];
  url: string;
  createdAt: string;
  updatedAt: string;
}

const SEARCH_QUERIES = [
  'artificial+intelligence',
  'machine+learning',
  'large+language+model',
  'deep+learning',
  'transformer+model',
];

export async function fetchGitHub(): Promise<void> {
  console.log('[GitHub] Fetching trending AI repositories...');

  // Search for repos created/updated in the last 7 days, sorted by stars
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];

  const allRepos = new Map<string, GHRepo>();

  for (const q of SEARCH_QUERIES) {
    const url = `https://api.github.com/search/repositories?q=${q}+created:>${since}&sort=stars&order=desc&per_page=20`;

    const headers: Record<string, string> = {
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'ai-research-dashboard',
    };
    if (process.env.GITHUB_TOKEN) {
      headers.Authorization = `token ${process.env.GITHUB_TOKEN}`;
    }

    try {
      const res = await fetchWithTimeout(url);
      if (!res.ok) {
        console.warn(`  GitHub search warning (${q}): ${res.status}`);
        continue;
      }
      const data = await res.json();
      for (const r of data.items ?? []) {
        if (!allRepos.has(r.full_name)) {
          allRepos.set(r.full_name, {
            name: r.name,
            fullName: r.full_name,
            description: r.description ?? '',
            stars: r.stargazers_count ?? 0,
            forks: r.forks_count ?? 0,
            language: r.language ?? '',
            topics: r.topics ?? [],
            url: r.html_url,
            createdAt: r.created_at,
            updatedAt: r.updated_at,
          });
        }
      }
    } catch (e) {
      console.warn(`  GitHub search error (${q}):`, e);
    }
  }

  const repos = [...allRepos.values()]
    .sort((a, b) => b.stars - a.stars)
    .slice(0, 50);

  saveJson('github.json', {
    updatedAt: isoNow(),
    count: repos.length,
    repos,
  });
}
