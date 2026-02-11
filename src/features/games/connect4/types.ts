export type Player = 0 | 1 | 2; // 0 = Empty, 1 = Human, 2 = Bot
export type BoardState = Player[][];
export type GameStatus = 'playing' | 'won' | 'draw';

export interface GameState {
    board: BoardState;
    currentPlayer: Player;
    status: GameStatus;
    winner: Player | null;
}
