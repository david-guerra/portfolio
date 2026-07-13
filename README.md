# David Guerra — Portfolio

Interactive browser games backed by C engines compiled to WebAssembly, kept off
the main thread with Web Workers.

[View the live site](https://david-guerra.github.io/portfolio/) — currently a
placeholder: the portfolio is being rebuilt on a fresh scaffold
([map](https://github.com/david-guerra/portfolio/issues/1)). The previous app
lives untouched in `legacy/` until launch.

## Architecture

```mermaid
flowchart LR
  UI[React UI] -->|typed messages| Worker[Web Worker]
  Worker --> Glue[Emscripten glue]
  Glue --> WASM[WebAssembly module]
  WASM --> Engine[C engine]
  Engine --> WASM --> Worker --> UI
```

Each game owns a worker and a small message protocol. Connect 4 runs a bitboard
negamax search with alpha-beta pruning; Sudoku uses constraint masks and
backtracking; Game of Life uses a double-buffered grid.

Toolchain: Vite 8, React 19, TypeScript 6, Tailwind 4, ESLint 10.

## Run locally

Requirements: Node.js 24 (see `.nvmrc`; anything ≥ 22.22 works) and npm.

```bash
npm ci
npm run dev
```

The Vite app is served under `/portfolio/` to match GitHub Pages.

## Quality checks

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

`npm test` drives the three real workers against the shipped `.wasm` engines
under Node's test runner (see `tests/helpers/worker-harness.ts`).

The Connect 4 native test can be rebuilt without writing a binary into the
repository:

```bash
clang c_connect/test_connect.c c_connect/boardcontrol.c c_connect/gamecontrol.c -o /tmp/test_connect && /tmp/test_connect
```

## Rebuild the WASM engines

Install [Emscripten](https://emscripten.org/docs/getting_started/downloads.html), then run these commands from the repository root:

```bash
emcc c_connect/wasm_adapter.c c_connect/boardcontrol.c c_connect/gamecontrol.c c_connect/botcontrol.c -O3 --no-entry -sWASM=1 -sMODULARIZE=1 -sEXPORT_NAME=createGameBotModule -sENVIRONMENT=worker -sEXPORTED_RUNTIME_METHODS='["ccall","cwrap"]' -o public/wasm/game_bot.js
emcc c_sudoku/wasm_adapter.c c_sudoku/boardcontrol.c -O3 --no-entry -sWASM=1 -sMODULARIZE=1 -sEXPORT_NAME=createSudokuModule -sENVIRONMENT=worker -sEXPORTED_RUNTIME_METHODS='["ccall","cwrap"]' -o public/wasm/sudoku.js
emcc c_lifegame/wasm_adapter.c c_lifegame/boardcontrol.c -O3 --no-entry -sWASM=1 -sMODULARIZE=1 -sEXPORT_NAME=createGoLModule -sENVIRONMENT=worker -sEXPORTED_RUNTIME_METHODS='["ccall","cwrap"]' -o public/wasm/game_of_life.js
```

## Deployment

Pushes to `main` run lint, typecheck, tests, and the build, then deploy to
GitHub Pages via `.github/workflows/deploy.yml`. Pull requests run the same
checks without deploying.
