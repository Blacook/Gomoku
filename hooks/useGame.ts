import { useState, useCallback, useEffect, useRef } from 'react';
import { GameConfig, GameState, IMoveStrategy, IWinStrategy, IAIStrategy, CellValue, Coordinate, Player } from '../types';

export const useGame = (
  initialConfig: GameConfig,
  moveStrategy: IMoveStrategy,
  winStrategy: IWinStrategy,
  aiStrategy: IAIStrategy // Injected AI
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
  const isComputerThinking = useRef(false);

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
    isComputerThinking.current = false;
  }, []);

  const resetGame = useCallback(() => {
    startGame(config);
  }, [config, startGame]);

  const makeMove = useCallback((inputX: number, inputY: number, inputZ: number) => {
    if (gameStatus !== 'playing') return;

    setGameState(prevState => {
        // 1. Delegate Position Logic to Strategy
        const target = moveStrategy.determinePosition(prevState.board, { x: inputX, y: inputY, z: inputZ });

        // If move is invalid (e.g. column full), do nothing
        if (!target) return prevState;

        // 2. Apply Move
        const { x, y, z } = target;
        const newBoard = prevState.board.map((layer, lIdx) => 
          lIdx === z 
            ? layer.map((row, rIdx) => 
                rIdx === y 
                  ? row.map((cell, cIdx) => cIdx === x ? prevState.currentPlayer : cell)
                  : row
              )
            : layer
        );

        // 3. Delegate Win Logic to Strategy
        const { winner, winningLine } = winStrategy.checkWin(newBoard, target, config.winLength);
        
        // 4. Check Draw
        const isBoardFull = !newBoard.some(layer => layer.some(row => row.some(cell => cell === null)));
        const isDraw = !winner && isBoardFull;

        const nextState = {
          board: newBoard,
          currentPlayer: prevState.currentPlayer === 'black' ? 'white' : 'black' as Player,
          winner,
          winningLine,
          history: [...prevState.history, target],
          isDraw,
        };
        
        // Side effect: Update status if game ended
        if (winner || isDraw) {
            setGameStatus('finished');
        }

        return nextState;
    });
  }, [config.winLength, gameStatus, moveStrategy, winStrategy]);

  // AI Turn Handling
  useEffect(() => {
    if (gameStatus !== 'playing' || config.gameMode !== 'PvE') return;

    // Assuming Computer plays WHITE
    if (gameState.currentPlayer === 'white' && !gameState.winner && !isComputerThinking.current) {
        isComputerThinking.current = true;
        
        // Add a delay for realism
        const timer = setTimeout(() => {
            const bestMove = aiStrategy.calculateMove(gameState.board, 'white', config.winLength);
            // Z coordinate is irrelevant for makeMove if using Gravity, 
            // but we pass 0 as placeholder since moveStrategy handles it.
            // However, calculateMove returns (x, y).
            makeMove(bestMove.x, bestMove.y, 0); 
            isComputerThinking.current = false;
        }, 600);

        return () => clearTimeout(timer);
    }
  }, [gameState.currentPlayer, gameState.winner, gameStatus, config.gameMode, config.winLength, aiStrategy, gameState.board, makeMove]);


  const undoMove = useCallback(() => {
    if (gameState.history.length === 0 || gameStatus === 'finished' || isComputerThinking.current) return;
    
    // In PvE, if it's player's turn (Black), undoing means going back to Black's previous turn.
    // So we need to pop 2 moves (White's move and Black's last move).
    // If computer is currently thinking, we shouldn't undo.
    
    let stepsToUndo = 1;
    if (config.gameMode === 'PvE') {
        // If it's currently Black's turn (Player), we need to undo White (Computer) and Black (Player)
        // to get back to Black's turn.
        if (gameState.currentPlayer === 'black' && gameState.history.length >= 2) {
            stepsToUndo = 2;
        } else if (gameState.currentPlayer === 'white') {
           // If it's computer's turn (very rare to catch this due to auto-play, but possible with fast clicks),
           // just undo one.
           stepsToUndo = 1; 
        } else {
           // Not enough history to undo fully
           return;
        }
    }

    setGameState(prev => {
        const newHistory = prev.history.slice(0, -stepsToUndo);
        
        // Reconstruct board from scratch is safer/easier than un-applying moves for complex states,
        // but for performance, we can just remove the specific stones if we know them.
        // Let's create a fresh board and replay history for absolute correctness, 
        // or just clear the cells. Clearing cells is faster.
        
        const newBoard = JSON.parse(JSON.stringify(prev.board)); // Deep copy
        
        // Remove the stones that are being undone
        for (let i = 0; i < stepsToUndo; i++) {
            const moveToRemove = prev.history[prev.history.length - 1 - i];
            if (moveToRemove) {
                newBoard[moveToRemove.z][moveToRemove.y][moveToRemove.x] = null;
            }
        }

        // Determine previous player
        // If PvP: simply toggle.
        // If PvE and we undid 2 steps, currentPlayer remains the same (Black).
        let nextPlayer = prev.currentPlayer;
        if (config.gameMode === 'PvP') {
            nextPlayer = prev.currentPlayer === 'black' ? 'white' : 'black';
        } 
        // In PvE, if we undid 2 steps (Black -> White -> Black), player stays Black.

        return {
            board: newBoard,
            currentPlayer: nextPlayer,
            winner: null,
            winningLine: null,
            history: newHistory,
            isDraw: false,
        };
    });
  }, [gameState, gameStatus, config.gameMode]);


  const returnToSetup = useCallback(() => {
    setGameStatus('setup');
    isComputerThinking.current = false;
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
