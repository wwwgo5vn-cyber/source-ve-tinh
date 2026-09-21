import type { APIRoute } from 'astro'
import { getPublishedPosts } from '../lib/posts'

export const GET: APIRoute = async () => {
  const posts = await getPublishedPosts()
  const index = posts.map(post => ({
    slug: post.publicSlug,
    title: post.data.title,
    excerpt: post.data.excerpt ?? '',
    tags: post.data.tags ?? [],
    date: post.data.date,
  }))
  return new Response(JSON.stringify(index), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' }
  })
}
