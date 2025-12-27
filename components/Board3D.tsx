import React, { useState, useRef, useEffect } from 'react';
import { CellValue, Coordinate } from '../types';
import { Cell } from './Cell';

interface Board3DProps {
  board: CellValue[][][];
  onCellClick: (x: number, y: number, z: number) => void;
  winningLine: Coordinate[] | null;
  lastMove: Coordinate | undefined;
  gridSize: number;
  gameActive: boolean;
}

export const Board3D: React.FC<Board3DProps> = ({
  board,
  onCellClick,
  winningLine,
  lastMove,
  gridSize,
  gameActive
}) => {
  const [rotation, setRotation] = useState({ x: -20, y: 30 });
  const [isDragging, setIsDragging] = useState(false);
  const lastMousePos = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // --- Constants for Layout ---
  const CELL_SIZE = 50; // Stone diameter
  const GAP = 25;       // Gap between stones
  const PITCH = CELL_SIZE + GAP; // Distance between pole centers
  
  const POLE_SIZE = 10; // Thickness of the square prism pole
  const BASE_THICKNESS = 15; // Thickness of the base board
  
  // Calculate offsets to center the board at (0,0,0)
  // The grid spans from 0 to (gridSize-1) * PITCH
  const totalGridWidth = (gridSize - 1) * PITCH;
  const centerOffset = totalGridWidth / 2;

  // Board physical size (visual)
  // Add some padding around the outer poles
  const BOARD_PADDING = PITCH / 1.5;
  const BOARD_WIDTH = totalGridWidth + BOARD_PADDING * 2; 
  
  // Height of poles: enough to hold all layers plus a bit extra tip
  const POLE_HEIGHT = (gridSize * PITCH) + 20;

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    lastMousePos.current = { x: clientX, y: clientY };
  };

  const handleMouseMove = (e: MouseEvent | TouchEvent) => {
    if (!isDragging) return;
    if (e.cancelable) e.preventDefault();

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const deltaX = clientX - lastMousePos.current.x;
    const deltaY = clientY - lastMousePos.current.y;

    setRotation(prev => ({
      x: Math.max(-90, Math.min(90, prev.x - deltaY * 0.5)),
      y: prev.y + deltaX * 0.5
    }));

    lastMousePos.current = { x: clientX, y: clientY };
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleMouseMove, { passive: false });
      window.addEventListener('touchend', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleMouseMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging]);

  // Generate grid positions
  const columns = [];
  for(let y=0; y<gridSize; y++) {
      for(let x=0; x<gridSize; x++) {
          columns.push({x, y});
      }
  }

  // Textures
  const poleFaceStyle = {
    background: 'linear-gradient(90deg, #3E2723, #5D4037 40%, #795548 50%, #5D4037 60%, #3E2723)',
  };
  
  const baseTopStyle = {
    background: '#5D4037',
    backgroundImage: `
      repeating-linear-gradient(90deg, rgba(0,0,0,0.1) 0px, rgba(0,0,0,0.1) 1px, transparent 1px, transparent 20px),
      radial-gradient(circle at center, rgba(255,255,255,0.1), transparent)
    `,
    boxShadow: 'inset 0 0 30px rgba(0,0,0,0.6)'
  };
  
  const baseSideStyle = {
    background: 'linear-gradient(to bottom, #4E342E, #3E2723)',
    borderTop: '1px solid #6D4C41'
  };

  return (
    <div 
      className="relative w-full h-[600px] flex items-center justify-center overflow-hidden cursor-move touch-none bg-slate-900/50 rounded-xl border border-slate-700"
      onMouseDown={handleMouseDown}
      onTouchStart={handleMouseDown}
      ref={containerRef}
    >
       <div className="absolute top-4 left-4 text-xs text-slate-400 pointer-events-none z-10 bg-slate-900/80 p-2 rounded backdrop-blur border border-slate-700">
            <p>Drag to rotate view</p>
            <p>Click any pole to drop a stone</p>
        </div>

      <div
        className="relative transition-transform duration-75 ease-linear"
        style={{
          transformStyle: 'preserve-3d',
          transform: `perspective(1000px) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
          width: 0,
          height: 0,
        }}
      >
        {/* === SCENE CONTAINER === 
            Center (0,0,0) is in the middle of the grid horizontally/depth-wise.
            Y=0 is the vertical center of the first stone (Level 0).
        */}

        {/* 
            BASE PLATE 
            Position: Top surface should touch the bottom of Level 0 stones.
            Level 0 stone center is Y = 0.
            Stone radius = CELL_SIZE / 2.
            So Stone Bottom = +CELL_SIZE/2.
            Base Top = +CELL_SIZE/2.
        */}
        <div 
            className="absolute"
            style={{
                transformStyle: 'preserve-3d',
                transform: `translateY(${CELL_SIZE/2}px)`,
                width: 0, height: 0
            }}
        >
            {/* Top Face (Y=0 relative to base group) */}
            <div className="absolute" style={{
                width: BOARD_WIDTH,
                height: BOARD_WIDTH,
                transform: `translate(-50%, -50%) rotateX(90deg)`,
                ...baseTopStyle
            }} />

            {/* Side Faces - Creating a Box of thickness BASE_THICKNESS */}
            
            {/* Front */}
            <div className="absolute" style={{
                width: BOARD_WIDTH,
                height: BASE_THICKNESS,
                transform: `translate(-50%, 0) translateZ(${BOARD_WIDTH/2}px)`,
                ...baseSideStyle
            }} />
            
            {/* Back */}
            <div className="absolute" style={{
                width: BOARD_WIDTH,
                height: BASE_THICKNESS,
                transform: `translate(-50%, 0) translateZ(${-BOARD_WIDTH/2}px) rotateY(180deg)`,
                ...baseSideStyle
            }} />
            
            {/* Right */}
            <div className="absolute" style={{
                width: BOARD_WIDTH,
                height: BASE_THICKNESS,
                transform: `translate(-50%, 0) rotateY(90deg) translateZ(${BOARD_WIDTH/2}px)`,
                ...baseSideStyle
            }} />

            {/* Left */}
            <div className="absolute" style={{
                width: BOARD_WIDTH,
                height: BASE_THICKNESS,
                transform: `translate(-50%, 0) rotateY(-90deg) translateZ(${BOARD_WIDTH/2}px)`,
                ...baseSideStyle
            }} />
            
            {/* Bottom */}
            <div className="absolute" style={{
                width: BOARD_WIDTH,
                height: BOARD_WIDTH,
                transform: `translate(-50%, -50%) translateY(${BASE_THICKNESS}px) rotateX(90deg)`,
                background: '#2D1B18'
            }} />
        </div>

        {/* === POLES === */}
        {columns.map(({x, y}) => {
             const px = (x * PITCH) - centerOffset;
             const pz = (y * PITCH) - centerOffset;
             
             // Poles start from Base Top (Y = CELL_SIZE/2) and go UP (negative Y)
             const poleBaseY = CELL_SIZE / 2;

             return (
                 <div
                    key={`pole-${x}-${y}`}
                    className="absolute"
                    style={{
                        transformStyle: 'preserve-3d',
                        transform: `translate3d(${px}px, ${poleBaseY}px, ${pz}px)`,
                    }}
                 >
                     {/* 
                         Square Prism Pole (4 Faces) 
                         Growing UP from the origin (which is the base top).
                         Height: POLE_HEIGHT.
                         Width/Depth: POLE_SIZE.
                     */}
                     
                     {/* Front Face */}
                     <div className="absolute" style={{
                         width: POLE_SIZE, height: POLE_HEIGHT,
                         transformOrigin: 'bottom center',
                         transform: `translate(-50%, -100%) translateZ(${POLE_SIZE/2}px)`,
                         ...poleFaceStyle
                     }} />
                     
                     {/* Back Face */}
                     <div className="absolute" style={{
                         width: POLE_SIZE, height: POLE_HEIGHT,
                         transformOrigin: 'bottom center',
                         transform: `translate(-50%, -100%) rotateY(180deg) translateZ(${POLE_SIZE/2}px)`,
                         ...poleFaceStyle
                     }} />
                     
                     {/* Right Face */}
                     <div className="absolute" style={{
                         width: POLE_SIZE, height: POLE_HEIGHT,
                         transformOrigin: 'bottom center',
                         transform: `translate(-50%, -100%) rotateY(90deg) translateZ(${POLE_SIZE/2}px)`,
                         ...poleFaceStyle
                     }} />
                     
                     {/* Left Face */}
                     <div className="absolute" style={{
                         width: POLE_SIZE, height: POLE_HEIGHT,
                         transformOrigin: 'bottom center',
                         transform: `translate(-50%, -100%) rotateY(-90deg) translateZ(${POLE_SIZE/2}px)`,
                         ...poleFaceStyle
                     }} />
                     
                     {/* Top Cap (Optional, mainly for high angles) */}
                     <div className="absolute" style={{
                         width: POLE_SIZE, height: POLE_SIZE,
                         transform: `translate(-50%, -${POLE_HEIGHT}px) rotateX(90deg)`,
                         background: '#4E342E'
                     }} />
                 </div>
             )
        })}

        {/* === STONES === */}
        {board.map((layer, z) => 
          layer.map((row, y) => 
            row.map((cellValue, x) => {
              
              const px = (x * PITCH) - centerOffset;
              const pz = (y * PITCH) - centerOffset;
              // Level z is vertically UP from Level 0.
              // Level 0 is at Y=0.
              // Level 1 is at Y = -PITCH.
              const py = -(z * PITCH);

              const isWinning = winningLine?.some(c => c.x === x && c.y === y && c.z === z);
              const isLastMove = lastMove?.x === x && lastMove?.y === y && lastMove?.z === z;

              return (
                <div
                  key={`${x}-${y}-${z}`}
                  className="absolute"
                  style={{
                    transformStyle: 'preserve-3d',
                    transform: `translate3d(${px}px, ${py}px, ${pz}px)`,
                    width: 0, height: 0,
                  }}
                >
                  {/* Billboard Stone */}
                  <div 
                    style={{ 
                        transform: `rotateY(${-rotation.y}deg) rotateX(${-rotation.x}deg)`,
                        width: CELL_SIZE,
                        height: CELL_SIZE,
                        // Center the stone image on the coordinate
                        position: 'absolute',
                        left: -CELL_SIZE/2,
                        top: -CELL_SIZE/2,
                        transition: 'transform 0.1s linear',
                        pointerEvents: 'auto'
                    }}
                  >
                    <Cell
                        value={cellValue}
                        onClick={() => !isDragging && gameActive && onCellClick(x, y, z)}
                        isWinning={isWinning}
                        isLastMove={isLastMove}
                        disabled={!gameActive} 
                        variant="3d"
                    />
                  </div>
                </div>
              );
            })
          )
        )}

      </div>
    </div>
  );
};