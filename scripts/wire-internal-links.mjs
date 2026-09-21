/**
 * Gắn <!-- internal_links --> chéo giữa các bài SEO vệ tinh.
 * Chạy: node scripts/wire-internal-links.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

const posts = [
  { site: 'befine', file: 'rua-binh-sua-pigeon.txt', slug: 'rua-binh-sua-pigeon', label: 'Rửa bình sữa Pigeon' },
  { site: '9signal', file: 'nap-binh-sua-pigeon-co-hep.txt', slug: 'nap-binh-sua-pigeon-co-hep', label: 'Nắp bình sữa Pigeon cổ hẹp' },
  { site: '9seed', file: 'so-sanh-binh-sua-pigeon-va-moyuum.txt', slug: 'so-sanh-binh-sua-pigeon-va-moyuum', label: 'So sánh bình sữa Pigeon và Moyuum' },
  { site: 'calmlife', file: 'cach-gan-van-chong-sac-binh-sua-pigeon.txt', slug: 'cach-gan-van-chong-sac-binh-sua-pigeon', label: 'Cách gắn van chống sặc bình sữa Pigeon' },
  { site: 'goodfeel', file: 'huong-dan-su-dung-may-do-duong-huyet-accu-chek.txt', slug: 'huong-dan-su-dung-may-do-duong-huyet-accu-chek', label: 'Hướng dẫn dùng máy đo đường huyết Accu-Chek' },
  { site: 'gooncloud', file: 'may-do-duong-huyet-microlife-mgr100.txt', slug: 'may-do-duong-huyet-microlife-mgr100', label: 'Máy đo đường huyết Microlife MGR100' },
  { site: 'intimatefriend', file: 'may-do-duong-huyet-omron-hgm-111.txt', slug: 'may-do-duong-huyet-omron-hgm-111', label: 'Máy đo đường huyết Omron HGM-111' },
  { site: 'lovesomething', file: 'may-do-duong-huyet-safe-accu.txt', slug: 'may-do-duong-huyet-safe-accu', label: 'Máy đo đường huyết Safe-Accu' },
  { site: 'naturespirit', file: 'gia-ca-phe-rang-xay-trung-nguyen.txt', slug: 'gia-ca-phe-rang-xay-trung-nguyen', label: 'Giá cà phê rang xay Trung Nguyên' },
  { site: 'onefinething', file: 'ca-phe-g7-3in1-hop-21-goi.txt', slug: 'ca-phe-g7-3in1-hop-21-goi', label: 'Cà phê G7 3in1 hộp 21 gói' },
  { site: 'onemorestep', file: 'ca-phe-trung-nguyen-sang-tao-5.txt', slug: 'ca-phe-trung-nguyen-sang-tao-5', label: 'Cà phê Trung Nguyên Sáng Tạo 5' },
  { site: 'sweetchoice', file: 'ca-phe-chon-trung-nguyen-250gr.txt', slug: 'ca-phe-chon-trung-nguyen-250gr', label: 'Cà phê chồn Trung Nguyên 250gr' },
  { site: 'thewayofspirit', file: 'kcn-sunplay-nap-vang.txt', slug: 'kcn-sunplay-nap-vang', label: 'KCN Sunplay nắp vàng' },
  { site: 'truereason', file: 'kem-chong-nang-body-skin-aqua.txt', slug: 'kem-chong-nang-body-skin-aqua', label: 'Kem chống nắng body Skin Aqua' },
]

function urlOf(p) {
  return `https://${p.site}.info.vn/${p.slug}/`
}

for (const self of posts) {
  const others = posts.filter((p) => p.site !== self.site)
  const links = others.map((p) => `${urlOf(p)}|${p.label}`).join(', ')
  const line = `<!-- internal_links: ${links} -->`
  const fp = path.join(root, 'import', self.site, self.file)
  let text = fs.readFileSync(fp, 'utf8')
  text = text.replace(/<!--\s*internal_links\s*:[\s\S]*?-->\s*/gi, '')

  if (/<!--\s*xem_them\s*:/.test(text)) {
    text = text.replace(/(<!--\s*xem_them\s*:[\s\S]*?-->)/, `$1\n${line}`)
  } else if (/<!--\s*faq\s*:/.test(text)) {
    text = text.replace(/(<!--\s*faq\s*:[\s\S]*?-->)/, `${line}\n$1`)
  } else {
    text = `${line}\n${text}`
  }

  fs.writeFileSync(fp, text)
  console.log(`OK ${self.site} → ${others.length} links`)
}

console.log(`\nXong ${posts.length} file import.`)
