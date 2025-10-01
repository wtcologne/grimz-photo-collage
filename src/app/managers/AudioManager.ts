export class AudioManager {
  private audioContext: AudioContext | null = null;
  private isInitialized = false;

  constructor() {
    this.initAudioContext();
  }

  private async initAudioContext(): Promise<void> {
    try {
      // Create audio context
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.isInitialized = true;
    } catch (error) {
      console.warn('Audio not supported:', error);
      this.isInitialized = false;
    }
  }

  private async ensureAudioContext(): Promise<boolean> {
    if (!this.audioContext) {
      await this.initAudioContext();
    }

    if (this.audioContext?.state === 'suspended') {
      await this.audioContext.resume();
    }

    return this.isInitialized && this.audioContext !== null;
  }

  async playShutterSound(): Promise<void> {
    if (!(await this.ensureAudioContext())) {
      return;
    }

    const ctx = this.audioContext!;
    const duration = 0.15; // 150ms
    const sampleRate = ctx.sampleRate;
    const bufferLength = Math.floor(duration * sampleRate);
    
    // Create buffer
    const buffer = ctx.createBuffer(1, bufferLength, sampleRate);
    const data = buffer.getChannelData(0);

    // Generate realistic camera shutter sound
    for (let i = 0; i < bufferLength; i++) {
      const t = i / sampleRate;
      
      // Main click sound (high frequency burst)
      let click = 0;
      if (t < 0.01) {
        click = Math.sin(2 * Math.PI * 8000 * t) * Math.exp(-t * 200);
      }
      
      // Mechanical sound (lower frequency)
      let mechanical = 0;
      if (t < 0.05) {
        mechanical = Math.sin(2 * Math.PI * 200 * t) * Math.exp(-t * 30) * 0.3;
      }
      
      // Shutter blade sound (very short burst)
      let shutter = 0;
      if (t > 0.02 && t < 0.04) {
        shutter = (Math.random() - 0.5) * Math.exp(-(t - 0.02) * 50) * 0.2;
      }
      
      // Combine all sounds
      data[i] = (click + mechanical + shutter) * 0.4;
    }

    // Play the sound
    const source = ctx.createBufferSource();
    const gainNode = ctx.createGain();
    
    source.buffer = buffer;
    source.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    // Add slight fade out
    gainNode.gain.setValueAtTime(0.8, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
    
    source.start(ctx.currentTime);
  }

  async playSuccessSound(): Promise<void> {
    if (!(await this.ensureAudioContext())) {
      return;
    }

    const ctx = this.audioContext!;
    const duration = 0.3;
    const sampleRate = ctx.sampleRate;
    const bufferLength = Math.floor(duration * sampleRate);
    
    const buffer = ctx.createBuffer(1, bufferLength, sampleRate);
    const data = buffer.getChannelData(0);

    // Generate pleasant success chime
    for (let i = 0; i < bufferLength; i++) {
      const t = i / sampleRate;
      
      // Two-tone chime
      const tone1 = Math.sin(2 * Math.PI * 800 * t) * Math.exp(-t * 8);
      const tone2 = Math.sin(2 * Math.PI * 1000 * t) * Math.exp(-t * 6);
      
      data[i] = (tone1 + tone2) * 0.3;
    }

    const source = ctx.createBufferSource();
    const gainNode = ctx.createGain();
    
    source.buffer = buffer;
    source.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    gainNode.gain.setValueAtTime(0.6, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
    
    source.start(ctx.currentTime);
  }

  async playErrorSound(): Promise<void> {
    if (!(await this.ensureAudioContext())) {
      return;
    }

    const ctx = this.audioContext!;
    const duration = 0.2;
    const sampleRate = ctx.sampleRate;
    const bufferLength = Math.floor(duration * sampleRate);
    
    const buffer = ctx.createBuffer(1, bufferLength, sampleRate);
    const data = buffer.getChannelData(0);

    // Generate error buzz
    for (let i = 0; i < bufferLength; i++) {
      const t = i / sampleRate;
      
      // Low frequency buzz
      const buzz = Math.sin(2 * Math.PI * 150 * t) * Math.exp(-t * 10);
      
      data[i] = buzz * 0.4;
    }

    const source = ctx.createBufferSource();
    const gainNode = ctx.createGain();
    
    source.buffer = buffer;
    source.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    gainNode.gain.setValueAtTime(0.5, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
    
    source.start(ctx.currentTime);
  }

  // Method to enable audio (required for user interaction)
  async enableAudio(): Promise<boolean> {
    if (!this.audioContext) {
      await this.initAudioContext();
    }
    
    if (this.audioContext?.state === 'suspended') {
      await this.audioContext.resume();
    }
    
    return this.isInitialized;
  }

  // Check if audio is available
  isAudioAvailable(): boolean {
    return this.isInitialized && this.audioContext !== null;
  }
}
