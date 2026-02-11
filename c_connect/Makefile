gameloop: gameloop.c boardcontrol.h gamecontrol.c board.h boardcontrol.c gamecontrol.h bot.h botcontrol.h botcontrol.c
	clang -o gameloop gameloop.c boardcontrol.c gamecontrol.c botcontrol.c

winner: winnerwinner.c boardcontrol.h gamecontrol.c board.h boardcontrol.c gamecontrol.h botcontrol.c bot.h botcontrol.h
	clang -o winner winnerwinner.c gamecontrol.c boardcontrol.c

vier: viergewinnt.c boardcontrol.h gamecontrol.c board.h boardcontrol.c gamecontrol.h bot.h botcontrol.h botcontrol.c
	clang -o vier viergewinnt.c gamecontrol.c botcontrol.c boardcontrol.c && ./vier

wasm: wasm_adapter.c boardcontrol.c gamecontrol.c botcontrol.c boardcontrol.h gamecontrol.h botcontrol.h
	emcc wasm_adapter.c boardcontrol.c gamecontrol.c botcontrol.c -o ../public/wasm/game_bot.js -s WASM=1 -s EXPORTED_RUNTIME_METHODS='["ccall","cwrap"]' -s EXPORTED_FUNCTIONS='["_malloc","_free"]' -I . -s MODULARIZE=1 -s EXPORT_NAME='createGameBotModule' -s ALLOW_MEMORY_GROWTH=1


