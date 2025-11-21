import React, { useState } from 'react';
import { generateLevelFromPrompt } from '../services/geminiService';

interface MenuProps {
  onStart: (customGrid?: number[][]) => void;
  isGenerating: boolean;
  setIsGenerating: (val: boolean) => void;
}

export const Menu: React.FC<MenuProps> = ({ onStart, isGenerating, setIsGenerating }) => {
  const [prompt, setPrompt] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    setIsGenerating(true);
    setError(null);
    
    const grid = await generateLevelFromPrompt(prompt);
    
    setIsGenerating(false);
    if (grid) {
      onStart(grid);
    } else {
      setError("AI failed to generate a valid map. Try a different prompt.");
    }
  };

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-gray-900/90 backdrop-blur-sm z-10">
      <div className="max-w-md w-full bg-gray-800 p-8 rounded-2xl border border-gray-700 shadow-2xl text-center">
        <h1 className="text-4xl font-bold text-amber-400 mb-2 pixel-font tracking-widest">NEO TANK</h1>
        <p className="text-gray-400 mb-8 text-sm uppercase tracking-wider">AI Powered Warfare</p>

        <div className="space-y-4">
          <button 
            onClick={() => onStart()}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg transition-all transform hover:scale-105 shadow-lg shadow-indigo-500/30"
          >
            CLASSIC MODE
          </button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-800 text-gray-500">OR GENERATE MAP</span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe a battlefield (e.g., 'A maze made of steel with a river in the middle')"
              className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg text-gray-200 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-none resize-none h-24 text-sm"
            />
            <button 
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              className={`w-full py-3 font-bold rounded-lg transition-all flex items-center justify-center gap-2
                ${isGenerating || !prompt.trim() 
                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
                  : 'bg-amber-500 hover:bg-amber-400 text-gray-900 shadow-lg shadow-amber-500/30'}`}
            >
              {isGenerating ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-gray-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  GENERATING...
                </>
              ) : (
                <>
                  GENERATE & START
                </>
              )}
            </button>
            {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
          </div>
        </div>
        
        <div className="mt-8 text-xs text-gray-500">
          <p>WASD to Move • SPACE to Fire</p>
        </div>
      </div>
    </div>
  );
};
