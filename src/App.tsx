import { useState, useCallback, useEffect } from 'react';
import WaveformVisualizer from './components/WaveformVisualizer';
import ParticleVisualizer from './components/ParticleVisualizer';
import MandalaVisualizer from './components/MandalaVisualizer';
import TerrainVisualizer from './components/TerrainVisualizer';
import CellularAutomaton from './components/CellularAutomaton';
import ElectrodeMap from './components/ElectrodeMap';
import DataLoader from './components/DataLoader';
import ImageLoader, { ImageConfig } from './components/ImageLoader';
import { MentalState, MENTAL_STATES, BrainWaveType, BRAIN_WAVES } from './utils/eegSignals';
import { EEGData, ELECTRODES_10_20, REGION_COLORS } from './utils/electrode1020';

type VisualizerMode = 'waveform' | 'particles' | 'mandala' | 'terrain' | 'cellular';
type CellularRule = 'game_of_life' | 'brians_brain' | 'day_and_night' | 'seeds';
type Tab = 'visualize' | 'electrodes' | 'data' | 'images';

const VISUALIZER_MODES: { id: VisualizerMode; label: string; icon: string }[] = [
  { id: 'waveform', label: 'Waveform', icon: '〰️' },
  { id: 'particles', label: 'Particles', icon: '✦' },
  { id: 'mandala', label: 'Mandala', icon: '◎' },
  { id: 'terrain', label: 'Terrain', icon: '⛰️' },
  { id: 'cellular', label: 'Cellular', icon: '⬡' },
];

const CELLULAR_RULES: { id: CellularRule; label: string; description: string }[] = [
  { id: 'game_of_life', label: "Game of Life", description: 'Classic Conway rules' },
  { id: 'brians_brain', label: "Brian's Brain", description: '3-state automaton' },
  { id: 'day_and_night', label: 'Day & Night', description: 'Symmetric rules' },
  { id: 'seeds', label: 'Seeds', description: 'Explosive growth' },
];

