import { defineConfig } from 'vite';
import { readdirSync } from 'node:fs';
import { resolve } from 'node:path';

const rootDir = process.cwd();
const htmlEntries = Object.fromEntries(
  readdirSync(rootDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.html'))
    .map((entry) => [entry.name.replace(/\.html$/, ''), resolve(rootDir, entry.name)])
);

export default defineConfig({
  base: '/The-Bloom-Forward/',
  build: {
    rollupOptions: {
      input: htmlEntries,
    },
  },
});
