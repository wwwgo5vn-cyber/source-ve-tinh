import { getCollection, type CollectionEntry } from 'astro:content'
import { getSite } from '../config/site'

export type SitePost = CollectionEntry<'posts'> & { publicSlug: string }

export function publicSlug(slug: string, siteId = getSite().id): string {
  const prefix = `${siteId}/`
  return slug.startsWith(prefix) ? slug.slice(prefix.length) : slug
}

export async function getPublishedPosts(siteId = getSite().id): Promise<SitePost[]> {
  const prefix = `${siteId}/`
  const posts = await getCollection(
    'posts',
    ({ data, slug }) => !data.draft && slug.startsWith(prefix) && !slug.endsWith('/_placeholder')
  )

  return posts
    .map((post) => Object.assign({}, post, { publicSlug: post.slug.slice(prefix.length) }) as SitePost)
    .sort((a, b) => new Date(b.data.date).valueOf() - new Date(a.data.date).valueOf())
}
