import { useRef, useEffect } from 'react';
import { getSignalHistory, BrainWaveType, BRAIN_WAVES, MentalState } from '../utils/eegSignals';
import { EEGData, ELECTRODES_10_20, REGION_COLORS } from '../utils/electrode1020';
import { LoadedImages } from './ImageLoader';

interface WaveformVisualizerProps {
  state: MentalState;
  isPlaying: boolean;
  eegData: EEGData | null;
  selectedChannels: string[];
  images: LoadedImages;
}

export default function WaveformVisualizer({ state, isPlaying, eegData, selectedChannels, images }: WaveformVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timeRef = useRef(0);
  const animRef = useRef<number>(0);
  const bgImageRef = useRef<HTMLImageElement | null>(null);

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
      
      // Background
      if (bgImageRef.current) {
        ctx.globalAlpha = 0.15;
        ctx.drawImage(bgImageRef.current, 0, 0, w, h);
        ctx.globalAlpha = 1;
      }
      ctx.fillStyle = 'rgba(10, 10, 26, 0.85)';
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

      // Determine channels to display
      let channels: string[];
      let channelData: number[][];
      
      if (eegData && eegData.samples.length > 0) {
        // Use real EEG data
        const activeChannels = selectedChannels.length > 0 
          ? selectedChannels.filter(ch => eegData.channels.includes(ch))
          : eegData.channels.slice(0, 19);
        
        channels = activeChannels;
        const sampleIdx = Math.floor(timeRef.current * eegData.sampleRate);
        const windowSize = Math.min(500, eegData.samples[0].length);
        
        channelData = activeChannels.map(ch => {
          const chIdx = eegData.channels.indexOf(ch);
          if (chIdx < 0) return [];
          const start = Math.max(0, sampleIdx - windowSize);
          return eegData.samples[chIdx].slice(start, start + windowSize);
        });
      } else {
        // Use simulated data
        const waveTypes: BrainWaveType[] = ['delta', 'theta', 'alpha', 'beta', 'gamma'];
        channels = waveTypes;
        const history = getSignalHistory(timeRef.current, 4, 500, state);
        channelData = waveTypes.map(wt => history[wt]);
      }

      const sectionHeight = h / (channels.length + 1);

      channels.forEach((channelId, index) => {
        const data = channelData[index];
        if (!data || data.length === 0) return;
        
        // Determine color
        let color: string;
        const electrode = ELECTRODES_10_20.find(e => e.id === channelId);
        if (electrode) {
          color = REGION_COLORS[electrode.region];
        } else {
          const waveConfig = BRAIN_WAVES[channelId as BrainWaveType];
          color = waveConfig?.color || '#ffffff';
        }
        
        const centerY = sectionHeight * (index + 1);
        
        // Normalize data
        const maxVal = Math.max(...data.map(Math.abs), 0.001);
        
        // Glow effect
        ctx.shadowBlur = 12;
        ctx.shadowColor = color;
        
        // Draw waveform
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = 2.5;
        ctx.lineJoin = 'round';
        
        for (let i = 0; i < data.length; i++) {
          const x = (i / data.length) * w;
          const y = centerY + (data[i] / maxVal) * sectionHeight * 0.38;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        
        // Fill under curve
        ctx.lineTo(w, centerY);
        ctx.lineTo(0, centerY);
        ctx.closePath();
        ctx.fillStyle = color + '12';
        ctx.fill();
        
        ctx.shadowBlur = 0;
        
        // Label
        ctx.fillStyle = color;
        ctx.font = 'bold 22px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(channelId, 20, centerY - sectionHeight * 0.32);
        
        // Region tag
        if (electrode) {
          ctx.fillStyle = color + '60';
          ctx.font = '14px monospace';
          ctx.fillText(electrode.region.toUpperCase(), 20, centerY - sectionHeight * 0.32 + 18);
        }
      });

      // Time indicator
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.font = '18px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`t = ${timeRef.current.toFixed(2)}s | ${eegData ? 'LIVE DATA' : 'SIMULATED'}`, w - 20, 35);

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
      style={{ background: '#0a0a1a' }}
    />
  );
}
