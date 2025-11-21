import React, { useEffect, useRef, useCallback } from 'react';
import { TILE_SIZE, GRID_WIDTH, GRID_HEIGHT, CANVAS_WIDTH, CANVAS_HEIGHT, PLAYER_SPEED, ENEMY_SPEED, BULLET_SPEED, COLORS } from '../constants';
import { Direction, TileType, Tank, Bullet, Particle, GameStatus, Entity } from '../types';

interface GameCanvasProps {
  gameStatus: GameStatus;
  setGameStatus: (status: GameStatus) => void;
  levelGrid: number[][];
  onScoreUpdate: (points: number) => void;
  onLivesUpdate: (lives: number) => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({ 
  gameStatus, 
  setGameStatus, 
  levelGrid, 
  onScoreUpdate, 
  onLivesUpdate 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  
  // Mutable Game State (Refs for performance)
  const gridRef = useRef<number[][]>([]);
  const playerRef = useRef<Tank | null>(null);
  const enemiesRef = useRef<Tank[]>([]);
  const bulletsRef = useRef<Bullet[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const keysPressed = useRef<{ [key: string]: boolean }>({});
  const frameCountRef = useRef(0);
  const baseRef = useRef<{x: number, y: number} | null>(null);

  // --- Input Handling ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { keysPressed.current[e.code] = true; };
    const handleKeyUp = (e: KeyboardEvent) => { keysPressed.current[e.code] = false; };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // --- Initialization ---
  const initGame = useCallback(() => {
    // Deep copy grid
    gridRef.current = levelGrid.map(row => [...row]);
    
    // Find Base
    baseRef.current = null;
    for(let y=0; y<GRID_HEIGHT; y++) {
      for(let x=0; x<GRID_WIDTH; x++) {
        if (gridRef.current[y][x] === TileType.BASE) {
          baseRef.current = { x: x * TILE_SIZE, y: y * TILE_SIZE };
        }
      }
    }

    // Setup Player
    // Spawn at GRID_HEIGHT - 2 to avoid the bottom steel border
    playerRef.current = {
      id: 'player',
      x: (GRID_WIDTH / 2 - 3) * TILE_SIZE + (TILE_SIZE/2) - 14, // Offset start pos (left of base)
      y: (GRID_HEIGHT - 2) * TILE_SIZE,
      width: 28,
      height: 28,
      direction: Direction.UP,
      speed: PLAYER_SPEED,
      color: COLORS.PLAYER,
      isPlayer: true,
      markedForDeletion: false,
      cooldown: 0,
      health: 1
    };

    enemiesRef.current = [];
    bulletsRef.current = [];
    particlesRef.current = [];
    frameCountRef.current = 0;
    
    // Initial Enemy Spawn
    spawnEnemy(TILE_SIZE, TILE_SIZE);
    spawnEnemy((GRID_WIDTH - 2) * TILE_SIZE, TILE_SIZE);
    spawnEnemy((GRID_WIDTH / 2) * TILE_SIZE, TILE_SIZE);

  }, [levelGrid]);

  const spawnEnemy = (x: number, y: number) => {
    if (enemiesRef.current.length >= 6) return;
    enemiesRef.current.push({
      id: `enemy_${Date.now()}_${Math.random()}`,
      x,
      y,
      width: 28,
      height: 28,
      direction: Direction.DOWN,
      speed: ENEMY_SPEED,
      color: Math.random() > 0.5 ? COLORS.ENEMY_1 : COLORS.ENEMY_2,
      isPlayer: false,
      markedForDeletion: false,
      cooldown: 60, // Start with delay
      health: 1
    });
  };

  useEffect(() => {
    if (gameStatus === GameStatus.PLAYING) {
      initGame();
    }
  }, [gameStatus, initGame]);


  // --- Game Logic Helpers ---

  const getRect = (entity: Entity) => {
    return { x: entity.x, y: entity.y, w: entity.width, h: entity.height };
  };

  const rectIntersect = (r1: any, r2: any) => {
    return !(r2.x > r1.x + r1.w || 
             r2.x + r2.w < r1.x || 
             r2.y > r1.y + r1.h || 
             r2.y + r2.h < r1.y);
  };

  const checkTileCollision = (newX: number, newY: number, width: number, height: number) => {
    // Check boundary
    if (newX < 0 || newX + width > CANVAS_WIDTH || newY < 0 || newY + height > CANVAS_HEIGHT) return true;

    // Check grid tiles
    const startCol = Math.floor(newX / TILE_SIZE);
    const endCol = Math.floor((newX + width - 0.1) / TILE_SIZE);
    const startRow = Math.floor(newY / TILE_SIZE);
    const endRow = Math.floor((newY + height - 0.1) / TILE_SIZE);

    for (let r = startRow; r <= endRow; r++) {
      for (let c = startCol; c <= endCol; c++) {
        if (r >= 0 && r < GRID_HEIGHT && c >= 0 && c < GRID_WIDTH) {
          const tile = gridRef.current[r][c];
          if (tile === TileType.BRICK || tile === TileType.STEEL || tile === TileType.WATER || tile === TileType.BASE) {
            return true;
          }
        }
      }
    }
    return false;
  };

  const createExplosion = (x: number, y: number, color: string, count: number = 10) => {
    for(let i=0; i<count; i++) {
      particlesRef.current.push({
        x, y,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        life: 1.0,
        color: color,
        size: Math.random() * 4 + 2
      });
    }
  };

  const fireBullet = (tank: Tank) => {
    if (tank.cooldown > 0) return;
    
    // Center of tank
    const cx = tank.x + tank.width / 2;
    const cy = tank.y + tank.height / 2;
    const bw = 6;
    const bh = 6;
    let bx = cx - bw/2;
    let by = cy - bh/2;

    if (tank.direction === Direction.UP) by = tank.y - bh - 2;
    if (tank.direction === Direction.DOWN) by = tank.y + tank.height + 2;
    if (tank.direction === Direction.LEFT) bx = tank.x - bw - 2;
    if (tank.direction === Direction.RIGHT) bx = tank.x + tank.width + 2;

    bulletsRef.current.push({
      x: bx, y: by, width: bw, height: bh,
      direction: tank.direction,
      speed: BULLET_SPEED,
      markedForDeletion: false,
      ownerId: tank.id,
      damage: 1
    });
    tank.cooldown = 25; // Frames between shots
  };

  // --- Main Loop ---
  const update = () => {
    frameCountRef.current++;
    const player = playerRef.current;

    // 1. Player Movement
    if (player && !player.markedForDeletion) {
      let dx = 0;
      let dy = 0;
      let moved = false;

      if (keysPressed.current['KeyW'] || keysPressed.current['ArrowUp']) {
        dy = -player.speed; player.direction = Direction.UP; moved = true;
      } else if (keysPressed.current['KeyS'] || keysPressed.current['ArrowDown']) {
        dy = player.speed; player.direction = Direction.DOWN; moved = true;
      } else if (keysPressed.current['KeyA'] || keysPressed.current['ArrowLeft']) {
        dx = -player.speed; player.direction = Direction.LEFT; moved = true;
      } else if (keysPressed.current['KeyD'] || keysPressed.current['ArrowRight']) {
        dx = player.speed; player.direction = Direction.RIGHT; moved = true;
      }

      if (moved && !checkTileCollision(player.x + dx, player.y + dy, player.width, player.height)) {
        player.x += dx;
        player.y += dy;
      }

      if (keysPressed.current['Space']) {
        fireBullet(player);
      }
      if (player.cooldown > 0) player.cooldown--;
    }

    // 2. Enemy Logic (Simple AI)
    enemiesRef.current.forEach(enemy => {
      let dx = 0; 
      let dy = 0;
      
      if (enemy.direction === Direction.UP) dy = -enemy.speed;
      else if (enemy.direction === Direction.DOWN) dy = enemy.speed;
      else if (enemy.direction === Direction.LEFT) dx = -enemy.speed;
      else if (enemy.direction === Direction.RIGHT) dx = enemy.speed;

      // Try move
      if (!checkTileCollision(enemy.x + dx, enemy.y + dy, enemy.width, enemy.height)) {
        enemy.x += dx;
        enemy.y += dy;
      } else {
        // Hit wall, change direction randomly
        enemy.direction = Math.floor(Math.random() * 4);
      }

      // Random shoot
      if (Math.random() < 0.02) fireBullet(enemy);
      if (enemy.cooldown > 0) enemy.cooldown--;
    });

    // Spawn new enemies periodically
    if (frameCountRef.current % 200 === 0 && enemiesRef.current.length < 4) {
      const spawnPoints = [
        {x: TILE_SIZE, y: TILE_SIZE}, 
        {x: CANVAS_WIDTH/2, y: TILE_SIZE}, 
        {x: CANVAS_WIDTH-TILE_SIZE*2, y: TILE_SIZE}
      ];
      const pt = spawnPoints[Math.floor(Math.random()*spawnPoints.length)];
      // Only spawn if clear
      let clear = true;
      if (player && rectIntersect({x: pt.x, y: pt.y, w:30, h:30}, getRect(player))) clear = false;
      if (clear) spawnEnemy(pt.x, pt.y);
    }


    // 3. Bullet Logic
    bulletsRef.current.forEach(bullet => {
      if (bullet.direction === Direction.UP) bullet.y -= bullet.speed;
      else if (bullet.direction === Direction.DOWN) bullet.y += bullet.speed;
      else if (bullet.direction === Direction.LEFT) bullet.x -= bullet.speed;
      else if (bullet.direction === Direction.RIGHT) bullet.x += bullet.speed;

      // Bounds check
      if (bullet.x < 0 || bullet.x > CANVAS_WIDTH || bullet.y < 0 || bullet.y > CANVAS_HEIGHT) {
        bullet.markedForDeletion = true;
        return;
      }

      // Tile Collision
      const c = Math.floor((bullet.x + bullet.width/2) / TILE_SIZE);
      const r = Math.floor((bullet.y + bullet.height/2) / TILE_SIZE);

      if (r >= 0 && r < GRID_HEIGHT && c >= 0 && c < GRID_WIDTH) {
        const tile = gridRef.current[r][c];
        if (tile === TileType.BRICK) {
          gridRef.current[r][c] = TileType.EMPTY; // Destroy brick
          bullet.markedForDeletion = true;
          createExplosion(bullet.x, bullet.y, '#b91c1c', 5);
        } else if (tile === TileType.STEEL) {
          bullet.markedForDeletion = true; // Steel reflects/absorbs
          createExplosion(bullet.x, bullet.y, '#9ca3af', 3);
        } else if (tile === TileType.BASE) {
          gridRef.current[r][c] = TileType.EMPTY; // Base destroyed!
          bullet.markedForDeletion = true;
          createExplosion(bullet.x, bullet.y, '#fbbf24', 50);
          setGameStatus(GameStatus.GAME_OVER);
        }
      }

      // Entity Collision
      // Hit Enemy
      if (bullet.ownerId === 'player') {
        enemiesRef.current.forEach(enemy => {
          if (rectIntersect(getRect(bullet), getRect(enemy))) {
             enemy.health--;
             bullet.markedForDeletion = true;
             if(enemy.health <= 0) {
               enemy.markedForDeletion = true;
               createExplosion(enemy.x + 14, enemy.y + 14, enemy.color, 15);
               onScoreUpdate(100);
             }
          }
        });
      } 
      // Hit Player
      else if (player && !player.markedForDeletion) {
        if (rectIntersect(getRect(bullet), getRect(player))) {
           player.health--;
           bullet.markedForDeletion = true;
           if (player.health <= 0) {
             player.markedForDeletion = true;
             createExplosion(player.x + 14, player.y + 14, player.color, 30);
             setGameStatus(GameStatus.GAME_OVER);
             onLivesUpdate(0);
           }
        }
      }
    });

    // Cleanup
    bulletsRef.current = bulletsRef.current.filter(b => !b.markedForDeletion);
    enemiesRef.current = enemiesRef.current.filter(e => !e.markedForDeletion);

    // Particles
    particlesRef.current.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.05;
    });
    particlesRef.current = particlesRef.current.filter(p => p.life > 0);
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear
    ctx.fillStyle = '#111827';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw Map
    for(let r=0; r<GRID_HEIGHT; r++) {
      for(let c=0; c<GRID_WIDTH; c++) {
        const tile = gridRef.current[r][c];
        if (tile !== TileType.EMPTY && tile !== TileType.GRASS) {
          ctx.fillStyle = COLORS[tile] || '#fff';
          // Add a little bevel effect
          ctx.fillRect(c * TILE_SIZE, r * TILE_SIZE, TILE_SIZE, TILE_SIZE);
          ctx.strokeStyle = 'rgba(0,0,0,0.2)';
          ctx.strokeRect(c * TILE_SIZE, r * TILE_SIZE, TILE_SIZE, TILE_SIZE);
          
          if (tile === TileType.BRICK) {
             // Brick pattern detail
             ctx.fillStyle = 'rgba(0,0,0,0.1)';
             ctx.fillRect(c * TILE_SIZE, r * TILE_SIZE + 18, TILE_SIZE, 4);
             ctx.fillRect(c * TILE_SIZE + 18, r * TILE_SIZE, 4, TILE_SIZE);
          }
        }
      }
    }

    // Helper to draw tank
    const drawTank = (tank: Tank) => {
       ctx.save();
       ctx.translate(tank.x + tank.width/2, tank.y + tank.height/2);
       // Rotate based on direction
       if (tank.direction === Direction.RIGHT) ctx.rotate(Math.PI / 2);
       if (tank.direction === Direction.DOWN) ctx.rotate(Math.PI);
       if (tank.direction === Direction.LEFT) ctx.rotate(-Math.PI / 2);

       // Tank Body
       ctx.fillStyle = tank.color;
       ctx.fillRect(-12, -12, 24, 24);
       // Tracks
       ctx.fillStyle = '#333';
       ctx.fillRect(-14, -14, 8, 28);
       ctx.fillRect(6, -14, 8, 28);
       // Turret
       ctx.fillStyle = '#ddd';
       ctx.beginPath();
       ctx.arc(0, 0, 8, 0, Math.PI * 2);
       ctx.fill();
       // Barrel
       ctx.fillStyle = '#999';
       ctx.fillRect(-3, -20, 6, 16);
       
       ctx.restore();
    };

    // Draw Base (if alive)
    const basePos = baseRef.current;
    if (basePos) {
        const bx = Math.floor(basePos.x / TILE_SIZE);
        const by = Math.floor(basePos.y / TILE_SIZE);
        if (gridRef.current[by][bx] === TileType.BASE) {
           // Draw Fancy Eagle
           ctx.fillStyle = '#fbbf24'; // Gold
           const px = bx * TILE_SIZE;
           const py = by * TILE_SIZE;
           ctx.beginPath();
           ctx.moveTo(px + 20, py + 5);
           ctx.lineTo(px + 35, py + 35);
           ctx.lineTo(px + 5, py + 35);
           ctx.fill();
           // Eye
           ctx.fillStyle = '#000';
           ctx.fillRect(px + 18, py + 15, 4, 4);
        }
    }

    // Draw Player
    if (playerRef.current && !playerRef.current.markedForDeletion) {
      drawTank(playerRef.current);
    }

    // Draw Enemies
    enemiesRef.current.forEach(drawTank);

    // Draw Bullets
    ctx.fillStyle = '#fff';
    bulletsRef.current.forEach(b => {
      ctx.beginPath();
      ctx.arc(b.x + b.width/2, b.y + b.height/2, 3, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw Grass (Overlay)
    for(let r=0; r<GRID_HEIGHT; r++) {
      for(let c=0; c<GRID_WIDTH; c++) {
        if (gridRef.current[r][c] === TileType.GRASS) {
          ctx.fillStyle = 'rgba(22, 101, 52, 0.8)';
          ctx.fillRect(c * TILE_SIZE + 5, r * TILE_SIZE + 5, TILE_SIZE - 10, TILE_SIZE - 10);
        }
      }
    }

    // Draw Particles
    particlesRef.current.forEach(p => {
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1.0;
    });

    // Game Over Text overlay (if managed here, but React UI is better for this. Kept clean.)
  };

  const loop = useCallback(() => {
    if (gameStatus === GameStatus.PLAYING) {
      update();
      draw();
      requestRef.current = requestAnimationFrame(loop);
    } else {
      // Just draw static last frame or black
      draw();
    }
  }, [gameStatus]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    requestRef.current = requestAnimationFrame(loop);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [loop]);

  return (
    <div className="relative border-4 border-gray-700 rounded-lg shadow-2xl bg-black">
      <canvas 
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="block"
      />
    </div>
  );
};