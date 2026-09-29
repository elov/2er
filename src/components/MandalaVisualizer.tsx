import { useRef, useEffect } from 'react';
import { generateCompositeSignal, MentalState, BRAIN_WAVES, BrainWaveType } from '../utils/eegSignals';

interface MandalaVisualizerProps {
  state: MentalState;
  isPlaying: boolean;
}

export default function MandalaVisualizer({ state, isPlaying }: MandalaVisualizerProps) {
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

    const waveTypes: BrainWaveType[] = ['delta', 'theta', 'alpha', 'beta', 'gamma'];

    const draw = () => {
      if (isPlaying) {
        timeRef.current += 0.016;
      }

      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2;
      const cy = h / 2;
      const maxRadius = Math.min(w, h) * 0.42;

      ctx.fillStyle = 'rgba(5, 5, 20, 0.05)';
      ctx.fillRect(0, 0, w, h);

      const signals = generateCompositeSignal(timeRef.current, state, 0.02);
      const symmetry = 12;
      const angleStep = (Math.PI * 2) / symmetry;

      // Draw mandala layers
      waveTypes.forEach((waveType, layerIndex) => {
        const signal = signals[waveType];
        const config = BRAIN_WAVES[waveType];
        const baseRadius = maxRadius * (0.2 + layerIndex * 0.18);
        const radius = baseRadius + signal * 40;

        ctx.shadowBlur = 10;
        ctx.shadowColor = config.color;

        for (let s = 0; s < symmetry; s++) {
          const baseAngle = s * angleStep + timeRef.current * (0.2 + layerIndex * 0.1);
          
          ctx.beginPath();
          ctx.strokeStyle = config.color + 'cc';
          ctx.lineWidth = 2 + Math.abs(signal) * 3;

          const points = 60;
          for (let i = 0; i <= points; i++) {
            const t = i / points;
            const angle = baseAngle + t * angleStep * 0.8;
            
            // Complex curve based on signals
            const r = radius + 
              Math.sin(t * Math.PI * 4 + timeRef.current * config.frequency * 0.5) * 20 * Math.abs(signal) +
              Math.cos(t * Math.PI * 2 + timeRef.current) * 10;
            
            const x = cx + Math.cos(angle) * r;
            const y = cy + Math.sin(angle) * r;

            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();

          // Draw dots at peaks
          for (let i = 0; i < 4; i++) {
            const dotAngle = baseAngle + (i / 4) * angleStep * 0.8;
            const dotR = radius + Math.sin(timeRef.current * 3 + i) * 15;
            const dx = cx + Math.cos(dotAngle) * dotR;
            const dy = cy + Math.sin(dotAngle) * dotR;
            
            ctx.beginPath();
            ctx.arc(dx, dy, 3 + Math.abs(signal) * 5, 0, Math.PI * 2);
            ctx.fillStyle = config.color;
            ctx.fill();
          }
        }

        ctx.shadowBlur = 0;
      });

      // Center circle
      const centerPulse = 20 + Math.abs(signals.alpha) * 30;
      const centerGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, centerPulse);
      centerGrad.addColorStop(0, 'rgba(255,255,255,0.8)');
      centerGrad.addColorStop(0.5, 'rgba(150,100,255,0.3)');
      centerGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.beginPath();
      ctx.arc(cx, cy, centerPulse, 0, Math.PI * 2);
      ctx.fillStyle = centerGrad;
      ctx.fill();

      // Outer ring
      ctx.beginPath();
      ctx.arc(cx, cy, maxRadius, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255,255,255,0.1)';
      ctx.lineWidth = 1;
      ctx.stroke();

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
      style={{ background: '#050514' }}
    />
  );
}
