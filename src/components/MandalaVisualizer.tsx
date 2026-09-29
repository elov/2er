import { useRef, useEffect } from 'react';
import { generateCompositeSignal, MentalState, BRAIN_WAVES, BrainWaveType } from '../utils/eegSignals';
import { EEGData, ELECTRODES_10_20, REGION_COLORS } from '../utils/electrode1020';
import { LoadedImages } from './ImageLoader';

interface MandalaVisualizerProps {
  state: MentalState;
  isPlaying: boolean;
  eegData: EEGData | null;
  selectedChannels: string[];
  images: LoadedImages;
}

export default function MandalaVisualizer({ state, isPlaying, eegData, selectedChannels, images }: MandalaVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timeRef = useRef(0);
  const animRef = useRef<number>(0);
  const bgImageRef = useRef<HTMLImageElement | null>(null);
  const overlayImageRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    if (images.background) {
      const img = new Image();
      img.onload = () => { bgImageRef.current = img; };
      img.src = images.background;
    } else { bgImageRef.current = null; }
  }, [images.background]);

  useEffect(() => {
    if (images.overlay) {
      const img = new Image();
      img.onload = () => { overlayImageRef.current = img; };
      img.src = images.overlay;
    } else { overlayImageRef.current = null; }
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

    const draw = () => {
      if (isPlaying) timeRef.current += 0.016;

      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2;
      const cy = h / 2;
      const maxRadius = Math.min(w, h) * 0.42;

      // Background
      if (bgImageRef.current) {
        ctx.globalAlpha = 0.1;
        ctx.drawImage(bgImageRef.current, 0, 0, w, h);
        ctx.globalAlpha = 1;
      }
      ctx.fillStyle = 'rgba(5, 5, 20, 0.05)';
      ctx.fillRect(0, 0, w, h);

      // Get signal data
      const activeChannels = selectedChannels.length > 0 
        ? selectedChannels 
        : (eegData ? eegData.channels.slice(0, 10) : ['delta', 'theta', 'alpha', 'beta', 'gamma']);

      const symmetry = Math.min(activeChannels.length * 2 + 4, 24);
      const angleStep = (Math.PI * 2) / symmetry;

      activeChannels.forEach((channelId, layerIndex) => {
        let signal = 0;
        let color: string;

        if (eegData) {
          const chIdx = eegData.channels.indexOf(channelId);
          if (chIdx >= 0) {
            const sampleIdx = Math.floor(timeRef.current * eegData.sampleRate) % eegData.samples[chIdx].length;
            signal = eegData.samples[chIdx][sampleIdx] || 0;
          }
          const electrode = ELECTRODES_10_20.find(e => e.id === channelId);
          color = electrode ? REGION_COLORS[electrode.region] : '#ffffff';
        } else {
          const composite = generateCompositeSignal(timeRef.current, state, 0.02);
          const waveType = channelId as BrainWaveType;
          signal = composite[waveType] || 0;
          color = BRAIN_WAVES[waveType]?.color || '#ffffff';
        }

        const baseRadius = maxRadius * (0.15 + layerIndex * (0.7 / activeChannels.length));
        const radius = baseRadius + signal * 50;

        ctx.shadowBlur = 8;
        ctx.shadowColor = color;

        for (let s = 0; s < symmetry; s++) {
          const baseAngle = s * angleStep + timeRef.current * (0.15 + layerIndex * 0.08);
          
          ctx.beginPath();
          ctx.strokeStyle = color + 'bb';
          ctx.lineWidth = 1.5 + Math.abs(signal) * 3;

          const points = 50;
          for (let i = 0; i <= points; i++) {
            const t = i / points;
            const angle = baseAngle + t * angleStep * 0.7;
            const freq = eegData ? 3 : (BRAIN_WAVES[channelId as BrainWaveType]?.frequency || 10) * 0.3;
            
            const r = radius + 
              Math.sin(t * Math.PI * 4 + timeRef.current * freq * 0.3) * 25 * Math.abs(signal) +
              Math.cos(t * Math.PI * 2 + timeRef.current * 0.5) * 12;
            
            const x = cx + Math.cos(angle) * r;
            const y = cy + Math.sin(angle) * r;

            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();

          // Dots
          if (s % 2 === 0) {
            for (let i = 0; i < 3; i++) {
              const dotAngle = baseAngle + (i / 3) * angleStep * 0.7;
              const dotR = radius + Math.sin(timeRef.current * 2 + i + layerIndex) * 18;
              const dx = cx + Math.cos(dotAngle) * dotR;
              const dy = cy + Math.sin(dotAngle) * dotR;
              
              ctx.beginPath();
              ctx.arc(dx, dy, 2 + Math.abs(signal) * 5, 0, Math.PI * 2);
              ctx.fillStyle = color;
              ctx.fill();
            }
          }
        }

        ctx.shadowBlur = 0;

        // Channel label
        const labelAngle = timeRef.current * 0.1 + layerIndex * 0.5;
        const labelR = baseRadius + 30;
        ctx.fillStyle = color + '80';
        ctx.font = '14px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(
          channelId,
          cx + Math.cos(labelAngle) * labelR,
          cy + Math.sin(labelAngle) * labelR
        );
      });

      // Center orb
      const centerPulse = 25 + Math.abs(activeChannels.length > 0 ? 30 : 0);
      const centerGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, centerPulse);
      centerGrad.addColorStop(0, 'rgba(255,255,255,0.6)');
      centerGrad.addColorStop(0.5, 'rgba(150,100,255,0.2)');
      centerGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.beginPath();
      ctx.arc(cx, cy, centerPulse, 0, Math.PI * 2);
      ctx.fillStyle = centerGrad;
      ctx.fill();

      // Overlay
      if (overlayImageRef.current) {
        ctx.globalAlpha = 0.1;
        ctx.drawImage(overlayImageRef.current, 0, 0, w, h);
        ctx.globalAlpha = 1;
      }

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
