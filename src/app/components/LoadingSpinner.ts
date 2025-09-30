export class LoadingSpinner {
  private static activeSpinners: Set<string> = new Set();

  static show(id: string = 'default', message: string = 'Lädt...'): void {
    if (this.activeSpinners.has(id)) return;

    this.activeSpinners.add(id);
    
    const spinner = document.createElement('div');
    spinner.className = 'loading-spinner';
    spinner.id = `spinner-${id}`;
    spinner.innerHTML = `
      <div class="spinner-content">
        <div class="spinner-icon">
          <div class="spinner-ring"></div>
        </div>
        <div class="spinner-message">${message}</div>
      </div>
    `;

    spinner.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(11, 16, 32, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      backdrop-filter: blur(4px);
    `;

    document.body.appendChild(spinner);

    // Animate in
    requestAnimationFrame(() => {
      spinner.style.opacity = '1';
    });
  }

  static hide(id: string = 'default'): void {
    if (!this.activeSpinners.has(id)) return;

    const spinner = document.getElementById(`spinner-${id}`);
    if (spinner) {
      spinner.style.opacity = '0';
      setTimeout(() => {
        spinner.remove();
        this.activeSpinners.delete(id);
      }, 300);
    }
  }

  static hideAll(): void {
    this.activeSpinners.forEach(id => this.hide(id));
  }
}
