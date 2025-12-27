import React from 'react';
import { CellValue, Coordinate } from '../types';
import { Cell } from './Cell';

interface BoardLayerProps {
  layerIndex: number;
  grid: CellValue[][]; // 2D array [y][x]
  onCellClick: (x: number, y: number, z: number) => void;
  winningLine: Coordinate[] | null;
  lastMove: Coordinate | undefined;
  gridSize: number;
  isActive: boolean;
}

export const BoardLayer: React.FC<BoardLayerProps> = ({
  layerIndex,
  grid,
  onCellClick,
  winningLine,
  lastMove,
  gridSize,
  isActive
}) => {
  return (
    <div className={`flex flex-col items-center p-2 rounded-xl bg-slate-800/50 backdrop-blur-sm border transition-colors duration-300 ${isActive ? 'border-indigo-500/50 shadow-lg shadow-indigo-500/10' : 'border-slate-700/50'}`}>
      <h3 className="mb-2 text-sm font-semibold text-slate-400 uppercase tracking-wider">
        Level {layerIndex + 1}
      </h3>
      <div 
        className="grid gap-1"
        style={{ gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))` }}
      >
        {grid.map((row, y) => (
          row.map((cellValue, x) => {
            const isWinning = winningLine?.some(c => c.x === x && c.y === y && c.z === layerIndex);
            const isLastMove = lastMove?.x === x && lastMove?.y === y && lastMove?.z === layerIndex;

            return (
              <Cell
                key={`${x}-${y}-${layerIndex}`}
                value={cellValue}
                onClick={() => onCellClick(x, y, layerIndex)}
                isWinning={isWinning}
                isLastMove={isLastMove}
                disabled={!!cellValue || !isActive}
                variant="2d"
              />
            );
          })
        ))}
      </div>
    </div>
  );
};