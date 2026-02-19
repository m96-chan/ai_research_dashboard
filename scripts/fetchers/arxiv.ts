import { XMLParser } from 'fast-xml-parser';
import { fetchWithTimeout, saveJson, isoNow } from '../utils.js';

interface ArxivPaper {
  id: string;
  title: string;
  summary: string;
  authors: string[];
  published: string;
  updated: string;
  categories: string[];
  link: string;
  pdfLink: string;
}

const ARXIV_CATEGORIES = [
  'cs.AI',  // Artificial Intelligence
  'cs.LG',  // Machine Learning
  'cs.CL',  // Computation and Language (NLP)
  'cs.CV',  // Computer Vision
  'stat.ML', // Machine Learning (Stats)
];

const MAX_RESULTS = 50;

export async function fetchArxiv(): Promise<void> {
  console.log('[arXiv] Fetching latest papers...');

  const query = ARXIV_CATEGORIES.map(c => `cat:${c}`).join('+OR+');
  const url = `http://export.arxiv.org/api/query?search_query=${query}&start=0&max_results=${MAX_RESULTS}&sortBy=submittedDate&sortOrder=descending`;

  const res = await fetchWithTimeout(url);
  if (!res.ok) throw new Error(`arXiv API error: ${res.status}`);

  const xml = await res.text();
  const parser = new XMLParser({
    ignoreAttributes: false,
    isArray: (name) => name === 'entry' || name === 'author' || name === 'category',
  });
  const feed = parser.parse(xml);
  const entries = feed.feed?.entry ?? [];

  const papers: ArxivPaper[] = entries.map((e: any) => {
    const links = Array.isArray(e.link) ? e.link : [e.link];
    const htmlLink = links.find((l: any) => l['@_type'] === 'text/html')?.['@_href']
      ?? links.find((l: any) => !l['@_title'])?.['@_href']
      ?? `https://arxiv.org/abs/${e.id?.split('/').pop()}`;
    const pdfLink = links.find((l: any) => l['@_title'] === 'pdf')?.['@_href'] ?? '';

    const authors = (e.author ?? []).map((a: any) => a.name);
    const categories = (e.category ?? []).map((c: any) => c['@_term']);

    return {
      id: e.id ?? '',
      title: (e.title ?? '').replace(/\s+/g, ' ').trim(),
      summary: (e.summary ?? '').replace(/\s+/g, ' ').trim(),
      authors,
      published: e.published ?? '',
      updated: e.updated ?? '',
      categories,
      link: htmlLink,
      pdfLink,
    };
  });

  saveJson('arxiv.json', {
    updatedAt: isoNow(),
    count: papers.length,
    papers,
  });
}
