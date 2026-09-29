import { useRef, useEffect } from 'react';
import { generateCompositeSignal, MentalState, BRAIN_WAVES, BrainWaveType } from '../utils/eegSignals';

interface TerrainVisualizerProps {
  state: MentalState;
  isPlaying: boolean;
}

export default function TerrainVisualizer({ state, isPlaying }: TerrainVisualizerProps) {
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

      // Sky gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
      skyGrad.addColorStop(0, '#0a0020');
      skyGrad.addColorStop(0.4, '#1a0040');
      skyGrad.addColorStop(0.7, '#200050');
      skyGrad.addColorStop(1, '#0a0a2a');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, h);

      // Stars
      const signals = generateCompositeSignal(timeRef.current, state, 0.02);
      const starCount = 100;
      for (let i = 0; i < starCount; i++) {
        const sx = ((i * 137.5) % w);
        const sy = ((i * 97.3 + Math.sin(timeRef.current + i) * 2) % (h * 0.5));
        const brightness = 0.3 + 0.7 * Math.sin(timeRef.current * 2 + i * 0.5) * 0.5 + 0.5;
        ctx.beginPath();
        ctx.arc(sx, sy, 1 + brightness, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${brightness * 0.8})`;
        ctx.fill();
      }

      // Draw terrain layers (mountains)
      const layers = 5;
      for (let layer = 0; layer < layers; layer++) {
        const waveType = waveTypes[layer % waveTypes.length];
        const config = BRAIN_WAVES[waveType];
        const signal = signals[waveType];
        
        const baseY = h * (0.4 + layer * 0.12);
        const amplitude = 60 + Math.abs(signal) * 80 + layer * 20;
        const freq = 0.002 + layer * 0.001;
        const scrollSpeed = timeRef.current * (0.3 + layer * 0.2);

        ctx.beginPath();
        ctx.moveTo(0, h);

        for (let x = 0; x <= w; x += 2) {
          const noise1 = Math.sin((x * freq + scrollSpeed) * 1.0) * amplitude;
          const noise2 = Math.sin((x * freq * 2.3 + scrollSpeed * 1.5) * 1.0) * amplitude * 0.4;
          const noise3 = Math.sin((x * freq * 5.1 + scrollSpeed * 0.7) * 1.0) * amplitude * 0.15;
          const y = baseY + noise1 + noise2 + noise3;
          ctx.lineTo(x, y);
        }

        ctx.lineTo(w, h);
        ctx.closePath();

        // Layer gradient
        const layerGrad = ctx.createLinearGradient(0, baseY - amplitude, 0, h);
        const alpha = 0.6 + layer * 0.08;
        layerGrad.addColorStop(0, config.color + Math.floor(alpha * 255).toString(16).padStart(2, '0'));
        layerGrad.addColorStop(1, config.color + '10');
        ctx.fillStyle = layerGrad;
        ctx.fill();

        // Layer outline
        ctx.beginPath();
        for (let x = 0; x <= w; x += 2) {
          const noise1 = Math.sin((x * freq + scrollSpeed) * 1.0) * amplitude;
          const noise2 = Math.sin((x * freq * 2.3 + scrollSpeed * 1.5) * 1.0) * amplitude * 0.4;
          const noise3 = Math.sin((x * freq * 5.1 + scrollSpeed * 0.7) * 1.0) * amplitude * 0.15;
          const y = baseY + noise1 + noise2 + noise3;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = config.color + '80';
        ctx.lineWidth = 2;
        ctx.shadowBlur = 10;
        ctx.shadowColor = config.color;
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      // Aurora effect at top
      ctx.globalCompositeOperation = 'screen';
      for (let i = 0; i < 3; i++) {
        const auroraY = h * 0.15 + i * 30;
        const auroraGrad = ctx.createLinearGradient(0, auroraY - 50, 0, auroraY + 50);
        const auroraSignal = signals[waveTypes[i + 1]];
        auroraGrad.addColorStop(0, 'rgba(0,0,0,0)');
        auroraGrad.addColorStop(0.5, BRAIN_WAVES[waveTypes[i + 1]].color + '30');
        auroraGrad.addColorStop(1, 'rgba(0,0,0,0)');
        
        ctx.beginPath();
        for (let x = 0; x <= w; x += 4) {
          const y = auroraY + Math.sin(x * 0.005 + timeRef.current * 0.5 + i) * 30 * (1 + Math.abs(auroraSignal));
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.lineTo(w, auroraY + 80);
        ctx.lineTo(0, auroraY + 80);
        ctx.closePath();
        ctx.fillStyle = auroraGrad;
        ctx.fill();
      }
      ctx.globalCompositeOperation = 'source-over';

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
      style={{ background: '#0a0020' }}
    />
  );
}
