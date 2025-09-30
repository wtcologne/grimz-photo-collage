import { StateManager } from './StateManager';
import { getCollageSlices, CollageFormat } from '../types/CollageTypes';
import { FILTERS, applyFilterToCanvas, FilterType } from '../types/FilterTypes';

export class CollageManager {
  private stateManager: StateManager | null = null;

  setStateManager(stateManager: StateManager): void {
    this.stateManager = stateManager;
  }

  captureSlice(fullFrame: HTMLCanvasElement, step: number): HTMLCanvasElement | null {
    if (!this.stateManager) return null;

    const state = this.stateManager.getState();
    const baseWidth = state.baseWidth || fullFrame.width;
    const baseHeight = state.baseHeight || fullFrame.height;
    const format = state.currentFormat;

    const slices = getCollageSlices(format, baseWidth, baseHeight);
    const sliceInfo = slices[step - 1];
    
    if (!sliceInfo) return null;

    const slice = document.createElement('canvas');
    slice.width = sliceInfo.width;
    slice.height = sliceInfo.height;

    const ctx = slice.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(
      fullFrame,
      sliceInfo.x, sliceInfo.y, sliceInfo.width, sliceInfo.height,
      0, 0, sliceInfo.width, sliceInfo.height
    );

    // No filter applied during capture - only at the end

    return slice;
  }

  assembleCollage(): HTMLCanvasElement | null {
    if (!this.stateManager) return null;

    const state = this.stateManager.getState();
    const { parts, baseWidth, baseHeight, currentFormat } = state;

    if (!baseWidth || !baseHeight) {
      return null;
    }

    // Create canvas with viewport dimensions (full height)
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    const canvas = document.createElement('canvas');
    canvas.width = viewportWidth;
    canvas.height = viewportHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Fill background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, viewportWidth, viewportHeight);

    // Calculate crop dimensions to fill viewport height
    const aspectRatio = baseWidth / baseHeight;
    const viewportAspectRatio = viewportWidth / viewportHeight;
    
    let sourceX = 0;
    let sourceY = 0;
    let sourceWidth = baseWidth;
    let sourceHeight = baseHeight;
    
    if (aspectRatio > viewportAspectRatio) {
      // Image is wider than viewport - crop sides
      sourceWidth = baseHeight * viewportAspectRatio;
      sourceX = (baseWidth - sourceWidth) / 2;
    } else {
      // Image is taller than viewport - crop top/bottom
      sourceHeight = baseWidth / viewportAspectRatio;
      sourceY = (baseHeight - sourceHeight) / 2;
    }

    // Draw cropped image
    ctx.drawImage(
      this.createCollageImage(parts, baseWidth, baseHeight, currentFormat, 'none'),
      sourceX, sourceY, sourceWidth, sourceHeight,
      0, 0, viewportWidth, viewportHeight
    );

    // Add watermark AFTER cropping (so it's positioned correctly)
    this.drawWatermark(ctx, viewportWidth, viewportHeight);

