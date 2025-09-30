import { App } from './app/App';
import './styles/main.css';

// Mobile Viewport Fix
function setViewportHeight() {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
}

// Set viewport height on load and resize
window.addEventListener('load', setViewportHeight);
window.addEventListener('resize', setViewportHeight);
window.addEventListener('orientationchange', setViewportHeight);

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
  new App();
});
