# External Integrations

**Analysis Date:** 2026-03-05

## APIs & External Services

**None detected** - This is a self-contained client-side game with no external API integrations.

**Note:** The game references real-world locations and military operations (Beirut, Tehran, Deep Strike, etc.) as gameplay themes, but these are purely thematic/narrative - no actual API calls or integrations with external services exist.

## Data Storage

**Databases:**
- None - Game is stateless client-side application

**File Storage:**
- Local filesystem only - Assets embedded in build output (`dist/` directory)
- Public assets: `public/assets/` directory (purpose: game media storage if needed)
- No cloud storage integration detected

**Caching:**
- Browser caching of static assets (handled automatically by HTTP/Vite)
- SoundManager caches Web Audio synthesized noise buffers in memory:
  - `src/systems/SoundManager.js` - Noise buffer cache keyed by duration (0.1s precision)

## Authentication & Identity

**Auth Provider:**
- None - Game requires no user authentication or identity system

**Implementation:**
- Fully anonymous, no user login or accounts
- No session management

## Monitoring & Observability

**Error Tracking:**
- None detected - No integration with Sentry, LogRocket, or similar services

**Logs:**
- Browser console only (via standard `console.*` methods if implemented)
- No centralized logging service

## CI/CD & Deployment

**Hosting:**
- No hosting platform specified - Designed for static file serving
- Compatible with any static host:
  - AWS S3 + CloudFront
  - Netlify
  - Vercel
  - GitHub Pages
  - Traditional web server (nginx, Apache)
  - CDN providers

**CI Pipeline:**
- None detected - No GitHub Actions, GitLab CI, or Jenkins configuration
- Manual build required: `npm run build` outputs to `dist/`

**Local Testing Server:**
- Vite dev server (port 3000) for development
- Puppeteer automation script (`screenshot.mjs`) for headless testing and screenshots

## Environment Configuration

**Required env vars:**
- None - Game requires zero environment variables at runtime

**Secrets location:**
- Not applicable - No authentication, API keys, or secrets used

**Configuration approach:**
- All config hardcoded in source:
  - Game constants: `src/data/LevelConfig.js`
  - Physics settings: `src/main.js` (gravity, arcade physics)
  - Canvas dimensions: `src/main.js` (960x540)

## Webhooks & Callbacks

**Incoming:**
- None - Game receives no incoming webhooks or server callbacks

**Outgoing:**
- None - Game sends no webhooks to external services

## Audio System

**Web Audio API:**
- Synthesized sound generation via native Web Audio API (`window.AudioContext`)
- Located in `src/systems/SoundManager.js`
- No audio files or external audio library
- Supports both standard and webkit-prefixed AudioContext for older browsers
- Gracefully handles browsers without Web Audio support

## Browser APIs Used

**Standard Web APIs:**
- Canvas API - Via Phaser rendering
- Web Audio API - Sound synthesis in `SoundManager`
- Input APIs (keyboard, mouse) - Via Phaser input system
- RequestAnimationFrame - Frame timing via Phaser
- Storage - Not used (no localStorage or sessionStorage detected)

---

*Integration audit: 2026-03-05*
