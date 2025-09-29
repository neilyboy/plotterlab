# v0.20 – Examples Gallery + Thumbs

Highlights:
- Gallery: square, responsive tiles; draft→final upgrade; quick actions; inline toasts.
- Thumbnails: server-side generation; persisted in Docker; used in README and docs.
- Docs: gallery markdown + landing HTML; GitHub Pages deploy via Actions.
- UI Toasters: exports/imports/example load/layer actions.
- README: draft thumbs for speed + live gallery link & badges.

Changes:
- src/components/ExamplesGallery.jsx – layout, quick actions, toast
- src/App.jsx – toasts, exports/imports, layer actions
- scripts/generate_thumbs.js – fixed viewBox background rect
- scripts/build_gallery_md.js – outputs docs/gallery.md and docs/index.html (with GitHub link)
- .github/workflows/pages.yml – deploy docs to GitHub Pages
- docker-compose.yml – persist public/
- README.md – draft thumbs + badges
- CHANGELOG.md – added
