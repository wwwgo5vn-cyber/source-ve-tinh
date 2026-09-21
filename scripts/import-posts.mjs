/**
 * import-posts.mjs
 * Batch import file .txt (nội dung markdown) → .md trong src/content/posts/
 *
 * Cách dùng:
 *   node scripts/import-posts.mjs
 *   node scripts/import-posts.mjs --input=./my-folder --force
 *
 * Options:
 *   --site=<id>     Satellite site (bắt buộc, hoặc env SITE)
 *   --input=<dir>   Thư mục chứa file .txt (mặc định: ./import)
 *   --force         Ghi đè file đã tồn tại
 *   --dry-run       Chỉ in ra kết quả, không ghi file
 */

import fs   from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const args = Object.fromEntries(
  process.argv.slice(2).map(a => {
    const [k, v] = a.replace(/^--/, '').split('=')
    return [k, v ?? true]
  })
)

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const registry = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/config/sites.json'), 'utf-8'))
const siteArg = String(args.site ?? process.env.SITE ?? '').trim().toLowerCase()
const site = registry.sites.find((s) => s.id === siteArg || s.domain === siteArg)

if (!site) {
  console.error('Thiếu --site=<id>. Ví dụ: npm run import -- --site=befine')
  console.error(`Danh sách: ${registry.sites.map((s) => s.id).join(', ')}`)
  process.exit(1)
}

const INPUT_DIR  = path.resolve(args.input ?? './import')
const OUTPUT_DIR = path.join(ROOT, 'src/content/posts', site.id)
const FORCE      = Boolean(args.force)
const DRY_RUN    = Boolean(args['dry-run'])

const MAX_TITLE_LEN   = 60
const MAX_EXCERPT_LEN = 160
const MIN_WORD_COUNT  = 300

