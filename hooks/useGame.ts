import { useState, useCallback, useEffect, useRef } from 'react';
import { GameConfig, GameState, IMoveStrategy, IWinStrategy, IAIStrategy, INetworkStrategy, CellValue, Coordinate, Player } from '../types';

export const useGame = (
  initialConfig: GameConfig,
  moveStrategy: IMoveStrategy,
  winStrategy: IWinStrategy,
  aiStrategy: IAIStrategy,
  networkStrategy: INetworkStrategy
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
    networkStatus: 'disconnected',
    networkRoomId: undefined
  });

  // Use a Ref to access the latest gameState inside callbacks (like Network handlers)
  // without triggering re-creation of those callbacks or suffering from stale closures.
  const gameStateRef = useRef(gameState);
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  const [gameStatus, setGameStatus] = useState<'setup' | 'playing' | 'finished'>('setup');
  const isComputerThinking = useRef(false);

  // --- Network Event Handlers ---
  
  // Define performUndo first so it can be used in handleNetworkData
  const performUndo = useCallback((isRemote: boolean) => {
    const currentGameState = gameStateRef.current;

    // Validation using Ref to ensure we have latest state
    if (currentGameState.history.length === 0 || isComputerThinking.current) return;
    
    // In Online mode, if I initiate the undo (!isRemote), send message to opponent
    if (config.gameMode === 'Online' && !isRemote) {
        networkStrategy.sendData({ type: 'UNDO' });
    }

    setGameState(prev => {
        // Double check inside setter for safety
        if (prev.history.length === 0) return prev;

        let stepsToUndo = 1;
        
        // PvE Logic: Undo 2 steps (Computer + Player)
        if (config.gameMode === 'PvE') {
            if (prev.currentPlayer === 'black' && prev.history.length >= 2) {
                stepsToUndo = 2;
            } else if (prev.currentPlayer === 'white') {
               stepsToUndo = 1; 
            } else {
               return prev;
            }
        }
        
        // Online & PvP Logic: Undo 1 step

        const newHistory = prev.history.slice(0, -stepsToUndo);
        // Deep copy board to modify
        const newBoard = JSON.parse(JSON.stringify(prev.board)); 
        
        // Remove stones
        for (let i = 0; i < stepsToUndo; i++) {
            const moveToRemove = prev.history[prev.history.length - 1 - i];
            if (moveToRemove) {
                newBoard[moveToRemove.z][moveToRemove.y][moveToRemove.x] = null;
            }
        }

        let nextPlayer = prev.currentPlayer;
        if (config.gameMode === 'PvP' || config.gameMode === 'Online') {
            nextPlayer = prev.currentPlayer === 'black' ? 'white' : 'black';
        } 
        // PvE keeps same player if undid 2 steps

        return {
            ...prev,
            board: newBoard,
            currentPlayer: nextPlayer,
            winner: null,
            winningLine: null,
            history: newHistory,
            isDraw: false,
        };
    });
  }, [config.gameMode, networkStrategy]);


  const handleNetworkData = useCallback((data: any) => {
    if (data.type === 'MOVE') {
        const { x, y, z } = data;
        applyMove(x, y, z, true);
    } else if (data.type === 'RESET') {
        startNewGame(config, true);
    } else if (data.type === 'UNDO') {
        performUndo(true);
    }
  }, [config, performUndo]); // performUndo is stable due to deps


  // --- Game Actions ---

  const startNewGame = useCallback((newConfig: GameConfig, preserveNetwork = false) => {
    setConfig(newConfig);
    setGameState(prev => ({
      board: createEmptyBoard(newConfig.gridSize),
      currentPlayer: 'black',
      winner: null,
      winningLine: null,
      history: [],
      isDraw: false,
      networkStatus: preserveNetwork ? prev.networkStatus : 'disconnected',
      networkRoomId: preserveNetwork ? prev.networkRoomId : undefined
    }));
    setGameStatus('playing');
    isComputerThinking.current = false;
  }, []);

  const startGame = useCallback((newConfig: GameConfig) => {
    startNewGame(newConfig);
  }, [startNewGame]);

  const hostOnlineGame = useCallback((newConfig: GameConfig) => {
    setConfig({...newConfig, myPlayerColor: 'black'});
    setGameState(prev => ({ ...prev, networkStatus: 'connecting', board: createEmptyBoard(newConfig.gridSize) }));
    
    networkStrategy.hostGame(
        (id) => {
            setGameState(prev => ({ ...prev, networkRoomId: id, networkStatus: 'waiting_opponent' }));
        },
        handleNetworkData,
        () => {
            setGameState(prev => ({ ...prev, networkStatus: 'connected' }));
            setGameStatus('playing');
        }
    );
  }, [networkStrategy, handleNetworkData]);

  const joinOnlineGame = useCallback((newConfig: GameConfig, roomId: string) => {
    setConfig({...newConfig, myPlayerColor: 'white'});
    setGameState(prev => ({ ...prev, networkStatus: 'connecting', board: createEmptyBoard(newConfig.gridSize) }));

    networkStrategy.joinGame(
        roomId,
        handleNetworkData,
        () => {
            setGameState(prev => ({ ...prev, networkStatus: 'connected' }));
            setGameStatus('playing');
        }
    );
  }, [networkStrategy, handleNetworkData]);


  // Defined simply for use in handleNetworkData/makeMove
  function applyMove(inputX: number, inputY: number, inputZ: number, isRemote: boolean = false) {
      setGameState(prevState => {
        const target = moveStrategy.determinePosition(prevState.board, { x: inputX, y: inputY, z: inputZ });
        if (!target) return prevState;

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

        const { winner, winningLine } = winStrategy.checkWin(newBoard, target, config.winLength);
        const isBoardFull = !newBoard.some(layer => layer.some(row => row.some(cell => cell === null)));
        const isDraw = !winner && isBoardFull;

        const nextState = {
          ...prevState,
          board: newBoard,
          currentPlayer: prevState.currentPlayer === 'black' ? 'white' : 'black' as Player,
          winner,
          winningLine,
          history: [...prevState.history, target],
          isDraw,
        };
        
        if (winner || isDraw) {
            setGameStatus('finished');
        }

        if (!isRemote && config.gameMode === 'Online' && prevState.networkStatus === 'connected') {
             networkStrategy.sendData({ type: 'MOVE', x: inputX, y: inputY, z: inputZ });
        }

        return nextState;
    });
  }


  const makeMove = useCallback((inputX: number, inputY: number, inputZ: number) => {
    if (gameStatus !== 'playing') return;

    if (config.gameMode === 'Online') {
        if (gameStateRef.current.currentPlayer !== config.myPlayerColor) return;
    }

    applyMove(inputX, inputY, inputZ, false);
  }, [gameStatus, config]);


  // AI Turn Handling
  useEffect(() => {
    if (gameStatus !== 'playing' || config.gameMode !== 'PvE') return;

    if (gameState.currentPlayer === 'white' && !gameState.winner && !isComputerThinking.current) {
        isComputerThinking.current = true;
        
        const timer = setTimeout(() => {
            const bestMove = aiStrategy.calculateMove(gameState.board, 'white', config.winLength);
            applyMove(bestMove.x, bestMove.y, 0, false); 
            isComputerThinking.current = false;
        }, 600);

        return () => clearTimeout(timer);
    }
  }, [gameState.currentPlayer, gameState.winner, gameStatus, config.gameMode, config.winLength, aiStrategy, gameState.board]);


  const undoMove = useCallback(() => {
     performUndo(false);
  }, [performUndo]);


  const resetGame = useCallback(() => {
    if (config.gameMode === 'Online') {
         startNewGame(config, true);
         networkStrategy.sendData({ type: 'RESET' });
    } else {
        startNewGame(config);
    }
  }, [config, startNewGame, networkStrategy]);

  const returnToSetup = useCallback(() => {
    networkStrategy.disconnect(); 
    setGameStatus('setup');
    isComputerThinking.current = false;
  }, [networkStrategy]);

  return {
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
  };
};