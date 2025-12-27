import { CellValue, Coordinate, IMoveStrategy, IWinStrategy, Player } from '../types';

/**
 * Implements "Gravity" logic.
 * Stones fall to the lowest available Z index in the selected (X, Y) column.
 */
export class GravityMoveStrategy implements IMoveStrategy {
  determinePosition(board: CellValue[][][], input: Coordinate): Coordinate | null {
    const { x, y } = input;
    const size = board.length; // Assuming cube

    // Iterate from bottom (z=0) to top to find the first empty spot
    for (let z = 0; z < size; z++) {
      if (board[z][y][x] === null) {
        return { x, y, z };
      }
    }
    
    // Column is full
    return null;
  }
}

/**
 * Implements "Free Placement" logic (Optional usage).
 * Stones are placed exactly where clicked.
 */
export class FreePlacementStrategy implements IMoveStrategy {
    determinePosition(board: CellValue[][][], input: Coordinate): Coordinate | null {
        const { x, y, z } = input;
        if (board[z][y][x] === null) {
            return { x, y, z };
        }
        return null;
    }
}

/**
 * Implements Standard 3D Line checking.
 */
export class StandardWinStrategy implements IWinStrategy {
  checkWin(
    board: CellValue[][][],
    lastMove: Coordinate,
    winLength: number
  ): { winner: Player | null; winningLine: Coordinate[] | null } {
    const { x, y, z } = lastMove;
    const player = board[z][y][x];
    const size = board.length;

    if (!player) return { winner: null, winningLine: null };

    // Directions to check (dx, dy, dz)
    const directions = [
      [1, 0, 0],  // x-axis
      [0, 1, 0],  // y-axis
      [0, 0, 1],  // z-axis
      [1, 1, 0],  // xy diagonal 1
      [1, -1, 0], // xy diagonal 2
      [1, 0, 1],  // xz diagonal 1
      [1, 0, -1], // xz diagonal 2
      [0, 1, 1],  // yz diagonal 1
      [0, 1, -1], // yz diagonal 2
      [1, 1, 1],  // xyz diagonal 1
      [1, 1, -1], // xyz diagonal 2
      [1, -1, 1], // xyz diagonal 3
      [1, -1, -1] // xyz diagonal 4
    ];

    for (const [dx, dy, dz] of directions) {
      let line: Coordinate[] = [{ x, y, z }];

      // Check forward
      let i = 1;
      while (true) {
        const nx = x + dx * i;
        const ny = y + dy * i;
        const nz = z + dz * i;
        if (nx < 0 || nx >= size || ny < 0 || ny >= size || nz < 0 || nz >= size) break;
        if (board[nz][ny][nx] !== player) break;
        line.push({ x: nx, y: ny, z: nz });
        i++;
      }

      // Check backward
      i = 1;
      while (true) {
        const nx = x - dx * i;
        const ny = y - dy * i;
        const nz = z - dz * i;
        if (nx < 0 || nx >= size || ny < 0 || ny >= size || nz < 0 || nz >= size) break;
        if (board[nz][ny][nx] !== player) break;
        line.push({ x: nx, y: ny, z: nz });
        i++;
      }

      if (line.length >= winLength) {
        return { winner: player, winningLine: line };
      }
    }

    return { winner: null, winningLine: null };
  }
}
