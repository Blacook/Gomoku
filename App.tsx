import React, { useState, useMemo } from 'react';
import { ViewMode } from './types';
import { GameSetup } from './components/GameSetup';
import { BoardLayer } from './components/BoardLayer';
import { Board3D } from './components/Board3D';
import { useGame } from './hooks/useGame';
import { GravityMoveStrategy, StandardWinStrategy } from './logic/strategies';
import { HeuristicAIStrategy } from './logic/aiStrategies';
import { PeerNetworkStrategy } from './logic/networkStrategy';

const App: React.FC = () => {
  // Dependency Injection: Initialize strategies
  const moveStrategy = useMemo(() => new GravityMoveStrategy(), []);
  const winStrategy = useMemo(() => new StandardWinStrategy(), []);
  const aiStrategy = useMemo(() => new HeuristicAIStrategy(), []);
  const networkStrategy = useMemo(() => new PeerNetworkStrategy(), []);

  const {
    config,
    gameState,
    gameStatus,
    startGame,
    hostOnlineGame,
    joinOnlineGame,
    resetGame,
    makeMove,
    undoMove,
    returnToSetup
  } = useGame({ gridSize: 4, winLength: 4, gameMode: 'PvE' }, moveStrategy, winStrategy, aiStrategy, networkStrategy);

  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.CUBE_3D);

  const lastMove = gameState.history[gameState.history.length - 1];

  // Copy ID helper
  const copyToClipboard = () => {
      if (gameState.networkRoomId) {
          navigator.clipboard.writeText(gameState.networkRoomId);
          alert('Room ID copied to clipboard!');
      }
  };

  // --- Online Waiting Screen ---
  // Check this BEFORE standard setup check to show connecting status immediately
  if (config.gameMode === 'Online' && (gameState.networkStatus === 'connecting' || gameState.networkStatus === 'waiting_opponent')) {
     return (
        <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4">
            <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 max-w-md w-full text-center shadow-2xl">
                {gameState.networkStatus === 'connecting' && (
                     <div className="flex flex-col items-center">
                         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mb-4"></div>
                         <h2 className="text-xl font-bold">Connecting to server...</h2>
                     </div>
                )}
                {gameState.networkStatus === 'waiting_opponent' && (
                     <div className="flex flex-col items-center">
                         <h2 className="text-xl font-bold mb-2 text-cyan-400">Waiting for Opponent...</h2>
                         <p className="text-slate-400 mb-6">Share this Room ID with your friend:</p>
                         
                         <div className="bg-slate-900 p-4 rounded-lg border border-slate-600 flex items-center gap-2 mb-6 w-full">
                            <code className="flex-1 text-lg font-mono text-white break-all">{gameState.networkRoomId}</code>
                            <button onClick={copyToClipboard} className="p-2 hover:bg-slate-700 rounded transition-colors text-slate-300">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                            </button>
                         </div>
                         
                         <div className="animate-pulse text-sm text-slate-500">Listening for connection...</div>
                         <button onClick={returnToSetup} className="mt-8 text-slate-400 hover:text-white underline text-sm">Cancel</button>
                     </div>
                )}
            </div>
        </div>
     );
  }

  if (gameStatus === 'setup') {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-blue-500/30">
        <div className="container mx-auto px-4 py-8">
           <header className="mb-8 text-center">
             <div className="inline-block p-4 rounded-full bg-slate-800/50 mb-4 border border-slate-700">
                <svg className="w-12 h-12 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
             </div>
           </header>
          <GameSetup 
            onStart={startGame} 
            onHost={hostOnlineGame}
            onJoin={joinOnlineGame}
          />
        </div>
      </div>
    );
  }

  // --- Main Game Logic for Display Text ---
  let turnText = '';
  let statusColor = 'bg-slate-800';
  
  if (gameState.winner) {
    turnText = 'Game Over';
  } else {
    if (config.gameMode === 'PvE') {
        turnText = gameState.currentPlayer === 'black' ? 'Your Turn' : 'Computer Thinking...';
    } else if (config.gameMode === 'Online') {
        if (gameState.currentPlayer === config.myPlayerColor) {
             turnText = "Your Turn";
             statusColor = 'bg-green-900/50 border-green-700';
        } else {
             turnText = "Opponent's Turn";
             statusColor = 'bg-slate-800';
        }
    } else {
        turnText = gameState.currentPlayer === 'black' ? "Black's Turn" : "White's Turn";
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans flex flex-col">
      {/* Header / Info Bar */}
      <div className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-4">
             <button onClick={returnToSetup} className="text-slate-400 hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
             </button>
             <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-200 hidden sm:block">
                3D Gomoku 
                <span className="text-xs font-normal text-slate-400 ml-1">
                ({config.gameMode === 'PvE' ? 'vs CPU' : config.gameMode === 'Online' ? 'Online P2P' : 'PvP'})
                </span>
             </h1>
          </div>
          
          <div className="flex items-center gap-6">
             {config.gameMode === 'Online' && (
                 <div className="hidden md:flex items-center gap-2 text-xs text-slate-500 bg-slate-800 px-3 py-1 rounded-lg">
                    <span className={`w-2 h-2 rounded-full ${gameState.networkStatus === 'connected' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    {gameState.currentPlayer === config.myPlayerColor ? 'You are ' + (config.myPlayerColor === 'black' ? 'Black' : 'White') : 'Opponent'}
                 </div>
             )}

             <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full border border-slate-700 min-w-[140px] justify-center transition-colors ${statusColor}`}>
                <div className={`w-3 h-3 rounded-full transition-colors duration-300 ${gameState.currentPlayer === 'black' ? 'bg-slate-900 shadow-[inset_-1px_-1px_2px_rgba(255,255,255,0.2)]' : 'bg-slate-100'}`}></div>
                <span className="text-sm font-medium text-slate-300 whitespace-nowrap">
                    {turnText}
                </span>
             </div>
             
             <button 
                onClick={undoMove}
                disabled={gameState.history.length === 0 || !!gameState.winner}
                className="p-2 text-slate-400 hover:text-white disabled:opacity-30 transition-colors"
                title="Undo last move"
             >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
             </button>
          </div>
        </div>
      </div>

      {/* Main Game Area */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 flex flex-col items-center">
        
        {/* Game Status Message */}
        {gameState.winner && (
            <div className="mb-8 p-4 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/50 rounded-xl animate-bounce-slow text-center relative z-20">
                <h2 className="text-2xl font-bold text-yellow-400">
                    {config.gameMode === 'PvE' 
                        ? (gameState.winner === 'black' ? 'You Win!' : 'Computer Wins!') 
                        : config.gameMode === 'Online'
                            ? (gameState.winner === config.myPlayerColor ? 'You Win!' : 'You Lose!')
                            : (gameState.winner === 'black' ? 'Black Wins!' : 'White Wins!')
                    }
                </h2>
                <p className="text-sm text-yellow-200/70 mt-1">
                    Press Reset to play again
                </p>
            </div>
        )}
         {gameState.isDraw && (
            <div className="mb-8 p-4 bg-slate-700/50 rounded-xl text-center relative z-20">
                <h2 className="text-2xl font-bold text-slate-300">Draw!</h2>
            </div>
        )}

        {/* View Toggle */}
        <div className="flex bg-slate-800 p-1 rounded-lg mb-8 border border-slate-700 relative z-20">
            <button
                onClick={() => setViewMode(ViewMode.LAYERS)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    viewMode === ViewMode.LAYERS ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
            >
                Layer View
            </button>
            <button
                onClick={() => setViewMode(ViewMode.CUBE_3D)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    viewMode === ViewMode.CUBE_3D ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
            >
                3D Cube
            </button>
        </div>

        {/* Board Rendering */}
        <div className="w-full max-w-6xl mx-auto flex justify-center">
            {viewMode === ViewMode.CUBE_3D ? (
                <div className="w-full max-w-2xl perspective-container">
                    <Board3D 
                        board={gameState.board}
                        gridSize={config.gridSize}
                        onCellClick={makeMove}
                        winningLine={gameState.winningLine}
                        lastMove={lastMove}
                        gameActive={gameStatus === 'playing' && (
                            config.gameMode === 'PvP' || 
                            (config.gameMode === 'PvE' && gameState.currentPlayer === 'black') ||
                            (config.gameMode === 'Online' && gameState.currentPlayer === config.myPlayerColor)
                        )}
                    />
                     <p className="text-center text-slate-500 text-sm mt-4">
                        Drag to rotate. Scroll to zoom.
                     </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8 w-full">
                    {gameState.board.map((layer, index) => (
                        <div key={index} className="flex justify-center">
                            <BoardLayer 
                                layerIndex={index}
                                grid={layer}
                                gridSize={config.gridSize}
                                onCellClick={makeMove}
                                winningLine={gameState.winningLine}
                                lastMove={lastMove}
                                isActive={gameStatus === 'playing' && !gameState.winner && (
                                    config.gameMode === 'PvP' || 
                                    (config.gameMode === 'PvE' && gameState.currentPlayer === 'black') ||
                                    (config.gameMode === 'Online' && gameState.currentPlayer === config.myPlayerColor)
                                )}
                            />
                        </div>
                    ))}
                    <div className="col-span-full text-center text-slate-500 text-sm mt-4">
                         Note: Stones will fall to the lowest available level due to gravity.
                    </div>
                </div>
            )}
        </div>

        {/* Footer Actions */}
        <div className="mt-12 flex gap-4 relative z-20">
             <button 
                onClick={resetGame}
                className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors font-medium border border-slate-600"
            >
                Reset Game
            </button>
        </div>
      </main>
    </div>
  );
};

export default App;