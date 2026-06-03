/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

class SoundManager {
  private ctx: AudioContext | null = null;
  private soundEnabled: boolean = true;
  private musicEnabled: boolean = true;
  
  // For background music loop
  private musicInterval: number | null = null;
  private loopIndex: number = 0;
  private musicGainNode: GainNode | null = null;

  constructor() {
    // AudioContext will be initialized on first user interaction
  }

  private initContext() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioContextClass();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public setConfig(sound: boolean, music: boolean) {
    this.soundEnabled = sound;
    this.musicEnabled = music;
    
    if (!this.musicEnabled) {
      this.stopMusic();
    } else {
      this.startMusic();
    }
  }

  // --- Sound Effects ---

  public playClick() {
    if (!this.soundEnabled) return;
    const ctx = this.initContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1000, ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

    osc.start();
    osc.stop(ctx.currentTime + 0.08);
  }

  public playScoreFeed() {
    if (!this.soundEnabled) return;
    const ctx = this.initContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'sine';
    // Arpeggio sound
    const now = ctx.currentTime;
    osc.frequency.setValueAtTime(523.25, now); // C5
    osc.frequency.setValueAtTime(659.25, now + 0.05); // E5
    osc.frequency.setValueAtTime(783.99, now + 0.1); // G5

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.linearRampToValueAtTime(0.08, now + 0.12);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc.start();
    osc.stop(now + 0.25);
  }

  public playScoreGem() {
    if (!this.soundEnabled) return;
    const ctx = this.initContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'sine';
    const now = ctx.currentTime;
    osc.frequency.setValueAtTime(987.77, now); // B5
    osc.frequency.exponentialRampToValueAtTime(1567.98, now + 0.12); // G6

    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.start();
    osc.stop(now + 0.25);
  }

  public playCluck() {
    if (!this.soundEnabled) return;
    const ctx = this.initContext();
    const now = ctx.currentTime;

    // A chicken cluck consists of a brief high-pitched, vibrating chirp
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.linearRampToValueAtTime(450, now + 0.03);
    osc.frequency.linearRampToValueAtTime(320, now + 0.08);

    // Apply lowpass filter to make it warmer/nature-like
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1500, now);

