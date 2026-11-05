import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';
import devOauthMock from './scripts/dev-oauth-mock.mjs';

export default defineConfig({
  site: 'https://billotais.ch',
  redirects: {
    '/collections': '/',
    '/gaming': '/elca-gaming',
    '/fr/collections': '/fr/',
    '/fr/gaming': '/fr/elca-gaming',
  },
  integrations: [svelte()],
  devToolbar: { enabled: false },
  vite: { plugins: [devOauthMock()] },
});
