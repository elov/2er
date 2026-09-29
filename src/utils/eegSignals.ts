// EEG Signal Generator - Simulates brain wave patterns
export type BrainWaveType = 'delta' | 'theta' | 'alpha' | 'beta' | 'gamma';

export interface BrainWaveConfig {
  type: BrainWaveType;
  frequency: number; // Hz
  amplitude: number;
  color: string;
  label: string;
}

export const BRAIN_WAVES: Record<BrainWaveType, BrainWaveConfig> = {
  delta: { type: 'delta', frequency: 2, amplitude: 1.0, color: '#8B5CF6', label: 'Delta (0.5-4 Hz)' },
  theta: { type: 'theta', frequency: 6, amplitude: 0.8, color: '#3B82F6', label: 'Theta (4-8 Hz)' },
  alpha: { type: 'alpha', frequency: 10, amplitude: 0.6, color: '#10B981', label: 'Alpha (8-13 Hz)' },
  beta: { type: 'beta', frequency: 20, amplitude: 0.4, color: '#F59E0B', label: 'Beta (13-30 Hz)' },
  gamma: { type: 'gamma', frequency: 40, amplitude: 0.3, color: '#EF4444', label: 'Gamma (30-100 Hz)' },
};

export type MentalState = 'deep_sleep' | 'meditation' | 'relaxed' | 'focused' | 'creative';

export const MENTAL_STATES: Record<MentalState, { label: string; icon: string; waves: Partial<Record<BrainWaveType, number>> }> = {
  deep_sleep: { label: 'Deep Sleep', icon: '🌙', waves: { delta: 0.9, theta: 0.3, alpha: 0.05, beta: 0.02, gamma: 0.01 } },
  meditation: { label: 'Meditation', icon: '🧘', waves: { delta: 0.1, theta: 0.8, alpha: 0.7, beta: 0.1, gamma: 0.05 } },
  relaxed: { label: 'Relaxed', icon: '😌', waves: { delta: 0.05, theta: 0.2, alpha: 0.9, beta: 0.15, gamma: 0.05 } },
  focused: { label: 'Focused', icon: '🎯', waves: { delta: 0.02, theta: 0.1, alpha: 0.2, beta: 0.85, gamma: 0.3 } },
  creative: { label: 'Creative', icon: '✨', waves: { delta: 0.05, theta: 0.5, alpha: 0.6, beta: 0.3, gamma: 0.7 } },
};

export function generateEEGSignal(
  time: number,
  waveType: BrainWaveType,
  intensity: number = 1.0,
  noise: number = 0.1
): number {
  const config = BRAIN_WAVES[waveType];
  const freq = config.frequency;
  const amp = config.amplitude * intensity;
  
  // Main wave
  let signal = amp * Math.sin(2 * Math.PI * freq * time);
  
  // Add harmonics
  signal += (amp * 0.3) * Math.sin(2 * Math.PI * freq * 2 * time + 0.5);
  signal += (amp * 0.15) * Math.sin(2 * Math.PI * freq * 3 * time + 1.2);
  
  // Add noise
  signal += noise * (Math.random() - 0.5) * amp;
  
  return signal;
}

export function generateCompositeSignal(
  time: number,
  state: MentalState,
  noise: number = 0.05
): Record<BrainWaveType, number> {
  const stateConfig = MENTAL_STATES[state];
  const result: Record<BrainWaveType, number> = {
    delta: 0, theta: 0, alpha: 0, beta: 0, gamma: 0
  };
  
  for (const waveType of Object.keys(stateConfig.waves) as BrainWaveType[]) {
    const intensity = stateConfig.waves[waveType] || 0;
    result[waveType] = generateEEGSignal(time, waveType, intensity, noise);
  }
  
  return result;
}

export function getSignalHistory(
  currentTime: number,
  duration: number,
  steps: number,
  state: MentalState
): Record<BrainWaveType, number[]> {
  const history: Record<BrainWaveType, number[]> = {
    delta: [], theta: [], alpha: [], beta: [], gamma: []
  };
  
  for (let i = 0; i < steps; i++) {
    const t = currentTime - duration + (duration * i / steps);
    const signals = generateCompositeSignal(t, state);
    for (const waveType of Object.keys(history) as BrainWaveType[]) {
      history[waveType].push(signals[waveType]);
    }
  }
  
  return history;
}
