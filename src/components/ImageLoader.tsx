import { useRef, useState, useEffect } from 'react';
import { ColorPalette, extractPaletteFromImageElement, getImageDimensions } from '../utils/colorExtraction';

export interface LoadedImages {
  background: string | null;
  particle: string | null;
  overlay: string | null;
}

export interface ImageConfig {
  images: LoadedImages;
  palette: ColorPalette;
  primaryCount: number;
  accentCount: number;
  gridSize: { width: number; height: number };
}

interface ImageLoaderProps {
  config: ImageConfig;
  onConfigChange: (config: ImageConfig) => void;
}

type ImageSlot = keyof LoadedImages;

const IMAGE_SLOTS: { key: ImageSlot; label: string; description: string; icon: string }[] = [
  { key: 'background', label: 'Source Image', description: 'Image for color extraction and grid sizing', icon: '🖼️' },
  { key: 'particle', label: 'Particle Texture', description: 'Shape for particles (optional)', icon: '✦' },
  { key: 'overlay', label: 'Overlay Image', description: 'Semi-transparent overlay (optional)', icon: '🔲' },
];

export default function ImageLoader({ config, onConfigChange }: ImageLoaderProps) {
  const { images, palette, primaryCount, accentCount, gridSize } = config;
  
  const inputRefs = useRef<Record<ImageSlot, HTMLInputElement | null>>({
    background: null,
    particle: null,
    overlay: null,
  });
  const [isDragging, setIsDragging] = useState<ImageSlot | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);

  const handleFile = async (slot: ImageSlot, file: File) => {
    if (!file.type.startsWith('image/')) return;
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      const newImages = { ...images, [slot]: dataUrl };
      
      // Extract palette and dimensions from background image
      if (slot === 'background') {
        setIsExtracting(true);
        try {
          const img = new Image();
          img.onload = async () => {
            const extractedPalette = await extractPaletteFromImageElement(img, primaryCount, accentCount);
            const dimensions = await getImageDimensions(img);
            
            // Scale down grid for performance (max 200x200)
            const maxGridSize = 200;
            const scale = Math.min(maxGridSize / dimensions.width, maxGridSize / dimensions.height, 1);
            const scaledGrid = {
              width: Math.floor(dimensions.width * scale),
              height: Math.floor(dimensions.height * scale),
            };
            
            onConfigChange({
              ...config,
              images: newImages,
              palette: extractedPalette,
              gridSize: scaledGrid,
            });
            setIsExtracting(false);
          };
          img.src = dataUrl;
        } catch (err) {
          console.error('Failed to extract palette:', err);
          setIsExtracting(false);
          onConfigChange({ ...config, images: newImages });
        }
      } else {
        onConfigChange({ ...config, images: newImages });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileInput = (slot: ImageSlot, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(slot, file);
  };

  const handleDrop = (slot: ImageSlot, e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(null);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(slot, file);
  };

  const removeImage = (slot: ImageSlot) => {
    const newImages = { ...images, [slot]: null };
    onConfigChange({ ...config, images: newImages });
  };

  const updatePaletteCount = (type: 'primary' | 'accent', count: number) => {
    if (images.background) {
      // Re-extract palette with new counts
      const img = new Image();
      img.onload = async () => {
        const extractedPalette = await extractPaletteFromImageElement(
          img,
          type === 'primary' ? count : primaryCount,
          type === 'accent' ? count : accentCount
        );
        onConfigChange({
          ...config,
          palette: extractedPalette,
          primaryCount: type === 'primary' ? count : primaryCount,
          accentCount: type === 'accent' ? count : accentCount,
        });
      };
      img.src = images.background;
    } else {
      onConfigChange({
        ...config,
        primaryCount: type === 'primary' ? count : primaryCount,
        accentCount: type === 'accent' ? count : accentCount,
      });
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
        🎨 Image & Palette
      </h3>

      {/* Image slots */}
      {IMAGE_SLOTS.map(({ key, label, description, icon }) => (
        <div key={key} className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="text-sm">{icon}</span>
            <span className="text-xs font-medium text-gray-300">{label}</span>
          </div>

          {images[key] ? (
            <div className="relative group">
              <div className="w-full h-24 rounded-lg overflow-hidden border border-white/10 bg-black/30">
                <img src={images[key]!} alt={label} className="w-full h-full object-cover" />
              </div>
              <button
                onClick={() => removeImage(key)}
                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500/80 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
              >
                ✕
              </button>
            </div>
          ) : (
            <div
              onDrop={(e) => handleDrop(key, e)}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(key); }}
              onDragLeave={() => setIsDragging(null)}
              onClick={() => inputRefs.current[key]?.click()}
              className={`border-2 border-dashed rounded-lg p-3 text-center cursor-pointer transition-all ${
                isDragging === key
                  ? 'border-purple-500 bg-purple-500/10'
                  : 'border-white/15 hover:border-white/30 hover:bg-white/5'
              }`}
            >
              <input
                ref={(el) => { inputRefs.current[key] = el; }}
                type="file"
                accept="image/*"
                onChange={(e) => handleFileInput(key, e)}
                className="hidden"
              />
              <p className="text-xs text-gray-500">{description}</p>
              <p className="text-[10px] text-gray-600 mt-1">Drop image or click</p>
            </div>
          )}
        </div>
      ))}

      {/* Extraction status */}
      {isExtracting && (
        <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/30 text-xs text-blue-400 text-center">
          ⏳ Extracting color palette...
        </div>
      )}

      {/* Palette controls */}
      {images.background && (
        <div className="flex flex-col gap-3 p-3 rounded-lg bg-white/5 border border-white/10">
          <h4 className="text-xs font-semibold text-gray-400 uppercase">Color Palette</h4>
          
          {/* Primary colors */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400">Primary Colors</span>
              <input
                type="range"
                min="1"
                max="10"
                value={primaryCount}
                onChange={(e) => updatePaletteCount('primary', parseInt(e.target.value))}
                className="w-20 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-xs text-gray-500 w-6 text-right">{primaryCount}</span>
            </div>
            <div className="flex gap-1 flex-wrap">
              {palette.primary.map((color, idx) => (
                <div
                  key={idx}
                  className="w-8 h-8 rounded border border-white/20 cursor-pointer hover:scale-110 transition-transform"
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>

          {/* Accent colors */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400">Accent Colors</span>
              <input
                type="range"
                min="1"
                max="10"
                value={accentCount}
                onChange={(e) => updatePaletteCount('accent', parseInt(e.target.value))}
                className="w-20 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-xs text-gray-500 w-6 text-right">{accentCount}</span>
            </div>
            <div className="flex gap-1 flex-wrap">
              {palette.accent.map((color, idx) => (
                <div
                  key={idx}
                  className="w-8 h-8 rounded border border-white/20 cursor-pointer hover:scale-110 transition-transform"
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>

          {/* Grid size info */}
          <div className="pt-2 border-t border-white/10">
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Grid Size:</span>
              <span className="text-gray-300 font-mono">{gridSize.width} × {gridSize.height}</span>
            </div>
            <div className="flex justify-between text-xs mt-1">
              <span className="text-gray-500">Total Cells:</span>
              <span className="text-gray-300 font-mono">{(gridSize.width * gridSize.height).toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}

      {/* Preset patterns */}
      <div className="mt-2">
        <p className="text-xs text-gray-500 mb-2">Quick patterns:</p>
        <div className="grid grid-cols-4 gap-1">
          {generatePresetPatterns().map((pattern, idx) => (
            <button
              key={idx}
              onClick={() => onConfigChange({ ...config, images: { ...images, particle: pattern } })}
              className="w-full aspect-square rounded border border-white/10 hover:border-purple-500/50 overflow-hidden transition-all hover:scale-105"
              title="Use as particle texture"
            >
              <img src={pattern} alt={`Pattern ${idx}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// Generate simple SVG-based preset patterns as data URLs
function generatePresetPatterns(): string[] {
  const patterns = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><circle cx="32" cy="32" r="28" fill="white"/></svg>`,
    `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><polygon points="32,4 40,24 62,24 44,38 50,58 32,46 14,58 20,38 2,24 24,24" fill="white"/></svg>`,
    `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><polygon points="32,2 62,32 32,62 2,32" fill="white"/></svg>`,
    `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><path d="M24,2 L40,2 L40,24 L62,24 L62,40 L40,40 L40,62 L24,62 L24,40 L2,40 L2,24 L24,24 Z" fill="white"/></svg>`,
    `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><path d="M32,56 C16,40 2,30 2,18 C2,8 10,2 18,2 C24,2 28,6 32,12 C36,6 40,2 46,2 C54,2 62,8 62,18 C62,30 48,40 32,56Z" fill="white"/></svg>`,
    `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><polygon points="32,4 60,58 4,58" fill="white"/></svg>`,
    `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><circle cx="32" cy="32" r="28" fill="none" stroke="white" stroke-width="6"/></svg>`,
    `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><circle cx="32" cy="32" r="6" fill="white"/><circle cx="32" cy="32" r="14" fill="none" stroke="white" stroke-width="3"/><circle cx="32" cy="32" r="22" fill="none" stroke="white" stroke-width="2"/><circle cx="32" cy="32" r="30" fill="none" stroke="white" stroke-width="1"/></svg>`,
  ];

  return patterns.map(svg => `data:image/svg+xml;base64,${btoa(svg)}`);
}
