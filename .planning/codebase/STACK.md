# Technology Stack

**Analysis Date:** 2026-03-05

## Languages

**Primary:**
- JavaScript (ES6+) - All source code in `src/` directory with `.js` files using ES6 modules

**Secondary:**
- HTML5 - Entry point and structure in `index.html`
- CSS - Minimal inline styles in `index.html`

## Runtime

**Environment:**
- Node.js (version not explicitly specified, but supports modern ES module syntax)

**Package Manager:**
- npm - Used for dependency management
- Lockfile: `package-lock.json` present (v3 format, npm 9+)

## Frameworks

**Core:**
- Phaser 3.80.1 - 2D game engine, primary framework for all game logic
  - Physics: Arcade physics system (gravity-based, 2D collision)
  - Canvas rendering with auto-detection (WebGL/Canvas)
  - Scene management system for game states

**Build/Dev:**
- Vite 5.4.0 - Fast build tool and dev server
  - Config: `vite.config.js`
  - Dev server port: 3000
  - Output: `dist/` directory
  - ES module bundling

**Testing/Automation:**
- Puppeteer 24.37.5 - Browser automation for headless game screenshot capture
  - Usage: `screenshot.mjs` for automated game screenshots
- Playwright 1.58.2 - Cross-browser testing framework (installed but minimal usage evidence)

## Key Dependencies

**Critical:**
- phaser@^3.80.1 - Game engine providing sprites, physics, scene management, input handling, rendering

**Build Dependencies:**
- vite@^5.4.0 - Build bundler and dev server
- @babel/* (via transitive deps) - Code transformation pipeline
- esbuild (via Vite) - Fast JavaScript bundler
- rollup (via Vite) - Module bundling

**Testing/Utilities:**
- puppeteer@^24.37.5 - Headless browser automation for screenshot generation
- playwright@^1.58.2 - Cross-browser automation (installed but not actively used in code)

## Configuration

**Environment:**
- No `.env` file required - Game is self-contained
- No runtime configuration from environment variables detected
- All game constants defined in code:
  - `src/data/LevelConfig.js` - Level dimensions and tile sizes

**Build:**
- `vite.config.js` - Vite configuration with custom server port (3000) and build output directory
- `package.json` - NPM scripts and dependency declarations

**HTML Entry Point:**
- `index.html` - Single-page application root
  - Canvas target: `document.body` (created by Phaser)
  - Viewport: 960x540 pixels (game dimensions)
  - CRT scanline effect overlay via CSS

## Platform Requirements

**Development:**
- Node.js (modern version supporting ES modules)
- npm v9+ (for lockfile v3 support)
- Terminal/shell for running vite dev server
- Browser with HTML5 Canvas, WebGL, and Web Audio API support

**Production:**
- Any modern web browser supporting:
  - HTML5 Canvas or WebGL
  - ES6 modules
  - Web Audio API (for audio synthesis)
  - Modern JavaScript (no IE11 support)
- Static file hosting (game outputs to `dist/` directory)
- No backend server required (fully client-side)

**Build Output:**
- Static HTML/CSS/JavaScript files suitable for CDN or static hosting
- No server-side dependencies

---

*Stack analysis: 2026-03-05*
