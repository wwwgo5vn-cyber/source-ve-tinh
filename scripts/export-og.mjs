import sharp from 'sharp'
import fs from 'fs'
import path from 'path'

const srcDir = 'C:/Users/Dell-3630/.cursor/projects/d-go5-source-ve-tinh/assets'
const outDir = path.resolve('public/images/og')
const ids = [
  'befine', 'onemorestep', '9signal', 'goodfeel', 'thewayofspirit',
  '9seed', 'truereason', 'naturespirit', 'calmlife', 'sweetchoice',
  'lovesomething', 'onefinething', 'intimatefriend', 'willbefine', 'gooncloud',
]

fs.mkdirSync(outDir, { recursive: true })

for (const id of ids) {
  const src = path.join(srcDir, `og-${id}.png`)
  if (!fs.existsSync(src)) {
    console.error('MISSING', src)
    process.exit(1)
  }
  const dest = path.join(outDir, `${id}.jpg`)
  await sharp(src)
    .resize(1200, 630, { fit: 'cover', position: 'centre' })
    .jpeg({ quality: 84, mozjpeg: true })
    .toFile(dest)
  console.log(id, fs.statSync(dest).size)
}
