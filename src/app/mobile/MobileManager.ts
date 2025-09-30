import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

export class MobileManager {
  private static instance: MobileManager;
  private isInitialized = false;

  static getInstance(): MobileManager {
    if (!MobileManager.instance) {
      MobileManager.instance = new MobileManager();
    }
    return MobileManager.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Only run on native platforms
      if (Capacitor.isNativePlatform()) {
        await this.setupStatusBar();
        await this.setupSplashScreen();
        await this.setupHaptics();
      }
      
      this.isInitialized = true;
      console.log('MobileManager initialized');
    } catch (error) {
      console.error('Failed to initialize MobileManager:', error);
    }
  }

  private async setupStatusBar(): Promise<void> {
    try {
      await StatusBar.setStyle({ style: Style.Dark });
      await StatusBar.setBackgroundColor({ color: '#000000' });
    } catch (error) {
      console.warn('StatusBar setup failed:', error);
    }
  }

  private async setupSplashScreen(): Promise<void> {
    try {
      await SplashScreen.hide();
    } catch (error) {
      console.warn('SplashScreen setup failed:', error);
    }
  }

  private async setupHaptics(): Promise<void> {
    // Haptics are ready to use
    console.log('Haptics initialized');
  }

  async vibrate(style: ImpactStyle = ImpactStyle.Medium): Promise<void> {
    try {
      if (Capacitor.isNativePlatform()) {
        await Haptics.impact({ style });
      }
    } catch (error) {
      console.warn('Haptic feedback failed:', error);
    }
  }

  async vibrateSuccess(): Promise<void> {
    await this.vibrate(ImpactStyle.Light);
  }

  async vibrateError(): Promise<void> {
    await this.vibrate(ImpactStyle.Heavy);
  }

  async vibrateCapture(): Promise<void> {
    await this.vibrate(ImpactStyle.Medium);
  }

  isMobile(): boolean {
    return Capacitor.isNativePlatform();
  }

  getPlatform(): string {
    return Capacitor.getPlatform();
  }
}
