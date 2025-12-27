import { useState, useCallback } from 'react';
import { GameConfig, GameState, IMoveStrategy, IWinStrategy, CellValue, Coordinate } from '../types';

export const useGame = (
  initialConfig: GameConfig,
  moveStrategy: IMoveStrategy,
  winStrategy: IWinStrategy
) => {
  const [config, setConfig] = useState<GameConfig>(initialConfig);
  
  const createEmptyBoard = (size: number): CellValue[][][] => {
    return Array(size).fill(null).map(() => 
      Array(size).fill(null).map(() => 
        Array(size).fill(null)
      )
    );
  };

  const [gameState, setGameState] = useState<GameState>({
    board: createEmptyBoard(initialConfig.gridSize),
    currentPlayer: 'black',
    winner: null,
    winningLine: null,
    history: [],
    isDraw: false,
  });

  const [gameStatus, setGameStatus] = useState<'setup' | 'playing' | 'finished'>('setup');

  const startGame = useCallback((newConfig: GameConfig) => {
    setConfig(newConfig);
    setGameState({
      board: createEmptyBoard(newConfig.gridSize),
      currentPlayer: 'black',
      winner: null,
      winningLine: null,
      history: [],
      isDraw: false,
    });
    setGameStatus('playing');
  }, []);

  const resetGame = useCallback(() => {
    startGame(config);
  }, [config, startGame]);

  const makeMove = useCallback((inputX: number, inputY: number, inputZ: number) => {
    if (gameStatus !== 'playing') return;

    // 1. Delegate Position Logic to Strategy
    const target = moveStrategy.determinePosition(gameState.board, { x: inputX, y: inputY, z: inputZ });

    // If move is invalid (e.g. column full), do nothing
    if (!target) return;

    // 2. Apply Move
    const { x, y, z } = target;
    const newBoard = gameState.board.map((layer, lIdx) => 
      lIdx === z 
        ? layer.map((row, rIdx) => 
            rIdx === y 
              ? row.map((cell, cIdx) => cIdx === x ? gameState.currentPlayer : cell)
              : row
          )
        : layer
    );

    // 3. Delegate Win Logic to Strategy
    const { winner, winningLine } = winStrategy.checkWin(newBoard, target, config.winLength);
    
    // 4. Check Draw
    const isBoardFull = !newBoard.some(layer => layer.some(row => row.some(cell => cell === null)));
    const isDraw = !winner && isBoardFull;

    setGameState(prev => ({
      board: newBoard,
      currentPlayer: prev.currentPlayer === 'black' ? 'white' : 'black',
      winner,
      winningLine,
      history: [...prev.history, target],
      isDraw,
    }));

    if (winner || isDraw) {
      setGameStatus('finished');
    }
  }, [gameState, config, gameStatus, moveStrategy, winStrategy]);

  const undoMove = useCallback(() => {
    if (gameState.history.length === 0 || gameStatus === 'finished') return;
    
    const lastMove = gameState.history[gameState.history.length - 1];
    const { x, y, z } = lastMove;

    const newBoard = gameState.board.map((layer, lIdx) => 
      lIdx === z 
        ? layer.map((row, rIdx) => 
            rIdx === y 
              ? row.map((cell, cIdx) => cIdx === x ? null : cell)
              : row
          )
        : layer
    );

    setGameState(prev => ({
      board: newBoard,
      currentPlayer: prev.currentPlayer === 'black' ? 'white' : 'black',
      winner: null,
      winningLine: null,
      history: prev.history.slice(0, -1),
      isDraw: false,
    }));
  }, [gameState, gameStatus]);

  const returnToSetup = useCallback(() => {
    setGameStatus('setup');
  }, []);

  return {
    config,
    gameState,
    gameStatus,
    startGame,
    resetGame,
    makeMove,
    undoMove,
    returnToSetup
  };
};
