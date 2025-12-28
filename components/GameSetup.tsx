import React, { useState } from 'react';
import { GameConfig, GameMode } from '../types';

interface GameSetupProps {
  onStart: (config: GameConfig) => void;
  onHost: (config: GameConfig) => void;
  onJoin: (config: GameConfig, roomId: string) => void;
}

export const GameSetup: React.FC<GameSetupProps> = ({ onStart, onHost, onJoin }) => {
  const [gridSize, setGridSize] = useState(4);
  const [winLength, setWinLength] = useState(4);
  const [gameMode, setGameMode] = useState<GameMode>('PvE');
  const [joinRoomId, setJoinRoomId] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const config: GameConfig = { gridSize, winLength, gameMode };

    if (gameMode === 'Online') {
       // Online logic handled by specific buttons
       return;
    }
    onStart(config);
  };

  // Adjust win length automatically if grid size becomes smaller than current win length
  const handleGridSizeChange = (size: number) => {
    setGridSize(size);
    if (winLength > size) {
      setWinLength(size);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] w-full max-w-md mx-auto p-6">
      <div className="w-full bg-slate-800 rounded-2xl shadow-2xl p-8 border border-slate-700">
        <h1 className="text-3xl font-bold text-center mb-8 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
          3D Gomoku Setup
        </h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Game Mode Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">
              Game Mode
            </label>
            <div className="flex justify-between gap-2">
               <button
                  type="button"
                  onClick={() => setGameMode('PvE')}
                  className={`flex-1 py-3 rounded-lg font-bold transition-all flex flex-col items-center gap-1 ${
                    gameMode === 'PvE' 
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30' 
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  <span>1 Player</span>
                  <span className="text-[10px] font-normal opacity-80">(vs CPU)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setGameMode('PvP')}
                  className={`flex-1 py-3 rounded-lg font-bold transition-all flex flex-col items-center gap-1 ${
                    gameMode === 'PvP' 
                      ? 'bg-pink-600 text-white shadow-lg shadow-pink-500/30' 
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  <span>2 Players</span>
                  <span className="text-[10px] font-normal opacity-80">(Local)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setGameMode('Online')}
                  className={`flex-1 py-3 rounded-lg font-bold transition-all flex flex-col items-center gap-1 ${
                    gameMode === 'Online' 
                      ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-500/30' 
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  <span>Online</span>
                  <span className="text-[10px] font-normal opacity-80">(P2P)</span>
                </button>
            </div>
          </div>

          <div className="h-px bg-slate-700 w-full" />

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">
              Field Size (Size x Size x Size)
            </label>
            <div className="flex justify-between gap-2">
              {[3, 4, 5, 6].map(size => (
                <button
                  key={size}
                  type="button"
                  onClick={() => handleGridSizeChange(size)}
                  className={`flex-1 py-3 rounded-lg font-bold transition-all ${
                    gridSize === size 
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' 
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">
              Winning Line Length
            </label>
             <div className="flex justify-between gap-2">
              {[3, 4, 5].map(len => (
                <button
                  key={len}
                  type="button"
                  disabled={len > gridSize}
                  onClick={() => setWinLength(len)}
                  className={`flex-1 py-3 rounded-lg font-bold transition-all ${
                    winLength === len 
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' 
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  } ${len > gridSize ? 'opacity-30 cursor-not-allowed' : ''}`}
                >
                  {len}
                </button>
              ))}
            </div>
             <p className="text-xs text-slate-500 mt-2">
               Connect {winLength} stones in any direction (Horizontal, Vertical, Diagonal, 3D Diagonal) to win.
             </p>
          </div>

          {gameMode !== 'Online' ? (
            <button
                type="submit"
                className="w-full py-4 mt-4 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white font-bold rounded-xl shadow-xl shadow-blue-500/20 transform transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
                Start Game
            </button>
          ) : (
             <div className="space-y-4 pt-2">
                 <button
                    type="button"
                    onClick={() => onHost({ gridSize, winLength, gameMode: 'Online' })}
                    className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
                    Create Room (Host)
                </button>
                
                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-600"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-slate-800 text-slate-400">or Join</span>
                    </div>
                </div>

                <div className="flex gap-2">
                    <input 
                        type="text" 
                        placeholder="Enter Room ID" 
                        value={joinRoomId}
                        onChange={(e) => setJoinRoomId(e.target.value)}
                        className="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-cyan-500 outline-none"
                    />
                    <button
                        type="button"
                        disabled={!joinRoomId}
                        onClick={() => onJoin({ gridSize, winLength, gameMode: 'Online' }, joinRoomId)}
                        className="px-6 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white font-bold rounded-lg transition-colors"
                    >
                        Join
                    </button>
                </div>
             </div>
          )}
        </form>
      </div>
    </div>
  );
};
