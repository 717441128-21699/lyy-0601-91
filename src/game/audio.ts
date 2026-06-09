export class AudioSystem {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private effectGain: GainNode | null = null;
  private source: AudioBufferSourceNode | null = null;
  private audioBuffer: AudioBuffer | null = null;
  private startTime: number = 0;
  private pausedAt: number = 0;
  private isPlaying: boolean = false;
  private hitSoundBuffer: AudioBuffer | null = null;

  constructor() {
    this.initAudioContext();
  }

  private initAudioContext(): void {
    if (typeof window !== 'undefined') {
      this.audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();

      this.masterGain = this.audioContext.createGain();
      this.musicGain = this.audioContext.createGain();
      this.effectGain = this.audioContext.createGain();

      this.musicGain.connect(this.masterGain);
      this.effectGain.connect(this.masterGain);
      this.masterGain.connect(this.audioContext.destination);

      this.generateHitSound();
    }
  }

  private async generateHitSound(): Promise<void> {
    if (!this.audioContext) return;

    const sampleRate = this.audioContext.sampleRate;
    const duration = 0.05;
    const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;
      const envelope = Math.exp(-t * 100);
      data[i] = Math.sin(2 * Math.PI * 800 * t) * envelope * 0.3;
    }

    this.hitSoundBuffer = buffer;
  }

  async loadAudio(url: string): Promise<void> {
    if (!this.audioContext) {
      this.initAudioContext();
    }

    if (!this.audioContext) return;

    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
  }

  loadAudioFromArrayBuffer(arrayBuffer: ArrayBuffer): Promise<void> {
    if (!this.audioContext) {
      this.initAudioContext();
    }

    if (!this.audioContext) return Promise.resolve();

    return this.audioContext.decodeAudioData(arrayBuffer).then((buffer) => {
      this.audioBuffer = buffer;
    });
  }

  play(offset: number = 0): void {
    if (!this.audioContext || !this.audioBuffer || !this.musicGain) return;

    if (this.isPlaying) {
      this.stop();
    }

    this.source = this.audioContext.createBufferSource();
    this.source.buffer = this.audioBuffer;
    this.source.connect(this.musicGain);

    const startOffset = offset / 1000;
    this.source.start(0, startOffset);
    this.startTime = this.audioContext.currentTime - startOffset;
    this.isPlaying = true;

    this.source.onended = () => {
      this.isPlaying = false;
    };
  }

  pause(): void {
    if (!this.isPlaying || !this.source || !this.audioContext) return;

    this.pausedAt = this.getCurrentTime();
    this.source.stop();
    this.source.disconnect();
    this.source = null;
    this.isPlaying = false;
  }

  resume(): void {
    if (this.isPlaying || !this.audioBuffer) return;

    this.play(this.pausedAt);
  }

  stop(): void {
    if (this.source) {
      try {
        this.source.stop();
      } catch (e) {
        // Ignore errors from already stopped sources
      }
      this.source.disconnect();
      this.source = null;
    }
    this.isPlaying = false;
    this.pausedAt = 0;
  }

  getCurrentTime(): number {
    if (!this.audioContext || !this.isPlaying) {
      return this.pausedAt;
    }
    return (this.audioContext.currentTime - this.startTime) * 1000;
  }

  getDuration(): number {
    return this.audioBuffer ? this.audioBuffer.duration * 1000 : 0;
  }

  playHitSound(): void {
    if (!this.audioContext || !this.hitSoundBuffer || !this.effectGain) return;

    const source = this.audioContext.createBufferSource();
    source.buffer = this.hitSoundBuffer;
    source.connect(this.effectGain);
    source.start();
  }

  playMissSound(): void {
    if (!this.audioContext || !this.effectGain) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(200, this.audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(50, this.audioContext.currentTime + 0.1);

    gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);

    oscillator.connect(gainNode);
    gainNode.connect(this.effectGain);

    oscillator.start();
    oscillator.stop(this.audioContext.currentTime + 0.1);
  }

  setMasterVolume(volume: number): void {
    if (this.masterGain) {
      this.masterGain.gain.value = volume;
    }
  }

  setMusicVolume(volume: number): void {
    if (this.musicGain) {
      this.musicGain.gain.value = volume;
    }
  }

  setEffectVolume(volume: number): void {
    if (this.effectGain) {
      this.effectGain.gain.value = volume;
    }
  }

  seek(time: number): void {
    if (this.isPlaying) {
      this.pause();
      this.pausedAt = time;
      this.resume();
    } else {
      this.pausedAt = time;
    }
  }

  getIsPlaying(): boolean {
    return this.isPlaying;
  }

  destroy(): void {
    this.stop();
    if (this.audioContext) {
      this.audioContext.close();
    }
  }
}

export const audioSystem = new AudioSystem();
