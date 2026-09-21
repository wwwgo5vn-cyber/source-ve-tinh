/**
 * Chạy astro dev/build/preview cho 1 satellite site.
 *   node scripts/run-site.mjs build befine
 *   node scripts/run-site.mjs dev calmlife
 */
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const registry = JSON.parse(fs.readFileSync(path.join(root, 'src/config/sites.json'), 'utf-8'))

const cmd = process.argv[2]
const requested = (process.argv[3] || process.env.SITE || registry.defaultSite || '').trim().toLowerCase()

if (!cmd || !['dev', 'build', 'preview'].includes(cmd)) {
  console.error('Cách dùng: node scripts/run-site.mjs <dev|build|preview> <site-id>')
  process.exit(1)
}

const site = registry.sites.find((s) => s.id === requested || s.domain === requested)
if (!site) {
  console.error(`SITE không hợp lệ: "${requested}"`)
  console.error(`Danh sách: ${registry.sites.map((s) => s.id).join(', ')}`)
  process.exit(1)
}

console.log(`[${cmd}] ${site.id} → https://${site.domain}`)
if (cmd === 'dev') {
  console.log(`[${cmd}] Ảnh bài: assets/${site.id}/images/ (localhost /images/...)`)
}
if (cmd === 'preview') {
  console.log(`[${cmd}] Phục vụ dist/${site.id}/ — cần build trước`)
}

const child = spawn('npx', ['astro', cmd], {
  cwd: root,
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, SITE: site.id },
})

child.on('exit', (code) => process.exit(code ?? 1))
