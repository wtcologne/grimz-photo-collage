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
    colorTemp?: number; // Color temperature: positive = cool (blue), negative = warm (orange)
    redShift?: number; // Red channel multiplier
    greenShift?: number; // Green channel multiplier
    blueShift?: number; // Blue channel multiplier
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
    cssFilter: 'sepia(0.5) contrast(1.15) brightness(1.05) saturate(1.2)',
    adjustments: {
      sepia: 0.5,
      contrast: 1.15,
      brightness: 1.05,
      saturate: 1.2,
      redShift: 1.05,
      greenShift: 0.98,
      blueShift: 0.92
    }
  },
  blackwhite: {
    type: 'blackwhite',
    name: 'Schwarz-Weiß',
    description: 'Monochrom',
    icon: '⚫',
    cssFilter: 'grayscale(100%) contrast(1.15) brightness(1.02)',
    adjustments: {
      grayscale: 100,
      contrast: 1.15,
      brightness: 1.02
    }
  },
  sepia: {
    type: 'sepia',
    name: 'Sepia',
    description: 'Warme Töne',
    icon: '🤎',
    cssFilter: 'sepia(0.7) contrast(1.1) brightness(1.05)',
    adjustments: {
      sepia: 0.7,
      contrast: 1.1,
      brightness: 1.05
    }
  },
  vibrant: {
    type: 'vibrant',
    name: 'Lebendig',
    description: 'Satte Farben',
    icon: '🌈',
    cssFilter: 'saturate(1.4) contrast(1.12) brightness(1.03)',
    adjustments: {
      saturate: 1.4,
      contrast: 1.12,
      brightness: 1.03
    }
  },
  cool: {
    type: 'cool',
    name: 'Kühl',
    description: 'Blaue Töne',
    icon: '❄️',
    cssFilter: 'brightness(0.98) contrast(1.05) saturate(1.1)',
    adjustments: {
      brightness: 0.98,
      contrast: 1.05,
      saturate: 1.1,
      colorTemp: 0.15,
      redShift: 0.92,
      greenShift: 0.98,
      blueShift: 1.08
    }
  },
  warm: {
    type: 'warm',
    name: 'Warm',
    description: 'Orange Töne',
    icon: '🔥',
    cssFilter: 'brightness(1.05) contrast(1.08) saturate(1.15)',
    adjustments: {
      brightness: 1.05,
      contrast: 1.08,
      saturate: 1.15,
      colorTemp: -0.15,
      redShift: 1.08,
      greenShift: 1.02,
      blueShift: 0.92
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
    cssFilter: 'contrast(1.25) saturate(1.08) brightness(1.02)',
    adjustments: {
      contrast: 1.25,
      saturate: 1.08,
      brightness: 1.02
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
  const { 
    brightness = 1, 
    contrast = 1, 
    saturate = 1, 
    hue = 0, 
    grayscale = 0, 
    sepia = 0,
    colorTemp = 0,
    redShift = 1,
    greenShift = 1,
    blueShift = 1
  } = filter.adjustments;

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    // Color temperature adjustment (before other adjustments)
    // Cool (positive): reduce red, enhance blue
    // Warm (negative): enhance red, reduce blue
    if (colorTemp !== 0) {
      r *= (1 - colorTemp * 0.5);
      b *= (1 + colorTemp * 0.5);
    }

    // Channel-specific shifts (subtle color grading)
    r *= redShift;
    g *= greenShift;
    b *= blueShift;

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

    // Hue rotation (only if explicitly set, not for cool/warm)
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

    // Sepia (adjust intensity based on value)
    if (sepia > 0) {
      const sepiaAmount = sepia > 1 ? sepia / 100 : sepia;
      const tr = 0.393 * r + 0.769 * g + 0.189 * b;
      const tg = 0.349 * r + 0.686 * g + 0.168 * b;
      const tb = 0.272 * r + 0.534 * g + 0.131 * b;
      r = r + (tr - r) * sepiaAmount;
      g = g + (tg - g) * sepiaAmount;
      b = b + (tb - b) * sepiaAmount;
    }

    // Clamp values
    data[i] = Math.max(0, Math.min(255, r));
    data[i + 1] = Math.max(0, Math.min(255, g));
    data[i + 2] = Math.max(0, Math.min(255, b));
  }

  ctx.putImageData(imageData, 0, 0);
}
