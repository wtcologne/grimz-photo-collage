export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastOptions {
  type: ToastType;
  message: string;
  duration?: number;
  position?: 'top' | 'bottom';
}

export class Toast {
  private static container: HTMLElement | null = null;
  private static toasts: Map<string, HTMLElement> = new Map();
  private static toastId = 0;

  static init(): void {
    if (this.container) return;

    this.container = document.createElement('div');
    this.container.className = 'toast-container';
    this.container.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
      display: flex;
      flex-direction: column;
      gap: 10px;
      pointer-events: none;
    `;
    document.body.appendChild(this.container);
  }

  static show(options: ToastOptions): string {
    this.init();
    
    const id = `toast-${++this.toastId}`;
    const toast = document.createElement('div');
    toast.className = `toast toast-${options.type}`;
    toast.id = id;
    
    const duration = options.duration || (options.type === 'error' ? 5000 : 3000);
    
    toast.innerHTML = `
      <div class="toast-content">
        <div class="toast-icon">${this.getIcon(options.type)}</div>
        <div class="toast-message">${options.message}</div>
        <button class="toast-close" aria-label="Schließen">×</button>
      </div>
    `;

    // Styles
    toast.style.cssText = `
      background: ${this.getBackgroundColor(options.type)};
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      transform: translateX(100%);
      transition: transform 0.3s ease, opacity 0.3s ease;
      pointer-events: auto;
      max-width: 300px;
      word-wrap: break-word;
    `;

    this.container!.appendChild(toast);
    this.toasts.set(id, toast);

    // Animate in
    requestAnimationFrame(() => {
      toast.style.transform = 'translateX(0)';
    });

    // Auto remove
    const timeout = setTimeout(() => {
      this.remove(id);
    }, duration);

    // Close button
    const closeBtn = toast.querySelector('.toast-close') as HTMLButtonElement;
    closeBtn.addEventListener('click', () => {
      clearTimeout(timeout);
      this.remove(id);
    });

    return id;
  }

  static remove(id: string): void {
    const toast = this.toasts.get(id);
    if (!toast) return;

    toast.style.transform = 'translateX(100%)';
    toast.style.opacity = '0';
    
    setTimeout(() => {
      toast.remove();
      this.toasts.delete(id);
    }, 300);
  }

  static clear(): void {
    this.toasts.forEach((_, id) => this.remove(id));
  }

  private static getIcon(type: ToastType): string {
    const icons = {
      success: '✓',
      error: '✕',
      info: 'ℹ',
      warning: '⚠'
    };
    return icons[type];
  }

  private static getBackgroundColor(type: ToastType): string {
    const colors = {
      success: 'linear-gradient(135deg, #22c55e, #16a34a)',
      error: 'linear-gradient(135deg, #ef4444, #dc2626)',
      info: 'linear-gradient(135deg, #3b82f6, #2563eb)',
      warning: 'linear-gradient(135deg, #f59e0b, #d97706)'
    };
    return colors[type];
  }
}
