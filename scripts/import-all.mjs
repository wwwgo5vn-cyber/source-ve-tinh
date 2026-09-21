/**
 * Import mọi thư mục import/<site-id>/*.txt → posts của site tương ứng.
 *
 * Usage:
 *   node scripts/import-all.mjs
 *   node scripts/import-all.mjs --force
 *   node scripts/import-all.mjs --dry-run
 */
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const registry = JSON.parse(fs.readFileSync(path.join(root, 'src/config/sites.json'), 'utf-8'))
const importRoot = path.join(root, 'import')
const extra = process.argv.slice(2).filter((a) => a.startsWith('--'))

const siteIds = new Set(registry.sites.map((s) => s.id))
const dirs = fs.existsSync(importRoot)
  ? fs.readdirSync(importRoot, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name)
  : []

const targets = dirs.filter((id) => siteIds.has(id))
const unknown = dirs.filter((id) => !siteIds.has(id))

if (unknown.length) {
  console.warn(`Bỏ qua thư mục không khớp site: ${unknown.join(', ')}`)
}

if (targets.length === 0) {
  console.log('Không có import/<site-id>/ nào để chạy.')
  process.exit(0)
}

let failed = 0
for (const id of targets) {
  const input = path.join(importRoot, id)
  console.log(`\n========== IMPORT ${id} ==========`)
  const result = spawnSync(
    process.execPath,
    [path.join(root, 'scripts/import-posts.mjs'), `--site=${id}`, `--input=${input}`, ...extra],
    { cwd: root, stdio: 'inherit' }
  )
  if (result.status !== 0) failed++
}

console.log('\n--------------------------------------------------')
console.log(`Import xong ${targets.length - failed}/${targets.length} thư mục site.`)
if (failed > 0) process.exit(1)
