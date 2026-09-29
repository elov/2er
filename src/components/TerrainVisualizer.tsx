import { useRef, useEffect } from 'react';
import { generateCompositeSignal, MentalState, BRAIN_WAVES, BrainWaveType } from '../utils/eegSignals';
import { EEGData, ELECTRODES_10_20, REGION_COLORS } from '../utils/electrode1020';
import { LoadedImages } from './ImageLoader';

interface TerrainVisualizerProps {
  state: MentalState;
  isPlaying: boolean;
  eegData: EEGData | null;
  selectedChannels: string[];
  images: LoadedImages;
}

export default function TerrainVisualizer({ state, isPlaying, eegData, selectedChannels, images }: TerrainVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timeRef = useRef(0);
  const animRef = useRef<number>(0);
  const bgImageRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    if (images.background) {
      const img = new Image();
      img.onload = () => { bgImageRef.current = img; };
      img.src = images.background;
    } else { bgImageRef.current = null; }
  }, [images.background]);

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

      // Sky gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
      skyGrad.addColorStop(0, '#0a0020');
      skyGrad.addColorStop(0.4, '#1a0040');
      skyGrad.addColorStop(0.7, '#200050');
      skyGrad.addColorStop(1, '#0a0a2a');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, h);

      // Background image
      if (bgImageRef.current) {
        ctx.globalAlpha = 0.2;
        ctx.drawImage(bgImageRef.current, 0, 0, w, h);
        ctx.globalAlpha = 1;
      }

      // Stars
      const starCount = 120;
      for (let i = 0; i < starCount; i++) {
        const sx = ((i * 137.5) % w);
        const sy = ((i * 97.3 + Math.sin(timeRef.current + i) * 2) % (h * 0.5));
        const brightness = 0.3 + 0.7 * (Math.sin(timeRef.current * 2 + i * 0.5) * 0.5 + 0.5);
        ctx.beginPath();
        ctx.arc(sx, sy, 1 + brightness, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${brightness * 0.8})`;
        ctx.fill();
      }

      // Get active channels for terrain layers
      const activeChannels = selectedChannels.length > 0
        ? selectedChannels
        : (eegData ? eegData.channels.slice(0, 5) : ['delta', 'theta', 'alpha', 'beta', 'gamma']);

      const layers = Math.min(activeChannels.length, 6);

      // Draw terrain layers
      for (let layer = 0; layer < layers; layer++) {
        const channelId = activeChannels[layer];
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

        const baseY = h * (0.35 + layer * 0.11);
        const amplitude = 50 + Math.abs(signal) * 100 + layer * 15;
        const freq = 0.002 + layer * 0.001;
        const scrollSpeed = timeRef.current * (0.2 + layer * 0.15);

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

        const layerGrad = ctx.createLinearGradient(0, baseY - amplitude, 0, h);
        const alpha = 0.5 + layer * 0.08;
        layerGrad.addColorStop(0, color + Math.floor(alpha * 255).toString(16).padStart(2, '0'));
        layerGrad.addColorStop(1, color + '08');
        ctx.fillStyle = layerGrad;
        ctx.fill();

        // Outline
        ctx.beginPath();
        for (let x = 0; x <= w; x += 2) {
          const noise1 = Math.sin((x * freq + scrollSpeed) * 1.0) * amplitude;
          const noise2 = Math.sin((x * freq * 2.3 + scrollSpeed * 1.5) * 1.0) * amplitude * 0.4;
          const noise3 = Math.sin((x * freq * 5.1 + scrollSpeed * 0.7) * 1.0) * amplitude * 0.15;
          const y = baseY + noise1 + noise2 + noise3;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = color + '90';
        ctx.lineWidth = 2;
        ctx.shadowBlur = 8;
        ctx.shadowColor = color;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Channel label on terrain
        ctx.fillStyle = color + 'aa';
        ctx.font = 'bold 16px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(channelId, 20, baseY - amplitude - 10);
      }

      // Aurora effect
      ctx.globalCompositeOperation = 'screen';
      for (let i = 0; i < 3; i++) {
        const auroraY = h * 0.12 + i * 25;
        const channelId = activeChannels[i % activeChannels.length];
        let auroraSignal = 0;
        let auroraColor: string;

        if (eegData) {
          const chIdx = eegData.channels.indexOf(channelId);
          if (chIdx >= 0) {
            const sampleIdx = Math.floor(timeRef.current * eegData.sampleRate) % eegData.samples[chIdx].length;
            auroraSignal = eegData.samples[chIdx][sampleIdx] || 0;
          }
          const electrode = ELECTRODES_10_20.find(e => e.id === channelId);
          auroraColor = electrode ? REGION_COLORS[electrode.region] : '#ffffff';
        } else {
          const composite = generateCompositeSignal(timeRef.current, state, 0.02);
          const waveType = channelId as BrainWaveType;
          auroraSignal = composite[waveType] || 0;
          auroraColor = BRAIN_WAVES[waveType]?.color || '#ffffff';
        }

        const auroraGrad = ctx.createLinearGradient(0, auroraY - 40, 0, auroraY + 40);
        auroraGrad.addColorStop(0, 'rgba(0,0,0,0)');
        auroraGrad.addColorStop(0.5, auroraColor + '25');
        auroraGrad.addColorStop(1, 'rgba(0,0,0,0)');
        
        ctx.beginPath();
        for (let x = 0; x <= w; x += 4) {
          const y = auroraY + Math.sin(x * 0.004 + timeRef.current * 0.4 + i) * 25 * (1 + Math.abs(auroraSignal));
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.lineTo(w, auroraY + 60);
        ctx.lineTo(0, auroraY + 60);
        ctx.closePath();
        ctx.fillStyle = auroraGrad;
        ctx.fill();
      }
      ctx.globalCompositeOperation = 'source-over';

      // Info
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.font = '18px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`Layers: ${layers} | ${eegData ? 'EEG DATA' : 'SIMULATED'}`, w - 20, 30);

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
      style={{ background: '#0a0020' }}
    />
  );
}
