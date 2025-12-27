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
  const [zoom, setZoom] = useState(0); // Added zoom state
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

  // --- Interaction Handlers ---

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    // Only start drag if clicking directly on the container or empty space, 
    // to avoid conflict if we click on UI buttons (though they are absolutely positioned on top)
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

  // Zoom Handler (Wheel)
  const handleWheel = (e: React.WheelEvent) => {
    // Prevent default scrolling behaviour is hard with React synthetic events sometimes,
    // but usually setting overflow: hidden on parent works.
    const delta = -Math.sign(e.deltaY) * 50;
    setZoom(prev => Math.max(-1200, Math.min(600, prev + delta)));
  };

  // Zoom Controls
  const handleZoomIn = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoom(prev => Math.min(600, prev + 100));
  };

  const handleZoomOut = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoom(prev => Math.max(-1200, prev - 100));
  };

  const handleResetView = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRotation({ x: -20, y: 30 });
    setZoom(0);
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
      className="relative w-full h-[600px] flex items-center justify-center overflow-hidden cursor-move touch-none bg-slate-900/50 rounded-xl border border-slate-700 select-none"
      onMouseDown={handleMouseDown}
      onTouchStart={handleMouseDown}
      onWheel={handleWheel}
      ref={containerRef}
    >
        {/* Info Overlay */}
        <div className="absolute top-4 left-4 pointer-events-none z-10 flex flex-col gap-2">
            <div className="text-xs text-slate-400 bg-slate-900/80 p-2 rounded backdrop-blur border border-slate-700">
                <p>Drag to rotate</p>
                <p>Scroll to zoom</p>
                <p>Click pole to drop</p>
            </div>
        </div>

        {/* Zoom Controls */}
        <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
            <button 
                onClick={handleZoomIn}
                className="w-10 h-10 flex items-center justify-center bg-slate-800/80 hover:bg-slate-700 text-slate-200 rounded-lg backdrop-blur border border-slate-600 shadow-lg transition-colors"
                title="Zoom In"
            >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
            </button>
            <button 
                onClick={handleZoomOut}
                className="w-10 h-10 flex items-center justify-center bg-slate-800/80 hover:bg-slate-700 text-slate-200 rounded-lg backdrop-blur border border-slate-600 shadow-lg transition-colors"
                title="Zoom Out"
            >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
            </button>
            <button 
                onClick={handleResetView}
                className="w-10 h-10 flex items-center justify-center bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg backdrop-blur border border-slate-600 shadow-lg transition-colors mt-2"
                title="Reset View"
            >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
            </button>
        </div>

      <div
        className="relative transition-transform duration-75 ease-linear"
        style={{
          transformStyle: 'preserve-3d',
          // Apply zoom via translateZ. Perspective stays fixed.
          transform: `perspective(1000px) translateZ(${zoom}px) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
          width: 0,
          height: 0,
        }}
      >
        {/* === SCENE CONTAINER === */}

        {/* BASE PLATE */}
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
                     
                     {/* Top Cap */}
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