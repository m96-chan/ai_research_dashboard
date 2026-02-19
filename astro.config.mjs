// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://m96-chan.github.io',
  base: '/ai_research_dashboard',
  vite: {
    plugins: [tailwindcss()]
  }
});