    return canvas;
  }

  applyResultFilter(filter: FilterType): HTMLCanvasElement | null {
    if (!this.stateManager) return null;

    const state = this.stateManager.getState();
    const { parts, baseWidth, baseHeight, currentFormat } = state;

    if (!baseWidth || !baseHeight) {
      return null;
    }

    // Create canvas with viewport dimensions (full height)
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    const canvas = document.createElement('canvas');
    canvas.width = viewportWidth;
    canvas.height = viewportHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Fill background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, viewportWidth, viewportHeight);

    // Calculate crop dimensions to fill viewport height
    const aspectRatio = baseWidth / baseHeight;
    const viewportAspectRatio = viewportWidth / viewportHeight;
    
    let sourceX = 0;
    let sourceY = 0;
    let sourceWidth = baseWidth;
    let sourceHeight = baseHeight;
    
    if (aspectRatio > viewportAspectRatio) {
      // Image is wider than viewport - crop sides
      sourceWidth = baseHeight * viewportAspectRatio;
      sourceX = (baseWidth - sourceWidth) / 2;
    } else {
      // Image is taller than viewport - crop top/bottom
      sourceHeight = baseWidth / viewportAspectRatio;
      sourceY = (baseHeight - sourceHeight) / 2;
    }

    // Draw cropped image
    ctx.drawImage(
      this.createCollageImage(parts, baseWidth, baseHeight, currentFormat, filter),
      sourceX, sourceY, sourceWidth, sourceHeight,
      0, 0, viewportWidth, viewportHeight
    );

    // Add watermark AFTER cropping (so it's positioned correctly)
    this.drawWatermark(ctx, viewportWidth, viewportHeight);

    return canvas;
  }

  private createCollageImage(parts: { [key: number]: HTMLCanvasElement | null }, baseWidth: number, baseHeight: number, currentFormat: CollageFormat, filter: FilterType): HTMLCanvasElement {
    const slices = getCollageSlices(currentFormat, baseWidth, baseHeight);
    const canvas = document.createElement('canvas');
    canvas.width = baseWidth;
    canvas.height = baseHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;

    // Fill background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, baseWidth, baseHeight);

    // Draw parts
    slices.forEach((sliceInfo, index) => {
      const part = parts[index + 1];
      if (part) {
        ctx.drawImage(part, sliceInfo.x, sliceInfo.y, sliceInfo.width, sliceInfo.height);
      }
    });

    // Apply filter to the image parts only (not watermark)
    if (filter !== 'none') {
      const filterData = FILTERS[filter];
      applyFilterToCanvas(canvas, filterData);
    }

    return canvas;
  }

  private drawWatermark(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    const margin = Math.round(Math.min(width, height) * 0.03);
    const text = 'GRIMZ';
    const fontSize = Math.max(20, Math.round(width * 0.06));

    ctx.save();
    ctx.font = `900 ${fontSize}px 'Orbitron', 'Courier New', monospace`;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';

    // Calculate box dimensions
    const metrics = ctx.measureText(text);
    const padX = Math.round(fontSize * 0.5);
    const padY = Math.round(fontSize * 0.35);
    const boxWidth = Math.ceil(metrics.width + padX * 2);
    const boxHeight = Math.ceil(fontSize + padY * 1.2);
    const x = margin + boxWidth / 2;
    const y = margin + boxHeight / 2;

    // Draw background box
    ctx.globalAlpha = 0.65;
    ctx.fillStyle = '#000';
    this.roundRect(ctx, margin, margin, boxWidth, boxHeight, Math.min(16, Math.floor(boxHeight / 2)));
    ctx.fill();

    // Draw text with gradient
    ctx.globalAlpha = 1.0;
    const gradient = ctx.createLinearGradient(margin, margin, margin + boxWidth, margin);
    gradient.addColorStop(0, '#22c55e');
    gradient.addColorStop(0.5, '#3b82f6');
    gradient.addColorStop(1, '#a855f7');
    ctx.fillStyle = gradient;

    ctx.shadowColor = 'rgba(0,0,0,0.35)';
    ctx.shadowBlur = Math.round(fontSize * 0.25);
    ctx.fillText(text, x, y);
    ctx.restore();
  }

  private roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number): void {
    const r = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + width, y, x + width, y + height, r);
    ctx.arcTo(x + width, y + height, x, y + height, r);
    ctx.arcTo(x, y + height, x, y, r);
    ctx.arcTo(x, y, x + width, y, r);
    ctx.closePath();
  }

  async saveImage(canvas: HTMLCanvasElement, filename: string = 'GRIMZ.png'): Promise<void> {
    try {
      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, 'image/png');
      });

      if (!blob) {
        throw new Error('Failed to create blob');
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    } catch (error) {
      console.error('Failed to save image:', error);
      throw new Error('Bild konnte nicht gespeichert werden');
    }
  }
}
