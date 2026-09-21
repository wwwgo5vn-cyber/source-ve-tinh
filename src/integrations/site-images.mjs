/**
 * Brand/OG từ public/images + ảnh bài từ assets/<siteId>/images/.
 * Dev: serve assets/<siteId>/images tại /images/*
 * Build: copy vào dist/<siteId>/images
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const MIME = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.avif': 'image/avif',
}

function copyIfExists(from, to) {
  if (!fs.existsSync(from)) return false
  fs.mkdirSync(path.dirname(to), { recursive: true })
  fs.copyFileSync(from, to)
  return true
}

function copyArticleImages(siteId, imagesOut) {
  const assetsDir = path.resolve('assets', siteId, 'images')
  if (!fs.existsSync(assetsDir)) return []

  const copied = []
  for (const name of fs.readdirSync(assetsDir)) {
    if (name === '.gitkeep' || name === 'README.md') continue
    const from = path.join(assetsDir, name)
    if (!fs.statSync(from).isFile()) continue
    if (!/\.(jpe?g|png|webp|gif|svg|avif)$/i.test(name)) continue
    copyIfExists(from, path.join(imagesOut, name))
    copied.push(name)
  }
  return copied
}

function safeImageName(urlPath) {
  const raw = decodeURIComponent((urlPath || '').split('?')[0])
  const name = path.basename(raw)
  if (!name || name !== raw.replace(/^\/+/, '').split('/').pop()) return null
  if (name.includes('..')) return null
  if (!/\.(jpe?g|png|webp|gif|svg|avif)$/i.test(name)) return null
  return name
}

export function siteImages(siteId) {
  const assetsDir = path.resolve('assets', siteId, 'images')

  return {
    name: 'site-images',
    hooks: {
      'astro:server:setup': ({ server }) => {
        server.middlewares.use((req, res, next) => {
          if (!req.url?.startsWith('/images/')) return next()

          const rel = req.url.slice('/images/'.length)
          // brand/OG vẫn lấy từ public/images qua Astro mặc định
          if (rel.startsWith('og/') || rel === 'logo.png' || rel === 'avatar.jpg') {
            return next()
          }

          const name = safeImageName(rel)
          if (!name) return next()

          const file = path.join(assetsDir, name)
          if (!fs.existsSync(file) || !fs.statSync(file).isFile()) return next()

          const ext = path.extname(name).toLowerCase()
          res.statusCode = 200
          res.setHeader('Content-Type', MIME[ext] || 'application/octet-stream')
          res.setHeader('Cache-Control', 'no-cache')
          fs.createReadStream(file).pipe(res)
        })
        console.log(`[site-images] dev: /images/* ← assets/${siteId}/images/`)
      },

      'astro:build:done': async ({ dir }) => {
        const outRoot = fileURLToPath(dir)
        const imagesOut = path.join(outRoot, 'images')
        const imagesSrc = path.resolve('public/images')

        if (fs.existsSync(imagesOut)) {
          fs.rmSync(imagesOut, { recursive: true, force: true })
        }
        fs.mkdirSync(path.join(imagesOut, 'og'), { recursive: true })

        const kept = []
        for (const rel of ['logo.png', 'avatar.jpg', `og/${siteId}.jpg`]) {
          if (copyIfExists(path.join(imagesSrc, rel), path.join(imagesOut, rel))) {
            kept.push(rel)
          }
        }

        const articles = copyArticleImages(siteId, imagesOut)
        console.log(
          `[site-images] ${siteId}: brand [${kept.join(', ') || 'none'}] + articles [${articles.join(', ') || 'none'}]`
        )
      },
    },
  }
}
