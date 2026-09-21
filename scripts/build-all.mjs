/**
 * Build lần lượt 15 satellite site → dist/<site-id>/
 */
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const registry = JSON.parse(fs.readFileSync(path.join(root, 'src/config/sites.json'), 'utf-8'))

const only = (process.argv[2] || '').trim().toLowerCase()
const sites = only
  ? registry.sites.filter((s) => s.id === only || s.domain === only)
  : registry.sites

if (sites.length === 0) {
  console.error(`Không khớp site nào với "${only}"`)
  process.exit(1)
}

let failed = 0
for (const site of sites) {
  console.log(`\n========== BUILD ${site.id} → https://${site.domain} ==========`)
  const result = spawnSync('npx', ['astro', 'build'], {
    cwd: root,
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, SITE: site.id },
  })
  if (result.status !== 0) {
    console.error(`FAIL ${site.id}`)
    failed++
  }
}

console.log('\n--------------------------------------------------')
console.log(`Xong ${sites.length - failed}/${sites.length} site. Output: dist/<site-id>/`)
if (failed > 0) process.exit(1)