function slugify(str) {
  return str
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd').replace(/Đ/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

function parseMeta(content) {
  const meta = {}
  const pattern = /<!--\s*(\w+)\s*:\s*([\s\S]*?)\s*-->/g
  let m
  while ((m = pattern.exec(content)) !== null) {
    meta[m[1].toLowerCase()] = m[2].trim()
  }
  return meta
}

function stripMeta(content) {
  return content.replace(/<!--[\s\S]*?-->/g, '').trimStart()
}

function extractTitle(content) {
  const m = content.match(/^# (.+)$/m)
  return m ? m[1].trim() : null
}

function extractExcerpt(content) {
  const lines = content.split('\n')
  let inCode = false
  const paras = []
  let current = []

  for (const line of lines) {
    if (line.startsWith('```')) { inCode = !inCode; continue }
    if (inCode) continue
    if (line.startsWith('#')) { if (current.length) { paras.push(current.join(' ')); current = [] }; continue }
    if (line.trim() === '') { if (current.length) { paras.push(current.join(' ')); current = [] }; continue }
    current.push(line.trim())
  }
  if (current.length) paras.push(current.join(' '))

  const text = paras.find(p => p.length > 30) ?? paras[0] ?? ''
  const clean = text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .trim()

  return clean.length > 155 ? clean.slice(0, 152) + '...' : clean
}

function extractTags(content) {
  const h2 = [...content.matchAll(/^## (.+)$/gm)]
    .map(m => slugify(m[1]))
    .filter(t => t.length >= 3)
    .slice(0, 5)
  return h2.length ? h2 : ['blog']
}

function countWords(content) {
  const clean = content
    .replace(/```[\s\S]*?```/g, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/[*_`~[\]()>|#]/g, ' ')
  return clean.trim().split(/\s+/).filter(w => w.length > 0).length
}

function seoWarnings(title, excerpt, wordCount, outName) {
  const warnings = []
  if (title.length > MAX_TITLE_LEN)
    warnings.push(`       ⚠️  Title dài ${title.length} ký tự (khuyến nghị ≤${MAX_TITLE_LEN})`)
  if (excerpt.length > MAX_EXCERPT_LEN)
    warnings.push(`       ⚠️  Excerpt dài ${excerpt.length} ký tự (khuyến nghị ≤${MAX_EXCERPT_LEN})`)
  if (wordCount < MIN_WORD_COUNT)
    warnings.push(`       ⚠️  Thin content: chỉ ~${wordCount} từ (khuyến nghị ≥${MIN_WORD_COUNT})`)
  if (warnings.length > 0) {
    console.log(`       SEO warnings:`)
    warnings.forEach(w => console.log(w))
  }
  return warnings.length > 0
}

// ── Main ──────────────────────────────────────────────────────────────────────

if (!fs.existsSync(INPUT_DIR)) {
  console.error(`Khong tim thay thu muc input: ${INPUT_DIR}`)
  process.exit(1)
}

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })
}

const files = fs.readdirSync(INPUT_DIR).filter(f => f.endsWith('.txt'))

if (files.length === 0) {
  console.log(`Khong co file .txt nao trong ${INPUT_DIR}`)
  process.exit(0)
}

const today = new Date().toISOString().split('T')[0]
let created = 0, skipped = 0, errors = 0, warned = 0

console.log(`\nSite  : ${site.id} (https://${site.domain})`)
console.log(`Input : ${INPUT_DIR}`)
console.log(`Output: ${OUTPUT_DIR}`)
console.log(`Tim thay ${files.length} file .txt\n`)
if (DRY_RUN) console.log('DRY-RUN mode\n')

for (const file of files) {
  const raw  = fs.readFileSync(path.join(INPUT_DIR, file), 'utf-8')
  const meta = parseMeta(raw)
  const body = stripMeta(raw)

  const titleRaw = meta.title ?? extractTitle(body)
  const title    = titleRaw ?? path.basename(file, '.txt').replace(/-/g, ' ')
  const excerpt  = meta.excerpt ?? extractExcerpt(body)
  const tagsRaw  = meta.tags ?? extractTags(body).join(', ')
  const tags     = tagsRaw.split(',').map(t => t.trim()).filter(Boolean)
  const cover    = meta.cover ?? ''
  const date     = meta.date ?? today
  const wordCount = countWords(body)

  const slug    = slugify(path.basename(file, '.txt'))
  const outName = `${slug}.md`
  const outPath = path.join(OUTPUT_DIR, outName)

  if (fs.existsSync(outPath) && !FORCE) {
    console.log(`  SKIP  ${outName}`)
    skipped++
    continue
  }

  const frontmatter = [
    '---',
    `title: "${title.replace(/"/g, '\\"')}"`,
    `date: "${date}"`,
    `tags: [${tags.map(t => `"${t}"`).join(', ')}]`,
    `excerpt: "${excerpt.replace(/"/g, '\\"')}"`,
    ...(cover ? [`cover: "${cover}"`] : []),
    'draft: false',
    '---',
  ].join('\n')

  let appendix = ''

  // FAQ
  if (meta.faq) {
    const pairs = meta.faq.split(',').map(s => s.trim()).filter(Boolean)
    const faqs = pairs.map(p => {
      const [q, a] = p.split('|').map(s => s.trim())
      return { q, a }
    }).filter(f => f.q && f.a)

    if (faqs.length > 0) {
      const faqHtml = faqs.map(f =>
        `<div class="faq-item">\n<h3 class="faq-item__q">${f.q}</h3>\n<p class="faq-item__a">${f.a}</p>\n</div>`
      ).join('\n')
      appendix += `\n\n<div class="faq-section">\n<h2 class="faq-section__title">Câu hỏi thường gặp</h2>\n${faqHtml}\n</div>`

      const faqSchema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": faqs.map(f => ({
          "@type": "Question",
          "name": f.q,
          "acceptedAnswer": { "@type": "Answer", "text": f.a }
        }))
      }
      appendix += `\n\n<script type="application/ld+json">\n${JSON.stringify(faqSchema, null, 2)}\n</script>`
    }
  }

  // Internal links
  if (meta.internal_links) {
    const links = meta.internal_links.split(',').map(s => s.trim()).filter(Boolean)
    const items = links.map(l => {
      const [url, label] = l.split('|').map(s => s.trim())
      return `<li><a href="${url}">${label || url}</a></li>`
    }).join('\n')
    appendix += `\n\n<div class="internal-links">\n<h2 class="internal-links__title">Bài viết liên quan</h2>\n<ul>\n${items}\n</ul>\n</div>`
  }

  // Xem them
  if (meta.xem_them) {
    const links = meta.xem_them.split(',').map(s => s.trim()).filter(Boolean)
    const btns = links.map(l => {
      const [url, label] = l.split('|').map(s => s.trim())
      return `<div class="xem-them-box__item">• <a href="${url}" target="_blank" rel="noopener noreferrer" class="xem-them-box__link">${label || url}</a></div>`
    }).join('\n')
    appendix += `\n\n<div class="xem-them-box">\n<p class="xem-them-box__title">🛒 Xem hàng tại Go5</p>\n<div class="xem-them-box__links">\n${btns}\n</div>\n</div>`
  }

  // Xóa dòng # Title khỏi body (tránh H1 trùng với title frontmatter)
  const bodyClean = body.trimStart().replace(/^# .+\n?/, '')

  const output = frontmatter + '\n\n' + bodyClean + appendix

  if (DRY_RUN) {
    console.log(`  [DRY] ${outName} — title: ${title}`)
    created++
    continue
  }

  try {
    fs.writeFileSync(outPath, output, 'utf-8')
    console.log(`  OK  ${outName}`)
    console.log(`      title  : ${title}`)
    console.log(`      tags   : ${tags.join(', ')}`)
    console.log(`      excerpt: ${excerpt.slice(0, 60)}...`)
    console.log(`      words  : ~${wordCount}`)
    const hasWarning = seoWarnings(title, excerpt, wordCount, outName)
    if (hasWarning) warned++
    console.log()
    created++
  } catch (e) {
    console.error(`  LOI khi ghi ${outName}: ${e.message}`)
    errors++
  }
}

console.log('--------------------------------------------------')
console.log(`Tao moi: ${created}   Bo qua: ${skipped}   Loi: ${errors}   Canh bao SEO: ${warned}`)
console.log(`Chay "npm run build -- ${site.id}" de build lai site.`)
