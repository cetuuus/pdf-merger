export default defineNuxtConfig({
  compatibilityDate: '2025-02-20',
  devtools: { enabled: true },

  modules: [
    '@nuxthub/core',
    '@nuxtjs/tailwindcss',
    '@nuxt/eslint'
  ],

  // Configuration d'ESLint pour un code propre
  eslint: {
    config: {
      stylistic: {
        indent: 2,
        quotes: 'single',
        semi: false,
        commaDangle: 'never'
      }
    }
  },

  // Configuration NuxtHub (pas besoin de base de données ni de stockage R2 ici,
  // tout se fait en mémoire vive dans le Worker Cloudflare)
  hub: {}
})