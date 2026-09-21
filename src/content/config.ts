import { defineCollection, z } from 'astro:content'

const posts = defineCollection({
  type: 'content',
  schema: z.object({
    title:     z.string(),
    date:      z.string(),
    tags:      z.array(z.string()).default([]),
    excerpt:   z.string(),
    cover:     z.string().optional(),
    draft:     z.boolean().default(false),
    updatedAt: z.string().optional(),
    seoTitle:  z.string().optional(),
    seoDesc:   z.string().optional(),
  })
})

export const collections = { posts }
