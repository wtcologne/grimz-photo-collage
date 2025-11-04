import { CollageFormat } from '../types/CollageTypes';
import { FilterType } from '../types/FilterTypes';

export interface AppState {
  step: number;
  stream: MediaStream | null;
  baseWidth: number | null;
  baseHeight: number | null;
  parts: {
    [key: number]: HTMLCanvasElement | null;
  };
  isProcessing: boolean;
  currentFormat: CollageFormat;
  currentFilter: FilterType;
  resultFilter: FilterType; // Separate filter for finished collage
  showFormatSelector: boolean;
  showFilterSelector: boolean;
  showResultFilterSelector: boolean;
}

export class StateManager {
  private state: AppState = {
    step: 1,
    stream: null,
    baseWidth: null,
    baseHeight: null,
    parts: {},
    isProcessing: false,
    currentFormat: '2x1',
    currentFilter: 'none',
    resultFilter: 'none',
    showFormatSelector: false,
    showFilterSelector: false,
    showResultFilterSelector: false
  };

  private listeners: Array<(state: AppState) => void> = [];

  getState(): AppState {
    return { ...this.state };
  }

  updateState(updates: Partial<AppState>): void {
    this.state = { ...this.state, ...updates };
    this.notifyListeners();
  }

  reset(): void {
    this.state = {
      step: 1,
      stream: null,
      baseWidth: null,
      baseHeight: null,
      parts: {},
      isProcessing: false,
      currentFormat: '2x1',
      currentFilter: 'none',
      resultFilter: 'none',
      showFormatSelector: false,
      showFilterSelector: false,
      showResultFilterSelector: false
    };
    this.notifyListeners();
  }

  subscribe(listener: (state: AppState) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.state));
  }
}
