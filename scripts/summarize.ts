import { readFileSync, writeFileSync } from 'node:fs';
import OpenAI from 'openai';
import { DATA_DIR } from './utils.js';

const MODEL = 'gpt-4o-mini';
const CONCURRENCY = 10;

let client: OpenAI;

// ---- helpers ----

async function summarize(text: string): Promise<string> {
  const res = await client.chat.completions.create({
    model: MODEL,
    max_tokens: 150,
    temperature: 0.3,
    messages: [
      {
        role: 'system',
        content:
          'あなたはAI/テクノロジー専門のニュースエディターです。与えられた記事の内容を日本語で1〜2文のTL;DRにまとめてください。専門用語はそのまま使って構いません。出力はTL;DRのテキストのみ。',
      },
      { role: 'user', content: text.slice(0, 2000) },
    ],
  });
  return res.choices[0]?.message?.content?.trim() ?? '';
}

async function runBatch<T>(
  items: T[],
  fn: (item: T) => Promise<void>,
  concurrency: number
): Promise<void> {
  const queue = [...items];
  const workers = Array.from({ length: concurrency }, async () => {
    while (queue.length > 0) {
      const item = queue.shift()!;
      try {
        await fn(item);
      } catch (e) {
        console.warn('  Summarize error:', e instanceof Error ? e.message : e);
      }
    }
  });
  await Promise.all(workers);
}

function loadJson(filename: string): any {
  try {
    return JSON.parse(readFileSync(`${DATA_DIR}${filename}`, 'utf-8'));
  } catch {
    return null;
  }
}

function saveData(filename: string, data: any): void {
  writeFileSync(`${DATA_DIR}${filename}`, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`  ✓ Saved ${filename}`);
}

// ---- summarize each data source ----

async function summarizeArxiv(): Promise<void> {
  const data = loadJson('arxiv.json');
  if (!data?.papers?.length) return;
  console.log(`[arXiv] Summarizing ${data.papers.length} papers...`);

  let count = 0;
  await runBatch(data.papers, async (p: any) => {
    if (p.tldr) return; // skip if already summarized
    const input = `Title: ${p.title}\n\nAbstract: ${p.summary}`;
    p.tldr = await summarize(input);
    count++;
  }, CONCURRENCY);

  console.log(`  ${count} new summaries`);
  saveData('arxiv.json', data);
}

async function summarizeRSS(): Promise<void> {
  const data = loadJson('rss.json');
  if (!data?.categories?.length) return;

  const allItems = data.categories.flatMap((c: any) => c.items ?? []);
  const needSummary = allItems.filter((i: any) => !i.tldr && i.title);
  console.log(`[RSS] Summarizing ${needSummary.length}/${allItems.length} items...`);

  let count = 0;
  await runBatch(needSummary, async (item: any) => {
    const input = `Title: ${item.title}\nSource: ${item.source}\n\n${item.description || ''}`;
    item.tldr = await summarize(input);
    count++;
  }, CONCURRENCY);

  console.log(`  ${count} new summaries`);
  saveData('rss.json', data);
}

async function summarizeGitHub(): Promise<void> {
  const data = loadJson('github.json');
  if (!data?.repos?.length) return;
  console.log(`[GitHub] Summarizing ${data.repos.length} repos...`);

  let count = 0;
  await runBatch(data.repos, async (r: any) => {
    if (r.tldr) return;
    const input = `Repository: ${r.fullName}\nLanguage: ${r.language}\nTopics: ${(r.topics ?? []).join(', ')}\n\n${r.description || ''}`;
    r.tldr = await summarize(input);
    count++;
  }, CONCURRENCY);

  console.log(`  ${count} new summaries`);
  saveData('github.json', data);
}

// ---- main ----

async function main() {
  if (!process.env.OPENAI_API_KEY) {
    console.log('[Summarize] OPENAI_API_KEY not set, skipping TL;DR generation');
    return;
  }

  client = new OpenAI();
  console.log('=== TL;DR Summarization ===\n');
  const start = Date.now();

  await Promise.all([
    summarizeArxiv(),
    summarizeRSS(),
    summarizeGitHub(),
  ]);

  console.log(`\nDone in ${Date.now() - start}ms`);
}

main();
