import { FilterType, FILTERS } from '../types/FilterTypes';

export class FilterSelector {
  private container: HTMLElement | null = null;
  private onFilterChange: ((filter: FilterType) => void) | null = null;

  create(): HTMLElement {
    const selector = document.createElement('div');
    selector.className = 'filter-selector';
    selector.innerHTML = `
      <div class="selector-header">
        <h3>Filter</h3>
        <button class="close-btn" aria-label="Schließen">×</button>
      </div>
      <div class="filter-grid">
        ${Object.values(FILTERS).map(filter => `
          <button class="filter-option" data-filter="${filter.type}">
            <div class="filter-icon">${filter.icon}</div>
            <div class="filter-name">${filter.name}</div>
            <div class="filter-desc">${filter.description}</div>
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
      .filter-selector .selector-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        color: var(--fg);
      }
      
      .filter-selector h3 {
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
      
      .filter-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
        gap: 15px;
        flex: 1;
        overflow-y: auto;
      }
      
      .filter-option {
        background: var(--card);
        border: 2px solid transparent;
        border-radius: 12px;
        padding: 20px;
        cursor: pointer;
        transition: all 0.2s ease;
        text-align: center;
        color: var(--fg);
        position: relative;
        overflow: hidden;
      }
      
      .filter-option:hover {
        border-color: var(--primary);
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(34, 197, 94, 0.2);
      }
      
      .filter-option.selected {
        border-color: var(--primary);
        background: linear-gradient(135deg, var(--primary), var(--secondary));
        color: #000;
      }
      
      .filter-option::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: var(--filter-preview);
        opacity: 0.3;
        transition: opacity 0.2s ease;
      }
      
      .filter-option:hover::before {
        opacity: 0.5;
      }
      
      .filter-option.selected::before {
        opacity: 0.1;
      }
      
      .filter-icon {
        font-size: 2rem;
        margin-bottom: 10px;
        position: relative;
        z-index: 1;
      }
      
      .filter-name {
        font-weight: 700;
        font-size: 1.1rem;
        margin-bottom: 5px;
        position: relative;
        z-index: 1;
      }
      
      .filter-desc {
        font-size: 0.9rem;
        opacity: 0.8;
        position: relative;
        z-index: 1;
      }
      
      @media (max-width: 768px) {
        .filter-grid {
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 10px;
        }
        
        .filter-option {
          padding: 15px;
        }
        
        .filter-icon {
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

    // Filter options
    const filterOptions = this.container.querySelectorAll('.filter-option');
    filterOptions.forEach(option => {
      option.addEventListener('click', () => {
        const filter = option.getAttribute('data-filter') as FilterType;
        if (filter && this.onFilterChange) {
          this.onFilterChange(filter);
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

  show(currentFilter: FilterType, onFilterChange: (filter: FilterType) => void): void {
    this.onFilterChange = onFilterChange;
    
    if (!this.container) {
      this.create();
    }

    // Update selected filter and preview styles
    const filterOptions = this.container!.querySelectorAll('.filter-option');
    filterOptions.forEach(option => {
      const filter = option.getAttribute('data-filter');
      const filterData = FILTERS[filter as FilterType];
      
      if (filter === currentFilter) {
        option.classList.add('selected');
      } else {
        option.classList.remove('selected');
      }
      
      // Set CSS filter preview
      if (filterData && filterData.cssFilter) {
        (option as HTMLElement).style.setProperty('--filter-preview', filterData.cssFilter);
      } else {
        (option as HTMLElement).style.removeProperty('--filter-preview');
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
    this.onFilterChange = null;
  }
}
