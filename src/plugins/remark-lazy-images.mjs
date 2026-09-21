/**
 * remark-lazy-images.mjs
 * Tự động thêm loading="lazy" decoding="async" cho mọi ảnh trong Markdown.
 * Ảnh cover trong PostLayout dùng loading="eager" riêng — không bị ảnh hưởng.
 */
import { visit } from 'unist-util-visit'

export function remarkLazyImages() {
  return (tree) => {
    visit(tree, 'image', (node) => {
      node.data = node.data ?? {}
      node.data.hProperties = {
        ...node.data.hProperties,
        loading: 'lazy',
        decoding: 'async',
      }
    })
  }
}
