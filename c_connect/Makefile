gameloop: gameloop.c boardcontrol.h gamecontrol.c board.h boardcontrol.c gamecontrol.h bot.h botcontrol.h botcontrol.c
	clang -o gameloop gameloop.c boardcontrol.c gamecontrol.c botcontrol.c

winner: winnerwinner.c boardcontrol.h gamecontrol.c board.h boardcontrol.c gamecontrol.h botcontrol.c bot.h botcontrol.h
	clang -o winner winnerwinner.c gamecontrol.c boardcontrol.c

vier: viergewinnt.c boardcontrol.h gamecontrol.c board.h boardcontrol.c gamecontrol.h bot.h botcontrol.h botcontrol.c
	clang -o vier viergewinnt.c gamecontrol.c botcontrol.c boardcontrol.c && ./vier


