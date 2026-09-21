# Source vệ tinh — 1 codebase, 15 website

Astro 4 + Markdown. Mỗi domain là một site độc lập (URL, title, content, sitemap), build từ cùng source.

## 15 site

| id | domain |
|---|---|
| befine | https://befine.info.vn |
| onemorestep | https://onemorestep.info.vn |
| 9signal | https://9signal.info.vn |
| goodfeel | https://goodfeel.info.vn |
| thewayofspirit | https://thewayofspirit.info.vn |
| 9seed | https://9seed.info.vn |
| truereason | https://truereason.info.vn |
| naturespirit | https://naturespirit.info.vn |
| calmlife | https://calmlife.info.vn |
| sweetchoice | https://sweetchoice.info.vn |
| lovesomething | https://lovesomething.info.vn |
| onefinething | https://onefinething.info.vn |
| intimatefriend | https://intimatefriend.info.vn |
| willbefine | https://willbefine.info.vn |
| gooncloud | https://gooncloud.info.vn |

Registry: `src/config/sites.json`

## Lệnh

```bash
npm install

npm run dev                  # mặc định befine
npm run dev -- calmlife      # dev 1 site

npm run build -- befine      # dist/befine/
npm run build:all            # lần lượt 15 site → dist/<id>/

npm run preview -- befine
```

Upload `dist/<id>/` lên `public_html` của domain tương ứng.

**Ảnh bài viết (staging local):** `assets/<site-id>/images/` — xem `assets/README.md`.  
Khi `npm run build -- <site-id>`, ảnh trong `assets/<site-id>/images/` được copy vào `dist/<site-id>/images/` cùng logo/avatar/OG.  
Upload cả `dist/<site-id>/` lên hosting là đủ (merge nếu server đã có file khác).

`public/images` chỉ giữ brand + OG (`logo.png`, `avatar.jpg`, `og/*.jpg`). Không đặt ảnh bài vào `public/images`.

```bash
npm run assets:init                 # tạo assets/<id>/images cho 15 site
npm run check-images                # thiếu/thừa theo markdown
npm run check-images -- 9seed
```

### Checklist deploy 1 site

1. Import / thêm bài `.md` đúng `src/content/posts/<site-id>/`
2. Dán ảnh vào `assets/<site-id>/images/` (tên khớp markdown) → `npm run check-images -- <site-id>`
3. `npm run build -- <site-id>` (ảnh bài tự vào `dist/<site-id>/images/`)
4. Upload `dist/<site-id>/` lên `public_html` chế độ **merge**
5. Mở trang bài + F12 Network xem ảnh `200`

## Nội dung theo site

```
src/content/posts/<site-id>/*.md
```

Ví dụ bài của Be Fine nằm ở `src/content/posts/befine/ten-bai.md` → URL `https://befine.info.vn/ten-bai/`

Import:

```bash
npm run import -- --site=befine
npm run import -- --site=calmlife --input=./import/calmlife
```

## Cấu hình

| File | Ý nghĩa |
|---|---|
| `src/config/sites.json` | id, domain, name, tagline, description, brand chung |
| `src/config/site.ts` | đọc `SITE` env, trả config đang build |
| `astro.config.mjs` | `site` + `outDir` theo satellite hiện tại |

Không hardcode domain trong page/layout. Mọi URL lấy từ `getSite()`.
