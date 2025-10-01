import { StateManager, AppState } from './StateManager';
import { CameraManager } from './CameraManager';
import { CollageManager } from './CollageManager';
import { AudioManager } from './AudioManager';
import { Toast } from '../components/Toast';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { GestureHandler } from '../components/GestureHandler';
import { FilterSelector } from '../components/FilterSelector';
import { CollageFormat } from '../types/CollageTypes';
import { FilterType } from '../types/FilterTypes';
import { MobileManager } from '../mobile/MobileManager';

export class UIManager {
  private stateManager: StateManager;
  private cameraManager: CameraManager;
  private collageManager: CollageManager;
  private audioManager: AudioManager;
  private unsubscribe: (() => void) | null = null;

  // DOM Elements
  private videoElement: HTMLVideoElement | null = null;
  private stageElement: HTMLElement | null = null;
  private resultCanvas: HTMLCanvasElement | null = null;
  private maskElement: HTMLElement | null = null;
  private capturedImages: { [key: number]: HTMLImageElement } = {};

  // Control buttons
  private btnCapture: HTMLButtonElement | null = null;
  private btnRestart: HTMLButtonElement | null = null;
  private btnSave: HTMLButtonElement | null = null;

  // Control containers
  private controlsLive: HTMLElement | null = null;
  private controlsResult: HTMLElement | null = null;

  // Gesture handling
  private gestureHandler: GestureHandler | null = null;

  // Selectors
  private filterSelector: FilterSelector | null = null;

  constructor(stateManager: StateManager, cameraManager: CameraManager, collageManager: CollageManager, audioManager: AudioManager) {
    this.stateManager = stateManager;
    this.cameraManager = cameraManager;
    this.collageManager = collageManager;
    this.audioManager = audioManager;
  }

  async initialize(): Promise<void> {
    this.createUI();
    this.bindElements();
    this.setupEventListeners();
    this.setupStateSubscription();
    
    // Initialize managers
    this.cameraManager.setStateManager(this.stateManager);
    this.collageManager.setStateManager(this.stateManager);
    
    // Initialize audio
    await this.audioManager.enableAudio();
    
    // Initialize components
    Toast.init();
    
    // Initialize selectors
    this.filterSelector = new FilterSelector();
    
    // Setup gesture handling
    this.setupGestures();
    
    // Set initial mask
    this.updateMask();
    
    // Auto-start camera
    await this.autoStartCamera();
  }

  private async autoStartCamera(): Promise<void> {
    try {
      LoadingSpinner.show('camera', 'Kamera wird gestartet...');
      await this.cameraManager.startCamera();
      LoadingSpinner.hide('camera');
    } catch (error) {
      LoadingSpinner.hide('camera');
      await this.showError(error instanceof Error ? error.message : 'Kamera-Fehler');
    }
  }

  private createUI(): void {
    const app = document.getElementById('app');
    if (!app) throw new Error('App container not found');

    app.innerHTML = `
      <header>
        <div class="brand" aria-label="GRIMZ">GRIMZ</div>
      </header>

      <div class="card">
        <div class="stage" id="stage">
          <video id="video" class="video" playsinline autoplay muted></video>
          <div class="captured" id="captured">
            <!-- Captured images will be added dynamically -->
          </div>
          <div class="overlay">
            <div class="mask" id="mask"></div>
          </div>
        </div>
        <canvas id="resultCanvas" class="result-canvas"></canvas>
      </div>

      <!-- Format Toggle -->
      <div class="format-toggle-container">
        <button id="btnFormatToggle" class="format-toggle">
          <span class="toggle-text">2 Linien</span>
        </button>
      </div>

          <div id="controlsLive" class="controls">
            <button id="btnCapture" class="primary" disabled>Aufnahme</button>
          </div>

      <div id="controlsResult" class="controls hidden">
        <button id="btnRestart" class="ghost">Neustart</button>
        <button id="btnResultFilter" class="feature-btn">Filter</button>
        <button id="btnSave" class="primary">Speichern</button>
      </div>
    `;
  }

  private bindElements(): void {
    this.videoElement = document.getElementById('video') as HTMLVideoElement;
    this.stageElement = document.getElementById('stage');
    this.resultCanvas = document.getElementById('resultCanvas') as HTMLCanvasElement;
    this.maskElement = document.getElementById('mask');
    
    // Captured images will be created dynamically
    this.capturedImages = {};

        this.btnCapture = document.getElementById('btnCapture') as HTMLButtonElement;
        this.btnRestart = document.getElementById('btnRestart') as HTMLButtonElement;
        this.btnSave = document.getElementById('btnSave') as HTMLButtonElement;

    this.controlsLive = document.getElementById('controlsLive');
    this.controlsResult = document.getElementById('controlsResult');

    if (this.videoElement) {
      this.cameraManager.setVideoElement(this.videoElement);
    }
  }

