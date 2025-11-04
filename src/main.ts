import { App } from './app/App';
import './styles/main.css';
import { ViewportManager } from './app/utils/ViewportManager';

// Initialize viewport fixes
const viewportManager = ViewportManager.getInstance();
viewportManager.initialize();

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
  new App();
});
