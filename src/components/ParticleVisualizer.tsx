import { useRef, useEffect } from 'react';
import { generateCompositeSignal, MentalState, BrainWaveType, BRAIN_WAVES } from '../utils/eegSignals';

interface ParticleVisualizerProps {
  state: MentalState;
  isPlaying: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  waveType: BrainWaveType;
  size: number;
}

export default function ParticleVisualizer({ state, isPlaying }: ParticleVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timeRef = useRef(0);
  const animRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);

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

      // Fade effect
      ctx.fillStyle = 'rgba(5, 5, 20, 0.08)';
      ctx.fillRect(0, 0, w, h);

      const signals = generateCompositeSignal(timeRef.current, state, 0.02);

      // Spawn new particles based on signal intensity
      if (isPlaying) {
        for (const waveType of waveTypes) {
          const intensity = Math.abs(signals[waveType]);
          const spawnCount = Math.floor(intensity * 3);
          
          for (let i = 0; i < spawnCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = intensity * 3 + Math.random() * 2;
            
            particlesRef.current.push({
              x: w / 2 + (Math.random() - 0.5) * 100,
              y: h / 2 + (Math.random() - 0.5) * 100,
              vx: Math.cos(angle) * speed,
              vy: Math.sin(angle) * speed,
              life: 0,
              maxLife: 60 + Math.random() * 120,
              waveType,
              size: 2 + intensity * 8,
            });
          }
        }
      }

      // Update and draw particles
      particlesRef.current = particlesRef.current.filter(p => {
        p.life++;
        if (p.life > p.maxLife) return false;

        const progress = p.life / p.maxLife;
        const alpha = 1 - progress;
        
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.99;
        p.vy *= 0.99;

        // Add wave influence
        const waveSignal = signals[p.waveType];
        p.vx += waveSignal * 0.5;
        p.vy += Math.cos(timeRef.current * BRAIN_WAVES[p.waveType].frequency) * 0.3;

        const config = BRAIN_WAVES[p.waveType];
        const color = config.color;

        // Draw particle with glow
        ctx.shadowBlur = 20;
        ctx.shadowColor = color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (1 - progress * 0.5), 0, Math.PI * 2);
        ctx.fillStyle = color + Math.floor(alpha * 255).toString(16).padStart(2, '0');
        ctx.fill();
        ctx.shadowBlur = 0;

        // Draw trail
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - p.vx * 3, p.y - p.vy * 3);
        ctx.strokeStyle = color + Math.floor(alpha * 100).toString(16).padStart(2, '0');
        ctx.lineWidth = p.size * 0.5;
        ctx.stroke();

        return true;
      });

      // Limit particles
      if (particlesRef.current.length > 2000) {
        particlesRef.current = particlesRef.current.slice(-1500);
      }

      // Draw center orb
      const orbPulse = 1 + signals.alpha * 0.3;
      const gradient = ctx.createRadialGradient(w/2, h/2, 0, w/2, h/2, 60 * orbPulse);
      gradient.addColorStop(0, 'rgba(255,255,255,0.3)');
      gradient.addColorStop(0.5, 'rgba(100,200,255,0.1)');
      gradient.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.beginPath();
      ctx.arc(w/2, h/2, 60 * orbPulse, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();

      // Info
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.font = '20px monospace';
      ctx.fillText(`Particles: ${particlesRef.current.length}`, 20, 40);

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
