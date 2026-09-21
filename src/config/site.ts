import registry from './sites.json'

export type BrandConfig = typeof registry.brand

export type SiteEntry = (typeof registry.sites)[number] & {
  gaId?: string
}

export type SiteConfig = SiteEntry & {
  origin: string
  ogImage: string
  author: {
    name: string
    initials: string
    role: string
    bioHtml: string
  }
  contact: BrandConfig
}

export const SITE_IDS = registry.sites.map((s) => s.id) as readonly string[]

export function listSites(): SiteEntry[] {
  return registry.sites
}

export function getSiteId(): string {
  const raw = (process.env.SITE || registry.defaultSite).trim().toLowerCase()
  const match = registry.sites.find((s) => s.id === raw || s.domain === raw)
  if (!match) {
    const allowed = registry.sites.map((s) => s.id).join(', ')
    throw new Error(`SITE="${raw}" không hợp lệ. Dùng một trong: ${allowed}`)
  }
  return match.id
}

export function getSite(id = getSiteId()): SiteConfig {
  const entry = registry.sites.find((s) => s.id === id)
  if (!entry) {
    throw new Error(`Không tìm thấy site "${id}"`)
  }

  const brand = registry.brand
  return {
    ...entry,
    origin: `https://${entry.domain}`,
    ogImage: `/images/og/${entry.id}.jpg`,
    contact: brand,
    author: {
      name: brand.authorName,
      initials: brand.authorInitials,
      role: `Biên tập viên · ${entry.name}`,
      bioHtml: [
        `Email: <a href="mailto:${brand.email}">${brand.email}</a>`,
        `Hotline: <a href="tel:${brand.phone}">${brand.phoneDisplay}</a>`,
        `Website: <a href="${brand.parentUrl}" target="_blank" rel="noopener noreferrer">${brand.parentUrl.replace(/^https?:\/\//, '')}</a>`,
        `Địa chỉ: ${brand.address}`,
      ].join('<br>'),
    },
  }
}

export function siteOrigin(site = getSite()): string {
  return site.origin
}