  private setupEventListeners(): void {
    this.btnCapture?.addEventListener('click', () => this.handleCapture());
    this.btnRestart?.addEventListener('click', () => this.handleRestart());
    this.btnSave?.addEventListener('click', () => this.handleSave());

    // Format toggle
    document.getElementById('btnFormatToggle')?.addEventListener('click', () => this.handleFormatToggle());
    document.getElementById('btnResultFilter')?.addEventListener('click', () => this.handleResultFilterSelect());

    // Handle visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.cameraManager.stopCamera();
      }
    });

    window.addEventListener('beforeunload', () => {
      this.cameraManager.stopCamera();
    });

    // Initialize format toggle state
    const state = this.stateManager.getState();
    this.updateFormatToggleState(state.currentFormat);
  }

  private setupGestures(): void {
    if (!this.stageElement) return;

    this.gestureHandler = new GestureHandler(this.stageElement);
    
    // Double tap to capture
    this.gestureHandler.on('double-tap', () => {
      const state = this.stateManager.getState();
      if (state.stream && !state.isProcessing) {
        this.handleCapture();
      }
    });

    // Long press for info
    this.gestureHandler.on('long-press', () => {
      // Silent - no toast
    });

    // Swipe gestures for navigation
    this.gestureHandler.on('swipe-up', () => {
      // Silent - no toast
    });

    this.gestureHandler.on('swipe-down', () => {
      const state = this.stateManager.getState();
      if (state.step > 1) {
        this.handleRestart();
      }
    });
  }

  private setupStateSubscription(): void {
    this.unsubscribe = this.stateManager.subscribe((state) => {
      this.updateUI(state);
    });
  }

  private updateUI(state: AppState): void {
    // Update capture button state
    if (this.btnCapture) {
      this.btnCapture.disabled = !state.stream || state.isProcessing;
    }

    // Update processing state
    if (state.isProcessing) {
      this.btnCapture?.classList.add('loading');
    } else {
      this.btnCapture?.classList.remove('loading');
    }

    // Update format toggle
    this.updateFormatToggle(state);
  }

  private updateFormatToggle(state: AppState): void {
    const toggleBtn = document.getElementById('btnFormatToggle');
    const toggleText = toggleBtn?.querySelector('.toggle-text');
    
    if (toggleText) {
      toggleText.textContent = state.currentFormat === '2x1' ? '2 Linien' : '3 Linien';
    }
  }


  private async handleCapture(): Promise<void> {
    const state = this.stateManager.getState();
    if (state.isProcessing) return;

    try {
      // Haptic feedback for capture
      MobileManager.getInstance().vibrateCapture();
      
      // Play shutter sound
      await this.audioManager.playShutterSound();
      
      this.stateManager.updateState({ isProcessing: true });

      const fullFrame = this.cameraManager.captureFrame();
      if (!fullFrame) {
        throw new Error('Frame capture failed');
      }

      // Set base dimensions on first capture
      if (!state.baseWidth || !state.baseHeight) {
        const dimensions = this.cameraManager.getVideoDimensions();
        if (dimensions) {
          this.stateManager.updateState({
            baseWidth: dimensions.width,
            baseHeight: dimensions.height
          });
        }
      }

      // Capture slice (filter is already applied in CollageManager)
      const slice = this.collageManager.captureSlice(fullFrame, state.step);
      if (!slice) {
        throw new Error('Slice capture failed');
      }

      // Store slice
      const newParts = { ...state.parts };
      newParts[state.step as keyof typeof newParts] = slice;
      this.stateManager.updateState({ parts: newParts });

      // Display slice with animation
      const dataUrl = slice.toDataURL('image/jpeg', 0.92);
      await this.createCapturedImage(state.step, dataUrl);
      
      // Add success animation
      if (this.capturedImages[state.step]) {
        this.capturedImages[state.step].classList.add('success-pulse');
      }

      // Get total steps for current format
      const { COLLAGE_LAYOUTS } = await import('../types/CollageTypes');
      const layout = COLLAGE_LAYOUTS[state.currentFormat];
      const totalSteps = layout.rows * layout.cols;

      if (state.step < totalSteps) {
        // Next step
        this.stateManager.updateState({ step: state.step + 1 });
        this.updateMask();
      } else {
        // Assemble collage
        await this.assembleAndShowResult();
      }

    } catch (error) {
      await this.showError(error instanceof Error ? error.message : 'Aufnahme-Fehler');
    } finally {
      this.stateManager.updateState({ isProcessing: false });
    }
  }

  private async assembleAndShowResult(): Promise<void> {
    const collage = this.collageManager.assembleCollage();
    if (!collage) {
      throw new Error('Collage assembly failed');
    }

    // Play success sound
    await this.audioManager.playSuccessSound();

    // Show result
    if (this.resultCanvas) {
      this.resultCanvas.width = collage.width;
      this.resultCanvas.height = collage.height;
      const ctx = this.resultCanvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(collage, 0, 0);
      }
      this.resultCanvas.style.display = 'block';
      this.resultCanvas.classList.add('success-pulse');
    }

    if (this.stageElement) {
      this.stageElement.style.display = 'none';
    }

    if (this.controlsLive) {
      this.controlsLive.classList.add('hidden');
    }

    if (this.controlsResult) {
      this.controlsResult.classList.remove('hidden');
    }

    // Hide format toggle when collage is finished
    const formatToggleContainer = document.querySelector('.format-toggle-container');
    if (formatToggleContainer) {
      formatToggleContainer.classList.add('hidden');
    }

    this.cameraManager.stopCamera();
  }

  private async handleSave(): Promise<void> {
    if (!this.resultCanvas) return;

    try {
      LoadingSpinner.show('save', 'Bild wird gespeichert...');
      await this.collageManager.saveImage(this.resultCanvas);
      LoadingSpinner.hide('save');
      
      // Haptic feedback for successful save
      MobileManager.getInstance().vibrateSuccess();
    } catch (error) {
      LoadingSpinner.hide('save');
      await this.showError(error instanceof Error ? error.message : 'Speichern-Fehler');
    }
  }

  private async handleRestart(): Promise<void> {
    this.stateManager.reset();
    
    // Reset UI
    Object.values(this.capturedImages).forEach(img => {
      img.src = '';
      img.style.display = 'none';
      img.classList.remove('success-pulse');
    });

    if (this.resultCanvas) {
      this.resultCanvas.style.display = 'none';
      this.resultCanvas.classList.remove('success-pulse');
    }

    if (this.stageElement) {
      this.stageElement.style.display = 'block';
    }

    if (this.controlsResult) {
      this.controlsResult.classList.add('hidden');
    }

    if (this.controlsLive) {
      this.controlsLive.classList.remove('hidden');
    }

    // Show format toggle again when restarting
    const formatToggleContainer = document.querySelector('.format-toggle-container');
    if (formatToggleContainer) {
      formatToggleContainer.classList.remove('hidden');
    }

    this.updateMask();
    
    // Restart camera automatically
    await this.autoStartCamera();
  }

  private updateMask(): void {
    if (!this.maskElement) return;

    const state = this.stateManager.getState();
    const { step, currentFormat } = state;
    
    // Get layout info
    import('../types/CollageTypes').then(({ COLLAGE_LAYOUTS }) => {
      const layout = COLLAGE_LAYOUTS[currentFormat];
      
      // Calculate slice position
      const sliceIndex = step - 1;
      const totalSlices = layout.rows * layout.cols;
      
      if (sliceIndex >= totalSlices) return;
      
      // Create mask based on format
      let maskCSS = '';
      
      if (layout.rows === 1) {
        // Horizontal layout (1x3, 1x4)
        const sliceWidth = 100 / layout.cols;
        const sliceStart = sliceIndex * sliceWidth;
        const sliceEnd = sliceStart + sliceWidth;
        maskCSS = `linear-gradient(90deg, #000 0, #000 ${sliceStart}%, transparent ${sliceStart}%, transparent ${sliceEnd}%, #000 ${sliceEnd}%, #000 100%)`;
      } else {
        // Vertical layout (3x1, 2x2, 4x1)
        const sliceHeight = 100 / layout.rows;
        const sliceStart = sliceIndex * sliceHeight;
        const sliceEnd = sliceStart + sliceHeight;
        maskCSS = `linear-gradient(#000 0, #000 ${sliceStart}%, transparent ${sliceStart}%, transparent ${sliceEnd}%, #000 ${sliceEnd}%, #000 100%)`;
      }
      
      this.maskElement!.style.setProperty('--mask', maskCSS);
    });
  }

  private async showError(message: string): Promise<void> {
    // Haptic feedback for errors
    MobileManager.getInstance().vibrateError();
    
    // Play error sound
    await this.audioManager.playErrorSound();
    
    this.showToast('error', message);
    // Add shake animation to relevant elements
    if (this.stageElement) {
      this.stageElement.classList.add('error-shake');
      setTimeout(() => {
        this.stageElement?.classList.remove('error-shake');
      }, 500);
    }
  }

  private showToast(type: 'success' | 'error' | 'info' | 'warning', message: string): void {
    Toast.show({ type, message });
  }

  private async createCapturedImage(step: number, dataUrl: string): Promise<void> {
    const capturedContainer = document.getElementById('captured');
    if (!capturedContainer) return;

    // Remove existing image for this step
    const existingImg = document.getElementById(`cap-${step}`);
    if (existingImg) {
      existingImg.remove();
    }

    // Create new image
    const img = document.createElement('img');
    img.id = `cap-${step}`;
    img.className = 'cap';
    img.src = dataUrl;
    img.alt = `Captured slice ${step}`;
    img.style.display = 'block';

    // Position based on current format
    const state = this.stateManager.getState();
    const { COLLAGE_LAYOUTS } = await import('../types/CollageTypes');
    const layout = COLLAGE_LAYOUTS[state.currentFormat];
    
    const sliceIndex = step - 1;
    const row = Math.floor(sliceIndex / layout.cols);
    const col = sliceIndex % layout.cols;
    
    const top = (row / layout.rows) * 100;
    const left = (col / layout.cols) * 100;
    const width = (100 / layout.cols);
    const height = (100 / layout.rows);
    
    img.style.position = 'absolute';
    img.style.top = `${top}%`;
    img.style.left = `${left}%`;
    img.style.width = `${width}%`;
    img.style.height = `${height}%`;
    img.style.objectFit = 'cover';

    capturedContainer.appendChild(img);
    this.capturedImages[step] = img;
  }

  private handleFormatToggle(): void {
    const state = this.stateManager.getState();
    const newFormat: CollageFormat = state.currentFormat === '2x1' ? '3x1' : '2x1';
    
    this.stateManager.updateState({ currentFormat: newFormat });
    this.updateMask();
    this.updateFormatToggleState(newFormat);
  }

  private updateFormatToggleState(format: CollageFormat): void {
    const toggle = document.getElementById('btnFormatToggle');
    const textElement = toggle?.querySelector('.toggle-text') as HTMLElement;
    
    if (toggle && textElement) {
      // Remove existing state classes
      toggle.classList.remove('state-2lines', 'state-3lines');
      
      // Add new state class
      if (format === '2x1') {
        toggle.classList.add('state-2lines');
        this.animateTextChange(textElement, '2 Linien');
      } else {
        toggle.classList.add('state-3lines');
        this.animateTextChange(textElement, '3 Linien');
      }
    }
  }

  private animateTextChange(textElement: HTMLElement, newText: string): void {
    // Add changing class for fade out
    textElement.classList.add('changing');
    
    setTimeout(() => {
      // Change text
      textElement.textContent = newText;
      
      // Remove changing class and add new class for fade in
      textElement.classList.remove('changing');
      textElement.classList.add('new');
      
      // Remove new class after animation
      setTimeout(() => {
        textElement.classList.remove('new');
      }, 300);
    }, 150);
  }

  private handleResultFilterSelect(): void {
    const state = this.stateManager.getState();
    this.filterSelector?.show(state.resultFilter, (filter: FilterType) => {
      this.stateManager.updateState({ resultFilter: filter });
      this.updateResultCanvas();
    });
  }

  private updateResultCanvas(): void {
    if (!this.resultCanvas) return;

    const state = this.stateManager.getState();
    const newCanvas = this.collageManager.applyResultFilter(state.resultFilter);
    
    if (newCanvas) {
      this.resultCanvas.width = newCanvas.width;
      this.resultCanvas.height = newCanvas.height;
      const ctx = this.resultCanvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(newCanvas, 0, 0);
      }
    }
  }

  destroy(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
    if (this.gestureHandler) {
      this.gestureHandler.destroy();
    }
    this.cameraManager.stopCamera();
    LoadingSpinner.hideAll();
    Toast.clear();
  }
}
