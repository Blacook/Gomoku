export type Player = 'black' | 'white';
export type CellValue = Player | null;

export interface Coordinate {
  x: number;
  y: number;
  z: number;
}

export interface GameConfig {
  gridSize: number;
  winLength: number;
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