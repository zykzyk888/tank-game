export enum Direction {
  UP = 0,
  RIGHT = 1,
  DOWN = 2,
  LEFT = 3,
}

export enum TileType {
  EMPTY = 0,
  BRICK = 1,
  STEEL = 2,
  WATER = 3,
  GRASS = 4,
  BASE = 9,
}

export enum GameStatus {
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER',
  VICTORY = 'VICTORY',
}

export interface Entity {
  x: number;
  y: number;
  width: number;
  height: number;
  direction: Direction;
  speed: number;
  markedForDeletion: boolean;
}

export interface Tank extends Entity {
  id: string;
  color: string;
  isPlayer: boolean;
  cooldown: number;
  health: number;
}

export interface Bullet extends Entity {
  ownerId: string;
  damage: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
}

export interface LevelData {
  grid: number[][]; // 2D array of TileType
  enemiesToSpawn: number;
}

export interface GameStats {
  score: number;
  lives: number;
  level: number;
}
