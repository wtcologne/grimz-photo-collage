/**
 * ViewportManager - Handles browser-specific viewport fixes and scaling
 * Consolidates Chrome workarounds, iOS fixes, and viewport height calculations
 */
export class ViewportManager {
  private static instance: ViewportManager;
  private isInitialized = false;

  static getInstance(): ViewportManager {
    if (!ViewportManager.instance) {
      ViewportManager.instance = new ViewportManager();
    }
    return ViewportManager.instance;
  }

  /**
   * Initialize viewport fixes and set up event listeners
   */
  initialize(): void {
    if (this.isInitialized) return;

    this.setViewportHeight();
    
    // Set viewport height on load and resize
    window.addEventListener('load', () => {
      this.setViewportHeight();
      // Chrome-specific delayed fixes
      setTimeout(() => this.setViewportHeight(), 100);
      setTimeout(() => this.setViewportHeight(), 500);
    });
    
    window.addEventListener('resize', () => this.setViewportHeight());
    window.addEventListener('orientationchange', () => this.setViewportHeight());

    this.isInitialized = true;
  }

  /**
   * Update viewport height and apply browser-specific fixes
   */
  setViewportHeight(): void {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);

    // iOS WebApp fix
    if (this.isIOSWebApp()) {
      document.documentElement.style.setProperty('--vh', '1vh');
    }

    // Chrome-specific fixes
    if (this.isChrome()) {
      this.applyChromeFixes();
    } else {
      this.removeChromeFixes();
    }
  }

  /**
   * Detect if running on iOS
   */
  isIOS(): boolean {
    return /iPad|iPhone|iPod/.test(navigator.userAgent);
  }

  /**
   * Detect if running as iOS WebApp
   */
  isIOSWebApp(): boolean {
    if (!this.isIOS()) return false;
    
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isInWebApp = (window.navigator as any).standalone === true;
    
    return isStandalone || isInWebApp;
  }

  /**
   * Detect if running in Chrome
   */
  isChrome(): boolean {
    return /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
  }

  /**
   * Check if device is mobile
   */
  isMobile(): boolean {
    return window.innerWidth <= 768;
  }

  /**
   * Get Chrome scale factor
   */
  getChromeScale(): number {
    if (!this.isChrome()) return 1;
    return this.isMobile() ? 0.75 : 0.9;
  }

  /**
   * Apply Chrome-specific viewport scaling
   */
  private applyChromeFixes(): void {
    const scaleFactor = this.getChromeScale();
    const isMobile = this.isMobile();

    document.documentElement.style.setProperty('--chrome-scale', scaleFactor.toString());
    document.documentElement.style.setProperty('--chrome-padding', isMobile ? '20px' : '10px');

    // Add Chrome-specific class for CSS targeting
    document.body.classList.remove('chrome-mobile', 'chrome-desktop');
    document.body.classList.add(isMobile ? 'chrome-mobile' : 'chrome-desktop');

    // Apply scaling to the main app container
    const app = document.getElementById('app');
    if (app) {
      app.style.transform = `scale(${scaleFactor})`;
      app.style.transformOrigin = 'center center';
    }
  }

  /**
   * Remove Chrome-specific fixes
   */
  private removeChromeFixes(): void {
    document.documentElement.style.setProperty('--chrome-scale', '1');
    document.documentElement.style.setProperty('--chrome-padding', '0px');
    document.body.classList.remove('chrome-mobile', 'chrome-desktop');

    const app = document.getElementById('app');
    if (app) {
      app.style.transform = '';
      app.style.transformOrigin = '';
    }
  }

  /**
   * Get viewport dimensions with Chrome scaling applied
   */
  getViewportDimensions(): { width: number; height: number } {
    const scale = this.getChromeScale();
    return {
      width: window.innerWidth,
      height: Math.floor(window.innerHeight * scale)
    };
  }
}

