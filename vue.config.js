const { defineConfig } = require('@vue/cli-service');
module.exports = defineConfig({
  transpileDependencies: true,
  publicPath: process.env.NODE_ENV === 'production' ? '/vue3/' : '/',
  pwa: {
    name: 'Rainbow Manager',
    themeColor: '#42b883',
    msTileColor: '#000000',
    manifestOptions: {
      short_name: 'RM',
      start_url: '/vue3/',
      display: 'standalone',
      background_color: '#ffffff',
      icons: [
        {
          src: 'icons/rainbow-192.png',
          sizes: '192x192',
          type: 'image/png',
        },
        {
          src: 'icons/rainbow.png',
          sizes: '512x512',
          type: 'image/png',
        },
      ],
    },
    workboxOptions: {
      skipWaiting: true,
      clientsClaim: true,
    },
  },
});
