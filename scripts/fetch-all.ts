import { fetchArxiv } from './fetchers/arxiv.js';
import { fetchHuggingFace } from './fetchers/huggingface.js';
import { fetchGitHub } from './fetchers/github.js';
import { fetchRSS } from './fetchers/rss.js';
import { fetchGoogleTrends } from './fetchers/google-trends.js';
import { fetchStocks } from './fetchers/stocks.js';

interface FetchResult {
  name: string;
  status: 'success' | 'error';
  error?: string;
  durationMs: number;
}

async function runFetcher(
  name: string,
  fn: () => Promise<void>
): Promise<FetchResult> {
  const start = Date.now();
  try {
    await fn();
    return { name, status: 'success', durationMs: Date.now() - start };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`[${name}] ERROR: ${msg}`);
    return { name, status: 'error', error: msg, durationMs: Date.now() - start };
  }
}

async function main() {
  console.log('=== AI Research Dashboard - Data Fetch ===\n');
  const start = Date.now();

  // Run all fetchers in parallel - each is independent
  const results = await Promise.all([
    runFetcher('arXiv', fetchArxiv),
    runFetcher('HuggingFace', fetchHuggingFace),
    runFetcher('GitHub', fetchGitHub),
    runFetcher('RSS', fetchRSS),
    runFetcher('Google Trends', fetchGoogleTrends),
    runFetcher('Stocks', fetchStocks),
  ]);

  console.log('\n=== Results ===');
  for (const r of results) {
    const icon = r.status === 'success' ? '✓' : '✗';
    console.log(`  ${icon} ${r.name}: ${r.status} (${r.durationMs}ms)`);
    if (r.error) console.log(`    Error: ${r.error}`);
  }

  const failed = results.filter(r => r.status === 'error');
  const totalMs = Date.now() - start;
  console.log(`\nTotal: ${totalMs}ms | ${results.length - failed.length}/${results.length} succeeded`);

  // Exit with error if ALL fetchers failed
  if (failed.length === results.length) {
    process.exit(1);
  }
}

main();
