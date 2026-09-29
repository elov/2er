import { useState, useCallback } from 'react';
import WaveformVisualizer from './components/WaveformVisualizer';
import ParticleVisualizer from './components/ParticleVisualizer';
import MandalaVisualizer from './components/MandalaVisualizer';
import TerrainVisualizer from './components/TerrainVisualizer';
import { MentalState, MENTAL_STATES, BrainWaveType, BRAIN_WAVES } from './utils/eegSignals';

type VisualizerMode = 'waveform' | 'particles' | 'mandala' | 'terrain';

const VISUALIZER_MODES: { id: VisualizerMode; label: string; icon: string }[] = [
  { id: 'waveform', label: 'Waveform', icon: '〰️' },
  { id: 'particles', label: 'Particles', icon: '✦' },
  { id: 'mandala', label: 'Mandala', icon: '◎' },
  { id: 'terrain', label: 'Terrain', icon: '⛰️' },
];

function App() {
  const [mode, setMode] = useState<VisualizerMode>('waveform');
  const [mentalState, setMentalState] = useState<MentalState>('relaxed');
  const [isPlaying, setIsPlaying] = useState(true);
  const [showControls, setShowControls] = useState(true);

  const renderVisualizer = useCallback(() => {
    switch (mode) {
      case 'waveform':
        return <WaveformVisualizer state={mentalState} isPlaying={isPlaying} />;
      case 'particles':
        return <ParticleVisualizer state={mentalState} isPlaying={isPlaying} />;
      case 'mandala':
        return <MandalaVisualizer state={mentalState} isPlaying={isPlaying} />;
      case 'terrain':
        return <TerrainVisualizer state={mentalState} isPlaying={isPlaying} />;
    }
  }, [mode, mentalState, isPlaying]);

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/10 backdrop-blur-sm bg-gray-950/80 relative z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-lg font-bold">
            🧠
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
              EEG Art
            </h1>
            <p className="text-xs text-gray-400">Neural Signal Visualization</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              isPlaying
                ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30'
                : 'bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30'
            }`}
          >
            {isPlaying ? '⏸ Pause' : '▶ Play'}
          </button>
          <button
            onClick={() => setShowControls(!showControls)}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
          >
            {showControls ? '✕ Hide' : '☰ Show'} Panel
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Controls */}
        {showControls && (
          <aside className="w-80 border-r border-white/10 p-4 overflow-y-auto bg-gray-950/90 backdrop-blur-sm flex flex-col gap-6">
            {/* Visualization Mode */}
            <section>
              <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3">
                Visualization Mode
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {VISUALIZER_MODES.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setMode(m.id)}
                    className={`p-3 rounded-lg text-sm font-medium transition-all flex flex-col items-center gap-1 ${
                      mode === m.id
                        ? 'bg-purple-500/20 border-purple-500/50 border text-purple-300 shadow-lg shadow-purple-500/10'
                        : 'bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300'
                    }`}
                  >
                    <span className="text-xl">{m.icon}</span>
                    <span>{m.label}</span>
                  </button>
                ))}
              </div>
            </section>

            {/* Mental State */}
            <section>
              <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3">
                Mental State
              </h3>
              <div className="flex flex-col gap-2">
                {(Object.keys(MENTAL_STATES) as MentalState[]).map((ms) => {
                  const config = MENTAL_STATES[ms];
                  return (
                    <button
                      key={ms}
                      onClick={() => setMentalState(ms)}
                      className={`p-3 rounded-lg text-sm font-medium transition-all flex items-center gap-3 ${
                        mentalState === ms
                          ? 'bg-cyan-500/20 border-cyan-500/50 border text-cyan-300 shadow-lg shadow-cyan-500/10'
                          : 'bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300'
                      }`}
                    >
                      <span className="text-xl">{config.icon}</span>
                      <span>{config.label}</span>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Brain Wave Info */}
            <section>
              <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3">
                Active Brain Waves
              </h3>
              <div className="flex flex-col gap-2">
                {(Object.keys(BRAIN_WAVES) as BrainWaveType[]).map((waveType) => {
                  const config = BRAIN_WAVES[waveType];
                  const intensity = MENTAL_STATES[mentalState].waves[waveType] || 0;
                  return (
                    <div key={waveType} className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: config.color, boxShadow: `0 0 8px ${config.color}` }}
                      />
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs text-gray-400">{waveType}</span>
                          <span className="text-xs text-gray-500">{config.frequency} Hz</span>
                        </div>
                        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${intensity * 100}%`,
                              backgroundColor: config.color,
                              boxShadow: `0 0 6px ${config.color}`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Info */}
            <section className="mt-auto pt-4 border-t border-white/10">
              <p className="text-xs text-gray-500 leading-relaxed">
                This visualization simulates EEG brain wave patterns for different mental states.
                Each brain wave type (Delta, Theta, Alpha, Beta, Gamma) corresponds to different
                levels of brain activity and consciousness.
              </p>
            </section>
          </aside>
        )}

        {/* Main Canvas Area */}
        <main className="flex-1 relative p-4">
          <div className="w-full h-full relative rounded-xl overflow-hidden border border-white/10">
            {renderVisualizer()}
            
            {/* Overlay info */}
            <div className="absolute top-4 left-4 flex items-center gap-2">
              <div className="px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 text-xs text-gray-300">
                {VISUALIZER_MODES.find(m => m.id === mode)?.icon} {VISUALIZER_MODES.find(m => m.id === mode)?.label}
              </div>
              <div className="px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 text-xs text-gray-300">
                {MENTAL_STATES[mentalState].icon} {MENTAL_STATES[mentalState].label}
              </div>
              <div className={`px-3 py-1.5 rounded-full backdrop-blur-sm border text-xs ${
                isPlaying 
                  ? 'bg-green-500/20 border-green-500/30 text-green-400' 
                  : 'bg-red-500/20 border-red-500/30 text-red-400'
              }`}>
                {isPlaying ? '● LIVE' : '○ PAUSED'}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
