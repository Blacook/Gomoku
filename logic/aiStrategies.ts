import { CellValue, Coordinate, IAIStrategy, Player } from '../types';

/**
 * A basic AI that uses heuristics to determine the best move.
 * Priority:
 * 1. Win immediately.
 * 2. Block opponent from winning immediately.
 * 3. Create lines / occupy center.
 */
export class HeuristicAIStrategy implements IAIStrategy {
  
  calculateMove(board: CellValue[][][], currentPlayer: Player, winLength: number): { x: number; y: number } {
    const size = board.length; // Assuming cube
    const opponent: Player = currentPlayer === 'black' ? 'white' : 'black';
    const validMoves: { x: number; y: number; z: number }[] = [];

    // 1. Identify all valid moves (Gravity logic simulation)
    for (let x = 0; x < size; x++) {
      for (let y = 0; y < size; y++) {
        const z = this.getNextOpenZ(board, x, y);
        if (z !== -1) {
          validMoves.push({ x, y, z });
        }
      }
    }

    if (validMoves.length === 0) return { x: 0, y: 0 }; // Should not happen if game is not over

    // 2. Check for Instant Win (High Priority)
    for (const move of validMoves) {
      if (this.evaluateLineStrength(board, move, currentPlayer, winLength) >= winLength) {
        return { x: move.x, y: move.y };
      }
    }

    // 3. Check for Instant Block (High Priority)
    for (const move of validMoves) {
      if (this.evaluateLineStrength(board, move, opponent, winLength) >= winLength) {
        return { x: move.x, y: move.y };
      }
    }

    // 4. Score remaining moves based on heuristics
    let bestMove = validMoves[0];
    let maxScore = -Infinity;

    for (const move of validMoves) {
      let score = 0;

      // Factor A: Center control (Stones in the center are more valuable)
      const center = (size - 1) / 2;
      const dist = Math.sqrt((move.x - center) ** 2 + (move.y - center) ** 2 + (move.z - center) ** 2);
      score += (size * Math.sqrt(3) - dist); // Closer to center = higher score

      // Factor B: Offensive potential (How many lines can I extend?)
      const myPotential = this.evaluatePotential(board, move, currentPlayer, winLength);
      score += myPotential * 10;

      // Factor C: Defensive potential (Block opponent's potential lines)
      const oppPotential = this.evaluatePotential(board, move, opponent, winLength);
      score += oppPotential * 8; // Defense is slightly less prioritized than offense unless it's critical

      // Random jitter to make it less predictable when scores are tied
      score += Math.random();

      if (score > maxScore) {
        maxScore = score;
        bestMove = move;
      }
    }

    return { x: bestMove.x, y: bestMove.y };
  }

  // --- Helpers ---

  private getNextOpenZ(board: CellValue[][][], x: number, y: number): number {
    for (let z = 0; z < board.length; z++) {
      if (board[z][y][x] === null) return z;
    }
    return -1;
  }

  // Simulate placing a stone and checking the longest line created
  private evaluateLineStrength(board: CellValue[][][], move: Coordinate, player: Player, winLength: number): number {
    // Temporarily place stone
    board[move.z][move.y][move.x] = player;
    
    let maxLength = 0;
    const directions = this.getDirections();

    for (const [dx, dy, dz] of directions) {
      const len = this.countLine(board, move, dx, dy, dz, player, board.length);
      if (len > maxLength) maxLength = len;
    }

    // Revert stone
    board[move.z][move.y][move.x] = null;
    return maxLength;
  }

  // Evaluate how many continuous stones this move would connect (less strict than win check)
  private evaluatePotential(board: CellValue[][][], move: Coordinate, player: Player, winLength: number): number {
    board[move.z][move.y][move.x] = player;
    
    let totalPotential = 0;
    const directions = this.getDirections();

    for (const [dx, dy, dz] of directions) {
      const len = this.countLine(board, move, dx, dy, dz, player, board.length);
      // Only count if this line has potential to become a winning line (has enough empty space)
      // For simplicity in this heuristic, we just sum up the lengths > 1
      if (len > 1) totalPotential += len * len; 
    }

    board[move.z][move.y][move.x] = null;
    return totalPotential;
  }

  private countLine(board: CellValue[][][], start: Coordinate, dx: number, dy: number, dz: number, player: Player, size: number): number {
    let count = 1;
    
    // Forward
    let i = 1;
    while(true) {
        const nx = start.x + dx * i;
        const ny = start.y + dy * i;
        const nz = start.z + dz * i;
        if(nx < 0 || nx >= size || ny < 0 || ny >= size || nz < 0 || nz >= size) break;
        if(board[nz][ny][nx] !== player) break;
        count++;
        i++;
    }

    // Backward
    i = 1;
    while(true) {
        const nx = start.x - dx * i;
        const ny = start.y - dy * i;
        const nz = start.z - dz * i;
        if(nx < 0 || nx >= size || ny < 0 || ny >= size || nz < 0 || nz >= size) break;
        if(board[nz][ny][nx] !== player) break;
        count++;
        i++;
    }
    return count;
  }

  private getDirections() {
    return [
      [1, 0, 0], [0, 1, 0], [0, 0, 1],
      [1, 1, 0], [1, -1, 0], [1, 0, 1], [1, 0, -1], [0, 1, 1], [0, 1, -1],
      [1, 1, 1], [1, 1, -1], [1, -1, 1], [1, -1, -1]
    ];
  }
}