    osc.disconnect(gain);
    osc.connect(filter);
    filter.connect(gain);

    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.start();
    osc.stop(now + 0.12);
  }

  public playJump() {
    if (!this.soundEnabled) return;
    const ctx = this.initContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'triangle';
    const now = ctx.currentTime;
    osc.frequency.setValueAtTime(250, now);
    osc.frequency.exponentialRampToValueAtTime(650, now + 0.16);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.start();
    osc.stop(now + 0.18);
  }

  public playSlide() {
    if (!this.soundEnabled) return;
    const ctx = this.initContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'sine';
    const now = ctx.currentTime;
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.2);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc.start();
    osc.stop(now + 0.22);
  }

  public playPowerUp() {
    if (!this.soundEnabled) return;
    const ctx = this.initContext();
    const now = ctx.currentTime;

    // Upward space chime
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(329.63, now); // E4
    osc1.frequency.exponentialRampToValueAtTime(1318.51, now + 0.4);

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(392.00, now + 0.05); // G4
    osc2.frequency.exponentialRampToValueAtTime(1567.98, now + 0.45);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    osc1.start();
    osc2.start();
    osc1.stop(now + 0.5);
    osc2.stop(now + 0.5);
  }

  public playHit() {
    if (!this.soundEnabled) return;
    const ctx = this.initContext();
    const now = ctx.currentTime;

    // Noise crash using noise-like buffer
    const bufferSize = ctx.sampleRate * 0.4;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noiseNode = ctx.createBufferSource();
    noiseNode.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, now);
    filter.frequency.exponentialRampToValueAtTime(60, now + 0.35);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    noiseNode.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    // Add a thumb oscillator for impact
    const subOsc = ctx.createOscillator();
    const subGain = ctx.createGain();
    subOsc.frequency.setValueAtTime(130, now);
    subOsc.frequency.exponentialRampToValueAtTime(40, now + 0.2);
    subGain.gain.setValueAtTime(0.3, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    subOsc.connect(subGain);
    subGain.connect(ctx.destination);

    noiseNode.start();
    subOsc.start();
    noiseNode.stop(now + 0.4);
    subOsc.stop(now + 0.2);
  }

  public playLevelUp() {
    if (!this.soundEnabled) return;
    const ctx = this.initContext();
    const now = ctx.currentTime;

    const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50]; // C major chords
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      gain.gain.setValueAtTime(0.08, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.3);

      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.3);
    });
  }

  // --- Background Procedural Music Loop ---

  public startMusic() {
    if (!this.musicEnabled) return;
    if (this.musicInterval) return; // Already running

    const ctx = this.initContext();
    this.musicGainNode = ctx.createGain();
    this.musicGainNode.gain.setValueAtTime(0.025, ctx.currentTime);
    this.musicGainNode.connect(ctx.destination);

    this.loopIndex = 0;
    
    // A simple, upbeat 130 BPM chicken tech-farm chiptune beat:
    // 0.23 seconds per eighth-note at 130 BPM
    const delay = 230;

    // Sound sequence loops: C major or G pentatonic notes
    const melody = [
      440.00, 0, 440.00, 523.25, 0, 440.00, 392.00, 0,
      392.00, 0, 392.00, 440.00, 523.25, 587.33, 659.25, 0,
      659.25, 0, 659.25, 587.33, 523.25, 0, 440.00, 0,
      392.00, 440.00, 523.25, 0, 523.25, 0, 0, 0
    ];

    const bass = [
      110.00, 110.00, 130.81, 130.81, 98.00, 98.00, 110.00, 110.00,
      98.00, 98.00, 110.00, 110.00, 130.81, 130.81, 146.83, 146.83,
      130.81, 130.81, 146.83, 146.83, 110.00, 110.00, 98.00, 98.00,
      98.00, 110.00, 130.81, 130.81, 130.81, 130.81, 110.00, 110.00
    ];

    this.musicInterval = window.setInterval(() => {
      if (!this.musicEnabled || !this.ctx || !this.musicGainNode) return;
      const now = this.ctx.currentTime;
      const step = this.loopIndex % melody.length;

      // Bass note triggering
      if (bass[step] > 0 && Math.random() < 0.85) {
        const bassOsc = this.ctx.createOscillator();
        const bassGain = this.ctx.createGain();
        bassOsc.connect(bassGain);
        bassGain.connect(this.musicGainNode);

        bassOsc.type = 'triangle';
        bassOsc.frequency.setValueAtTime(bass[step], now);

        bassGain.gain.setValueAtTime(0.3, now);
        bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        bassOsc.start(now);
        bassOsc.stop(now + 0.35);
      }

      // Melody note triggering
      if (melody[step] > 0 && Math.random() < 0.7) {
        const melOsc = this.ctx.createOscillator();
        const melGain = this.ctx.createGain();
        melOsc.connect(melGain);
        melGain.connect(this.musicGainNode);

        melOsc.type = 'sine';
        melOsc.frequency.setValueAtTime(melody[step], now);

        melGain.gain.setValueAtTime(0.15, now);
        melGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

        melOsc.start(now);
        melOsc.stop(now + 0.18);
      }

      // High-hat accent beat
      if (step % 2 === 0) {
        const bufferSize = this.ctx.sampleRate * 0.03;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random();
        }

        const hatNode = this.ctx.createBufferSource();
        hatNode.buffer = buffer;
        const hatFilter = this.ctx.createBiquadFilter();
        hatFilter.type = 'highpass';
        hatFilter.frequency.setValueAtTime(7000, now);

        const hatGain = this.ctx.createGain();
        // Give a bit stronger beat on count 4
        const volume = (step % 4 === 2) ? 0.08 : 0.04;
        hatGain.gain.setValueAtTime(volume, now);
        hatGain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

        hatNode.connect(hatFilter);
        hatFilter.connect(hatGain);
        hatGain.connect(this.musicGainNode);

        hatNode.start(now);
        hatNode.stop(now + 0.03);
      }

      this.loopIndex++;
    }, delay);
  }

  public stopMusic() {
    if (this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
    if (this.musicGainNode) {
      try {
        this.musicGainNode.disconnect();
      } catch (e) {}
      this.musicGainNode = null;
    }
  }

  // --- Procedural Weather Ambient Sounds ---
  private noiseBuffer: AudioBuffer | null = null;
  private windSource: AudioBufferSourceNode | null = null;
  private windGain: GainNode | null = null;
  private rainSource: AudioBufferSourceNode | null = null;
  private rainGain: GainNode | null = null;
  private cricketsOsc: OscillatorNode | null = null;
  private cricketsGain: GainNode | null = null;
  private cricketsModulator: OscillatorNode | null = null;
  public ambienceActive: boolean = false;

  private getNoiseBuffer(ctx: AudioContext): AudioBuffer {
    if (this.noiseBuffer) return this.noiseBuffer;
    const bufferSize = ctx.sampleRate * 2.0; // 2 seconds of noise
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    this.noiseBuffer = buffer;
    return buffer;
  }

  public startWeatherAmbience() {
    if (!this.soundEnabled || this.ambienceActive) return;
    try {
      const ctx = this.initContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      this.ambienceActive = true;

      const noise = this.getNoiseBuffer(ctx);

      // 1. Wind Sound (noise + bandpass filter + auto modulation)
      this.windSource = ctx.createBufferSource();
      this.windSource.buffer = noise;
      this.windSource.loop = true;

      const windFilter = ctx.createBiquadFilter();
      windFilter.type = "bandpass";
      windFilter.Q.setValueAtTime(4.0, now);
      windFilter.frequency.setValueAtTime(450, now);

      // Filter frequency sweep oscillator (LFO)
      const windLFO = ctx.createOscillator();
      windLFO.type = "sine";
      windLFO.frequency.setValueAtTime(0.12, now); // slow wave
      const windLFOGain = ctx.createGain();
      windLFOGain.gain.setValueAtTime(250, now); // sweep 250Hz up/down

      windLFO.connect(windLFOGain);
      windLFOGain.connect(windFilter.frequency);

      this.windGain = ctx.createGain();
      this.windGain.gain.setValueAtTime(0.001, now); // start silent, blend up

      this.windSource.connect(windFilter);
      windFilter.connect(this.windGain);
      this.windGain.connect(ctx.destination);

      windLFO.start(now);
      this.windSource.start(now);

      // 2. Rain Sound (noise + lowpass filter)
      this.rainSource = ctx.createBufferSource();
      this.rainSource.buffer = noise;
      this.rainSource.loop = true;

      const rainFilter = ctx.createBiquadFilter();
      rainFilter.type = "lowpass";
      rainFilter.frequency.setValueAtTime(1400, now);

      this.rainGain = ctx.createGain();
      this.rainGain.gain.setValueAtTime(0.001, now);

      this.rainSource.connect(rainFilter);
      rainFilter.connect(this.rainGain);
      this.rainGain.connect(ctx.destination);

      this.rainSource.start(now);

      // 3. Crickets Sound (oscillators with 12Hz volume modulation)
      this.cricketsOsc = ctx.createOscillator();
      this.cricketsOsc.type = "sine";
      this.cricketsOsc.frequency.setValueAtTime(3200, now); // high frequency cricket buzz

      this.cricketsGain = ctx.createGain();
      this.cricketsGain.gain.setValueAtTime(0.001, now);

      // Amplitude modulator (makes it buzz)
      this.cricketsModulator = ctx.createOscillator();
      this.cricketsModulator.type = "sawtooth";
      this.cricketsModulator.frequency.setValueAtTime(12, now); // 12 times a sec
      const modGain = ctx.createGain();
      modGain.gain.setValueAtTime(0.4, now);

      this.cricketsModulator.connect(modGain);
      modGain.connect(this.cricketsGain.gain); // modulate gain directly

      this.cricketsOsc.connect(this.cricketsGain);
      this.cricketsGain.connect(ctx.destination);

      this.cricketsModulator.start(now);
      this.cricketsOsc.start(now);
    } catch (err) {
      console.error("Failed to start weather ambience:", err);
    }
  }

  public updateWeatherAmbience(weatherType: string, timeOfDay: number) {
    if (!this.soundEnabled) return;
    if (!this.ambienceActive) {
      this.startWeatherAmbience();
    }
    try {
      const ctx = this.initContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      // Determine target volumes
      let targetWind = 0.012; // soft hum by default
      let targetRain = 0.0;
      let targetCrickets = 0.0;

      // Weather type modifiers
      if (weatherType === "CLOUDY") {
        targetWind = 0.04;
      } else if (weatherType === "LIGHT_RAIN" || weatherType === "RAIN_SUNSHINE") {
        targetWind = 0.035;
        targetRain = 0.07;
      } else if (weatherType === "THUNDERSTORM") {
        targetWind = 0.12; // strong howling wind
        targetRain = 0.16; // heavy pouring rain
      } else if (weatherType === "FOGGY") {
        targetWind = 0.005; // calm, dead silent fog
      }

      // Crickets chirp at night
      const isNightTime = timeOfDay > 19.0 || timeOfDay < 5.0;
      if (isNightTime) {
        targetCrickets = (weatherType === "THUNDERSTORM" || weatherType === "LIGHT_RAIN") ? 0.003 : 0.025;
      }

      if (this.windGain) {
        this.windGain.gain.linearRampToValueAtTime(targetWind, now + 1.5);
      }
      if (this.rainGain) {
        this.rainGain.gain.linearRampToValueAtTime(targetRain, now + 1.5);
      }
      if (this.cricketsGain) {
        this.cricketsGain.gain.linearRampToValueAtTime(targetCrickets, now + 2.0);
      }

      // Dynamic bird chirps during sunny or sunrise/sunset nature hours
      const isNatureHours = timeOfDay >= 5.0 && timeOfDay <= 18.5;
      const canChirp = (weatherType === "SUNNY" || weatherType === "FOGGY" || weatherType === "RAIN_SUNSHINE") && !isNightTime;
      if (isNatureHours && canChirp && Math.random() < 0.015) {
        this.playBirdChirp();
      }
    } catch (err) {}
  }

  public playBirdChirp() {
    if (!this.soundEnabled) return;
    try {
      const ctx = this.initContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = "sine";
      osc.frequency.setValueAtTime(1800 + Math.random() * 400, now);
      osc.frequency.exponentialRampToValueAtTime(2600 + Math.random() * 400, now + 0.08);

      gain.gain.setValueAtTime(0.015, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.10);

      osc.start(now);
      osc.stop(now + 0.10);
    } catch (err) {}
  }

  public playThunderBoom() {
    if (!this.soundEnabled) return;
    try {
      const ctx = this.initContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      const noise = this.getNoiseBuffer(ctx);
      const thunderSource = ctx.createBufferSource();
      thunderSource.buffer = noise;

      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(140, now);
      filter.frequency.linearRampToValueAtTime(15, now + 1.2);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.38, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);

      thunderSource.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      const sub = ctx.createOscillator();
      sub.type = "sine";
      sub.frequency.setValueAtTime(55, now);
      sub.frequency.linearRampToValueAtTime(22, now + 0.6);

      const subGain = ctx.createGain();
      subGain.gain.setValueAtTime(0.45, now);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

      sub.connect(subGain);
      subGain.connect(ctx.destination);

      thunderSource.start(now);
      sub.start(now);

      thunderSource.stop(now + 1.5);
      sub.stop(now + 0.6);
    } catch (err) {}
  }

  public stopWeatherAmbience() {
    this.ambienceActive = false;
    const safeStop = (node: any) => {
      if (node) {
        try {
          node.stop();
          node.disconnect();
        } catch (e) {}
      }
    };
    safeStop(this.windSource);
    safeStop(this.rainSource);
    safeStop(this.cricketsOsc);
    safeStop(this.cricketsModulator);

    this.windSource = null;
    this.windGain = null;
    this.rainSource = null;
    this.rainGain = null;
    this.cricketsOsc = null;
    this.cricketsGain = null;
    this.cricketsModulator = null;
  }
}

export const soundManager = new SoundManager();
