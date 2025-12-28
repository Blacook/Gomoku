
export type Player = 'black' | 'white';
export type CellValue = Player | null;

export type GameMode = 'PvP' | 'PvE' | 'Online'; // Added Online

export interface Coordinate {
  x: number;
  y: number;
  z: number;
}

export interface GameConfig {
  gridSize: number;
  winLength: number;
  gameMode: GameMode;
  myPlayerColor?: Player; // For Online mode
}

export interface GameState {
  board: CellValue[][][]; // z, y, x
  currentPlayer: Player;
  winner: Player | null;
  winningLine: Coordinate[] | null;
  history: Coordinate[];
  isDraw: boolean;
  networkStatus?: 'disconnected' | 'connecting' | 'waiting_opponent' | 'connected';
  networkRoomId?: string;
}

export enum ViewMode {
  LAYERS = 'LAYERS',
  CUBE_3D = 'CUBE_3D',
}

// --- SOLID Refactoring Interfaces ---

export interface IMoveStrategy {
  determinePosition(board: CellValue[][][], input: Coordinate): Coordinate | null;
}

export interface IWinStrategy {
  checkWin(
    board: CellValue[][][], 
    lastMove: Coordinate, 
    winLength: number
  ): { winner: Player | null; winningLine: Coordinate[] | null };
}

export interface IAIStrategy {
  calculateMove(
    board: CellValue[][][], 
    currentPlayer: Player, 
    winLength: number
  ): { x: number, y: number };
}

/**
 * Interface for Network Communication
 */
export interface INetworkStrategy {
  hostGame(onOpen: (id: string) => void, onData: (data: any) => void, onConnect: () => void): void;
  joinGame(hostId: string, onData: (data: any) => void, onConnect: () => void): void;
  sendData(data: any): void;
  disconnect(): void;
}
