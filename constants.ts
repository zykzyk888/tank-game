import { TileType } from './types';

export const TILE_SIZE = 40;
export const GRID_WIDTH = 20;
export const GRID_HEIGHT = 15;

export const CANVAS_WIDTH = TILE_SIZE * GRID_WIDTH; // 800
export const CANVAS_HEIGHT = TILE_SIZE * GRID_HEIGHT; // 600

export const PLAYER_SPEED = 3;
export const ENEMY_SPEED = 2;
export const BULLET_SPEED = 7;

export const COLORS = {
  [TileType.EMPTY]: '#000000',
  [TileType.BRICK]: '#b91c1c', // Red-700 brick look
  [TileType.STEEL]: '#9ca3af', // Gray-400
  [TileType.WATER]: '#2563eb', // Blue-600
  [TileType.GRASS]: '#166534', // Green-800 (transparent usually, but for simplicity solid here or handled in draw)
  [TileType.BASE]: '#fbbf24', // Amber-400 (Eagle)
  PLAYER: '#fbbf24', // Amber
  ENEMY_1: '#f87171', // Red light
  ENEMY_2: '#c084fc', // Purple
  ENEMY_3: '#34d399', // Emerald
  BULLET: '#ffffff',
};

// Simple default map
export const DEFAULT_MAP: number[][] = Array(GRID_HEIGHT).fill(0).map((_, y) => 
  Array(GRID_WIDTH).fill(0).map((_, x) => {
    // 1. Outer Steel Walls
    if (x === 0 || x === GRID_WIDTH - 1 || y === 0 || y === GRID_HEIGHT - 1) return TileType.STEEL;

    // 2. Protected Base Area (Bottom Center)
    // Base is at [GRID_HEIGHT-2, GRID_WIDTH/2] (Row 13, Col 10)
    // Player spawn is left of Base.
    const centerX = Math.floor(GRID_WIDTH / 2); // 10
    
    // The Base
    if (y === GRID_HEIGHT - 2 && x === centerX) return TileType.BASE;

    // Empty space around base for player spawn and movement
    if (y === GRID_HEIGHT - 2 && x >= centerX - 3 && x <= centerX + 3) return TileType.EMPTY;
    if (y === GRID_HEIGHT - 3 && x >= centerX - 2 && x <= centerX + 2) return TileType.EMPTY;

    // Brick Walls around the Base (The "Eagle's Nest")
    if (y === GRID_HEIGHT - 2 && (x === centerX - 1 || x === centerX + 1)) return TileType.BRICK;
    if (y === GRID_HEIGHT - 3 && (x >= centerX - 1 && x <= centerX + 1)) return TileType.BRICK;

    // 3. Standard Grid Pattern
    if (x % 2 === 0 && y % 2 === 0) return TileType.BRICK;
    
    return TileType.EMPTY;
  })
);