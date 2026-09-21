/**
 * Staging ảnh bài: assets/<site-id>/images/
 * So khớp đường dẫn /images/... trong markdown với file local.
 *
 * Usage:
 *   node scripts/check-images.mjs              # mọi site
 *   node scripts/check-images.mjs 9seed
 *   node scripts/check-images.mjs --init       # tạo thư mục 15 site
 * Build tự copy assets/<id>/images → dist/<id>/images (mọi site).
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const registry = JSON.parse(fs.readFileSync(path.join(root, 'src/config/sites.json'), 'utf-8'))

const args = process.argv.slice(2)
const doInit = args.includes('--init')
const only = args.find((a) => !a.startsWith('--'))?.trim().toLowerCase() || ''

const sites = only
  ? registry.sites.filter((s) => s.id === only || s.domain === only)
  : registry.sites

if (sites.length === 0) {
  console.error(`Không khớp site nào với "${only}"`)
  process.exit(1)
}

const BRAND = new Set(['logo.png', 'avatar.jpg'])
const IMG_RE = /\/images\/([a-zA-Z0-9._-]+\.(?:jpe?g|png|webp|gif))/gi

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true })
  const keep = path.join(dir, '.gitkeep')
  if (!fs.existsSync(keep)) fs.writeFileSync(keep, '')
}

function walkMd(dir, out = []) {
  if (!fs.existsSync(dir)) return out
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name)
    if (ent.isDirectory()) walkMd(p, out)
    else if (/\.(md|mdx|txt)$/i.test(ent.name)) out.push(p)
  }
  return out
}

function refsInFile(file) {
  const text = fs.readFileSync(file, 'utf-8')
  const names = new Set()
  for (const m of text.matchAll(IMG_RE)) {
    const name = m[1]
    if (BRAND.has(name)) continue
    if (name.startsWith('og/')) continue
    names.add(name)
  }
  return names
}

function listFiles(dir) {
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir).filter((n) => {
    if (n === '.gitkeep' || n === 'README.md') return false
    const full = path.join(dir, n)
    return fs.statSync(full).isFile()
  })
}

if (doInit) {
  for (const site of registry.sites) {
    ensureDir(path.join(root, 'assets', site.id, 'images'))
  }
  console.log(`Đã tạo assets/<id>/images cho ${registry.sites.length} site.`)
}

let missingTotal = 0
let orphanTotal = 0

for (const site of sites) {
  const assetsDir = path.join(root, 'assets', site.id, 'images')
  ensureDir(assetsDir)

  const postsDir = path.join(root, 'src/content/posts', site.id)
  const files = walkMd(postsDir)
  const needed = new Set()
  for (const f of files) {
    for (const n of refsInFile(f)) needed.add(n)
  }

  const present = new Set(listFiles(assetsDir))
  const missing = [...needed].filter((n) => !present.has(n)).sort()
  const orphans = [...present].filter((n) => !needed.has(n)).sort()

  console.log(`\n========== ${site.id} (${site.domain}) ==========`)
  console.log(`Staging: assets/${site.id}/images/ → dist/${site.id}/images/ (khi build)`)
  console.log(`Host: https://${site.domain}/images/`)
  console.log(`Bài markdown: ${files.length} | Ảnh cần: ${needed.size}`)

  if (needed.size === 0) {
    console.log('  (chưa có bài / chưa tham chiếu ảnh)')
  } else {
    for (const n of [...needed].sort()) {
      const ok = present.has(n)
      console.log(`  ${ok ? 'OK   ' : 'THIEU'}  ${n}`)
      if (!ok) missingTotal++
    }
  }

  if (orphans.length) {
    orphanTotal += orphans.length
    console.log('  Thừa (không thấy trong markdown):')
    for (const n of orphans) console.log(`  THUA  ${n}`)
  }

  const distImg = path.join(root, 'dist', site.id, 'images')
  if (fs.existsSync(distImg) && needed.size > 0) {
    const inDist = new Set(listFiles(distImg))
    const notInDist = [...needed].filter((n) => !inDist.has(n))
    if (notInDist.length) {
      console.log('  Dist chưa có (chạy npm run build -- ' + site.id + '):')
      for (const n of notInDist) console.log(`    ${n}`)
    } else {
      console.log('  Dist: đã có đủ ảnh bài')
    }
  }
}

console.log('\n--------------------------------------------------')
console.log(`Thiếu: ${missingTotal} | Thừa: ${orphanTotal}`)
if (missingTotal > 0) process.exit(1)
