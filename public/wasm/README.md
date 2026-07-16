# Rebuilding the WebAssembly game engines

Install the Emscripten SDK, activate it, and run these commands from the repository root. Each command writes a JavaScript loader and its paired `.wasm` binary into this directory.

## Connect Four

```bash
emcc \
  c_connect/wasm_adapter.c \
  c_connect/boardcontrol.c \
  c_connect/botcontrol.c \
  c_connect/gamecontrol.c \
  -O3 \
  --no-entry \
  -sWASM=1 \
  -sMODULARIZE=1 \
  -sEXPORT_NAME=createGameBotModule \
  -sENVIRONMENT=worker \
  -sEXPORTED_RUNTIME_METHODS='["ccall","cwrap"]' \
  -o public/wasm/game_bot.js
```

## Sudoku

```bash
emcc \
  c_sudoku/wasm_adapter.c \
  c_sudoku/boardcontrol.c \
  -O3 \
  --no-entry \
  -sWASM=1 \
  -sMODULARIZE=1 \
  -sEXPORT_NAME=createSudokuModule \
  -sENVIRONMENT=worker \
  -sEXPORTED_RUNTIME_METHODS='["ccall","cwrap"]' \
  -o public/wasm/sudoku.js
```

## Game of Life

```bash
emcc \
  c_lifegame/wasm_adapter.c \
  c_lifegame/boardcontrol.c \
  -O3 \
  --no-entry \
  -sWASM=1 \
  -sMODULARIZE=1 \
  -sEXPORT_NAME=createGoLModule \
  -sENVIRONMENT=worker \
  -sEXPORTED_RUNTIME_METHODS='["ccall","cwrap"]' \
  -o public/wasm/game_of_life.js
```

The workers load these generated scripts with `importScripts`, so keep the export names and `worker` environment unchanged. Commit each generated `.js` file together with its matching `.wasm` file.
