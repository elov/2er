import { useRef, useState } from 'react';

export interface LoadedImages {
  background: string | null;
  particle: string | null;
  overlay: string | null;
}

interface ImageLoaderProps {
  images: LoadedImages;
  onImagesChange: (images: LoadedImages) => void;
}

type ImageSlot = keyof LoadedImages;

const IMAGE_SLOTS: { key: ImageSlot; label: string; description: string; icon: string }[] = [
  { key: 'background', label: 'Background', description: 'Used as canvas background in terrain/particle modes', icon: '🖼️' },
  { key: 'particle', label: 'Particle Texture', description: 'Shape applied to particles in particle mode', icon: '✦' },
  { key: 'overlay', label: 'Overlay Image', description: 'Semi-transparent overlay on visualizations', icon: '🔲' },
];

export default function ImageLoader({ images, onImagesChange }: ImageLoaderProps) {
  const inputRefs = useRef<Record<ImageSlot, HTMLInputElement | null>>({
    background: null,
    particle: null,
    overlay: null,
  });
  const [isDragging, setIsDragging] = useState<ImageSlot | null>(null);

  const handleFile = (slot: ImageSlot, file: File) => {
    if (!file.type.startsWith('image/')) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      onImagesChange({ ...images, [slot]: dataUrl });
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
    onImagesChange({ ...images, [slot]: null });
  };

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
        🎨 Image Assets
      </h3>

      {IMAGE_SLOTS.map(({ key, label, description, icon }) => (
        <div key={key} className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="text-sm">{icon}</span>
            <span className="text-xs font-medium text-gray-300">{label}</span>
          </div>

          {images[key] ? (
            <div className="relative group">
              <div
                className="w-full h-20 rounded-lg overflow-hidden border border-white/10 bg-black/30"
              >
                <img
                  src={images[key]!}
                  alt={label}
                  className="w-full h-full object-cover"
                />
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
              <p className="text-xs text-gray-500">
                {description}
              </p>
              <p className="text-[10px] text-gray-600 mt-1">
                Drop image or click
              </p>
            </div>
          )}
        </div>
      ))}

      {/* Preset patterns */}
      <div className="mt-2">
        <p className="text-xs text-gray-500 mb-2">Quick patterns:</p>
        <div className="grid grid-cols-4 gap-1">
          {generatePresetPatterns().map((pattern, idx) => (
            <button
              key={idx}
              onClick={() => onImagesChange({ ...images, particle: pattern })}
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
    // Circle
    `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><circle cx="32" cy="32" r="28" fill="white"/></svg>`,
    // Star
    `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><polygon points="32,4 40,24 62,24 44,38 50,58 32,46 14,58 20,38 2,24 24,24" fill="white"/></svg>`,
    // Diamond
    `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><polygon points="32,2 62,32 32,62 2,32" fill="white"/></svg>`,
    // Cross
    `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><path d="M24,2 L40,2 L40,24 L62,24 L62,40 L40,40 L40,62 L24,62 L24,40 L2,40 L2,24 L24,24 Z" fill="white"/></svg>`,
    // Heart
    `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><path d="M32,56 C16,40 2,30 2,18 C2,8 10,2 18,2 C24,2 28,6 32,12 C36,6 40,2 46,2 C54,2 62,8 62,18 C62,30 48,40 32,56Z" fill="white"/></svg>`,
    // Triangle
    `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><polygon points="32,4 60,58 4,58" fill="white"/></svg>`,
    // Ring
    `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><circle cx="32" cy="32" r="28" fill="none" stroke="white" stroke-width="6"/></svg>`,
    // Spiral (simplified)
    `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><circle cx="32" cy="32" r="6" fill="white"/><circle cx="32" cy="32" r="14" fill="none" stroke="white" stroke-width="3"/><circle cx="32" cy="32" r="22" fill="none" stroke="white" stroke-width="2"/><circle cx="32" cy="32" r="30" fill="none" stroke="white" stroke-width="1"/></svg>`,
  ];

  return patterns.map(svg => `data:image/svg+xml;base64,${btoa(svg)}`);
}
