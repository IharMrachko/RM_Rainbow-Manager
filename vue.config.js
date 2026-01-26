const { defineConfig } = require('@vue/cli-service');
module.exports = defineConfig({
  transpileDependencies: true,
  publicPath: process.env.NODE_ENV === 'production' ? '/RM_Rainbow-Manager/' : '/',
  pwa: {
    name: 'Rainbow Manager',
    themeColor: '#42b883',
    msTileColor: '#000000',
    manifestOptions: {
      short_name: 'RM',
      start_url: '/RM_Rainbow-Manager/',
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
  configureWebpack: {
    module: {
      rules: [
        {
          test: /\.(pdf)(\?.*)?$/,
          type: 'asset/resource',
          generator: {
            filename: 'assets/pdf/[name].[hash:8][ext]',
          },
        },
      ],
    },
  },
});
