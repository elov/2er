// International 10-20 System electrode positions
// Coordinates are normalized (0-1) on a head circle viewed from above
// Nose points up (negative Y)

export interface Electrode {
  id: string;
  label: string;
  x: number; // 0-1, center is 0.5
  y: number; // 0-1, center is 0.5
  region: 'frontal' | 'central' | 'parietal' | 'occipital' | 'temporal';
  hemisphere: 'left' | 'right' | 'midline';
}

// Standard 10-20 system with 19 electrodes + reference
export const ELECTRODES_10_20: Electrode[] = [
  // Frontal
  { id: 'Fp1', label: 'Fp1', x: 0.40, y: 0.15, region: 'frontal', hemisphere: 'left' },
  { id: 'Fp2', label: 'Fp2', x: 0.60, y: 0.15, region: 'frontal', hemisphere: 'right' },
  { id: 'F7', label: 'F7', x: 0.20, y: 0.30, region: 'frontal', hemisphere: 'left' },
  { id: 'F3', label: 'F3', x: 0.35, y: 0.30, region: 'frontal', hemisphere: 'left' },
  { id: 'Fz', label: 'Fz', x: 0.50, y: 0.28, region: 'frontal', hemisphere: 'midline' },
  { id: 'F4', label: 'F4', x: 0.65, y: 0.30, region: 'frontal', hemisphere: 'right' },
  { id: 'F8', label: 'F8', x: 0.80, y: 0.30, region: 'frontal', hemisphere: 'right' },
  
  // Central
  { id: 'T3', label: 'T3', x: 0.12, y: 0.50, region: 'temporal', hemisphere: 'left' },
  { id: 'C3', label: 'C3', x: 0.35, y: 0.50, region: 'central', hemisphere: 'left' },
  { id: 'Cz', label: 'Cz', x: 0.50, y: 0.50, region: 'central', hemisphere: 'midline' },
  { id: 'C4', label: 'C4', x: 0.65, y: 0.50, region: 'central', hemisphere: 'right' },
  { id: 'T4', label: 'T4', x: 0.88, y: 0.50, region: 'temporal', hemisphere: 'right' },
  
  // Parietal
  { id: 'T5', label: 'T5', x: 0.20, y: 0.70, region: 'parietal', hemisphere: 'left' },
  { id: 'P3', label: 'P3', x: 0.35, y: 0.70, region: 'parietal', hemisphere: 'left' },
  { id: 'Pz', label: 'Pz', x: 0.50, y: 0.72, region: 'parietal', hemisphere: 'midline' },
  { id: 'P4', label: 'P4', x: 0.65, y: 0.70, region: 'parietal', hemisphere: 'right' },
  { id: 'T6', label: 'T6', x: 0.80, y: 0.70, region: 'parietal', hemisphere: 'right' },
  
  // Occipital
  { id: 'O1', label: 'O1', x: 0.40, y: 0.85, region: 'occipital', hemisphere: 'left' },
  { id: 'O2', label: 'O2', x: 0.60, y: 0.85, region: 'occipital', hemisphere: 'right' },
];

export const REGION_COLORS: Record<string, string> = {
  frontal: '#8B5CF6',
  central: '#3B82F6',
  parietal: '#10B981',
  occipital: '#F59E0B',
  temporal: '#EF4444',
};

export const CHANNEL_NAMES = ELECTRODES_10_20.map(e => e.id);

export interface EEGData {
  channels: string[];
  sampleRate: number; // Hz
  samples: number[][]; // [channel][sample]
  duration: number; // seconds
}

// Parse CSV data into EEG data structure
export function parseCSVData(csv: string): EEGData {
  const lines = csv.trim().split('\n');
  if (lines.length < 2) throw new Error('CSV must have at least a header and one data row');
  
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  
  // Find time column and data columns
  const timeIdx = headers.findIndex(h => 
    h.toLowerCase() === 'time' || h.toLowerCase() === 't' || h.toLowerCase() === 'timestamp'
  );
  
  const dataHeaders = headers.filter((_, i) => i !== timeIdx);
  const dataIndices = headers.map((_, i) => i).filter(i => i !== timeIdx);
  
  const channels = dataHeaders;
  const numSamples = lines.length - 1;
  const samples: number[][] = channels.map(() => []);
  
  let hasTime = timeIdx >= 0;
  const times: number[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => parseFloat(v.trim()));
    
    if (hasTime) {
      times.push(values[timeIdx]);
    }
    
    dataIndices.forEach((colIdx, chIdx) => {
      const val = values[colIdx];
      samples[chIdx].push(isNaN(val) ? 0 : val);
    });
  }
  
  // Calculate sample rate
  let sampleRate = 256; // default
  if (hasTime && times.length > 1) {
    const dt = (times[times.length - 1] - times[0]) / (times.length - 1);
    sampleRate = Math.round(1 / dt);
  }
  
  return {
    channels,
    sampleRate,
    samples,
    duration: numSamples / sampleRate,
  };
}

// Generate sample data for demo
export function generateSampleData(): EEGData {
  const sampleRate = 256;
  const duration = 5; // seconds
  const numSamples = sampleRate * duration;
  const channels = CHANNEL_NAMES;
  const samples: number[][] = channels.map(() => []);
  
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    channels.forEach((ch, chIdx) => {
      const electrode = ELECTRODES_10_20[chIdx];
      // Different characteristics per region
      let signal = 0;
      switch (electrode.region) {
        case 'frontal':
          signal = 0.5 * Math.sin(2 * Math.PI * 12 * t + chIdx * 0.3); // alpha
          signal += 0.3 * Math.sin(2 * Math.PI * 20 * t + chIdx * 0.5); // beta
          break;
        case 'central':
          signal = 0.7 * Math.sin(2 * Math.PI * 10 * t + chIdx * 0.2); // mu/alpha
          signal += 0.2 * Math.sin(2 * Math.PI * 25 * t); // beta
          break;
        case 'parietal':
          signal = 0.6 * Math.sin(2 * Math.PI * 10 * t + chIdx * 0.4); // alpha
          signal += 0.4 * Math.sin(2 * Math.PI * 6 * t); // theta
          break;
        case 'occipital':
          signal = 0.9 * Math.sin(2 * Math.PI * 10 * t + chIdx * 0.1); // strong alpha
          signal += 0.3 * Math.sin(2 * Math.PI * 8 * t); // theta
          break;
        case 'temporal':
          signal = 0.4 * Math.sin(2 * Math.PI * 6 * t + chIdx * 0.6); // theta
          signal += 0.3 * Math.sin(2 * Math.PI * 15 * t); // beta
          break;
      }
      // Add noise
      signal += (Math.random() - 0.5) * 0.2;
      samples[chIdx].push(signal);
    });
  }
  
  return { channels, sampleRate, samples, duration };
}
