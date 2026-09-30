// Color palette extraction from images using k-means clustering

export interface ColorPalette {
  primary: string[]; // Main colors
  accent: string[];  // Accent/highlight colors
}

// Convert RGB to hex
function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => {
    const hex = Math.round(x).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

// Convert hex to RGB
function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16)
  ] : [0, 0, 0];
}

// Calculate color distance (Euclidean in RGB space)
function colorDistance(c1: [number, number, number], c2: [number, number, number]): number {
  return Math.sqrt(
    Math.pow(c1[0] - c2[0], 2) +
    Math.pow(c1[1] - c2[1], 2) +
    Math.pow(c1[2] - c2[2], 2)
  );
}

// K-means clustering for color quantization
function kMeans(colors: [number, number, number][], k: number, iterations: number = 20): [number, number, number][] {
  if (colors.length === 0) return [];
  
  // Initialize centroids randomly
  const centroids: [number, number, number][] = [];
  const step = Math.floor(colors.length / k);
  for (let i = 0; i < k; i++) {
    centroids.push([...colors[i * step]]);
  }
  
  for (let iter = 0; iter < iterations; iter++) {
    // Assign colors to nearest centroid
    const clusters: [number, number, number][][] = Array.from({ length: k }, () => []);
    
    for (const color of colors) {
      let minDist = Infinity;
      let closestIdx = 0;
      
      for (let i = 0; i < k; i++) {
        const dist = colorDistance(color, centroids[i]);
        if (dist < minDist) {
          minDist = dist;
          closestIdx = i;
        }
      }
      
      clusters[closestIdx].push(color);
    }
    
    // Update centroids
    for (let i = 0; i < k; i++) {
      if (clusters[i].length > 0) {
        const sum = clusters[i].reduce(
          (acc, c) => [acc[0] + c[0], acc[1] + c[1], acc[2] + c[2]],
          [0, 0, 0] as [number, number, number]
        );
        centroids[i] = [
          sum[0] / clusters[i].length,
          sum[1] / clusters[i].length,
          sum[2] / clusters[i].length
        ];
      }
    }
  }
  
  return centroids;
}

// Extract dominant colors from image
export function extractPaletteFromImage(
  imageData: ImageData,
  primaryCount: number = 5,
  accentCount: number = 3
): ColorPalette {
  const pixels: [number, number, number][] = [];
  const data = imageData.data;
  
  // Sample pixels (every 4th pixel for performance)
  for (let i = 0; i < data.length; i += 16) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];
    
    // Skip very dark, very bright, or transparent pixels
    if (a < 128) continue;
    const brightness = (r + g + b) / 3;
    if (brightness < 20 || brightness > 235) continue;
    
    pixels.push([r, g, b]);
  }
  
  if (pixels.length === 0) {
    return { primary: ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444'], accent: ['#EC4899', '#8B5CF6', '#06B6D4'] };
  }
  
  // Extract primary colors (most dominant)
  const totalColors = primaryCount + accentCount;
  const allCentroids = kMeans(pixels, totalColors);
  
  // Sort by frequency (approximate by cluster size in last iteration)
  // For simplicity, just split the results
  const primary = allCentroids.slice(0, primaryCount).map(c => rgbToHex(c[0], c[1], c[2]));
  const accent = allCentroids.slice(primaryCount).map(c => rgbToHex(c[0], c[1], c[2]));
  
  return { primary, accent };
}

// Load image and extract palette
export async function extractPaletteFromImageElement(
  imgElement: HTMLImageElement,
  primaryCount: number = 5,
  accentCount: number = 3
): Promise<ColorPalette> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Could not get canvas context');
  }
  
  // Resize for performance (max 200x200 for color extraction)
  const maxSize = 200;
  const scale = Math.min(maxSize / imgElement.width, maxSize / imgElement.height, 1);
  canvas.width = imgElement.width * scale;
  canvas.height = imgElement.height * scale;
  
  ctx.drawImage(imgElement, 0, 0, canvas.width, canvas.height);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  
  return extractPaletteFromImage(imageData, primaryCount, accentCount);
}

// Get image dimensions
export async function getImageDimensions(imgElement: HTMLImageElement): Promise<{ width: number; height: number }> {
  return { width: imgElement.naturalWidth, height: imgElement.naturalHeight };
}
