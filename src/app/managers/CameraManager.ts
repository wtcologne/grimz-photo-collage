import { StateManager } from './StateManager';

export class CameraManager {
  private videoElement: HTMLVideoElement | null = null;
  private stateManager: StateManager | null = null;

  setVideoElement(video: HTMLVideoElement): void {
    this.videoElement = video;
  }

  setStateManager(stateManager: StateManager): void {
    this.stateManager = stateManager;
  }

  async startCamera(): Promise<void> {
    try {
      if (this.stateManager) {
        const currentState = this.stateManager.getState();
        if (currentState.stream) {
          this.stopCamera();
        }
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: 'user',
          width: { ideal: 1080 },
          height: { ideal: 1440 }
        }
      });

      if (this.stateManager) {
        this.stateManager.updateState({ stream });
      }

      if (this.videoElement) {
        this.videoElement.srcObject = stream;
        await this.videoElement.play();
      }

    } catch (error) {
      console.error('Camera access failed:', error);
      throw new Error('Kamera nicht verfügbar. Zugriff erlauben & Seite über https öffnen.');
    }
  }

  stopCamera(): void {
    if (this.stateManager) {
      const currentState = this.stateManager.getState();
      if (currentState.stream) {
        currentState.stream.getTracks().forEach(track => track.stop());
        this.stateManager.updateState({ stream: null });
      }
    }
  }

  captureFrame(): HTMLCanvasElement | null {
    if (!this.videoElement || !this.videoElement.videoWidth || !this.videoElement.videoHeight) {
      return null;
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return null;

    const vw = this.videoElement.videoWidth;
    const vh = this.videoElement.videoHeight;

    canvas.width = vw;
    canvas.height = vh;

    // Mirror the frame horizontally
    ctx.save();
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(this.videoElement, 0, 0, vw, vh);
    ctx.restore();

    return canvas;
  }

  getVideoDimensions(): { width: number; height: number } | null {
    if (!this.videoElement || !this.videoElement.videoWidth || !this.videoElement.videoHeight) {
      return null;
    }

    return {
      width: this.videoElement.videoWidth,
      height: this.videoElement.videoHeight
    };
  }
}
