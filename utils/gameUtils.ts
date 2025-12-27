import { CellValue, Coordinate, Player } from '../types';

export const createEmptyBoard = (size: number): CellValue[][][] => {
  return Array(size).fill(null).map(() => 
    Array(size).fill(null).map(() => 
      Array(size).fill(null)
    )
  );
};

// 重力を考慮して、指定された(x, y)列で次に石を置けるz座標を返す
// 列が一杯の場合は -1 を返す
export const getNextOpenZ = (board: CellValue[][][], x: number, y: number): number => {
  for (let z = 0; z < board.length; z++) {
    if (board[z][y][x] === null) {
      return z;
    }
  }
  return -1;
};

export const checkWin = (
  board: CellValue[][][], 
  size: number, 
  winLength: number, 
  lastMove: Coordinate
): { winner: Player | null; winningLine: Coordinate[] | null } => {
  const { x, y, z } = lastMove;
  const player = board[z][y][x];

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
};

export const isBoardFull = (board: CellValue[][][], size: number): boolean => {
  for (let z = 0; z < size; z++) {
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        if (board[z][y][x] === null) return false;
      }
    }
  }
  return true;
};