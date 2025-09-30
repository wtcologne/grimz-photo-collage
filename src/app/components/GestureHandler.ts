export interface GestureEvent {
  type: 'tap' | 'double-tap' | 'long-press' | 'swipe-left' | 'swipe-right' | 'swipe-up' | 'swipe-down';
  x: number;
  y: number;
  target: EventTarget | null;
}

export class GestureHandler {
  private element: HTMLElement;
  private callbacks: Map<string, ((event: GestureEvent) => void)[]> = new Map();
  
  private touchStartTime = 0;
  private touchStartX = 0;
  private touchStartY = 0;
  private longPressTimer: number | null = null;
  private lastTapTime = 0;

  constructor(element: HTMLElement) {
    this.element = element;
    this.setupEventListeners();
  }

  on(gesture: string, callback: (event: GestureEvent) => void): void {
    if (!this.callbacks.has(gesture)) {
      this.callbacks.set(gesture, []);
    }
    this.callbacks.get(gesture)!.push(callback);
  }

  off(gesture: string, callback: (event: GestureEvent) => void): void {
    const callbacks = this.callbacks.get(gesture);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  private setupEventListeners(): void {
    this.element.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
    this.element.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
    this.element.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
    this.element.addEventListener('touchcancel', this.handleTouchCancel.bind(this), { passive: false });
  }

  private handleTouchStart(event: TouchEvent): void {
    const touch = event.touches[0];
    this.touchStartTime = Date.now();
    this.touchStartX = touch.clientX;
    this.touchStartY = touch.clientY;

    // Long press detection
    this.longPressTimer = window.setTimeout(() => {
      this.triggerGesture('long-press', touch.clientX, touch.clientY, event.target);
    }, 500);
  }

  private handleTouchEnd(event: TouchEvent): void {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }

    const touch = event.changedTouches[0];
    const touchDuration = Date.now() - this.touchStartTime;
    const deltaX = touch.clientX - this.touchStartX;
    const deltaY = touch.clientY - this.touchStartY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    // Only process if it's a short touch and didn't move much
    if (touchDuration < 300 && distance < 10) {
      const currentTime = Date.now();
      const timeSinceLastTap = currentTime - this.lastTapTime;
      
      if (timeSinceLastTap < 300) {
        // Double tap
        this.triggerGesture('double-tap', touch.clientX, touch.clientY, event.target);
      } else {
        // Single tap
        this.triggerGesture('tap', touch.clientX, touch.clientY, event.target);
      }
      
      this.lastTapTime = currentTime;
    } else if (distance > 30) {
      // Swipe detection
      const absDeltaX = Math.abs(deltaX);
      const absDeltaY = Math.abs(deltaY);
      
      if (absDeltaX > absDeltaY) {
        // Horizontal swipe
        if (deltaX > 0) {
          this.triggerGesture('swipe-right', touch.clientX, touch.clientY, event.target);
        } else {
          this.triggerGesture('swipe-left', touch.clientX, touch.clientY, event.target);
        }
      } else {
        // Vertical swipe
        if (deltaY > 0) {
          this.triggerGesture('swipe-down', touch.clientX, touch.clientY, event.target);
        } else {
          this.triggerGesture('swipe-up', touch.clientX, touch.clientY, event.target);
        }
      }
    }
  }

  private handleTouchMove(_event: TouchEvent): void {
    // Cancel long press if user moves finger
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
  }

  private handleTouchCancel(_event: TouchEvent): void {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
  }

  private triggerGesture(type: string, x: number, y: number, target: EventTarget | null): void {
    const callbacks = this.callbacks.get(type);
    if (callbacks) {
      const gestureEvent: GestureEvent = {
        type: type as any,
        x,
        y,
        target
      };
      
      callbacks.forEach(callback => {
        try {
          callback(gestureEvent);
        } catch (error) {
          console.error('Gesture callback error:', error);
        }
      });
    }
  }

  destroy(): void {
    this.element.removeEventListener('touchstart', this.handleTouchStart.bind(this));
    this.element.removeEventListener('touchend', this.handleTouchEnd.bind(this));
    this.element.removeEventListener('touchmove', this.handleTouchMove.bind(this));
    this.element.removeEventListener('touchcancel', this.handleTouchCancel.bind(this));
    this.callbacks.clear();
  }
}
