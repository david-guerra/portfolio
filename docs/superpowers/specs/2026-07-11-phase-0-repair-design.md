# Phase 0 Portfolio Repair Design

## Goal

Make the existing portfolio safe to share without adding Phase 1 content or changing its core Gruvbox terminal identity. Phase 0 is complete when the production build has a working contact path, intentional branding, functioning motion and depth styles, recoverable error states, clean repository entry points, and passing build and lint checks.

## Scope

Phase 0 implements the eight items under “Stop the bleeding” in `artifacts/portfolio-audit.html`:

1. Pass the Web3Forms access key into the GitHub Pages build.
2. Add a real favicon, useful title and description, and Open Graph/Twitter sharing metadata with a 1200×630 preview image.
3. Self-host and preload the JetBrains Mono variable font.
4. Define the missing typing and fade-in animations, including reduced-motion fallbacks.
5. Restore visual depth with a `#1d2021` page background and `#32302f` soft card surface.
6. Keep the 404 escape route inside the hash-routed application and show the Connect 4 worker’s error state with a retry action.
7. Stop tracking generated Vite config files and compiled C test binaries, ignore their replacements, and add a working ESLint flat configuration.
8. Add a README with a current screenshot, architecture diagram, live link, prerequisites, and reproducible web/WASM build instructions.

Phase 1 copy, project case studies, résumé/email exposure, blog content, dependency upgrades, and broader refactors remain out of scope.

## Design

### Deployment and contact

The Pages workflow will expose a repository secret named `WEB3FORMS_ACCESS_KEY` to Vite as `VITE_WEB3FORMS_ACCESS_KEY` during `npm run build`. The application will continue using Web3Forms from the browser, as its access keys are client-facing identifiers. Repository configuration remains a manual prerequisite: the workflow can reference the secret but cannot invent its value.

### Brand assets and presentation

The current terminal identity remains intact. A small, legible `DG` terminal-style SVG will replace the missing Vite favicon. JetBrains Mono will be stored under `public/fonts`, declared with `@font-face`, and preloaded from the base-aware public URL. Missing animations will be defined in CSS so their existing class names begin working without component churn; reduced-motion users will receive an immediate, non-animated state.

The page canvas will use Gruvbox hard background `#1d2021`, while `gruv-bg-soft` becomes `#32302f`. Existing component colors remain unchanged unless needed to make those two intended layers visible.

The document head will describe David as a software builder rather than add speculative Phase 1 positioning. The Open Graph image will be a 1200×630 capture/composition of the repaired landing view, stored as a static public asset and referenced with the deployed portfolio URL.

### Navigation and worker failure recovery

The hash-router 404 action will use React Router navigation so “Back to home” returns to the portfolio root rather than the GitHub Pages domain root.

Connect 4 will distinguish three startup states: loading, ready, and failed. A worker failure replaces the endless loading label with a concise themed error and a retry control. Retrying remounts/reinitializes the worker through the hook’s public interface; the UI will not reload the whole page.

### Repository hygiene and documentation

Generated `vite.config.js` and `vite.config.d.ts` files and compiled `test_life`/`c_connect/test_connect` binaries will be removed from version control and covered by targeted ignore rules. The authored `vite.config.ts` and C test sources remain canonical.

An ESLint flat config compatible with the installed ESLint 8 and TypeScript/React plugins will lint the current TypeScript and React source while ignoring generated artifacts. Fixes required to make the existing code pass are included only when they are mechanical and local; broad typing/refactoring belongs to Phase 3.

The README will serve as the repository front door: purpose and live link first, then a screenshot, a Mermaid architecture flow (`React → typed worker protocol → Web Worker → Emscripten/WASM → C engines`), local setup, WASM rebuild commands, and deployment notes. It will describe only commands verified in this repository.

## Verification

Completion requires fresh evidence from:

- `npm run lint`
- `npm run build`
- available native C test executables rebuilt from source, where the repository exposes a reliable build command
- browser checks at desktop and mobile widths for the landing page, favicon/font/styles, unknown-route recovery, Connect 4 loading/failure UI, and console errors
- inspection of the built `dist/index.html` and static assets to confirm base-aware URLs and metadata
- a final repository status review confirming that pre-existing user changes and the audit artifact were not accidentally overwritten or staged

## Known External Step

The repository owner must add `WEB3FORMS_ACCESS_KEY` to GitHub Actions secrets if it is not already present. Local and CI builds should still succeed when the value is absent; only live contact submission depends on it.
