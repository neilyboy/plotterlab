# Changelog

All notable changes to this project will be documented in this file.

## [v0.20] – 2025-09-29

- Added: Examples Gallery polish in `src/components/ExamplesGallery.jsx`
  - Square, responsive tiles with `aspect-ratio`
  - Static thumbs loading (draft-first → final upgrade)
  - Quick actions overlay: Open / Copy link
  - Lightweight toast notifications
- Added: More app toasts in `src/App.jsx`
  - Export started/done (SVGs, G-code), example/preset loading, layer add/remove
- Added: Docs site generation
  - `scripts/build_gallery_md.js` now outputs `docs/gallery.md` and `docs/index.html`
  - Header link: "View on GitHub"
- Added: GitHub Pages workflow `.github/workflows/pages.yml` to auto-deploy `docs/`
- Changed: README now uses lighter `*.draft.svg` thumbs for faster load and links to live gallery
- Infra: Docker `docker-compose.yml` persists `public/` so generated thumbs survive rebuilds
- Fix: Background rect alignment in generated SVG thumbs (`server.js`, `scripts/generate_thumbs.js`)

[v0.20]: https://github.com/neilyboy/plotterlab/releases/tag/v0.20
