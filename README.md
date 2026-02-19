<p align="center">
  <img src="docs/hero.png" alt="AI Research Dashboard" width="600" />
</p>

<h1 align="center">AI Research Dashboard</h1>

<p align="center">
  A curated dashboard for the latest AI/ML papers, models, repos, trends, and news.<br/>
  Auto-updated every hour via GitHub Actions.<br/><br/>
  AI/ML の最新論文・モデル・リポジトリ・トレンド・ニュースを集約するダッシュボード。<br/>
  GitHub Actions により毎時自動更新。
</p>

<p align="center">
  <a href="https://ai.m96-chan.dev">Live Site</a> &bull;
  <a href="https://github.com/m96-chan/ai_research_dashboard/issues/new">Request a Feature / 機能リクエスト</a> &bull;
  <a href="https://www.buymeacoffee.com/m96chan">Buy Me a Coffee</a>
</p>

---

## What's Inside / コンテンツ

| Source | Description / 説明 |
|--------|-------------|
| **arXiv** | Latest papers from cs.AI, cs.LG, cs.CL, cs.CV, stat.ML / AI 関連の最新論文 |
| **HuggingFace** | Trending models & datasets / トレンドのモデルとデータセット |
| **GitHub** | Newly starred AI/ML repositories / 注目の AI/ML リポジトリ |
| **RSS Feeds** | Global & Japan AI news, Hardware, Security (YAML configurable) / 国内外の AI ニュース、ハードウェア、セキュリティ |
| **Google Trends** | Tech trending topics from US, Japan, South Korea / 米・日・韓のテック急上昇ワード |
| **Stock Prices** | AI-related stocks (Semiconductors, Big Tech, AI Pure-Play) / AI 関連銘柄の株価 |
| **TL;DR** | Japanese summaries by GPT-4o-mini / GPT-4o-mini による日本語要約 |

## Tech Stack / 技術スタック

- **Framework:** [Astro](https://astro.build) + Tailwind CSS v4
- **Data Fetching:** TypeScript scripts on GitHub Actions (cron every 60 min)
- **Summarization:** OpenAI GPT-4o-mini
- **Hosting:** GitHub Pages

## Getting Started / はじめかた

```bash
pnpm install
pnpm run fetch-data      # Fetch all data sources / データ取得
pnpm run summarize       # Generate TL;DR (requires OPENAI_API_KEY) / 要約生成
pnpm dev                 # Start dev server at localhost:4321 / 開発サーバー起動
```

## Add / Edit RSS Feeds / RSS フィードの追加・編集

Edit `config/feeds.yml` to add your own feeds:

`config/feeds.yml` を編集してフィードを追加できます：

```yaml
categories:
  - name: Global AI & Tech
    feeds:
      - name: OpenAI Blog
        url: https://openai.com/blog/rss.xml
      - name: Google AI Blog
        url: https://blog.google/technology/ai/rss/
```

## Want a New Feature? / 機能リクエスト

Got an idea? Found a bug? We'd love to hear from you!

アイデアやバグ報告、大歓迎です！

**[Open an Issue / Issue を作成する](https://github.com/m96-chan/ai_research_dashboard/issues/new)**

## Support / サポート

This dashboard uses the OpenAI API to generate TL;DR summaries, which costs real money to run. If you find this useful, a small donation would be greatly appreciated!

このダッシュボードは TL;DR 要約の生成に OpenAI API を利用しており、API 利用料が発生しています。もし役に立っていたら、カンパしていただけるとめちゃくちゃ助かります！

**[Buy Me a Coffee](https://www.buymeacoffee.com/m96chan)**

## License

MIT
