import { saveJson, isoNow } from '../utils.js';

interface StockQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

interface StockCategory {
  name: string;
  id: string;
  stocks: StockQuote[];
}

const STOCK_GROUPS = [
  {
    name: 'AI半導体',
    id: 'semiconductor',
    symbols: [
      { symbol: 'NVDA', name: 'NVIDIA' },
      { symbol: 'AMD', name: 'AMD' },
      { symbol: 'INTC', name: 'Intel' },
      { symbol: 'QCOM', name: 'Qualcomm' },
      { symbol: 'AVGO', name: 'Broadcom' },
      { symbol: 'TSM', name: 'TSMC' },
      { symbol: 'ARM', name: 'Arm Holdings' },
    ],
  },
  {
    name: 'ビッグテック',
    id: 'bigtech',
    symbols: [
      { symbol: 'MSFT', name: 'Microsoft' },
      { symbol: 'GOOGL', name: 'Alphabet' },
      { symbol: 'META', name: 'Meta' },
      { symbol: 'AMZN', name: 'Amazon' },
      { symbol: 'AAPL', name: 'Apple' },
    ],
  },
  {
    name: 'AI特化',
    id: 'ai-pure',
    symbols: [
      { symbol: 'PLTR', name: 'Palantir' },
      { symbol: 'AI', name: 'C3.ai' },
      { symbol: 'SNOW', name: 'Snowflake' },
      { symbol: 'PATH', name: 'UiPath' },
      { symbol: 'DDOG', name: 'Datadog' },
    ],
  },
];

async function fetchQuote(symbol: string): Promise<{ price: number; prevClose: number } | null> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const meta = data.chart?.result?.[0]?.meta;
    if (!meta) return null;
    return {
      price: meta.regularMarketPrice ?? 0,
      prevClose: meta.chartPreviousClose ?? 0,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchStocks(): Promise<void> {
  console.log('[Stocks] Fetching AI-related stock prices...');

  const allSymbols = STOCK_GROUPS.flatMap(g => g.symbols);
  const quotes = new Map<string, { price: number; prevClose: number }>();

  // Fetch in batches of 5 to avoid rate limiting
  for (let i = 0; i < allSymbols.length; i += 5) {
    const batch = allSymbols.slice(i, i + 5);
    const results = await Promise.all(
      batch.map(async (s) => {
        const q = await fetchQuote(s.symbol);
        return { symbol: s.symbol, quote: q };
      })
    );
    for (const r of results) {
      if (r.quote) quotes.set(r.symbol, r.quote);
    }
    // Small delay between batches
    if (i + 5 < allSymbols.length) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  console.log(`  Fetched ${quotes.size}/${allSymbols.length} quotes`);

  const categories: StockCategory[] = STOCK_GROUPS.map(group => ({
    name: group.name,
    id: group.id,
    stocks: group.symbols.map(s => {
      const q = quotes.get(s.symbol);
      const price = q?.price ?? 0;
      const change = price - (q?.prevClose ?? 0);
      const changePercent = q?.prevClose ? (change / q.prevClose) * 100 : 0;
      return {
        symbol: s.symbol,
        name: s.name,
        price,
        change,
        changePercent,
      };
    }),
  }));

  saveJson('stocks.json', {
    updatedAt: isoNow(),
    categories,
  });
}
