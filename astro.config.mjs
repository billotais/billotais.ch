import { defineConfig } from 'astro/config';
import devOauthMock from './scripts/dev-oauth-mock.mjs';

export default defineConfig({
  site: 'https://billotais.ch',
  redirects: { '/collections': '/' },
  vite: { plugins: [devOauthMock()] },
});
