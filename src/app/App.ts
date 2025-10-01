import { CameraManager } from './managers/CameraManager';
import { CollageManager } from './managers/CollageManager';
import { UIManager } from './managers/UIManager';
import { StateManager } from './managers/StateManager';
import { MobileManager } from './mobile/MobileManager';

export class App {
  private cameraManager: CameraManager;
  private collageManager: CollageManager;
  private uiManager: UIManager;
  private stateManager: StateManager;
  private mobileManager: MobileManager;

  constructor() {
    this.stateManager = new StateManager();
    this.cameraManager = new CameraManager();
    this.collageManager = new CollageManager();
    this.uiManager = new UIManager(this.stateManager, this.cameraManager, this.collageManager);
    this.mobileManager = MobileManager.getInstance();
    
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      // Initialize mobile features first
      await this.mobileManager.initialize();
      
      // Then initialize UI
      await this.uiManager.initialize();
      
      console.log('GRIMZ App initialized successfully');
      console.log(`Platform: ${this.mobileManager.getPlatform()}`);
    } catch (error) {
      console.error('Failed to initialize app:', error);
      alert('App konnte nicht initialisiert werden');
    }
  }

  getMobileManager(): MobileManager {
    return this.mobileManager;
  }
}
