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
    },
    workboxOptions: {
      skipWaiting: true,
    },
  },
});
