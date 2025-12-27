
export type Player = 'black' | 'white';
export type CellValue = Player | null;

export type GameMode = 'PvP' | 'PvE'; // Player vs Player | Player vs Environment

export interface Coordinate {
  x: number;
  y: number;
  z: number;
}

export interface GameConfig {
  gridSize: number;
  winLength: number;
  gameMode: GameMode;
}

export interface GameState {
  board: CellValue[][][]; // z, y, x
  currentPlayer: Player;
  winner: Player | null;
  winningLine: Coordinate[] | null;
  history: Coordinate[];
  isDraw: boolean;
}

export enum ViewMode {
  LAYERS = 'LAYERS',
  CUBE_3D = 'CUBE_3D',
}

// --- SOLID Refactoring Interfaces ---

/**
 * Strategy interface for determining where a stone lands.
 * Supports different mechanics (e.g., Gravity vs Free Placement).
 */
export interface IMoveStrategy {
  /**
   * Calculates the actual placement coordinate based on user input.
   * @returns The accepted coordinate or null if the move is invalid.
   */
  determinePosition(board: CellValue[][][], input: Coordinate): Coordinate | null;
}

/**
 * Strategy interface for checking win conditions.
 * Supports different rules (e.g., Line-4, Square-4, etc).
 */
export interface IWinStrategy {
  checkWin(
    board: CellValue[][][], 
    lastMove: Coordinate, 
    winLength: number
  ): { winner: Player | null; winningLine: Coordinate[] | null };
}

/**
 * Strategy interface for Computer Logic.
 */
export interface IAIStrategy {
  /**
   * Calculates the best move for the computer.
   * Returns only (x, y) because z is determined by the MoveStrategy (Gravity).
   */
  calculateMove(
    board: CellValue[][][], 
    currentPlayer: Player, 
    winLength: number
  ): { x: number, y: number };
}
