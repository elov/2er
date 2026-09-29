import { useRef, useState } from 'react';
import { EEGData, parseCSVData, generateSampleData, CHANNEL_NAMES } from '../utils/electrode1020';

interface DataLoaderProps {
  onDataLoaded: (data: EEGData) => void;
  currentData: EEGData | null;
}

export default function DataLoader({ onDataLoaded, currentData }: DataLoaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = (file: File) => {
    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const data = parseCSVData(text);
        
        // Validate channels
        const validChannels = data.channels.filter(ch => 
          CHANNEL_NAMES.includes(ch.toUpperCase())
        );
        
        if (validChannels.length === 0) {
          // Accept any channel names if none match 10-20
          onDataLoaded(data);
        } else {
          onDataLoaded(data);
        }
      } catch (err) {
        setError(`Error parsing CSV: ${(err as Error).message}`);
      }
    };
    reader.onerror = () => setError('Failed to read file');
    reader.readAsText(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const loadSampleData = () => {
    setError(null);
    const data = generateSampleData();
    onDataLoaded(data);
  };

  const downloadTemplate = () => {
    const headers = ['time', ...CHANNEL_NAMES].join(',');
    const rows = [headers];
    const sampleRate = 256;
    for (let i = 0; i < sampleRate * 2; i++) {
      const t = i / sampleRate;
      const values = [t.toFixed(6)];
      CHANNEL_NAMES.forEach((_, idx) => {
        const signal = Math.sin(2 * Math.PI * 10 * t + idx * 0.3) * 0.5 + 
                       (Math.random() - 0.5) * 0.1;
        values.push(signal.toFixed(6));
      });
      rows.push(values.join(','));
    }
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'eeg_template_10-20.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
        📊 Data Import
      </h3>

      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-all ${
          isDragging
            ? 'border-purple-500 bg-purple-500/10'
            : 'border-white/20 hover:border-white/40 hover:bg-white/5'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.txt,.tsv"
          onChange={handleFileInput}
          className="hidden"
        />
        <div className="text-2xl mb-2">📁</div>
        <p className="text-xs text-gray-400">
          Drop CSV file here or click to browse
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Format: time, Fp1, Fp2, F3, F4, ... (19 channels)
        </p>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <button
          onClick={loadSampleData}
          className="flex-1 px-3 py-2 rounded-lg text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30 transition-all"
        >
          🎲 Demo Data
        </button>
        <button
          onClick={downloadTemplate}
          className="flex-1 px-3 py-2 rounded-lg text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30 transition-all"
        >
          📥 Template
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-400">
          ⚠️ {error}
        </div>
      )}

      {/* Current data info */}
      {currentData && (
        <div className="p-3 rounded-lg bg-white/5 border border-white/10">
          <p className="text-xs text-gray-400 mb-2">Loaded Data:</p>
          <div className="grid grid-cols-2 gap-1 text-xs">
            <span className="text-gray-500">Channels:</span>
            <span className="text-white">{currentData.channels.length}</span>
            <span className="text-gray-500">Sample Rate:</span>
            <span className="text-white">{currentData.sampleRate} Hz</span>
            <span className="text-gray-500">Duration:</span>
            <span className="text-white">{currentData.duration.toFixed(1)}s</span>
            <span className="text-gray-500">Samples:</span>
            <span className="text-white">{currentData.samples[0]?.length || 0}</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-1">
            {currentData.channels.slice(0, 19).map(ch => (
              <span key={ch} className="px-1.5 py-0.5 rounded text-[10px] bg-purple-500/20 text-purple-300">
                {ch}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Format help */}
      <details className="text-xs">
        <summary className="text-gray-500 cursor-pointer hover:text-gray-300">
          CSV Format Help
        </summary>
        <div className="mt-2 p-2 rounded bg-white/5 text-gray-400 font-mono text-[10px] leading-relaxed">
          <p>time,Fp1,Fp2,F3,F4,C3,C4,P3,P4,O1,O2,F7,F8,T3,T4,T5,T6,Fz,Cz,Pz</p>
          <p>0.000,Fp1_val,Fp2_val,...</p>
          <p>0.004,Fp1_val,Fp2_val,...</p>
          <p className="mt-1 text-gray-500">
            • First row = headers<br/>
            • First column = time (seconds)<br/>
            • Remaining = channel values (μV)
          </p>
        </div>
      </details>
    </div>
  );
}
