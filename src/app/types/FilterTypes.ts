export type FilterType = 'none' | 'vintage' | 'blackwhite' | 'sepia' | 'vibrant' | 'cool' | 'warm' | 'blur' | 'sharpen';

export interface Filter {
  type: FilterType;
  name: string;
  description: string;
  icon: string;
  cssFilter: string;
  adjustments: {
    brightness?: number;
    contrast?: number;
    saturate?: number;
    hue?: number;
    blur?: number;
    sepia?: number;
    grayscale?: number;
  };
}

export const FILTERS: Record<FilterType, Filter> = {
  none: {
    type: 'none',
    name: 'Original',
    description: 'Keine Filter',
    icon: '◯',
    cssFilter: '',
    adjustments: {}
  },
  vintage: {
    type: 'vintage',
    name: 'Vintage',
    description: 'Retro-Look',
    icon: '📷',
    cssFilter: 'sepia(0.8) contrast(1.2) brightness(1.1) saturate(1.3)',
    adjustments: {
      sepia: 0.8,
      contrast: 1.2,
      brightness: 1.1,
      saturate: 1.3
    }
  },
  blackwhite: {
    type: 'blackwhite',
    name: 'Schwarz-Weiß',
    description: 'Monochrom',
    icon: '⚫',
    cssFilter: 'grayscale(100%) contrast(1.2)',
    adjustments: {
      grayscale: 100,
      contrast: 1.2
    }
  },
  sepia: {
    type: 'sepia',
    name: 'Sepia',
    description: 'Warme Töne',
    icon: '🤎',
    cssFilter: 'sepia(100%) contrast(1.1)',
    adjustments: {
      sepia: 100,
      contrast: 1.1
    }
  },
  vibrant: {
    type: 'vibrant',
    name: 'Lebendig',
    description: 'Satte Farben',
    icon: '🌈',
    cssFilter: 'saturate(1.5) contrast(1.1) brightness(1.05)',
    adjustments: {
      saturate: 1.5,
      contrast: 1.1,
      brightness: 1.05
    }
  },
  cool: {
    type: 'cool',
    name: 'Kühl',
    description: 'Blaue Töne',
    icon: '❄️',
    cssFilter: 'hue-rotate(200deg) saturate(1.2) brightness(0.95)',
    adjustments: {
      hue: 200,
      saturate: 1.2,
      brightness: 0.95
    }
  },
  warm: {
    type: 'warm',
    name: 'Warm',
    description: 'Orange Töne',
    icon: '🔥',
    cssFilter: 'hue-rotate(-30deg) saturate(1.3) brightness(1.1)',
    adjustments: {
      hue: -30,
      saturate: 1.3,
      brightness: 1.1
    }
  },
  blur: {
    type: 'blur',
    name: 'Weich',
    description: 'Unschärfe-Effekt',
    icon: '🌫️',
    cssFilter: 'blur(2px)',
    adjustments: {
      blur: 2
    }
  },
  sharpen: {
    type: 'sharpen',
    name: 'Scharf',
    description: 'Kontrast verstärkt',
    icon: '⚡',
    cssFilter: 'contrast(1.5) saturate(1.1)',
    adjustments: {
      contrast: 1.5,
      saturate: 1.1
    }
  }
};

export function applyFilterToCanvas(canvas: HTMLCanvasElement, filter: Filter): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const { width, height } = canvas;
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  // Apply adjustments
  const { brightness = 1, contrast = 1, saturate = 1, hue = 0, grayscale = 0, sepia = 0 } = filter.adjustments;

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    // Brightness
    r *= brightness;
    g *= brightness;
    b *= brightness;

    // Contrast
    r = ((r - 128) * contrast) + 128;
    g = ((g - 128) * contrast) + 128;
    b = ((b - 128) * contrast) + 128;

    // Saturation
    if (saturate !== 1) {
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      r = gray + saturate * (r - gray);
      g = gray + saturate * (g - gray);
      b = gray + saturate * (b - gray);
    }

    // Hue rotation
    if (hue !== 0) {
      const cos = Math.cos(hue * Math.PI / 180);
      const sin = Math.sin(hue * Math.PI / 180);
      const newR = r * cos - g * sin;
      const newG = r * sin + g * cos;
      r = newR;
      g = newG;
    }

    // Grayscale
    if (grayscale > 0) {
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      r = r + (gray - r) * (grayscale / 100);
      g = g + (gray - g) * (grayscale / 100);
      b = b + (gray - b) * (grayscale / 100);
    }

    // Sepia
    if (sepia > 0) {
      const tr = 0.393 * r + 0.769 * g + 0.189 * b;
      const tg = 0.349 * r + 0.686 * g + 0.168 * b;
      const tb = 0.272 * r + 0.534 * g + 0.131 * b;
      r = r + (tr - r) * (sepia / 100);
      g = g + (tg - g) * (sepia / 100);
      b = b + (tb - b) * (sepia / 100);
    }

    // Clamp values
    data[i] = Math.max(0, Math.min(255, r));
    data[i + 1] = Math.max(0, Math.min(255, g));
    data[i + 2] = Math.max(0, Math.min(255, b));
  }

  ctx.putImageData(imageData, 0, 0);
}
