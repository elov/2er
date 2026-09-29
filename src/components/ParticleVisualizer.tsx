import { useRef, useEffect } from 'react';
import { generateCompositeSignal, MentalState, BrainWaveType, BRAIN_WAVES } from '../utils/eegSignals';
import { EEGData, ELECTRODES_10_20 } from '../utils/electrode1020';
import { LoadedImages } from './ImageLoader';

interface ParticleVisualizerProps {
  state: MentalState;
  isPlaying: boolean;
  eegData: EEGData | null;
  selectedChannels: string[];
  images: LoadedImages;
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
  channelId: string;
}

export default function ParticleVisualizer({ state, isPlaying, eegData, selectedChannels, images }: ParticleVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timeRef = useRef(0);
  const animRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);
  const bgImageRef = useRef<HTMLImageElement | null>(null);
  const particleImageRef = useRef<HTMLImageElement | null>(null);
  const overlayImageRef = useRef<HTMLImageElement | null>(null);

  // Load images
  useEffect(() => {
    if (images.background) {
      const img = new Image();
      img.onload = () => { bgImageRef.current = img; };
      img.src = images.background;
    } else {
      bgImageRef.current = null;
    }
  }, [images.background]);

  useEffect(() => {
    if (images.particle) {
      const img = new Image();
      img.onload = () => { particleImageRef.current = img; };
      img.src = images.particle;
    } else {
      particleImageRef.current = null;
    }
  }, [images.particle]);

  useEffect(() => {
    if (images.overlay) {
      const img = new Image();
      img.onload = () => { overlayImageRef.current = img; };
      img.src = images.overlay;
    } else {
      overlayImageRef.current = null;
    }
  }, [images.overlay]);

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
    const activeChannels = selectedChannels.length > 0 ? selectedChannels : ELECTRODES_10_20.map(e => e.id);

    const draw = () => {
      if (isPlaying) {
        timeRef.current += 0.016;
      }

      const w = canvas.width;
      const h = canvas.height;

      // Background
      if (bgImageRef.current) {
        ctx.globalAlpha = 0.3;
        ctx.drawImage(bgImageRef.current, 0, 0, w, h);
        ctx.globalAlpha = 1;
        ctx.fillStyle = 'rgba(5, 5, 20, 0.15)';
        ctx.fillRect(0, 0, w, h);
      } else {
        ctx.fillStyle = 'rgba(5, 5, 20, 0.08)';
        ctx.fillRect(0, 0, w, h);
      }

      // Get signal values
      let signals: Record<string, number> = {};
      
      if (eegData && eegData.samples.length > 0) {
        // Use real EEG data
        const sampleIdx = Math.floor(timeRef.current * eegData.sampleRate) % (eegData.samples[0]?.length || 1);
        eegData.channels.forEach((ch, idx) => {
          signals[ch] = eegData.samples[idx]?.[sampleIdx] || 0;
        });
      } else {
        // Use simulated data
        const composite = generateCompositeSignal(timeRef.current, state, 0.02);
        activeChannels.forEach((ch, idx) => {
          const waveIdx = idx % waveTypes.length;
          signals[ch] = composite[waveTypes[waveIdx]];
        });
      }

      // Spawn particles based on channel signals
      if (isPlaying) {
        activeChannels.forEach((channelId, chIdx) => {
          const signal = signals[channelId] || 0;
          const intensity = Math.abs(signal);
          const spawnCount = Math.floor(intensity * 2);
          
          // Position based on electrode position
          const electrode = ELECTRODES_10_20.find(e => e.id === channelId);
          const baseX = electrode ? electrode.x * w : (chIdx / activeChannels.length) * w;
          const baseY = electrode ? electrode.y * h : h / 2;

          for (let i = 0; i < spawnCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = intensity * 4 + Math.random() * 2;
            const waveType = waveTypes[chIdx % waveTypes.length];
            
            particlesRef.current.push({
              x: baseX + (Math.random() - 0.5) * 60,
              y: baseY + (Math.random() - 0.5) * 60,
              vx: Math.cos(angle) * speed,
              vy: Math.sin(angle) * speed,
              life: 0,
              maxLife: 80 + Math.random() * 150,
              waveType,
              size: 3 + intensity * 10,
              channelId,
            });
          }
        });
      }

      // Update and draw particles
      particlesRef.current = particlesRef.current.filter(p => {
        p.life++;
        if (p.life > p.maxLife) return false;

        const progress = p.life / p.maxLife;
        const alpha = 1 - progress;
        
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.98;
        p.vy *= 0.98;

        const config = BRAIN_WAVES[p.waveType];
        const color = config.color;

        // Draw particle
        if (particleImageRef.current) {
          ctx.globalAlpha = alpha;
          ctx.drawImage(
            particleImageRef.current,
            p.x - p.size, p.y - p.size,
            p.size * 2, p.size * 2
          );
          ctx.globalAlpha = 1;
        } else {
          ctx.shadowBlur = 15;
          ctx.shadowColor = color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * (1 - progress * 0.5), 0, Math.PI * 2);
          ctx.fillStyle = color + Math.floor(alpha * 200).toString(16).padStart(2, '0');
          ctx.fill();
          ctx.shadowBlur = 0;
        }

        // Trail
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - p.vx * 4, p.y - p.vy * 4);
        ctx.strokeStyle = color + Math.floor(alpha * 80).toString(16).padStart(2, '0');
        ctx.lineWidth = p.size * 0.4;
        ctx.stroke();

        return true;
      });

      // Limit particles
      if (particlesRef.current.length > 3000) {
        particlesRef.current = particlesRef.current.slice(-2000);
      }

      // Draw overlay image
      if (overlayImageRef.current) {
        ctx.globalAlpha = 0.15;
        ctx.drawImage(overlayImageRef.current, 0, 0, w, h);
        ctx.globalAlpha = 1;
      }

      // Draw channel labels
      if (eegData) {
        ctx.font = '16px monospace';
        activeChannels.slice(0, 8).forEach((ch, idx) => {
          const electrode = ELECTRODES_10_20.find(e => e.id === ch);
          if (electrode) {
            const x = electrode.x * w;
            const y = electrode.y * h;
            const signal = signals[ch] || 0;
            const intensity = Math.abs(signal);
            
            ctx.fillStyle = `rgba(255,255,255,${0.3 + intensity * 0.7})`;
            ctx.textAlign = 'center';
            ctx.fillText(ch, x, y - 20);
          }
        });
      }

      // Info
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.font = '18px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`Particles: ${particlesRef.current.length}`, 20, 30);
      ctx.fillText(`Channels: ${activeChannels.length}`, 20, 55);

      animRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [state, isPlaying, eegData, selectedChannels, images]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full rounded-xl"
      style={{ background: '#050514' }}
    />
  );
}
