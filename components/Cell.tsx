import React from 'react';
import { CellValue } from '../types';

interface CellProps {
  value: CellValue;
  onClick: () => void;
  isWinning?: boolean;
  isLastMove?: boolean;
  disabled?: boolean;
  variant?: '2d' | '3d';
}

export const Cell: React.FC<CellProps> = ({ 
  value, 
  onClick, 
  isWinning, 
  isLastMove, 
  disabled, 
  variant = '2d' 
}) => {
  
  // 2D View Implementation
  if (variant === '2d') {
    return (
        <div 
          className={`
            relative flex items-center justify-center transition-all duration-300 cursor-pointer
            w-10 h-10 sm:w-12 sm:h-12 border border-slate-700/30 
            hover:bg-slate-700/30 active:bg-slate-600/40
            ${isWinning ? 'bg-yellow-500/20 ring-2 ring-yellow-400' : ''}
            ${isLastMove && !isWinning ? 'ring-2 ring-blue-400' : ''}
            ${disabled ? 'cursor-not-allowed' : ''}
          `} 
          onClick={!disabled ? onClick : undefined}
        >
          {/* Simple pole indicator in 2D */}
          <div className="absolute top-0 bottom-0 w-[4px] bg-slate-600/40 rounded-full" />

          {value && (
            <div 
              className={`
                relative rounded-full shadow-lg z-10 w-3/4 h-3/4
                ${value === 'black' 
                  ? 'bg-[radial-gradient(circle_at_30%_30%,_#334155,_#020617)] shadow-slate-900' 
                  : 'bg-[radial-gradient(circle_at_30%_30%,_#ffffff,_#cbd5e1)] shadow-slate-400'
                }
              `}
            />
          )}
        </div>
    );
  }

  // 3D View Implementation
  return (
    <div 
      className={`relative w-full h-full flex items-center justify-center ${!value && !disabled ? 'cursor-pointer' : ''}`}
      onClick={!disabled ? onClick : undefined}
    >
      {value ? (
        <div 
            className={`
                relative rounded-full
                ${isLastMove ? 'animate-[dropBounce_0.6s_cubic-bezier(0.25,1.4,0.5,1)_backwards]' : ''}
            `}
            style={{
                width: '85%',
                height: '85%',
                background: value === 'black'
                    ? 'radial-gradient(circle at 35% 35%, #64748b 0%, #0f172a 50%, #000000 100%)'
                    : 'radial-gradient(circle at 35% 35%, #ffffff 0%, #e2e8f0 50%, #94a3b8 100%)',
                boxShadow: value === 'black'
                    ? 'inset -5px -5px 10px rgba(0,0,0,0.8), 5px 5px 15px rgba(0,0,0,0.5)'
                    : 'inset -5px -5px 10px rgba(0,0,0,0.2), 2px 5px 10px rgba(0,0,0,0.3)',
            }}
        >
            {/* Glossy Reflection for 3D effect */}
            <div className="absolute top-[15%] left-[15%] w-[25%] h-[25%] rounded-full bg-gradient-to-br from-white/90 to-transparent blur-[2px]" />
            
            {/* Winning Glow */}
            {isWinning && (
                 <div className="absolute -inset-1 rounded-full border-2 border-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.8)] animate-pulse" />
            )}
            
            {/* Last Move Indicator */}
            {isLastMove && !isWinning && (
                <div className="absolute -inset-1 rounded-full border-2 border-blue-400/80 shadow-[0_0_15px_rgba(96,165,250,0.6)]" />
            )}
        </div>
      ) : (
        /* Ghost/Hover target for empty cells */
        !disabled && (
            <div className="w-[80%] h-[80%] rounded-full bg-white/0 hover:bg-white/10 transition-colors border border-transparent hover:border-white/20 scale-75" />
        )
      )}
    </div>
  );
};