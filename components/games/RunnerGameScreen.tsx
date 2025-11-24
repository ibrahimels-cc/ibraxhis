
import React, { useRef, useEffect, useState } from 'react';
import { GameState, Language } from '../../types';
import { translations } from '../../utils/translations';
import { ArrowLeft, Play, RotateCcw, Heart, Zap, Cpu } from 'lucide-react';
import { audioManager } from '../../utils/audio';

interface RunnerGameScreenProps {
  onNavigate: (state: GameState) => void;
  language: Language;
}

export const RunnerGameScreen: React.FC<RunnerGameScreenProps> = ({ onNavigate, language }) => {
  const t = translations[language];
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'start' | 'playing' | 'gameover'>('start');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [speedDisplay, setSpeedDisplay] = useState(100);

  // Game State Refs
  const stateRef = useRef({
    playerLane: 1, // 0, 1, 2
    playerX: 0,
    playerY: 0,
    objects: [] as { lane: number, z: number, type: 'obstacle' | 'coin', active: boolean, rotation: number }[],
    speed: 40,
    distance: 0,
    lastSpawnTime: 0,
    gridOffset: 0,
    cameraShake: 0,
    frame: 0,
    worldRotation: 0,
    targetWorldRotation: 0,
    backgroundRotation: 0,
  });

  const LANE_WIDTH = 300;
  const TOTAL_LANES = 3;

  const handleLaneChange = (direction: 'left' | 'right') => {
    if (gameState !== 'playing') return;
    
    const targetLane = direction === 'left' 
      ? Math.max(0, Math.round(stateRef.current.playerLane) - 1)
      : Math.min(TOTAL_LANES - 1, Math.round(stateRef.current.playerLane) + 1);
      
    if (targetLane !== stateRef.current.playerLane) {
        stateRef.current.playerLane = targetLane;
        // Tilt world slightly into the turn
        stateRef.current.targetWorldRotation = (targetLane - 1) * -0.1;
        audioManager.playClick();
    }
  };

  const startGame = () => {
    stateRef.current = {
      playerLane: 1,
      playerX: 0,
      playerY: 0,
      objects: [],
      speed: 40,
      distance: 0,
      lastSpawnTime: 0,
      gridOffset: 0,
      cameraShake: 0,
      frame: 0,
      worldRotation: 0,
      targetWorldRotation: 0,
      backgroundRotation: 0,
    };
    setScore(0);
    setLives(3);
    setLevel(1);
    setSpeedDisplay(100);
    setGameState('playing');
    audioManager.playCorrect();
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    // 3D Projection Configuration
    const FOV = 600;
    const CAMERA_HEIGHT = 200; 
    const HORIZON_Y = canvas.height * 0.5;

    const project = (x: number, y: number, z: number) => {
      if (z < 1) return { x: 0, y: 0, scale: 0 }; 
      const scale = FOV / (FOV + z);
      const x2d = (x * scale); // Centered at 0,0 relative to vanishing point
      const y2d = ((y - CAMERA_HEIGHT) * scale);
      return { x: x2d, y: y2d, scale };
    };

    const loop = (timestamp: number) => {
      if (gameState === 'playing') {
          updateGameLogic(timestamp);
      }
      drawGame(ctx, canvas.width, canvas.height, timestamp);
      stateRef.current.frame = requestAnimationFrame(loop);
    };
    
    const updateGameLogic = (timestamp: number) => {
        const state = stateRef.current;
        state.distance += state.speed;
        state.gridOffset = (state.gridOffset + state.speed) % 200;
        state.backgroundRotation += 0.0005;
        
        // World Rotation Logic (Swaying + Turning)
        // Base sway
        const sway = Math.sin(timestamp * 0.001) * 0.05;
        // Interpolate towards target rotation (based on lane)
        state.worldRotation += (state.targetWorldRotation + sway - state.worldRotation) * 0.05;

        // Difficulty
        if (state.distance > level * 15000) {
            setLevel(l => Math.min(l + 1, 5));
            state.speed += 2;
        }
        setSpeedDisplay(Math.floor((state.speed / 40) * 100));

        // Player Movement Interpolation
        const targetX = (state.playerLane - 1) * LANE_WIDTH;
        state.playerX += (targetX - state.playerX) * 0.15;

        state.cameraShake *= 0.9;

        // Spawning
        const spawnRate = Math.max(400, 25000 / state.speed);
        if (timestamp - state.lastSpawnTime > spawnRate) {
            const lane = Math.floor(Math.random() * TOTAL_LANES);
            const tooClose = state.objects.some(o => o.z < 1200 && Math.abs(o.z) < 300);
            
            if (!tooClose) {
                const type = Math.random() > 0.35 ? 'obstacle' : 'coin';
                state.objects.push({
                    lane,
                    z: 0, 
                    type,
                    active: true,
                    rotation: Math.random() * Math.PI * 2
                });
                state.lastSpawnTime = timestamp;
            }
        }

        // Object Logic
        for (let i = state.objects.length - 1; i >= 0; i--) {
            const obj = state.objects[i];
            obj.z += state.speed;
            
            // Spin obstacles
            if (obj.type === 'coin') obj.rotation += 0.05;

            // Collision
            // Player is approx at z=1200
            if (obj.active && obj.z > 1150 && obj.z < 1250) {
                const objX = (obj.lane - 1) * LANE_WIDTH;
                const hitDist = 100;
                
                if (Math.abs(state.playerX - objX) < hitDist) {
                    if (obj.type === 'obstacle') {
                        obj.active = false;
                        state.cameraShake = 30;
                        setLives(l => {
                            const newLives = l - 1;
                            if (newLives <= 0) {
                                setGameState('gameover');
                                audioManager.playWrong();
                            } else {
                                audioManager.playWrong();
                            }
                            return newLives;
                        });
                    } else {
                        obj.active = false;
                        setScore(s => s + 50);
                        audioManager.playCorrect();
                    }
                }
            }

            if (obj.z > 1800) {
                state.objects.splice(i, 1);
            }
        }
    };

    const drawGame = (ctx: CanvasRenderingContext2D, w: number, h: number, time: number) => {
        const state = stateRef.current;
        
        // -- BACKGROUND --
        // Draw deep space background (not affected by rotation for stability, or slight rotation)
        const bgGrad = ctx.createRadialGradient(w/2, h/2, 0, w/2, h/2, w);
        bgGrad.addColorStop(0, '#0f172a');
        bgGrad.addColorStop(1, '#020617');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, w, h);

        ctx.save();
        
        // Center the coordinate system for rotation
        ctx.translate(w/2, h/2);
        
        // Apply Camera Shake
        if (state.cameraShake > 0.5) {
            const dx = (Math.random() - 0.5) * state.cameraShake;
            const dy = (Math.random() - 0.5) * state.cameraShake;
            ctx.translate(dx, dy);
        }

        // Apply World Rotation (The Vortex Effect)
        ctx.rotate(state.worldRotation);

        // -- VORTEX / GALAXY --
        ctx.save();
        ctx.rotate(state.backgroundRotation);
        for(let i=0; i<8; i++) {
            ctx.rotate(Math.PI / 4);
            const grad = ctx.createLinearGradient(0, 0, w, 0);
            grad.addColorStop(0, 'rgba(124, 58, 237, 0)');
            grad.addColorStop(0.5, 'rgba(124, 58, 237, 0.1)'); // Purple
            grad.addColorStop(1, 'rgba(14, 165, 233, 0)'); // Cyan
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.quadraticCurveTo(w/4, h/4, w, 0);
            ctx.lineTo(w, 100);
            ctx.quadraticCurveTo(w/4, h/4 + 100, 0, 10);
            ctx.fill();
        }
        ctx.restore();

        // -- GRID FLOOR --
        drawGrid(ctx, w, h, state.gridOffset, project);

        // -- REFLECTIONS (Draw everything upside down with low opacity) --
        ctx.save();
        ctx.scale(1, -1); // Flip vertically
        ctx.translate(0, -20); // Move slightly "down" (which is up now) to create gap
        ctx.globalAlpha = 0.2;
        // Draw Reflection Player
        drawRobot(ctx, state.playerX, 1200, time, project, state.speed, true);
        // Draw Reflection Objects
        state.objects.forEach(obj => {
             if (obj.active && obj.z > 200) drawObject(ctx, obj, project);
        });
        ctx.restore();

        // -- MAIN SCENE --
        // Sort objects by Z to draw far ones first
        const sortedObjects = [...state.objects].sort((a,b) => a.z - b.z);
        
        // Draw Objects behind player
        sortedObjects.filter(o => o.z >= 1200).forEach(obj => {
            if (obj.active) drawObject(ctx, obj, project);
        });

        // Draw Player (Robot)
        if (gameState !== 'gameover') {
            drawRobot(ctx, state.playerX, 1200, time, project, state.speed, false);
        }

        // Draw Objects in front of player
        sortedObjects.filter(o => o.z < 1200).forEach(obj => {
             if (obj.active) drawObject(ctx, obj, project);
        });

        // -- SPEED LINES --
        drawSpeedLines(ctx, w, h, time, state.speed);

        ctx.restore(); // Restore from rotation/translation
    };

    const drawGrid = (ctx: CanvasRenderingContext2D, w: number, h: number, offset: number, project: Function) => {
        ctx.strokeStyle = '#a855f7'; // Purple 500
        ctx.lineWidth = 2;
        ctx.shadowColor = '#d8b4fe';
        ctx.shadowBlur = 10;
        
        // Glow Floor
        const floorGrad = ctx.createLinearGradient(0, 0, 0, h);
        floorGrad.addColorStop(0, 'rgba(88, 28, 135, 0.5)'); // Dark purple at horizon
        floorGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = floorGrad;
        
        // Fill a trapezoid for the floor
        const pTL = project(-4000, 0, 3000);
        const pTR = project(4000, 0, 3000);
        const pBL = project(-4000, 0, 0);
        const pBR = project(4000, 0, 0);
        
        ctx.beginPath();
        ctx.moveTo(pTL.x, pTL.y);
        ctx.lineTo(pTR.x, pTR.y);
        ctx.lineTo(pBR.x, pBR.y);
        ctx.lineTo(pBL.x, pBL.y);
        ctx.fill();

        ctx.beginPath();
        // Longitudinal lines
        for(let x=-3000; x<=3000; x+=LANE_WIDTH) {
            const p1 = project(x, 0, 0);
            const p2 = project(x, 0, 3000);
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
        }
        // Lateral lines
        for(let z=0; z<3000; z+=300) {
            const zActual = (z - offset + 3000) % 3000;
            const p1 = project(-3000, 0, zActual);
            const p2 = project(3000, 0, zActual);
            // Alpha fade
            ctx.globalAlpha = Math.min(1, zActual / 1500); 
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
        }
        ctx.globalAlpha = 1;
        ctx.stroke();
        ctx.shadowBlur = 0;
    };

    const drawRobot = (ctx: CanvasRenderingContext2D, xOffset: number, z: number, time: number, project: Function, speed: number, isReflection: boolean) => {
        const center = project(xOffset, 0, z);
        const scale = center.scale;
        
        // Animation params
        const runCycle = time * 0.015 * (speed/30);
        const bob = Math.abs(Math.sin(runCycle)) * 20 * scale;
        const tilt = (stateRef.current.playerLane - 1) * -0.2; // Bank into turns

        ctx.save();
        ctx.translate(center.x, center.y - bob);
        ctx.scale(scale, scale);
        ctx.rotate(tilt);

        // Colors
        const colorPrimary = '#0ea5e9'; // Sky 500
        const colorDark = '#0f172a'; // Slate 900
        const colorGlow = '#38bdf8'; // Sky 400

        if (isReflection) ctx.filter = 'blur(2px)';

        // --- DRAW LIMBS ---
        // Helper for pseudo-3D segments
        const drawSegment = (x1:number, y1:number, x2:number, y2:number, width:number) => {
            ctx.strokeStyle = colorDark;
            ctx.lineWidth = width;
            ctx.lineCap = 'round';
            ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
            
            // Highlight
            ctx.strokeStyle = colorPrimary;
            ctx.lineWidth = width * 0.3;
            ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
        };

        const legAmp = 30;
        const armAmp = 30;

        // RIGHT LEG (Back)
        const rLegAngle = Math.sin(runCycle + Math.PI);
        const rKneeX = Math.sin(rLegAngle) * legAmp;
        const rKneeY = 60 + Math.cos(rLegAngle) * 10;
        const rFootX = rKneeX + Math.sin(rLegAngle - 0.5) * legAmp;
        const rFootY = rKneeY + 60;
        drawSegment(10, 50, 10 + rKneeX, rKneeY, 14); // Thigh
        drawSegment(10 + rKneeX, rKneeY, 10 + rFootX, rFootY, 12); // Shin

        // LEFT ARM (Back)
        const lArmAngle = Math.sin(runCycle + Math.PI);
        const lElbowX = -20 + Math.sin(lArmAngle) * armAmp;
        const lElbowY = -30 + Math.abs(Math.cos(lArmAngle)) * 10;
        const lHandX = lElbowX + Math.sin(lArmAngle + 0.5) * armAmp;
        const lHandY = lElbowY + 30;
        drawSegment(-15, -40, lElbowX, lElbowY, 12);
        drawSegment(lElbowX, lElbowY, lHandX, lHandY, 10);

        // TORSO
        ctx.fillStyle = colorDark;
        ctx.beginPath();
        // Trapezoid torso
        ctx.moveTo(-15, -50); ctx.lineTo(15, -50);
        ctx.lineTo(10, 10); ctx.lineTo(-10, 10);
        ctx.fill();
        
        // Neon Core
        ctx.fillStyle = colorGlow;
        ctx.shadowColor = colorGlow;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.moveTo(-5, -40); ctx.lineTo(5, -40); ctx.lineTo(0, -10);
        ctx.fill();
        ctx.shadowBlur = 0;

        // HEAD
        ctx.fillStyle = colorDark;
        ctx.beginPath();
        ctx.arc(0, -65, 12, 0, Math.PI*2);
        ctx.fill();
        // Visor
        ctx.fillStyle = colorGlow;
        ctx.fillRect(-8, -68, 16, 6);

        // RIGHT ARM (Front)
        const rArmAngle = Math.sin(runCycle);
        const rElbowX = 20 + Math.sin(rArmAngle) * armAmp;
        const rElbowY = -30 + Math.abs(Math.cos(rArmAngle)) * 10;
        const rHandX = rElbowX + Math.sin(rArmAngle + 0.5) * armAmp;
        const rHandY = rElbowY + 30;
        drawSegment(15, -40, rElbowX, rElbowY, 12);
        drawSegment(rElbowX, rElbowY, rHandX, rHandY, 10);

        // LEFT LEG (Front)
        const lLegAngle = Math.sin(runCycle);
        const lKneeX = Math.sin(lLegAngle) * legAmp;
        const lKneeY = 60 + Math.cos(lLegAngle) * 10;
        const lFootX = lKneeX + Math.sin(lLegAngle - 0.5) * legAmp;
        const lFootY = lKneeY + 60;
        drawSegment(-10, 50, -10 + lKneeX, lKneeY, 14);
        drawSegment(-10 + lKneeX, lKneeY, -10 + lFootX, lFootY, 12);

        ctx.restore();
    };

    const drawObject = (ctx: CanvasRenderingContext2D, obj: any, project: Function) => {
        const x = (obj.lane - 1) * LANE_WIDTH;
        const center = project(x, 0, obj.z);
        const scale = center.scale;
        
        ctx.save();
        ctx.translate(center.x, center.y);
        ctx.scale(scale, scale);

        if (obj.type === 'obstacle') {
            // -- NEON OBSTACLE --
            ctx.shadowColor = '#f43f5e'; // Rose 500
            ctx.shadowBlur = 20;
            ctx.fillStyle = 'rgba(244, 63, 94, 0.2)';
            ctx.strokeStyle = '#fb7185'; // Rose 400
            ctx.lineWidth = 5;

            // Draw a spike/pyramid
            ctx.beginPath();
            ctx.moveTo(0, -100);
            ctx.lineTo(60, 0);
            ctx.lineTo(-60, 0);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Internal detail
            ctx.beginPath();
            ctx.moveTo(0, -60);
            ctx.lineTo(20, -10);
            ctx.lineTo(-20, -10);
            ctx.closePath();
            ctx.fillStyle = '#f43f5e';
            ctx.fill();

        } else {
            // -- COIN --
            ctx.rotate(obj.rotation);
            ctx.shadowColor = '#fbbf24'; // Amber 400
            ctx.shadowBlur = 15;
            ctx.fillStyle = '#f59e0b';
            
            // Octagon
            ctx.beginPath();
            for(let i=0; i<8; i++) {
                const a = (i/8) * Math.PI*2;
                const px = Math.cos(a) * 40;
                const py = Math.sin(a) * 40;
                if(i===0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.fill();
            
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 3;
            ctx.stroke();
        }

        ctx.restore();
    };

    const drawSpeedLines = (ctx: CanvasRenderingContext2D, w: number, h: number, time: number, speed: number) => {
        const count = 20;
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        
        for(let i=0; i<count; i++) {
            const angle = (i / count) * Math.PI * 2 + time * 0.001;
            const dist = ((time * speed * 0.5 + i * 100) % 1000) / 1000;
            
            // Exponential expansion
            const r1 = dist * dist * w * 0.8;
            const r2 = (dist + 0.1) * (dist + 0.1) * w * 0.8;
            
            if (dist < 0.1) continue; // Clip center

            const x1 = Math.cos(angle) * r1;
            const y1 = Math.sin(angle) * r1;
            const x2 = Math.cos(angle) * r2;
            const y2 = Math.sin(angle) * r2;

            ctx.globalAlpha = dist;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
        }
        ctx.globalAlpha = 1;
    };

    stateRef.current.frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(stateRef.current.frame);
  }, [gameState, level]);

  // Input Handling
  useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
          if (e.key === 'ArrowLeft') handleLaneChange('left');
          if (e.key === 'ArrowRight') handleLaneChange('right');
      };
      const handleTouchStart = (e: TouchEvent) => {
          if (e.touches[0].clientX < window.innerWidth / 2) handleLaneChange('left');
          else handleLaneChange('right');
      };
      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('touchstart', handleTouchStart);
      return () => {
          window.removeEventListener('keydown', handleKeyDown);
          window.removeEventListener('touchstart', handleTouchStart);
      };
  }, [gameState]);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-slate-950 font-mono select-none">
        <canvas ref={canvasRef} className="block w-full h-full" />
        
        {/* HUD Layer */}
        <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-start pointer-events-none z-20">
             <div className="text-4xl font-black text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.8)] italic">
                 {score.toString().padStart(6, '0')}
             </div>
             <div className="absolute left-1/2 -translate-x-1/2 top-8 text-center bg-black/40 px-4 py-1 rounded-full backdrop-blur-sm border border-white/10">
                 <div className="text-white font-bold text-sm tracking-[0.2em]">
                     LEVEL {level}
                 </div>
             </div>
             <div className="flex gap-2">
                 {[1,2,3].map(i => (
                     <Heart 
                        key={i} 
                        className={`filter drop-shadow-lg ${i <= lives ? 'text-red-500 fill-red-500' : 'text-slate-800 fill-slate-900'}`} 
                        size={28} 
                     />
                 ))}
             </div>
        </div>
        
        <div className="absolute bottom-6 right-6 pointer-events-none z-20">
            <div className="text-fuchsia-400 font-bold text-xl tracking-widest drop-shadow-[0_0_8px_rgba(232,121,249,0.8)]">
                SPEED {speedDisplay}%
            </div>
        </div>

        <button 
            onClick={() => onNavigate(GameState.GAMES_HUB)}
            className="absolute top-24 left-6 pointer-events-auto p-2 rounded-full bg-slate-900/50 text-white backdrop-blur border border-slate-700 hover:bg-slate-800 transition-colors z-20"
        >
            {language === 'ar' ? <ArrowLeft size={20} /> : <ArrowLeft size={20} className="rotate-180" />}
        </button>

        {/* --- START SCREEN (Specific Layout) --- */}
        {gameState === 'start' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md z-30">
                <div className="w-[340px] bg-[#0f172a] rounded-[24px] p-2 shadow-2xl border border-slate-700 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-fuchsia-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                    
                    <div className="relative rounded-[20px] bg-[#1e293b] overflow-hidden flex flex-col items-center pb-8">
                        {/* Title Header */}
                        <div className="w-full h-40 bg-slate-950 flex flex-col items-center justify-center relative overflow-hidden mb-6">
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_100%,rgba(6,182,212,0.4),rgba(0,0,0,0)_70%)]" />
                            <div className="w-full h-full border-b border-cyan-500/30 absolute bottom-0 transform perspective-[300px] rotate-x-12" />
                            
                            <h1 className="relative z-10 text-center leading-none">
                                <span className="block text-4xl font-black italic text-transparent bg-clip-text bg-gradient-to-b from-white to-cyan-300 drop-shadow-[0_0_15px_rgba(34,211,238,0.8)]">
                                    GEMINI
                                </span>
                                <span className="block text-3xl font-black italic text-fuchsia-400 tracking-wider">
                                    RUNNER
                                </span>
                            </h1>
                        </div>

                        {/* Button */}
                        <button 
                            onClick={startGame}
                            className="w-4/5 py-4 mb-3 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-xl flex items-center justify-center gap-2 hover:shadow-[0_0_25px_rgba(8,145,178,0.6)] hover:scale-105 transition-all duration-300"
                        >
                            <span className="text-white font-black tracking-widest text-sm">INITIALIZE RUN</span>
                            <Play size={16} className="fill-white text-white" />
                        </button>

                        {/* Developer Credit - Strictly below button */}
                        <div className="text-[9px] text-slate-500 font-bold tracking-[0.25em] uppercase">
                            DEVELOPED BY IBRAHIM
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* GAME OVER */}
        {gameState === 'gameover' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md z-30">
                <div className="flex flex-col items-center text-center p-8 border border-red-900/50 rounded-3xl bg-red-950/20 shadow-[0_0_50px_rgba(239,68,68,0.2)]">
                    <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6 border border-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.2)] animate-pulse">
                        <Cpu size={40} className="text-red-500" />
                    </div>
                    <h2 className="text-4xl font-black text-white mb-2 tracking-tighter italic">SYSTEM FAILURE</h2>
                    <p className="text-red-400 font-mono text-lg tracking-widest mb-8">SCORE: {score}</p>
                    
                    <button 
                        onClick={startGame}
                        className="px-12 py-4 bg-white text-black rounded-full font-bold flex items-center gap-2 hover:scale-105 transition-transform hover:bg-cyan-100"
                    >
                        <RotateCcw size={20} /> REBOOT SYSTEM
                    </button>
                    <button 
                        onClick={() => onNavigate(GameState.GAMES_HUB)}
                        className="mt-6 text-slate-500 text-sm hover:text-white transition-colors"
                    >
                        {t.back}
                    </button>
                </div>
            </div>
        )}
    </div>
  );
};
