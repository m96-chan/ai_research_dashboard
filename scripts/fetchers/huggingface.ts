import { fetchWithTimeout, saveJson, isoNow } from '../utils.js';

interface HFModel {
  id: string;
  author: string;
  likes: number;
  downloads: number;
  tags: string[];
  pipeline_tag: string;
  lastModified: string;
  link: string;
}

interface HFDataset {
  id: string;
  author: string;
  likes: number;
  downloads: number;
  tags: string[];
  lastModified: string;
  link: string;
}

const HF_BASE = 'https://huggingface.co/api';

export async function fetchHuggingFace(): Promise<void> {
  console.log('[HuggingFace] Fetching trending models & datasets...');

  const [modelsRes, datasetsRes] = await Promise.all([
    fetchWithTimeout(`${HF_BASE}/models?sort=trendingScore&direction=-1&limit=30`),
    fetchWithTimeout(`${HF_BASE}/datasets?sort=trendingScore&direction=-1&limit=20`),
  ]);

  if (!modelsRes.ok) throw new Error(`HF models API error: ${modelsRes.status}`);
  if (!datasetsRes.ok) throw new Error(`HF datasets API error: ${datasetsRes.status}`);

  const rawModels: any[] = await modelsRes.json();
  const rawDatasets: any[] = await datasetsRes.json();

  const models: HFModel[] = rawModels.map((m) => ({
    id: m.id ?? '',
    author: m.author ?? m.id?.split('/')[0] ?? '',
    likes: m.likes ?? 0,
    downloads: m.downloads ?? 0,
    tags: m.tags ?? [],
    pipeline_tag: m.pipeline_tag ?? '',
    lastModified: m.lastModified ?? '',
    link: `https://huggingface.co/${m.id}`,
  }));

  const datasets: HFDataset[] = rawDatasets.map((d) => ({
    id: d.id ?? '',
    author: d.author ?? d.id?.split('/')[0] ?? '',
    likes: d.likes ?? 0,
    downloads: d.downloads ?? 0,
    tags: d.tags ?? [],
    lastModified: d.lastModified ?? '',
    link: `https://huggingface.co/datasets/${d.id}`,
  }));

  saveJson('huggingface.json', {
    updatedAt: isoNow(),
    models: { count: models.length, items: models },
    datasets: { count: datasets.length, items: datasets },
  });
}
