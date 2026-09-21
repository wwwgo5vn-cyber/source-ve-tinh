import { defineConfig } from 'astro/config'
import mdx from '@astrojs/mdx'
import { remarkLazyImages } from './src/plugins/remark-lazy-images.mjs'
import { getSite } from './src/config/site.ts'
import { siteImages } from './src/integrations/site-images.mjs'

const site = getSite()

console.log(`[astro] site=${site.id} origin=${site.origin} outDir=dist/${site.id}`)

export default defineConfig({
  site: site.origin,
  outDir: `dist/${site.id}`,
  output: 'static',
  integrations: [
    mdx(),
    siteImages(site.id),
  ],
  markdown: {
    remarkPlugins: [remarkLazyImages],
    shikiConfig: {
      theme: 'github-light',
      wrap: true
    }
  }
})
