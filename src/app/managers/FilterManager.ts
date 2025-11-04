import { FilterType, FILTERS } from '../types/FilterTypes';

export class FilterManager {
  private currentFilter: FilterType = 'none';
  private videoElement: HTMLVideoElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private animationId: number | null = null;

  setVideoElement(video: HTMLVideoElement): void {
    this.videoElement = video;
    this.setupCanvas();
  }

  private setupCanvas(): void {
    if (!this.videoElement) return;

    // Create canvas for filter preview
    this.canvas = document.createElement('canvas');
    this.canvas.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      transform: scaleX(-1);
      z-index: 2;
      pointer-events: none;
    `;

    // Insert canvas after video element
    if (this.videoElement.parentNode) {
      this.videoElement.parentNode.insertBefore(this.canvas, this.videoElement.nextSibling);
    }

    this.ctx = this.canvas.getContext('2d');
    this.startFilterPreview();
  }

  setFilter(filter: FilterType): void {
    this.currentFilter = filter;
  }

  private startFilterPreview(): void {
    if (!this.videoElement || !this.canvas || !this.ctx) return;

    const updateCanvas = () => {
      if (!this.videoElement || !this.canvas || !this.ctx) return;

      const { videoWidth, videoHeight } = this.videoElement;
      if (videoWidth === 0 || videoHeight === 0) {
        this.animationId = requestAnimationFrame(updateCanvas);
        return;
      }

      // Set canvas size
      this.canvas.width = videoWidth;
      this.canvas.height = videoHeight;

      // Draw video frame
      this.ctx.drawImage(this.videoElement, 0, 0, videoWidth, videoHeight);

      // Apply filter
      if (this.currentFilter !== 'none') {
        const filter = FILTERS[this.currentFilter];
        this.applyFilterToCanvas(this.ctx, filter, videoWidth, videoHeight);
      }

      this.animationId = requestAnimationFrame(updateCanvas);
    };

    updateCanvas();
  }

  private applyFilterToCanvas(ctx: CanvasRenderingContext2D, filter: typeof FILTERS[FilterType], width: number, height: number): void {
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

  stop(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    
    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }
    
    this.canvas = null;
    this.ctx = null;
  }

  destroy(): void {
    this.stop();
  }
}
