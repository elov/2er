import { useRef, useEffect, useState } from 'react';
import { ColorPalette } from '../utils/colorExtraction';
import { generateCompositeSignal, MentalState, BrainWaveType } from '../utils/eegSignals';
import { EEGData } from '../utils/electrode1020';

interface CellularAutomatonProps {
  palette: ColorPalette;
  gridSize: { width: number; height: number };
  state: MentalState;
  isPlaying: boolean;
  eegData: EEGData | null;
  rule: 'game_of_life' | 'brians_brain' | 'day_and_night' | 'seeds';
}

// Cellular automaton rules
const RULES = {
  game_of_life: {
    survive: [2, 3],
    birth: [3],
  },
  brians_brain: {
    states: 3, // 0=dead, 1=alive, 2=dying
  },
  day_and_night: {
    survive: [3, 4, 6, 7, 8],
    birth: [3, 6, 7, 8],
  },
  seeds: {
    survive: [],
    birth: [2],
  },
};

export default function CellularAutomaton({ 
  palette, 
  gridSize, 
  state, 
  isPlaying, 
  eegData,
  rule 
}: CellularAutomatonProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gridRef = useRef<number[][]>([]);
  const timeRef = useRef(0);
  const animRef = useRef<number>(0);

  // Initialize grid
  useEffect(() => {
    const grid: number[][] = [];
    const maxStates = rule === 'brians_brain' ? 3 : 2;
    
    for (let y = 0; y < gridSize.height; y++) {
      grid[y] = [];
      for (let x = 0; x < gridSize.width; x++) {
        grid[y][x] = Math.random() < 0.3 ? Math.floor(Math.random() * maxStates) : 0;
      }
    }
    gridRef.current = grid;
  }, [gridSize, rule]);

  // Count neighbors
  function countNeighbors(grid: number[][], x: number, y: number): number {
    let count = 0;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        const nx = (x + dx + gridSize.width) % gridSize.width;
        const ny = (y + dy + gridSize.height) % gridSize.height;
        if (grid[ny][nx] > 0) count++;
      }
    }
    return count;
  }

  // Update grid based on rule
  function updateGrid() {
    const grid = gridRef.current;
    const newGrid: number[][] = [];
    const ruleConfig = RULES[rule];

    for (let y = 0; y < gridSize.height; y++) {
      newGrid[y] = [];
      for (let x = 0; x < gridSize.width; x++) {
        const neighbors = countNeighbors(grid, x, y);
        const currentState = grid[y][x];

        if (rule === 'brians_brain') {
          // Brian's Brain: dead -> alive -> dying -> dead
          if (currentState === 0 && neighbors === 2) {
            newGrid[y][x] = 1; // birth
          } else if (currentState === 1) {
            newGrid[y][x] = 2; // dying
          } else {
            newGrid[y][x] = 0; // dead
          }
        } else {
          // Standard rules (Game of Life, Day & Night, Seeds)
          const { survive, birth } = ruleConfig as { survive: number[]; birth: number[] };
          
          if (currentState > 0) {
            newGrid[y][x] = survive.includes(neighbors) ? 1 : 0;
          } else {
            newGrid[y][x] = birth.includes(neighbors) ? 1 : 0;
          }
        }
      }
    }

    gridRef.current = newGrid;
  }

  // Inject EEG signals into grid
  function injectEEGSignals() {
    const grid = gridRef.current;
    let signals: Record<string, number>;

    if (eegData && eegData.samples.length > 0) {
      const sampleIdx = Math.floor(timeRef.current * eegData.sampleRate) % (eegData.samples[0]?.length || 1);
      signals = {};
      eegData.channels.forEach((ch, idx) => {
        signals[ch] = eegData.samples[idx]?.[sampleIdx] || 0;
      });
    } else {
      const composite = generateCompositeSignal(timeRef.current, state, 0.02);
      signals = composite;
    }

    // Randomly inject based on signal intensity
    const signalValues = Object.values(signals);
    const avgIntensity = signalValues.reduce((a, b) => a + Math.abs(b), 0) / signalValues.length;
    
    const injectionCount = Math.floor(avgIntensity * gridSize.width * gridSize.height * 0.01);
    
    for (let i = 0; i < injectionCount; i++) {
      const x = Math.floor(Math.random() * gridSize.width);
      const y = Math.floor(Math.random() * gridSize.height);
      grid[y][x] = 1;
    }
  }

  // Render grid
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const container = canvas.parentElement;
      if (container) {
        canvas.width = container.offsetWidth * 2;
        canvas.height = container.offsetHeight * 2;
      }
    };
    resize();
    window.addEventListener('resize', resize);

    const cellWidth = canvas.width / gridSize.width;
    const cellHeight = canvas.height / gridSize.height;

    const draw = () => {
      if (isPlaying) {
        timeRef.current += 0.05;
        
        // Update simulation
        updateGrid();
        injectEEGSignals();
      }

      const grid = gridRef.current;
      const allColors = [...palette.primary, ...palette.accent];

      // Clear canvas
      ctx.fillStyle = '#0a0a1a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw cells
      for (let y = 0; y < gridSize.height; y++) {
        for (let x = 0; x < gridSize.width; x++) {
          const cellState = grid[y][x];
          
          if (cellState > 0) {
            const colorIdx = (x + y + Math.floor(timeRef.current * 2)) % allColors.length;
            const color = allColors[colorIdx];
            
            const px = x * cellWidth;
            const py = y * cellHeight;
            
            // Draw cell with glow
            ctx.shadowBlur = 3;
            ctx.shadowColor = color;
            ctx.fillStyle = color;
            ctx.fillRect(px, py, cellWidth - 1, cellHeight - 1);
            ctx.shadowBlur = 0;
          }
        }
      }

      // Info overlay
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.font = '16px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`Grid: ${gridSize.width}×${gridSize.height}`, 10, 25);
      ctx.fillText(`Rule: ${rule.replace('_', ' ')}`, 10, 45);

      animRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [gridSize, palette, state, isPlaying, eegData, rule]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full rounded-xl"
      style={{ background: '#0a0a1a', imageRendering: 'pixelated' }}
    />
  );
}
