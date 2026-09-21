import type { APIRoute } from 'astro'
import { getSite } from '../config/site'

export const GET: APIRoute = () => {
  const siteUrl = getSite().origin
  const body = `User-agent: *
Allow: /
Disallow: /page/

Sitemap: ${siteUrl}/sitemap-index.xml
`

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
