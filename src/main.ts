import { App } from './app/App';
import './styles/main.css';

// Mobile Viewport Fix
function setViewportHeight() {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
  
  // Chrome mobile fix - add extra padding for browser UI
  const isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
  const isMobile = window.innerWidth <= 768;
  
  if (isChrome && isMobile) {
    document.documentElement.style.setProperty('--chrome-padding', '20px');
  } else {
    document.documentElement.style.setProperty('--chrome-padding', '0px');
  }
}

// Set viewport height on load and resize
window.addEventListener('load', setViewportHeight);
window.addEventListener('resize', setViewportHeight);
window.addEventListener('orientationchange', setViewportHeight);

// Chrome-specific fixes
window.addEventListener('load', () => {
  // Force viewport update after a short delay for Chrome
  setTimeout(setViewportHeight, 100);
  setTimeout(setViewportHeight, 500);
});

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
  new App();
});
