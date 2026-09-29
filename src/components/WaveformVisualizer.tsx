import { useRef, useEffect } from 'react';
import { getSignalHistory, BrainWaveType, BRAIN_WAVES, MentalState } from '../utils/eegSignals';

interface WaveformVisualizerProps {
  state: MentalState;
  isPlaying: boolean;
}

export default function WaveformVisualizer({ state, isPlaying }: WaveformVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timeRef = useRef(0);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth * 2;
      canvas.height = canvas.offsetHeight * 2;
    };
    resize();
    window.addEventListener('resize', resize);

    const draw = () => {
      if (isPlaying) {
        timeRef.current += 0.016;
      }

      const w = canvas.width;
      const h = canvas.height;
      
      // Dark background with subtle gradient
      ctx.fillStyle = '#0a0a1a';
      ctx.fillRect(0, 0, w, h);

      // Grid lines
      ctx.strokeStyle = 'rgba(255,255,255,0.03)';
      ctx.lineWidth = 1;
      for (let y = 0; y < h; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      const waveTypes: BrainWaveType[] = ['delta', 'theta', 'alpha', 'beta', 'gamma'];
      const history = getSignalHistory(timeRef.current, 4, 500, state);
      
      const sectionHeight = h / (waveTypes.length + 1);

      waveTypes.forEach((waveType, index) => {
        const data = history[waveType];
        const config = BRAIN_WAVES[waveType];
        const centerY = sectionHeight * (index + 1);
        
        // Glow effect
        ctx.shadowBlur = 15;
        ctx.shadowColor = config.color;
        
        // Draw waveform
        ctx.beginPath();
        ctx.strokeStyle = config.color;
        ctx.lineWidth = 2.5;
        ctx.lineJoin = 'round';
        
        for (let i = 0; i < data.length; i++) {
          const x = (i / data.length) * w;
          const y = centerY + data[i] * sectionHeight * 0.4;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        
        // Fill under curve
        ctx.lineTo(w, centerY);
        ctx.lineTo(0, centerY);
        ctx.closePath();
        ctx.fillStyle = config.color + '15';
        ctx.fill();
        
        ctx.shadowBlur = 0;
        
        // Label
        ctx.fillStyle = config.color;
        ctx.font = 'bold 24px monospace';
        ctx.fillText(config.label, 20, centerY - sectionHeight * 0.35);
      });

      // Time indicator
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.font = '20px monospace';
      ctx.fillText(`t = ${timeRef.current.toFixed(2)}s`, w - 200, 40);

      animRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [state, isPlaying]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full rounded-xl"
      style={{ background: '#0a0a1a' }}
    />
  );
}
