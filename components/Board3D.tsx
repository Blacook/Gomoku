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
  const CELL_SIZE = 60; // Diameter of the stone
  const GAP = 30;       // Gap between stone centers
  const PITCH = CELL_SIZE + GAP; // Center-to-center distance
  
  const POLE_DIAMETER = 12; // Visual thickness of the pole
  const BASE_THICKNESS = 20;
  
  // Calculate offsets to center the board at (0,0,0)
  // Grid coordinates go from 0 to gridSize-1
  // We want the center of the grid to be at 0.
  const centerOffset = ((gridSize - 1) * PITCH) / 2;

  // Board dimensions for the base plate
  // The base should cover the area from the outer edge of the first pole to the outer edge of the last pole
  // plus some padding.
  const BOARD_WIDTH = (gridSize - 1) * PITCH + CELL_SIZE + 20; 
  const POLE_HEIGHT = (gridSize * PITCH) + 40; // Tall enough for all layers

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

  // Wood Texture Styles
  // Simulating a cylinder using a gradient that is dark on edges and light in center
  const woodPoleTexture = `linear-gradient(to right, #3E2723, #5D4037 30%, #8D6E63 50%, #5D4037 70%, #3E2723)`;
  
  const woodBaseTop = {
    backgroundColor: '#5D4037',
    backgroundImage: `repeating-linear-gradient(90deg, rgba(0,0,0,0.1) 0px, rgba(0,0,0,0.1) 1px, transparent 1px, transparent 20px), 
                      linear-gradient(to bottom, rgba(255,255,255,0.1), rgba(0,0,0,0.2))`,
    boxShadow: 'inset 0 0 20px rgba(0,0,0,0.6)'
  };
  
  const woodBaseSide = {
    backgroundColor: '#3E2723',
    backgroundImage: 'linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.6))',
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
        className="relative transition-transform duration-75 ease-linear preserve-3d"
        style={{
          transformStyle: 'preserve-3d',
          transform: `perspective(1200px) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
          width: 0,
          height: 0,
        }}
      >
        {/* 
            COORDINATE SYSTEM:
            X: Horizontal
            Y: Vertical (CSS Y is down, so negative Y is UP)
            Z: Depth

            Center is (0,0,0).
        */}

        {/* === BASE PLATE === */}
        {/* 
           Level 1 stone center is at Y = 0 (vertically).
           Stone radius is CELL_SIZE / 2.
           Stone bottom is at Y = +CELL_SIZE/2.
           Therefore, Base Top Surface should be at Y = CELL_SIZE/2.
        */}
        <div className="absolute transform-style-3d pointer-events-none" style={{
            transform: `translate3d(0, ${CELL_SIZE/2}px, 0)`
        }}>
            {/* Top Face */}
            <div className="absolute origin-center border border-amber-900/50" style={{
                width: BOARD_WIDTH,
                height: BOARD_WIDTH,
                transform: `translate(-50%, -50%) rotateX(90deg)`,
                ...woodBaseTop
            }} />
            
            {/* Front Face */}
            <div className="absolute origin-top border border-amber-900/50" style={{
                width: BOARD_WIDTH,
                height: BASE_THICKNESS,
                transform: `translate(-50%, 0) translateZ(${BOARD_WIDTH/2}px)`,
                ...woodBaseSide
            }} />
            
            {/* Back Face */}
            <div className="absolute origin-top border border-amber-900/50" style={{
                width: BOARD_WIDTH,
                height: BASE_THICKNESS,
                transform: `translate(-50%, 0) translateZ(${-BOARD_WIDTH/2}px) rotateY(180deg)`,
                ...woodBaseSide
            }} />
            
            {/* Left Face */}
            <div className="absolute origin-top border border-amber-900/50" style={{
                width: BOARD_WIDTH,
                height: BASE_THICKNESS,
                transform: `translate(-50%, 0) rotateY(-90deg) translateZ(${BOARD_WIDTH/2}px)`,
                ...woodBaseSide
            }} />
            
             {/* Right Face */}
             <div className="absolute origin-top border border-amber-900/50" style={{
                width: BOARD_WIDTH,
                height: BASE_THICKNESS,
                transform: `translate(-50%, 0) rotateY(90deg) translateZ(${BOARD_WIDTH/2}px)`,
                ...woodBaseSide
            }} />

            {/* Bottom Face */}
            <div className="absolute origin-top border border-amber-900/50" style={{
                width: BOARD_WIDTH,
                height: BOARD_WIDTH,
                transform: `translate(-50%, ${BASE_THICKNESS}px) rotateX(-90deg)`,
                backgroundColor: '#2e1e1a'
            }} />
        </div>

        {/* === POLES === */}
        {columns.map(({x, y}) => {
             // Calculate center position relative to (0,0,0)
             const px = (x * PITCH) - centerOffset;
             const pz = (y * PITCH) - centerOffset;
             
             // Base Top is at Y = CELL_SIZE/2. Pole grows UP from there (Negative Y direction in CSS)
             // But actually, we can just position it at the base and translate up.
             
             return (
                 <div
                    key={`pole-${x}-${y}`}
                    className="absolute transform-style-3d pointer-events-none"
                    style={{
                        transform: `translate3d(${px}px, ${CELL_SIZE/2}px, ${pz}px)`,
                    }}
                 >
                    {/* 
                       IMPOSTER CYLINDER (Cross-Plane) 
                       Two intersecting planes with gradient texture.
                       This is much lighter than a polygon and looks very round for thin poles.
                    */}
                    <div className="absolute origin-bottom" style={{
                        width: POLE_DIAMETER,
                        height: POLE_HEIGHT,
                        background: woodPoleTexture,
                        transform: `translate(-50%, -100%) rotateY(0deg)`, // -100% Y to grow upwards
                    }} />
                    
                    <div className="absolute origin-bottom" style={{
                        width: POLE_DIAMETER,
                        height: POLE_HEIGHT,
                        background: woodPoleTexture,
                        transform: `translate(-50%, -100%) rotateY(90deg)`,
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
              // Level 0 (bottom) is at Y=0.
              // Level 1 is at Y = -PITCH.
              // Level z is at Y = -z * PITCH.
              const py = -(z * PITCH);

              const isWinning = winningLine?.some(c => c.x === x && c.y === y && c.z === z);
              const isLastMove = lastMove?.x === x && lastMove?.y === y && lastMove?.z === z;

              return (
                <div
                  key={`${x}-${y}-${z}`}
                  className="absolute"
                  style={{
                    // Centered exactly at the coordinate
                    transform: `translate3d(${px}px, ${py}px, ${pz}px)`,
                    width: 0, 
                    height: 0,
                    transformStyle: 'preserve-3d'
                  }}
                >
                  {/* 
                     BILLBOARD WRAPPER 
                     We create a container of size 0x0 at the exact center.
                     Then we render the stone centered on that point.
                  */}
                  <div 
                    style={{ 
                        transform: `rotateY(${-rotation.y}deg) rotateX(${-rotation.x}deg)`,
                        width: CELL_SIZE,
                        height: CELL_SIZE,
                        marginLeft: -CELL_SIZE/2, // Center the div
                        marginTop: -CELL_SIZE/2,  // Center the div
                        transition: 'transform 0.1s linear'
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