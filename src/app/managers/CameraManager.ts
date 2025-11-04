import { StateManager } from './StateManager';

export class CameraManager {
  private videoElement: HTMLVideoElement | null = null;
  private stateManager: StateManager | null = null;
  private currentFacingMode: 'user' | 'environment' = 'user';
  private retryCount = 0;
  private readonly maxRetries = 3;

  setVideoElement(video: HTMLVideoElement): void {
    this.videoElement = video;
  }

  setStateManager(stateManager: StateManager): void {
    this.stateManager = stateManager;
  }

  async startCamera(facingMode?: 'user' | 'environment'): Promise<void> {
    try {
      if (facingMode) {
        this.currentFacingMode = facingMode;
      }

      if (this.stateManager) {
        const currentState = this.stateManager.getState();
        if (currentState.stream) {
          this.stopCamera();
        }
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: this.currentFacingMode,
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

      // Reset retry count on success
      this.retryCount = 0;

    } catch (error) {
      console.error('Camera access failed:', error);
      
      // Retry logic for certain errors
      if (this.retryCount < this.maxRetries && this.isRetryableError(error)) {
        this.retryCount++;
        await new Promise(resolve => setTimeout(resolve, 1000 * this.retryCount));
        return this.startCamera();
      }

      // Provide user-friendly error messages
      const errorMessage = this.getErrorMessage(error);
      throw new Error(errorMessage);
    }
  }

  /**
   * Switch between front and back camera
   */
  async switchCamera(): Promise<void> {
    const newFacingMode = this.currentFacingMode === 'user' ? 'environment' : 'user';
    await this.startCamera(newFacingMode);
  }

  /**
   * Get current camera facing mode
   */
  getCurrentFacingMode(): 'user' | 'environment' {
    return this.currentFacingMode;
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: any): boolean {
    if (!error || !error.name) return false;
    
    // Retry on these error types
    const retryableErrors = ['NotReadableError', 'NotAllowedError', 'OverconstrainedError'];
    return retryableErrors.some(name => error.name.includes(name));
  }

  /**
   * Get user-friendly error message
   */
  private getErrorMessage(error: any): string {
    if (!error || !error.name) {
      return 'Kamera nicht verfügbar. Bitte überprüfen Sie die Berechtigungen.';
    }

    const errorName = error.name.toLowerCase();

    if (errorName.includes('notallowed') || errorName.includes('permission')) {
      return 'Kamera-Zugriff verweigert. Bitte erlauben Sie den Zugriff in den Browser-Einstellungen.';
    }

    if (errorName.includes('notfound') || errorName.includes('devicenotfound')) {
      return 'Keine Kamera gefunden. Bitte stellen Sie sicher, dass eine Kamera angeschlossen ist.';
    }

    if (errorName.includes('notreadable') || errorName.includes('trackstart')) {
      return 'Kamera wird bereits verwendet. Bitte schließen Sie andere Anwendungen, die die Kamera nutzen.';
    }

    if (errorName.includes('overconstrained') || errorName.includes('constraint')) {
      return 'Kamera-Anforderungen können nicht erfüllt werden. Versuchen Sie es mit einer anderen Kamera.';
    }

    if (errorName.includes('security') || errorName.includes('https')) {
      return 'Kamera-Zugriff erfordert HTTPS. Bitte öffnen Sie die Seite über HTTPS.';
    }

    return 'Kamera nicht verfügbar. Zugriff erlauben & Seite über https öffnen.';
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