function App() {
  const [mode, setMode] = useState<VisualizerMode>('waveform');
  const [mentalState, setMentalState] = useState<MentalState>('relaxed');
  const [isPlaying, setIsPlaying] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('visualize');
  
  // EEG Data
  const [eegData, setEegData] = useState<EEGData | null>(null);
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  
  // Image config (includes palette and grid size)
  const [imageConfig, setImageConfig] = useState<ImageConfig>({
    images: { background: null, particle: null, overlay: null },
    palette: { primary: ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444'], accent: ['#EC4899', '#8B5CF6', '#06B6D4'] },
    primaryCount: 5,
    accentCount: 3,
    gridSize: { width: 100, height: 100 },
  });

  // Cellular automaton rule
  const [cellularRule, setCellularRule] = useState<CellularRule>('game_of_life');
  
  // Time for electrode map animation
  const [currentTime, setCurrentTime] = useState(0);
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setCurrentTime(t => t + 0.05);
    }, 50);
    return () => clearInterval(interval);
  }, [isPlaying]);

  const handleChannelSelect = useCallback((channel: string) => {
    setSelectedChannels(prev => {
      if (prev.includes(channel)) {
        return prev.filter(c => c !== channel);
      }
      return [...prev, channel];
    });
  }, []);

  const handleDataLoaded = useCallback((data: EEGData) => {
    setEegData(data);
    setSelectedChannels(data.channels.slice(0, 5));
  }, []);

  const renderVisualizer = useCallback(() => {
    switch (mode) {
      case 'waveform':
        return <WaveformVisualizer state={mentalState} isPlaying={isPlaying} eegData={eegData} selectedChannels={selectedChannels} images={imageConfig.images} />;
      case 'particles':
        return <ParticleVisualizer state={mentalState} isPlaying={isPlaying} eegData={eegData} selectedChannels={selectedChannels} images={imageConfig.images} />;
      case 'mandala':
        return <MandalaVisualizer state={mentalState} isPlaying={isPlaying} eegData={eegData} selectedChannels={selectedChannels} images={imageConfig.images} />;
      case 'terrain':
        return <TerrainVisualizer state={mentalState} isPlaying={isPlaying} eegData={eegData} selectedChannels={selectedChannels} images={imageConfig.images} />;
      case 'cellular':
        return (
          <CellularAutomaton
            palette={imageConfig.palette}
            gridSize={imageConfig.gridSize}
            state={mentalState}
            isPlaying={isPlaying}
            eegData={eegData}
            rule={cellularRule}
          />
        );
    }
  }, [mode, mentalState, isPlaying, eegData, selectedChannels, imageConfig, cellularRule]);

  return (
    <div className="h-screen bg-gray-950 text-white flex flex-col overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-white/10 backdrop-blur-sm bg-gray-950/90 relative z-20 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-lg">
            🧠
          </div>
          <div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
              EEG Art
            </h1>
            <p className="text-[10px] text-gray-500">10-20 System Neural Visualization</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              isPlaying
                ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30'
                : 'bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30'
            }`}
          >
            {isPlaying ? '⏸ Pause' : '▶ Play'}
          </button>
          <button
            onClick={() => setShowControls(!showControls)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
          >
            {showControls ? '◀ Hide' : '▶ Panel'}
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        {showControls && (
          <aside className="w-[340px] border-r border-white/10 flex flex-col bg-gray-950/95 backdrop-blur-sm shrink-0">
            {/* Tabs */}
            <div className="flex border-b border-white/10 shrink-0">
              {([
                { id: 'visualize' as Tab, label: '🎨 Viz' },
                { id: 'electrodes' as Tab, label: '🧠 10-20' },
                { id: 'data' as Tab, label: '📊 Data' },
                { id: 'images' as Tab, label: '🖼️ Images' },
              ]).map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 py-2.5 text-xs font-medium transition-all ${
                    activeTab === tab.id
                      ? 'text-purple-400 border-b-2 border-purple-500 bg-purple-500/5'
                      : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {activeTab === 'visualize' && (
                <div className="flex flex-col gap-5">
                  {/* Visualization Mode */}
                  <section>
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                      Visualization
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      {VISUALIZER_MODES.map((m) => (
                        <button
                          key={m.id}
                          onClick={() => setMode(m.id)}
                          className={`p-2.5 rounded-lg text-xs font-medium transition-all flex flex-col items-center gap-1 ${
                            mode === m.id
                              ? 'bg-purple-500/20 border-purple-500/50 border text-purple-300 shadow-lg shadow-purple-500/10'
                              : 'bg-white/5 border border-white/10 hover:bg-white/10 text-gray-400'
                          }`}
                        >
                          <span className="text-lg">{m.icon}</span>
                          <span>{m.label}</span>
                        </button>
                      ))}
                    </div>
                  </section>

                  {/* Cellular Automaton Rules */}
                  {mode === 'cellular' && (
                    <section>
                      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                        Automaton Rule
                      </h3>
                      <div className="flex flex-col gap-1.5">
                        {CELLULAR_RULES.map((r) => (
                          <button
                            key={r.id}
                            onClick={() => setCellularRule(r.id)}
                            className={`p-2 rounded-lg text-xs text-left transition-all ${
                              cellularRule === r.id
                                ? 'bg-cyan-500/20 border-cyan-500/50 border text-cyan-300'
                                : 'bg-white/5 border border-white/10 hover:bg-white/10 text-gray-400'
                            }`}
                          >
                            <div className="font-medium">{r.label}</div>
                            <div className="text-[10px] text-gray-500 mt-0.5">{r.description}</div>
                          </button>
                        ))}
                      </div>
                      {imageConfig.images.background && (
                        <div className="mt-3 p-2 rounded-lg bg-green-500/10 border border-green-500/30 text-[10px] text-green-400">
                          ✓ Grid sized to image: {imageConfig.gridSize.width}×{imageConfig.gridSize.height}
                        </div>
                      )}
                    </section>
                  )}

                  {/* Mental State */}
                  <section>
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                      Mental State (Simulation)
                    </h3>
                    <div className="flex flex-col gap-1.5">
                      {(Object.keys(MENTAL_STATES) as MentalState[]).map((ms) => {
                        const config = MENTAL_STATES[ms];
                        return (
                          <button
                            key={ms}
                            onClick={() => setMentalState(ms)}
                            className={`p-2 rounded-lg text-xs font-medium transition-all flex items-center gap-2 ${
                              mentalState === ms
                                ? 'bg-cyan-500/20 border-cyan-500/50 border text-cyan-300'
                                : 'bg-white/5 border border-white/10 hover:bg-white/10 text-gray-400'
                            }`}
                          >
                            <span>{config.icon}</span>
                            <span>{config.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </section>

                  {/* Selected Channels */}
                  <section>
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                      Active Channels ({selectedChannels.length})
                    </h3>
                    {selectedChannels.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {selectedChannels.map(ch => {
                          const electrode = ELECTRODES_10_20.find(e => e.id === ch);
                          const color = electrode ? REGION_COLORS[electrode.region] : '#fff';
                          return (
                            <button
                              key={ch}
                              onClick={() => handleChannelSelect(ch)}
                              className="px-2 py-1 rounded text-[10px] font-medium border transition-all hover:opacity-70"
                              style={{ 
                                borderColor: color + '60', 
                                color: color,
                                backgroundColor: color + '15'
                              }}
                            >
                              {ch} ✕
                            </button>
                          );
                        })}
                        <button
                          onClick={() => setSelectedChannels([])}
                          className="px-2 py-1 rounded text-[10px] bg-white/5 border border-white/10 text-gray-500 hover:text-gray-300"
                        >
                          Clear All
                        </button>
                      </div>
                    ) : (
                      <p className="text-[10px] text-gray-600">
                        Select channels from the 10-20 map or all will be used
                      </p>
                    )}
                  </section>

                  {/* Brain Wave Info */}
                  <section>
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                      Wave Intensities
                    </h3>
                    <div className="flex flex-col gap-2">
                      {(Object.keys(BRAIN_WAVES) as BrainWaveType[]).map((waveType) => {
                        const config = BRAIN_WAVES[waveType];
                        const intensity = MENTAL_STATES[mentalState].waves[waveType] || 0;
                        return (
                          <div key={waveType} className="flex items-center gap-2">
                            <div
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: config.color, boxShadow: `0 0 6px ${config.color}` }}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-center mb-0.5">
                                <span className="text-[10px] text-gray-500">{waveType}</span>
                                <span className="text-[10px] text-gray-600">{config.frequency}Hz</span>
                              </div>
                              <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all duration-500"
                                  style={{
                                    width: `${intensity * 100}%`,
                                    backgroundColor: config.color,
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                </div>
              )}

              {activeTab === 'electrodes' && (
                <div className="flex flex-col gap-4">
                  <ElectrodeMap
                    data={eegData}
                    selectedChannels={selectedChannels}
                    onChannelSelect={handleChannelSelect}
                    currentTime={currentTime}
                  />
                  
                  {/* Channel list */}
                  <div>
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                      10-20 Electrodes (click to select)
                    </h3>
                    <div className="flex flex-wrap gap-1">
                      {ELECTRODES_10_20.map(e => {
                        const isSelected = selectedChannels.includes(e.id);
                        const color = REGION_COLORS[e.region];
                        return (
                          <button
                            key={e.id}
                            onClick={() => handleChannelSelect(e.id)}
                            className={`px-2 py-1 rounded text-[10px] font-medium border transition-all ${
                              isSelected ? 'scale-110' : 'opacity-70 hover:opacity-100'
                            }`}
                            style={{
                              borderColor: isSelected ? color : color + '40',
                              backgroundColor: isSelected ? color + '30' : 'transparent',
                              color: color,
                            }}
                          >
                            {e.id}
                          </button>
                        );
                      })}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        onClick={() => setSelectedChannels(ELECTRODES_10_20.map(e => e.id))}
                        className="px-2 py-1 rounded text-[10px] bg-white/5 border border-white/10 text-gray-400 hover:text-white"
                      >
                        Select All
                      </button>
                      <button
                        onClick={() => setSelectedChannels(ELECTRODES_10_20.filter(e => e.hemisphere === 'left').map(e => e.id))}
                        className="px-2 py-1 rounded text-[10px] bg-white/5 border border-white/10 text-gray-400 hover:text-white"
                      >
                        Left Only
                      </button>
                      <button
                        onClick={() => setSelectedChannels(ELECTRODES_10_20.filter(e => e.hemisphere === 'right').map(e => e.id))}
                        className="px-2 py-1 rounded text-[10px] bg-white/5 border border-white/10 text-gray-400 hover:text-white"
                      >
                        Right Only
                      </button>
                      <button
                        onClick={() => setSelectedChannels(ELECTRODES_10_20.filter(e => e.hemisphere === 'midline').map(e => e.id))}
                        className="px-2 py-1 rounded text-[10px] bg-white/5 border border-white/10 text-gray-400 hover:text-white"
                      >
                        Midline
                      </button>
                    </div>
                  </div>

                  {/* Region legend */}
                  <div>
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                      Regions
                    </h3>
                    <div className="flex flex-col gap-1">
                      {Object.entries(REGION_COLORS).map(([region, color]) => (
                        <div key={region} className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: color }} />
                          <span className="text-xs text-gray-400 capitalize">{region}</span>
                          <span className="text-[10px] text-gray-600 ml-auto">
                            {ELECTRODES_10_20.filter(e => e.region === region).length} ch
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'data' && (
                <DataLoader
                  onDataLoaded={handleDataLoaded}
                  currentData={eegData}
                />
              )}

              {activeTab === 'images' && (
                <ImageLoader
                  config={imageConfig}
                  onConfigChange={setImageConfig}
                />
              )}
            </div>
          </aside>
        )}

        {/* Main Canvas */}
        <main className="flex-1 relative p-3 min-w-0">
          <div className="w-full h-full relative rounded-xl overflow-hidden border border-white/10">
            {renderVisualizer()}
            
            {/* Overlay info */}
            <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap">
              <div className="px-2 py-1 rounded-full bg-black/60 backdrop-blur-sm border border-white/10 text-[10px] text-gray-300">
                {VISUALIZER_MODES.find(m => m.id === mode)?.icon} {VISUALIZER_MODES.find(m => m.id === mode)?.label}
              </div>
              {eegData ? (
                <div className="px-2 py-1 rounded-full bg-black/60 backdrop-blur-sm border border-green-500/30 text-[10px] text-green-400">
                  📊 {eegData.channels.length}ch @ {eegData.sampleRate}Hz
                </div>
              ) : (
                <div className="px-2 py-1 rounded-full bg-black/60 backdrop-blur-sm border border-white/10 text-[10px] text-gray-300">
                  {MENTAL_STATES[mentalState].icon} {MENTAL_STATES[mentalState].label}
                </div>
              )}
              <div className={`px-2 py-1 rounded-full backdrop-blur-sm border text-[10px] ${
                isPlaying 
                  ? 'bg-green-500/20 border-green-500/30 text-green-400' 
                  : 'bg-red-500/20 border-red-500/30 text-red-400'
              }`}>
                {isPlaying ? '● LIVE' : '○ PAUSED'}
              </div>
              {selectedChannels.length > 0 && (
                <div className="px-2 py-1 rounded-full bg-black/60 backdrop-blur-sm border border-purple-500/30 text-[10px] text-purple-400">
                  {selectedChannels.length} ch selected
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
