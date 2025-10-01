import { App } from './app/App';
import './styles/main.css';

// Mobile Viewport Fix
function setViewportHeight() {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
  
  // iPhone WebApp fix - use full screen height
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
  const isInWebApp = (window.navigator as any).standalone === true;
  
  if (isIOS && (isStandalone || isInWebApp)) {
    // For iPhone WebApp, use 100vh for full screen
    document.documentElement.style.setProperty('--vh', '1vh');
  }
  
  // Chrome detection and viewport scaling
  const isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
  const isMobile = window.innerWidth <= 768;
  
  if (isChrome) {
    // Chrome-specific viewport scaling to reduce image area
    const scaleFactor = isMobile ? 0.85 : 0.9; // Smaller scale for mobile Chrome, slightly smaller for desktop
    document.documentElement.style.setProperty('--chrome-scale', scaleFactor.toString());
    document.documentElement.style.setProperty('--chrome-padding', isMobile ? '20px' : '10px');
    
    // Add Chrome-specific class for CSS targeting
    document.body.classList.add(isMobile ? 'chrome-mobile' : 'chrome-desktop');
    
    // Apply scaling to the main app container
    const app = document.getElementById('app');
    if (app) {
      app.style.transform = `scale(${scaleFactor})`;
      app.style.transformOrigin = 'center center';
    }
  } else {
    document.documentElement.style.setProperty('--chrome-scale', '1');
    document.documentElement.style.setProperty('--chrome-padding', '0px');
    // Remove Chrome classes if not Chrome
    document.body.classList.remove('chrome-mobile', 'chrome-desktop');
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
