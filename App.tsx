import React, { useState, useCallback } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { Menu } from './components/Menu';
import { GameStatus, GameStats } from './types';
import { DEFAULT_MAP } from './constants';

const App: React.FC = () => {
  const [gameStatus, setGameStatus] = useState<GameStatus>(GameStatus.MENU);
  const [stats, setStats] = useState<GameStats>({ score: 0, lives: 3, level: 1 });
  const [currentGrid, setCurrentGrid] = useState<number[][]>(DEFAULT_MAP);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleStartGame = useCallback((customGrid?: number[][]) => {
    setStats({ score: 0, lives: 3, level: 1 });
    setCurrentGrid(customGrid || DEFAULT_MAP);
    setGameStatus(GameStatus.PLAYING);
  }, []);

  const handleRestart = () => {
    setGameStatus(GameStatus.MENU);
  };

  const updateScore = (points: number) => {
    setStats(prev => ({ ...prev, score: prev.score + points }));
  };

  const updateLives = (lives: number) => {
    setStats(prev => ({ ...prev, lives }));
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-950 p-4">
      
      {/* Header / HUD */}
      <div className="w-full max-w-[800px] mb-4 flex justify-between items-center bg-gray-900 p-4 rounded-lg border border-gray-800 shadow-lg">
        <div className="flex flex-col">
          <span className="text-xs text-gray-500 uppercase tracking-wider">Score</span>
          <span className="text-2xl font-bold text-amber-400 pixel-font">{stats.score.toString().padStart(6, '0')}</span>
        </div>
        
        <div className="text-center hidden sm:block">
           <h1 className="text-xl font-bold text-gray-200 tracking-widest">NEO TANK COMMAND</h1>
        </div>

        <div className="flex flex-col items-end">
           <span className="text-xs text-gray-500 uppercase tracking-wider">Status</span>
           <span className={`font-bold ${gameStatus === GameStatus.PLAYING ? 'text-green-400' : 'text-red-400'}`}>
             {gameStatus === GameStatus.PLAYING ? 'ACTIVE' : gameStatus}
           </span>
        </div>
      </div>

      {/* Game Container */}
      <div className="relative">
        <GameCanvas 
          gameStatus={gameStatus} 
          setGameStatus={setGameStatus}
          levelGrid={currentGrid}
          onScoreUpdate={updateScore}
          onLivesUpdate={updateLives}
        />

        {/* Menu Overlay */}
        {gameStatus === GameStatus.MENU && (
          <Menu 
            onStart={handleStartGame} 
            isGenerating={isGenerating}
            setIsGenerating={setIsGenerating}
          />
        )}

        {/* Game Over Overlay */}
        {gameStatus === GameStatus.GAME_OVER && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm z-20">
            <h2 className="text-5xl font-bold text-red-600 mb-4 pixel-font tracking-widest animate-pulse">GAME OVER</h2>
            <p className="text-gray-300 mb-8 text-lg">Final Score: <span className="text-white font-bold">{stats.score}</span></p>
            <button 
              onClick={handleRestart}
              className="px-8 py-3 bg-white text-black font-bold rounded hover:bg-gray-200 transition-colors"
            >
              RETURN TO BASE
            </button>
          </div>
        )}
      </div>
      
      <div className="mt-6 text-gray-600 text-sm max-w-[800px] text-center">
        <p>Use <kbd className="px-2 py-1 bg-gray-800 rounded border border-gray-700 text-gray-300">W</kbd><kbd className="px-2 py-1 bg-gray-800 rounded border border-gray-700 text-gray-300">A</kbd><kbd className="px-2 py-1 bg-gray-800 rounded border border-gray-700 text-gray-300">S</kbd><kbd className="px-2 py-1 bg-gray-800 rounded border border-gray-700 text-gray-300">D</kbd> to move and <kbd className="px-2 py-1 bg-gray-800 rounded border border-gray-700 text-gray-300">SPACE</kbd> to fire.</p>
      </div>

    </div>
  );
};

export default App;
