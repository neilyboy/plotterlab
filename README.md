# Plotter Lab – Generative Layers for Pen Plotters

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Built with Vite](https://img.shields.io/badge/Built%20with-Vite-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-18-61dafb?logo=react&logoColor=white)](https://react.dev/)
[![Docker](https://img.shields.io/badge/Docker-ready-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)

A modern, dark-themed web app for creating multi-layer generative SVG artwork and exporting clean per-layer SVGs and GRBL-compatible G-code for plotters.

- Frontend: React + Vite + Tailwind
- Backend: Express (serves built assets)
- Generators included: Spirograph, Star Lattice, Flow Field, Retro Pipes, Isometric City, Voronoi Shatter, MDI Pattern, MDI Icon Field, SVG Import, Hatch Fill, Halftone / Dither, Pixel Mosaic, Iso Contours, Superformula Rings, Wave Moiré, Streamlines, Reaction Contours, Quasicrystal Contours, Stripe Bands, L‑system, Phyllotaxis, Truchet Tiles, Hilbert Curve, Path Warp (link another layer), Image Contours (Marching Squares), Poisson Stipple, TSP Art, Harmonograph, De Jong Attractor, Maze, Reaction Strokes, Clifford Attractor, Sunflower Bands, Combinator
- Exports: ZIP of per-layer SVGs; G-code export modes (single combined file, per-layer ZIP, per-color ZIP)
- Docker: Multi-stage image for easy hosting on Ubuntu

## Table of Contents

- [Quick Start (Local Dev)](#quick-start-local-dev)
- [Build and Run (Production, without Docker)](#build-and-run-production-without-docker)
- [Docker](#docker)
- [Performance & Architecture](#performance--architecture)
- [Plotter Settings](#plotter-settings)
- [File Units](#file-units)
- [Project Structure](#project-structure)
- [UI Hints](#ui-hints)
- [Adding New Generators](#adding-new-generators)
- [Features Overview](#-features-overview)
- [Quick Start (Docker Compose)](#-quick-start-docker-compose)
- [Examples Library](#-examples-library)
- [UI Primer](#-ui-primer)
- [Generators Guide](#-generators-guide)
- [On‑Canvas Picker (Clip to Polygon)](#-oncanvas-picker-clip-to-polygon)
- [On‑Canvas Transform (SVG Import)](#-oncanvas-transform-svg-import)
- [Keyboard & Mouse](#-keyboard--mouse)
- [Design Recipes](#-design-recipes-starter-settings)
- [Exports](#-exports)
- [Photo → Halftone (Mono / CMYK)](#-photo--halftone-mono--cmyk)
- [Tips & Troubleshooting](#-tips--troubleshooting)
- [Contributing](#contributing)
- [Development](#-development)
- [Roadmap](#-roadmap-shortterm)
- [License](#-license)

## Quick Start (Local Dev)

Requirements: Node 18+ (Node 20 recommended)

```bash
npm install
npm run dev
```

Open http://localhost:5173 and start tweaking parameters. Use "Export SVG Layers" to download a ZIP, or "Export G-code" for a single toolpath file.

## Build and Run (Production, without Docker)

```bash
npm run build
npm run start
```
Serves the built app at http://localhost:8080

## Docker

Build and run via Docker (multi-stage image):

```bash
# Build image
docker build -t plotterlab:latest .

# Run
docker run -d --name plotterlab -p 8080:8080 --restart unless-stopped plotterlab:latest
```

Or use Docker Compose:

```bash
docker compose up -d --build
```
Then open http://<server-ip>:8080

## Performance & Architecture

- __Preview off the main thread__ — `src/lib/previewWorker.js` runs heavy rendering in a Web Worker. It streams `progress` events so the UI remains responsive and you get live progress.
- __Quality scaling for speed__ — In preview we scale down expensive params. Halftone accepts a `previewScale` hint and switches to faster modes (e.g., ordered dithering) for quick feedback; full quality is used on export.
- __No redundant clipping for halftone__ — `computeRendered()` in `src/lib/renderer.js` skips global clipping when generators already constrain output, avoiding polygon blow‑ups.
- __Travel/ordering optimized__ — `App.jsx` caches `overlayOrder`, computes it only when needed (travel/labels on and preview idle), and downsamples very large poly sets. For huge sets, a faster nearest‑neighbor method is used.
- __Grid overlay__ — Background grid (container) plus SVG line grid over the page for crisp alignment. Color adapts to dark/light backgrounds.
- __Responsive UI controls__ — Zoom/grid sliders are view‑only and do not trigger a re‑render; the rendering pill appears after a 250ms delay to avoid flicker.

## Plotter Settings

The generated G-code uses millimeters and absolute positioning. Defaults in `src/lib/gcode.js`:
- feed: 1800 mm/min (drawing)
- travel: 3000 mm/min (moves between paths)
- pen mode: Z axis or Servo/Macro mode
- Z mode: `penUp`, `penDown`, and `safeZ` heights
- Servo mode: `servoUp` (e.g. `M3 S180`), `servoDown` (e.g. `M3 S0`)
- Dwell: `delayAfterUp` and `delayAfterDown` seconds are inserted with `G4 P<sec>`

Adjust these in the UI in a later iteration, or change the defaults in code for your machine. If your plotter uses servo angles instead of Z mm, you can adapt the `toGcode` function to emit your preferred commands (e.g. M280 for RC servos) and we can add a selector in the UI.

## File Units

The canvas size is in millimeters. Exported SVGs include `width`/`height` with `mm` units and a matching `viewBox` so downstream tools maintain scale.

## Project Structure

- `src/App.jsx` – Main app with layer manager, parameters, preview, exports
- `src/lib/generators/` – Algorithm modules returning polylines
- `src/lib/geometry.js` – Helpers for building SVG paths from polylines
- `src/lib/svg.js` – Serialize paths into an SVG document
- `src/lib/gcode.js` – Convert polylines to GRBL-compatible G-code
- `server.js` – Express server to serve production build

## UI Hints

- The sidebar has a minimum width and will scroll if needed on smaller screens.
- Layer color has both a CMYK-style dropdown and a color picker.
- For `MDI Pattern`, choose the icon in the layer’s parameter list (the first field labeled “Icon”).
- Preview background color can be changed with the color picker in the Document panel (useful for black/grey paper preview).

## Adding New Generators

Each generator is a function that returns an array of polylines. A polyline is an array of `[x, y]` points. Example signature:

```js
export function myGenerator({ width, height, margin, seed, ...params }) {
  // compute polylines
  return [ [ [x1,y1], [x2,y2], ... ], [ ... ], ... ]
}
```
Add it to `src/lib/generators/`, export the function, and register it in `GENERATORS` inside `src/App.jsx` with default params.

## Roadmap

- More generators: Voronoi/Poisson field, flow fields, path-from-SVG (MDI icons), Hilbert curves, L-systems
- Per-layer export controls (single-layer SVG buttons)
- Reorder layers via drag-and-drop
- Pen change pauses between color layers (in G-code)
- Save/load presets (JSON) and seed locking per layer
- Server-side rendering for large or CPU-heavy generators (optional)

## License

This project’s code is MIT licensed. External dependencies retain their respective licenses.

---

## 🌟 Features Overview

- 🎨 Multi-layer editor with per-layer generator parameters and colors
- 🧠 Fast preview mode with quality slider for snappy iteration
- 🧭 Start-point presets and Shift+Click to set custom start point on canvas
- 🔗 MDI icon support (server-resolved `@mdi/js`) and robust SVG import
- 🪚 Hatch Fill, ◻️ Halftone, 🧩 MDI Pattern and ⬇️ SVG Import support clipping to shapes (All/Largest/Index + Union/Even‑Odd/Intersect/Difference)
- 🖱️ On-canvas picker: click inside a shape to set Clip Layer + Polygon Index
- 🎯 On‑canvas Transform Gizmo for `SVG Import` (move, scale, rotate directly on canvas)
- 🧩 Per-layer SVG and G-code exports (combined/per-layer/per-color)
- 🧰 Docker/Compose for easy hosting on Ubuntu
- ✨ Superformula presets with Morph/Twist and symmetry locks (round/even m, n2=n3)
- 🌐 Quasicrystal contours with presets and animated phase
- 📼 Stripe Bands and Wave Moiré for high-impact NES‑tube aesthetics
- 🌊 Streamlines followOnly mode for extra-long continuous strokes
- 📄 Paper Size presets (A-series, Letter/Legal/Tabloid) with Orientation toggle and custom sizes
- 🩹 Bleed (mm) support for SVG exports
- 🔍 Preview zoom-to-cursor, pan clamping, and sticky bottom controls

## 🖼️ Screenshots

> Place your screenshots in `docs/screenshots/` and update the paths below.

![Overview UI](docs/screenshots/overview.png)

![Path Warp + Image Contours](docs/screenshots/path-warp.png)

## 🚀 Quick Start (Docker Compose)

```bash
docker compose up -d --build
```

Open: http://localhost:8080 (or your server IP)

## 📚 Examples Library

- Open the `(Examples)` dropdown in the sidebar and pick a preset, then click `Load Example`.
- Recent additions:
  - Rosette Weave Knot
  - Poly Op Lattice
  - White Glow Spiro
  - CMYK Spinflower
  - Radial Orbitals
- Click `Set Default` to auto-load the current example on first visit; `Clear Default` resets this.

## 🧭 UI Primer

- __Document panel__
  - Width/Height/Margin are in millimeters.
  - Background color is for preview only.
  - Paper Size: choose common sizes (A0–A5, US Letter/Legal, Tabloid) or save your own.
  - Orientation: Portrait/Landscape; preserves the current orientation when changing sizes.
  - Bleed (mm): included in exported SVG dimensions and viewBox.
  - Start point controls:
    - Presets (e.g. Top‑Left, Center, Bottom‑Right)
    - Use Margin for Preset (keeps the presets inside the page margin)
    - Shift+Click on the preview to set a custom start point.
  - Travel overlay: show non-drawing moves and estimate plotting time.

- __Layers panel__
  - Add new layers with the ➕ button.
  - Change layer order (Up/Down), visibility (eye), color, and generator type.
  - Each generator exposes its own parameters below the layer header.

## 🧩 Generators Guide

- __MDI Pattern__
  - Draws a repeated MDI icon across a grid.
  - Set Icon by name (e.g., `mdiFlower`, `mdi:robot`, `robot`).
  - Samples multi‑subpath icons safely (no stray lines between parts).

- __MDI Icon Field__
  - Places a jittered field of icons. Set `namesCsv` ("mdiFlower,mdiRobot").
  - Each icon placement renders all its subpaths.

- __SVG Import__
  - Click “Load SVG” in the layer controls. Paths, polylines, polygons, rects and lines are supported.
  - Path data is split into subpaths by Move commands; no stray joins.

- __Hatch Fill__
  - Generates parallel lines (and optional crosshatch) clipped to shapes.
  - Key params: Angle, Spacing, Offset, Cross, Cross Offset.
  - Clipping:
    - Clip To Layer: use shapes from a specific visible layer.
    - Or: Clip to previous visible layer (quick workflow).
    - Clip Mode:
      - All polygons – union of all closed shapes on the source layer.
      - Largest polygon – pick the biggest shape by area.
      - # Index – use a specific polygon index (see overlays below).

- __Halftone / Dither__
  - Apply ordered dithering or error diffusion to a loaded bitmap.
  - Supports the same clipping modes as Hatch.

- __Iso Contours__
  - Implicit field with multiple iso levels; lobe presets (Hourglass, Lens, Bulb, Triple).
  - Key params: Levels, Separation, Lobes, SigmaX/Y, Bias, Warp.

- __Superformula Rings__
  - Rings of supershapes with interpolation inward for evolving forms.
  - Presets: Star, Gear, Petal, Bloom, Spiky.
  - Key params: m, n1/n2/n3, Rings, Steps, Inner, Rotate, Morph, Twist.
  - Symmetry locks: Round m, Force even m, Lock n2=n3.

- __Streamlines__
  - Packed flow lines tracing a simplex-noise direction field.
  - Key params: seedsX/Y, minSpacing, stepLen, maxSteps, noiseScale, curl, jitter.
  - Option: followOnly (trace forward only) for longer single-direction strokes.

- __Wave Moiré__
  - Interference of two waves to create classic moiré striping.
  - Key params: lines, freqA/B, angle, phase, warp.

- __Reaction Contours__
  - Gray–Scott reaction–diffusion simulation rendered as iso-contours.
  - Key params: cols/rows, steps, feed, kill, diffU/V, dt, iso.

- __Polar Starburst__
  - Radial spikes from a center point; optionally multiple lines per wedge for a burst/sunray effect.
  - Key params: spikes, spreadDeg, linesPerSpike, inner, outer, jitterDeg, lengthJitter.
  - Center can be the page center or set via `centerX/centerY`.

- __Quasicrystal Contours__
  - Aperiodic plane-wave interference field with mesmerizing iso-contours.
  - Presets: Star (7), Bloom (9), Flower (5).
  - Key params: waves, freq, contrast, iso, rotate, warp, cols/rows.
  - Animation: toggle "Animate Phase" and set "Phase Speed" for live preview.

- __Stripe Bands__
  - Many iso-contours across a multi-wave field; great for bold tube-like bands.
  - Key params: levels, isoStart/isoEnd, freqX/Y, radialFreq, radialAmp, angle, warp, cols/rows.
  - Tube‑Depth mode:
    - Toggle: `tubeDepth`
    - `tubePeriod` – how many iso steps per repeating band.
    - `tubeMinDuty` – minimum kept fraction at band edges.
    - `tubeCurve` – `tri` or `sin` profile for center weighting.

- __Phyllotaxis__
  - Vogel spiral points as either a connected path or dots.
  - Params: `count`, `spacing`, `angleDeg` (commonly ~137.5), `connect`, `jitter`, `dotSize`.

- __Truchet Tiles__
  - Grid of curve or line variants with optional jitter.
  - Params: `cols`, `rows`, `variant` (`curves` | `lines`), `jitter`.

- __Hilbert Curve__
  - Space-filling curve; param `order` controls recursion.

- __Path Warp__
  - Warps polylines from another layer (or the previous visible layer) through a noise field.
  - Link in the layer UI: choose `Source Layer` or enable "use previous visible layer".
  - Params: `amp`, `scale` (noise scale), `step` (resample), `copies`, `rotateFlow`.

- __Image Contours__
  - Marching Squares contour extraction from a loaded bitmap.
  - Params: `cols`, `rows`, `levels`, `invert`, `gamma`, `preserveAspect`.
  - Load a bitmap via the layer’s "Image Source" controls.

- __Poisson Stipple__
  - Blue-noise dots with minimum spacing; optionally denser in darker image regions.
  - Params: `minDist`, `attempts`, `useImage`, `invert`, `gamma`, `preserveAspect`, `dotMin/dotMax`, `connectPath`.

- __TSP Art__
  - Single continuous path through many points; optionally image-weighted sampling.
  - Params: `points`, `useImage`, `invert`, `gamma`, `preserveAspect`, `improveIters`.

- __Harmonograph__
  - Damped sinusoidal Lissajous-like curves.
  - Params: `Ax/Ay`, `fx/fy`, `px/py`, `dx/dy`, `tMax`, `steps`.

- __De Jong Attractor__
  - Strange attractor; iterated map normalized into page.
  - Params: `a, b, c, d`, `iter`, `burn`.

- __Maze__
  - Recursive backtracker grid maze; walls output as line segments.
  - Params: `cols`, `rows`.

- __Reaction Strokes__
  - Gray–Scott reaction–diffusion field, then traces long strokes tangent to iso-lines.
  - Params: RD (`cols`, `rows`, `steps`, `feed`, `kill`, `diffU`, `diffV`, `dt`) and Strokes (`seedsX`, `seedsY`, `minSpacing`, `stepLen`, `maxSteps`, `vMin`, `vMax`, `jitter`).
  - Tip: Lower `minSpacing` for denser strokes; reduce `maxSteps` for shorter threads.

- __Clifford Attractor__
  - Iterated strange attractor normalized to the page.
  - Params: `a, b, c, d`, `iter`, `burn`.

- __Sunflower Bands__
  - Phyllotaxis (Vogel spiral) dots rendered as small circle outlines within repeating radial bands.
  - Params: `count`, `spacing`, `angleDeg`, `dotSize`, `bandPeriod`, `bandDuty`, `jitter`.
  - Tip: Layer multiple colors with slight `bandPeriod`/`bandDuty` offsets for vibrant NES‑tube vibes.

- __Combinator__
  - Boolean-style combination of two source shape layers (A, B). Produces boundary polylines of Intersect/Union/Difference/XOR.
  - Params: `srcA`, `srcB`, `op`.
  - Tip: Use with `Hatch Fill`, `Stripe Bands`, etc., by setting their Clip to the Combinator result or vice versa.

## 👆 On‑Canvas Picker (Clip to Polygon)

For most generators (including Hatch/MDI/SVG Import and many others via generic clipping):

1) Click the button: “Pick shape on canvas”.
2) Cursor becomes a crosshair and a hint appears.
3) Click inside the shape you want to fill.

The app will set:

- `clipLayerId` → layer owning that shape
- `clipMode` → `index`
- `clipIndex` → polygon index you clicked

Tip: When “Clip Mode = index”, the preview displays small labels at polygon centroids so you can dial in indices manually if you prefer.

Note: A generic clipping step now applies to many generators that do not natively support clipping. You can set `Clip To Layer` or use `Clip to previous visible layer` to restrict outputs to shapes. Hatch/MDI/SVG Import retain advanced `Clip Rule` options (Union/Even‑Odd/Intersect/Difference). A dedicated “Fill Layers” UX is planned to streamline pattern‑fill workflows.

## 🛠️ On‑Canvas Transform (SVG Import)

Interactively move/scale/rotate any `SVG Import` layer.

1) In the layer, click `Transform on canvas`.
2) Handles appear around the imported SVG:
   - Drag inside the box to move. Updates `offsetX`/`offsetY`.
   - Drag a corner square to uniformly scale. Updates `scale`.
   - Drag the small “lollipop” handle above the box to rotate. Updates `rotateDeg`.
3) Click `Done Transform` to exit.

Notes:
- Works with current zoom/pan. Zoom with the mouse wheel to get precision.
- You can fine-tune the same parameters numerically in the layer panel.

## 🔗 Layer Linking (Path Warp)

- Add a `Path Warp` layer below or above your source geometry.
- Open its group and set `Source Layer` or enable `use previous visible layer` to link dynamically.
- Tweak `amp`, `scale`, `step`, and `copies` for different warp looks.
- Great combos:
  - Image Contours → Path Warp (wavy outlines)
  - Poisson Stipple (connectPath) → Path Warp (single flowing ribbon)
  - Hilbert or L‑system → Path Warp (organicized structure)

Tip: You can still clip warped output using the usual Clip Layer controls in other generators.

## ⌨️ Keyboard & Mouse

- Drag to pan preview. Wheel to zoom (zoom-to-cursor preserved).
- Double‑click or press `F` to Fit.
- Press `C` to Fit to Content (visible geometry).
- `+` / `-` to zoom. `0` to reset zoom/pan.
- `G` toggles the G‑code settings panel.
- Spacebar shows the pan cursor hint; hold Space while dragging to pan.
- Shift+Click sets the plotter Start point.

## 🎛️ Design Recipes (Starter Settings)

- __NES Tube Bands (bold stripe look)__
  - Generator: `Stripe Bands`
  - Try: `levels=80–120`, `isoStart=-0.9`, `isoEnd=0.9`, `freqX≈0.08`, `freqY≈0.06`, `radialFreq≈0.03`, `radialAmp≈0.6`, `angleDeg=0–15`, `warp=0.2–0.4`.
  - Tips: Layer two contrasting colors; dark paper preview; enable Grid for alignment.

- __Radial Orbitals (dots over wave field)__
  - Base: `Wave Moiré` with `lines≈200`, `freqA≈0.032`, `freqB≈0.053`, `warp≈0.5`.
  - Overlay: `MDI Pattern` with `mdiCheckboxBlankCircle`, `cols≈48`, `rows≈36`, `spacing≈26`, `scale≈2.4`, `jitter≈0.02`.
  - Clip the dots to the moiré shapes using `Clip To Layer` + `Clip Rule: even-odd`.

- __White Glow Spiro (luminous on dark)__
  - Generator: `Spirograph` with `R=120`, `r=35`, `d=50`, `turns≈2000+`, `step≈0.015`.
  - Use a dark paper color and `strokeWidth≈0.8` for a clean glow.

- __Rosette Weave (interlaced rings)__
  - Generator: `Superformula Rings` with `m≈10`, `n1≈0.28`, `n2≈0.26`, `n3≈0.26`, `rings≈56–70`, `twistDeg≈±40`, small `inner`.
  - Stack two layers with slight `rotateDeg` offsets and contrasting colors.

- __CMYK Spinflower (multi‑pen petals)__
  - Three `Superformula Rings` layers in cyan/magenta/yellow, minor `rotateDeg` offsets and opposite `twistDeg` directions.
  - Use `Bleed=0` and export per‑layer SVG or per‑color G‑code.

## 📦 Exports

- __SVG Layers (ZIP)__ – One SVG per visible layer (color preserved in stroke).
- __G-code__
  - Per Layer (ZIP)
  - Per Color (ZIP) – merges same‑color paths across layers
  - Combined single file – optional pause messages between layers
  - Start point, path order (Nearest / Improve), feed/travel all honored
  - SVG exports honor Bleed and document size/orientation

## 🖼️ Photo → Halftone (Mono / CMYK)

- In the sidebar __Import__ section, use:
  - `Photo → Mono Halftone` to create a single black halftone layer from an image.
  - `Photo → CMYK Halftone` to auto‑create four halftone layers (C, M, Y, K) with recommended screen angles.
- Each created layer is a normal `Halftone` generator with the image bound as an in‑memory bitmap.
  - Spacing: dot/line separation (mm).
  - Angle: screen angle in degrees.
  - Method: Bayer, Floyd, or simple threshold.
  - Gamma/Invert: tone controls.
- Bitmaps are ephemeral (kept in memory, not saved to localStorage). Re‑load the photo after a hard refresh.

## 🖼️ Image‑Powered Generators

Several generators consume a per‑layer bitmap via an "Image Source" group inside the layer UI:

- Halftone / Dither
- Pixel Mosaic
- Image Contours
- Poisson Stipple
- TSP Art

Click `Load Image` in the `Image Source` group to bind a bitmap to that layer (resolution is shown next to the button). Click `Clear` to remove it. Options like `invert`, `gamma`, and `preserveAspect` help match your material and look.

Tips:
- For Poisson Stipple and TSP Art, enabling `useImage` biases sampling to darker regions.
- For Image Contours, `levels` sets how many iso lines to extract; `cols/rows` controls grid resolution.

Per‑layer split buttons:
- In any `Halftone` layer after loading an image, you can also click:
  - `Split into RGB layers` – makes 3 layers (R, G, B) with colored strokes.
  - `Split into CMYK layers` – makes 4 layers (C, M, Y, K) using simple CMYK conversion.
  - Useful for multi‑pen color plotting workflows.

## 🔧 Plotter Settings (G-code)

Set under “Toolpath Controls”:

- Feed (mm/min) and Travel (mm/min)
- Optimize (Nearest, Nearest+Improve, Off)
- Pen Mode: Z‑axis (with `penUp`, `penDown`, `safeZ`) or Servo/Macro
- Servo commands (e.g., `M3 S180` / `M3 S0`) and dwell after up/down

## 🧪 Tips & Troubleshooting

- __Nothing appears for Hatch/ Halftone?__
  - Ensure the source layer is visible and has closed shapes.
  - Try “Clip Mode: All polygons” first.
  - If using “# Index”, check the index labels in the preview.
  - Spacing too tight? Try 4–10mm to start.

- __MDI icon renders only a circle or shows stray connecting lines?__
  - Fixed: icons are split per subpath and rendered without stray joins.
  - Hard refresh if you see stale behavior.

- __Largest polygon clips to a wedge?__
  - Hatch clipping now uses a union across polygons. If you want only one shape, use “Largest” or “# Index”.

- __Start point & travel look odd?__
  - Use a Start preset, or Shift+Click the exact start. Turn on “Show Travel” to visualize non‑drawing moves.

## Contributing

Contributions are welcome!

- __Requirements__
  - Node 18+ (Node 20 recommended)
  - pnpm/yarn/npm (repo currently uses npm)
- __Commit style__
  - Conventional commits are appreciated: `feat: ...`, `fix: ...`, `docs: ...`, `perf: ...`
- __Local dev__
  - `npm run dev` and open the Vite URL.
  - Please add screenshots/GIFs for UI changes in PRs when possible.
- __Issues__
  - Include repro steps, your OS/Browser, and whether you used Docker or `npm run dev`.

## 🏗️ Development

```bash
npm install
npm run dev
# or build + serve
npm run build
npm run start
```

Project structure highlights:

- `src/App.jsx` – main UI, layer manager, render pipeline, exports
- `src/lib/generators/` – all generators (hatchFill, halftone, mdiPattern, mdiIconField, flowField, retroPipes, isometricCity, voronoiShatter, pixelMosaic, svgImport, spirograph, etc.)
- `src/lib/gcode.js` – G-code emitter
- `src/lib/svgParse.js` – robust SVG path parsing with subpath splitting
- `server.js` – Express server and MDI resolver endpoint `/api/mdi/:name`

## 🗺️ Roadmap (short‑term)

- On‑canvas click‑to‑select for clip shapes ✅
- Overlay polygon indices for clip selection ✅
- Choose any layer as clip source ✅
- Combine‑mode options (Union/Intersect/Subtract) for clipping
- Visual handle to drag start point
- More sample presets and gallery

## 📜 License

MIT. External dependencies retain their licenses.
