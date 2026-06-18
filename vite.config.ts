import { defineConfig } from 'vite'
import type { Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer'
import sharp from 'sharp'

const LARGE_IMAGE_THRESHOLD_BYTES = 500 * 1024
const LARGE_IMAGE_MAX_WIDTH = 1600

const resizeLargeStaticImages = (): Plugin => ({
  name: 'resize-large-static-images',
  apply: 'build',
  async generateBundle(_, bundle) {
    await Promise.all(Object.values(bundle).map(async (asset) => {
      if (asset.type !== 'asset' || !/\.(png|jpe?g)$/i.test(asset.fileName)) return

      const source = typeof asset.source === 'string'
        ? Buffer.from(asset.source)
        : Buffer.from(asset.source)

      if (source.length <= LARGE_IMAGE_THRESHOLD_BYTES) return

      try {
        const image = sharp(source).rotate()
        const metadata = await image.metadata()
        const resized = metadata.width && metadata.width > LARGE_IMAGE_MAX_WIDTH
          ? image.resize({ width: LARGE_IMAGE_MAX_WIDTH, withoutEnlargement: true })
          : image

        const optimized = /\.(jpe?g)$/i.test(asset.fileName)
          ? await resized.jpeg({ quality: 78, progressive: true, mozjpeg: true }).toBuffer()
          : await resized.png({ quality: 80, compressionLevel: 9, adaptiveFiltering: true }).toBuffer()

        if (optimized.length < source.length) {
          asset.source = optimized
        }
      } catch {
        // Keep the original asset when sharp cannot decode an image.
      }
    }))
  },
})

export default defineConfig({
  plugins: [
    react(),
    ViteImageOptimizer({
      png: { quality: 80 },
      jpeg: { quality: 80 },
      jpg: { quality: 80 },
      webp: { quality: 80 },
    }),
    resizeLargeStaticImages(),
  ],
  build: {
    rollupOptions: {
      output: {
        assetFileNames: 'assets/[hash][extname]',
      },
    },
  },
  server: {
    proxy: {
      '/api': {
        target: process.env.VITE_BACKEND_PROXY_TARGET || 'http://127.0.0.1:18081',
        changeOrigin: true,
      },
      '/uploads': {
        target: process.env.VITE_BACKEND_PROXY_TARGET || 'http://127.0.0.1:18081',
        changeOrigin: true,
      },
    },
  },
})
