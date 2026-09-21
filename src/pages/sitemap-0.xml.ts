import type { APIRoute } from 'astro'
import { getSite } from '../config/site'
import { getPublishedPosts } from '../lib/posts'

export const GET: APIRoute = async () => {
  const siteUrl = getSite().origin
  const sorted = await getPublishedPosts()

  const urls: string[] = []

  urls.push(`  <url><loc>${siteUrl}/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>`)
  urls.push(`  <url><loc>${siteUrl}/tag/</loc><changefreq>weekly</changefreq><priority>0.6</priority></url>`)
  urls.push(`  <url><loc>${siteUrl}/tac-gia/</loc><changefreq>monthly</changefreq><priority>0.4</priority></url>`)

  for (const post of sorted) {
    const lastmod = post.data.updatedAt ?? post.data.date
    urls.push(`  <url><loc>${siteUrl}/${post.publicSlug}/</loc><lastmod>${lastmod}</lastmod><changefreq>monthly</changefreq><priority>0.8</priority></url>`)
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' }
  })
}
