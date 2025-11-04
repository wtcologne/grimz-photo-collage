import { StateManager, AppState } from './StateManager';
import { CameraManager } from './CameraManager';
import { CollageManager } from './CollageManager';
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
  private btnUndo: HTMLButtonElement | null = null;
  private btnCameraSwitch: HTMLButtonElement | null = null;

  // Control containers
  private controlsLive: HTMLElement | null = null;
  private controlsResult: HTMLElement | null = null;

  // Gesture handling
  private gestureHandler: GestureHandler | null = null;

  // Selectors
  private filterSelector: FilterSelector | null = null;

  constructor(stateManager: StateManager, cameraManager: CameraManager, collageManager: CollageManager) {
    this.stateManager = stateManager;
    this.cameraManager = cameraManager;
    this.collageManager = collageManager;
  }

  async initialize(): Promise<void> {
    this.createUI();
    this.bindElements();
    this.setupEventListeners();
    this.setupStateSubscription();
    
    // Initialize managers
    this.cameraManager.setStateManager(this.stateManager);
    this.collageManager.setStateManager(this.stateManager);
    
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
      this.showError(error instanceof Error ? error.message : 'Kamera-Fehler');
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

      <div id="controlsLive" class="controls">
        <button id="btnFormatToggle" class="format-toggle-inline">
          <span class="toggle-text">2 Linien</span>
        </button>
        <button id="btnUndo" class="ghost" disabled style="display: none;">Zurück</button>
        <button id="btnCameraSwitch" class="camera-switch-bottom" aria-label="Kamera wechseln" title="Kamera wechseln">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
            <circle cx="12" cy="13" r="3"/>
          </svg>
        </button>
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
        this.btnUndo = document.getElementById('btnUndo') as HTMLButtonElement;
        this.btnCameraSwitch = document.getElementById('btnCameraSwitch') as HTMLButtonElement;

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
    this.btnUndo?.addEventListener('click', () => this.handleUndo());
    this.btnCameraSwitch?.addEventListener('click', () => this.handleCameraSwitch());

    // Format toggle - simple toggle between 2x1 and 3x1
    document.getElementById('btnFormatToggle')?.addEventListener('click', () => {
      this.handleFormatToggle().catch(err => {
        console.error('Format toggle error:', err);
        this.showError('Format-Änderung fehlgeschlagen');
      });
    });
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

    // Update undo button visibility and state
    if (this.btnUndo) {
      const hasCapturedParts = Object.keys(state.parts).length > 0;
      const canUndo = state.step > 1 && hasCapturedParts;
      
      if (canUndo) {
        this.btnUndo.style.display = 'block';
        this.btnUndo.disabled = state.isProcessing;
      } else {
        this.btnUndo.style.display = 'none';
      }
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
    
    // Update toggle state classes
    if (toggleBtn) {
      toggleBtn.classList.remove('state-2lines', 'state-3lines');
      if (state.currentFormat === '2x1') {
        toggleBtn.classList.add('state-2lines');
      } else {
        toggleBtn.classList.add('state-3lines');
      }
    }
  }


  private async handleCapture(): Promise<void> {
    const state = this.stateManager.getState();
    if (state.isProcessing) return;

    try {
      // Haptic feedback for capture
      MobileManager.getInstance().vibrateCapture();
      
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
      this.showError(error instanceof Error ? error.message : 'Aufnahme-Fehler');
    } finally {
      this.stateManager.updateState({ isProcessing: false });
    }
  }

  private async assembleAndShowResult(): Promise<void> {
    const collage = this.collageManager.assembleCollage();
    if (!collage) {
      throw new Error('Collage assembly failed');
    }

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
      this.showError(error instanceof Error ? error.message : 'Speichern-Fehler');
    }
  }

  private async handleUndo(): Promise<void> {
    const state = this.stateManager.getState();
    // Can only undo if we have at least one captured part and are beyond step 1
    if (state.step <= 1 || state.isProcessing || Object.keys(state.parts).length === 0) return;

    try {
      // Haptic feedback
      MobileManager.getInstance().vibrateCapture();
      
      // Find the highest step number that was captured (the last one)
      const capturedSteps = Object.keys(state.parts)
        .map(key => parseInt(key))
        .filter(step => state.parts[step] !== null)
        .sort((a, b) => b - a); // Sort descending to get highest first
      
      if (capturedSteps.length === 0) return;
      
      // Remove the last captured slice (highest step number)
      const stepToRemove = capturedSteps[0];
      const previousStep = stepToRemove - 1;
      
      // Remove the captured image for the step we're removing
      if (this.capturedImages[stepToRemove]) {
        const img = this.capturedImages[stepToRemove];
        if (img.parentNode) {
          img.parentNode.removeChild(img);
        }
        delete this.capturedImages[stepToRemove];
      }

      // Remove the part from state
      const newParts = { ...state.parts };
      delete newParts[stepToRemove as keyof typeof newParts];

      // Update state - go back to the step after the last remaining captured step
      // If we removed step 3, we should be at step 3 (ready to capture step 3 again)
      // But if we removed step 2 and step 1 exists, we should be at step 2
      const remainingSteps = Object.keys(newParts)
        .map(key => parseInt(key))
        .filter(step => newParts[step] !== null)
        .sort((a, b) => b - a);
      
      const newStep = remainingSteps.length > 0 
        ? remainingSteps[0] + 1  // Next step after the highest remaining step
        : 1; // If no steps remain, go back to step 1

      this.stateManager.updateState({
        step: newStep,
        parts: newParts
      });

      // Update mask to show current step
      this.updateMask();

      this.showToast('info', 'Schritt rückgängig gemacht');
    } catch (error) {
      this.showError(error instanceof Error ? error.message : 'Undo-Fehler');
    }
  }

  private async handleCameraSwitch(): Promise<void> {
    const state = this.stateManager.getState();
    if (state.isProcessing) return;

    try {
      LoadingSpinner.show('camera', 'Kamera wird gewechselt...');
      await this.cameraManager.switchCamera();
      LoadingSpinner.hide('camera');
      
      // Haptic feedback
      MobileManager.getInstance().vibrateSuccess();
      
      const facingMode = this.cameraManager.getCurrentFacingMode();
      const modeText = facingMode === 'user' ? 'Frontkamera' : 'Rückkamera';
      this.showToast('success', `${modeText} aktiviert`);
    } catch (error) {
      LoadingSpinner.hide('camera');
      this.showError(error instanceof Error ? error.message : 'Kamera-Wechsel fehlgeschlagen');
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

  private showError(message: string): void {
    // Haptic feedback for errors
    MobileManager.getInstance().vibrateError();
    
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

  private async handleFormatToggle(): Promise<void> {
    const state = this.stateManager.getState();
    const newFormat: CollageFormat = state.currentFormat === '2x1' ? '3x1' : '2x1';
    
    // If format hasn't changed, do nothing
    if (state.currentFormat === newFormat) return;

    // If there are captured parts, reset everything (start from beginning)
    if (Object.keys(state.parts).length > 0) {
      // Reset all captured images
      Object.values(this.capturedImages).forEach(img => {
        if (img && img.parentNode) {
          img.parentNode.removeChild(img);
        }
      });
      this.capturedImages = {};

      // Reset state - start from beginning with new format
      this.stateManager.updateState({
        currentFormat: newFormat,
        parts: {},
        step: 1,
        baseWidth: null,
        baseHeight: null
      });

      // Update mask for new format
      this.updateMask();

      // Update format toggle UI
      this.updateFormatToggleState(newFormat);

      this.showToast('info', 'Format geändert - Aufnahme von vorne begonnen');
    } else {
      // No captured parts yet, just change format
      this.stateManager.updateState({
        currentFormat: newFormat
      });

      // Update format toggle UI
      this.updateFormatToggleState(newFormat);

      // Update mask for new format
      this.updateMask();
    }
  }

  private async updateCapturedImagesDisplay(format: CollageFormat, parts: { [key: number]: HTMLCanvasElement | null }): Promise<void> {
    const capturedContainer = document.getElementById('captured');
    if (!capturedContainer) return;

    // Remove all existing captured images
    Object.keys(this.capturedImages).forEach(key => {
      const img = this.capturedImages[parseInt(key)];
      if (img && img.parentNode) {
        img.parentNode.removeChild(img);
      }
    });
    this.capturedImages = {};

    // Re-add captured images based on new format
    const { COLLAGE_LAYOUTS } = await import('../types/CollageTypes');
    const layout = COLLAGE_LAYOUTS[format];

    for (const key of Object.keys(parts)) {
      const step = parseInt(key);
      const part = parts[step];
      if (part) {
        const dataUrl = part.toDataURL('image/jpeg', 0.92);
        try {
          await this.createCapturedImage(step, dataUrl);
        } catch (err) {
          console.error('Failed to update captured image:', err);
        }
      }
    }
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
