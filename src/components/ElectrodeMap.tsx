import { useRef, useEffect, useState } from 'react';
import { ELECTRODES_10_20, REGION_COLORS, EEGData } from '../utils/electrode1020';

interface ElectrodeMapProps {
  data: EEGData | null;
  selectedChannels: string[];
  onChannelSelect: (channel: string) => void;
  currentTime: number;
}

export default function ElectrodeMap({ data, selectedChannels, onChannelSelect, currentTime }: ElectrodeMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredElectrode, setHoveredElectrode] = useState<string | null>(null);
  const [canvasSize, setCanvasSize] = useState({ w: 400, h: 400 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const container = canvas.parentElement;
    if (container) {
      const size = Math.min(container.offsetWidth, container.offsetHeight, 500);
      setCanvasSize({ w: size, h: size });
      canvas.width = size * 2;
      canvas.height = size * 2;
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const radius = Math.min(w, h) * 0.42;

    // Clear
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, w, h);

    // Draw head outline
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Draw nose indicator
    ctx.beginPath();
    ctx.moveTo(cx - 15, cy - radius + 5);
    ctx.lineTo(cx, cy - radius - 20);
    ctx.lineTo(cx + 15, cy - radius + 5);
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw ears
    ctx.beginPath();
    ctx.ellipse(cx - radius - 10, cy, 8, 20, 0, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    ctx.beginPath();
    ctx.ellipse(cx + radius + 10, cy, 8, 20, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Draw region boundaries (subtle)
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    
    // Frontal line
    ctx.beginPath();
    ctx.moveTo(cx - radius * 0.7, cy - radius * 0.4);
    ctx.lineTo(cx + radius * 0.7, cy - radius * 0.4);
    ctx.stroke();
    
    // Central line
    ctx.beginPath();
    ctx.moveTo(cx - radius * 0.9, cy);
    ctx.lineTo(cx + radius * 0.9, cy);
    ctx.stroke();
    
    // Parietal line
    ctx.beginPath();
    ctx.moveTo(cx - radius * 0.7, cy + radius * 0.4);
    ctx.lineTo(cx + radius * 0.7, cy + radius * 0.4);
    ctx.stroke();

    ctx.setLineDash([]);

    // Draw connections between electrodes
    const connections = [
      ['Fp1', 'F7'], ['Fp2', 'F8'], ['F7', 'F3'], ['F8', 'F4'],
      ['F3', 'Fz'], ['Fz', 'F4'], ['F3', 'C3'], ['F4', 'C4'],
      ['Fz', 'Cz'], ['C3', 'T3'], ['C4', 'T4'], ['Cz', 'C3'], ['Cz', 'C4'],
      ['T3', 'T5'], ['T4', 'T6'], ['C3', 'P3'], ['C4', 'P4'],
      ['Cz', 'Pz'], ['P3', 'T5'], ['P4', 'T6'], ['Pz', 'P3'], ['Pz', 'P4'],
      ['T5', 'O1'], ['T6', 'O2'], ['P3', 'O1'], ['P4', 'O2'],
    ];

    connections.forEach(([from, to]) => {
      const eFrom = ELECTRODES_10_20.find(e => e.id === from);
      const eTo = ELECTRODES_10_20.find(e => e.id === to);
      if (!eFrom || !eTo) return;

      const x1 = cx + (eFrom.x - 0.5) * radius * 2;
      const y1 = cy + (eFrom.y - 0.5) * radius * 2;
      const x2 = cx + (eTo.x - 0.5) * radius * 2;
      const y2 = cy + (eTo.y - 0.5) * radius * 2;

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    // Draw electrodes
    ELECTRODES_10_20.forEach((electrode) => {
      const ex = cx + (electrode.x - 0.5) * radius * 2;
      const ey = cy + (electrode.y - 0.5) * radius * 2;
      const color = REGION_COLORS[electrode.region];
      const isSelected = selectedChannels.includes(electrode.id);
      const isHovered = hoveredElectrode === electrode.id;

      // Get signal amplitude for this electrode
      let amplitude = 0;
      if (data) {
        const chIdx = data.channels.indexOf(electrode.id);
        if (chIdx >= 0) {
          const sampleIdx = Math.floor(currentTime * data.sampleRate) % data.samples[chIdx].length;
          amplitude = Math.abs(data.samples[chIdx][sampleIdx] || 0);
        }
      }

      // Glow based on amplitude
      if (amplitude > 0.1) {
        ctx.shadowBlur = 15 + amplitude * 20;
        ctx.shadowColor = color;
      }

      // Draw electrode circle
      const dotRadius = isSelected ? 12 : isHovered ? 10 : 7 + amplitude * 8;
      ctx.beginPath();
      ctx.arc(ex, ey, dotRadius, 0, Math.PI * 2);
      
      if (isSelected) {
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
      } else {
        ctx.fillStyle = color + '80';
        ctx.fill();
      }

      ctx.shadowBlur = 0;

      // Draw label
      ctx.fillStyle = isSelected ? '#fff' : 'rgba(255,255,255,0.7)';
      ctx.font = `${isSelected ? 'bold ' : ''}${isHovered ? 14 : 11}px monospace`;
      ctx.textAlign = 'center';
      ctx.fillText(electrode.label, ex, ey - dotRadius - 6);

      // Draw amplitude ring
      if (amplitude > 0.05) {
        ctx.beginPath();
        ctx.arc(ex, ey, dotRadius + 4 + amplitude * 10, 0, Math.PI * 2 * amplitude);
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    });

    // Region labels
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    const regionLabels = [
      { label: 'FRONTAL', x: cx, y: cy - radius * 0.65, color: REGION_COLORS.frontal },
      { label: 'CENTRAL', x: cx, y: cy - 10, color: REGION_COLORS.central },
      { label: 'PARIETAL', x: cx, y: cy + radius * 0.55, color: REGION_COLORS.parietal },
      { label: 'OCCIPITAL', x: cx, y: cy + radius * 0.9, color: REGION_COLORS.occipital },
    ];

    regionLabels.forEach(({ label, x, y, color }) => {
      ctx.fillStyle = color + '60';
      ctx.fillText(label, x, y);
    });

  }, [data, selectedChannels, hoveredElectrode, currentTime, canvasSize]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top) * scaleY;

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const radius = Math.min(canvas.width, canvas.height) * 0.42;

    for (const electrode of ELECTRODES_10_20) {
      const ex = cx + (electrode.x - 0.5) * radius * 2;
      const ey = cy + (electrode.y - 0.5) * radius * 2;
      const dist = Math.sqrt((mx - ex) ** 2 + (my - ey) ** 2);
      if (dist < 20) {
        onChannelSelect(electrode.id);
        return;
      }
    }
  };

  const handleCanvasMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top) * scaleY;

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const radius = Math.min(canvas.width, canvas.height) * 0.42;

    let found = false;
    for (const electrode of ELECTRODES_10_20) {
      const ex = cx + (electrode.x - 0.5) * radius * 2;
      const ey = cy + (electrode.y - 0.5) * radius * 2;
      const dist = Math.sqrt((mx - ex) ** 2 + (my - ey) ** 2);
      if (dist < 20) {
        setHoveredElectrode(electrode.id);
        found = true;
        break;
      }
    }
    if (!found) setHoveredElectrode(null);
  };

  return (
    <div className="flex items-center justify-center w-full h-full min-h-[300px]">
      <canvas
        ref={canvasRef}
        width={canvasSize.w * 2}
        height={canvasSize.h * 2}
        style={{ width: canvasSize.w, height: canvasSize.h }}
        className="cursor-pointer"
        onClick={handleCanvasClick}
        onMouseMove={handleCanvasMove}
        onMouseLeave={() => setHoveredElectrode(null)}
      />
    </div>
  );
}
