import { CollageFormat, COLLAGE_LAYOUTS } from '../types/CollageTypes';

export class FormatSelector {
  private container: HTMLElement | null = null;
  private onFormatChange: ((format: CollageFormat) => void) | null = null;

  create(): HTMLElement {
    const selector = document.createElement('div');
    selector.className = 'format-selector';
    selector.innerHTML = `
      <div class="selector-header">
        <h3>Collage-Format</h3>
        <button class="close-btn" aria-label="Schließen">×</button>
      </div>
      <div class="format-grid">
        ${Object.values(COLLAGE_LAYOUTS).map(layout => `
          <button class="format-option" data-format="${layout.format}">
            <div class="format-icon">${layout.icon}</div>
            <div class="format-name">${layout.name}</div>
            <div class="format-desc">${layout.description}</div>
          </button>
        `).join('')}
      </div>
    `;

    // Styles
    selector.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(11, 16, 32, 0.95);
      backdrop-filter: blur(10px);
      z-index: 1000;
      display: flex;
      flex-direction: column;
      padding: 20px;
      animation: fadeInUp 0.3s ease-out;
    `;

    const style = document.createElement('style');
    style.textContent = `
      .format-selector .selector-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        color: var(--fg);
      }
      
      .format-selector h3 {
        margin: 0;
        font-size: 1.5rem;
        font-weight: 700;
      }
      
      .close-btn {
        background: none;
        border: none;
        color: var(--fg);
        font-size: 2rem;
        cursor: pointer;
        padding: 0;
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: background-color 0.2s ease;
      }
      
      .close-btn:hover {
        background-color: rgba(255, 255, 255, 0.1);
      }
      
      .format-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 15px;
        flex: 1;
        overflow-y: auto;
      }
      
      .format-option {
        background: var(--card);
        border: 2px solid transparent;
        border-radius: 12px;
        padding: 20px;
        cursor: pointer;
        transition: all 0.2s ease;
        text-align: center;
        color: var(--fg);
      }
      
      .format-option:hover {
        border-color: var(--primary);
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(34, 197, 94, 0.2);
      }
      
      .format-option.selected {
        border-color: var(--primary);
        background: linear-gradient(135deg, var(--primary), var(--secondary));
        color: #000;
      }
      
      .format-icon {
        font-size: 2rem;
        margin-bottom: 10px;
        white-space: pre-line;
        line-height: 1.2;
      }
      
      .format-name {
        font-weight: 700;
        font-size: 1.1rem;
        margin-bottom: 5px;
      }
      
      .format-desc {
        font-size: 0.9rem;
        opacity: 0.8;
      }
      
      @media (max-width: 768px) {
        .format-grid {
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 10px;
        }
        
        .format-option {
          padding: 15px;
        }
        
        .format-icon {
          font-size: 1.5rem;
        }
      }
    `;
    document.head.appendChild(style);

    this.container = selector;
    this.setupEventListeners();
    return selector;
  }

  private setupEventListeners(): void {
    if (!this.container) return;

    // Close button
    const closeBtn = this.container.querySelector('.close-btn');
    closeBtn?.addEventListener('click', () => {
      this.hide();
    });

    // Format options
    const formatOptions = this.container.querySelectorAll('.format-option');
    formatOptions.forEach(option => {
      option.addEventListener('click', () => {
        const format = option.getAttribute('data-format') as CollageFormat;
        if (format && this.onFormatChange) {
          this.onFormatChange(format);
          this.hide();
        }
      });
    });

    // Close on backdrop click
    this.container.addEventListener('click', (e) => {
      if (e.target === this.container) {
        this.hide();
      }
    });
  }

  show(currentFormat: CollageFormat, onFormatChange: (format: CollageFormat) => void): void {
    this.onFormatChange = onFormatChange;
    
    if (!this.container) {
      this.create();
    }

    // Update selected format
    const formatOptions = this.container!.querySelectorAll('.format-option');
    formatOptions.forEach(option => {
      const format = option.getAttribute('data-format');
      if (format === currentFormat) {
        option.classList.add('selected');
      } else {
        option.classList.remove('selected');
      }
    });

    document.body.appendChild(this.container!);
  }

  hide(): void {
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
  }

  destroy(): void {
    this.hide();
    this.container = null;
    this.onFormatChange = null;
  }
}
