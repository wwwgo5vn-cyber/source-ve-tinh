# Ảnh bài viết theo site (staging trước khi build)

```
assets/<site-id>/images/<ten-anh>.jpg
```

## Quy trình

1. Dán ảnh bài vào `assets/<site-id>/images/` — tên khớp markdown (`/images/ten-anh.jpg`).
2. `npm run check-images -- <site-id>` — báo thiếu / thừa.
3. `npm run build -- <site-id>` — build **tự copy** ảnh này vào `dist/<site-id>/images/`.
4. Upload cả thư mục `dist/<site-id>/` lên `public_html` của đúng domain (merge).

## Brand / OG (không đặt ở đây)

Giữ trong `public/images/`: `logo.png`, `avatar.jpg`, `og/<site-id>.jpg`.
