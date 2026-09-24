// Procedural Web Audio API sound generator - no external dependencies or loading issues
import { ROCKET_TIMING } from '../utils/rocketLaunch';

class SoundEngine {
  private ctx: AudioContext | null = null;
  public isMuted: boolean = false;
  private readonly volumeKey = 'galactic_portfolio_audio_levels';
  private volumes = { ambient: 0.7, engine: 0.8, effects: 0.8 };
  private volumesLoaded = false;
  private buses: Partial<Record<'ambient' | 'engine' | 'effects', GainNode>> = {};
  private spatialVoices: Map<string, { oscillator: OscillatorNode; gain: GainNode; panner: PannerNode | null; volume: number }> = new Map();
  private lastSpatialUpdate = -Infinity;
  private ambientStopping: ReturnType<typeof setTimeout> | null = null;

  // Ambient Cosmic Synth Drone Nodes
  private ambientOscs: OscillatorNode[] = [];
  private ambientGain: GainNode | null = null;
  private ambientFilter: BiquadFilterNode | null = null;
  private ambientLfo: OscillatorNode | null = null;
  private isAmbientPlaying: boolean = false;
  private ambientRequested = false;

  // Smooth Rocket Thruster Sound Nodes
  private thrusterNoiseSource: AudioBufferSourceNode | null = null;
  private thrusterSubOsc: OscillatorNode | null = null;
  private thrusterGain: GainNode | null = null;
  private thrusterFilter: BiquadFilterNode | null = null;
  private isThrusterActive: boolean = false;
  private thrusterBoosting = false;
  private resumePending = false;
  private rocketLaunchCleanup: (() => void) | null = null;
  private rocketLaunchNoise: AudioBuffer | null = null;

  private initCtx() {
    this.loadVolumes();
    if (!this.ctx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        this.ctx = new AudioCtxClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended' && !this.resumePending) {
      this.resumePending = true;
      this.ctx.resume().catch(() => {}).finally(() => {
        this.resumePending = false;
      });
    }
  }

  private loadVolumes() {
    if (this.volumesLoaded) return;
    this.volumesLoaded = true;
    try {
      const saved = JSON.parse(window.localStorage?.getItem(this.volumeKey) || '{}');
      for (const category of ['ambient', 'engine', 'effects'] as const) {
        if (Number.isFinite(saved[category])) this.volumes[category] = Math.max(0, Math.min(1, saved[category]));
      }
    } catch { /* Storage is optional. */ }
  }

  private output(category: 'ambient' | 'engine' | 'effects'): AudioNode {
    const ctx = this.ctx!;
    if (!this.buses[category]) {
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(this.isMuted ? 0 : this.volumes[category], ctx.currentTime);
      gain.connect(ctx.destination);
      this.buses[category] = gain;
    }
    return this.buses[category];
  }

  public getVolumes() { this.loadVolumes(); return { ...this.volumes }; }

  public setVolume(category: 'ambient' | 'engine' | 'effects', volume: number) {
    if (!Number.isFinite(volume)) return;
    this.loadVolumes();
    this.volumes[category] = Math.max(0, Math.min(1, volume));
    try { window.localStorage?.setItem(this.volumeKey, JSON.stringify(this.volumes)); } catch { /* Storage is optional. */ }
    const bus = this.buses[category];
    if (bus && this.ctx) bus.gain.setTargetAtTime(this.isMuted ? 0 : this.volumes[category], this.ctx.currentTime, 0.04);
  }

  public async warmup(): Promise<void> {
    if (typeof window === 'undefined') return;
    const unlockAudio = () => {
      this.initCtx();
      window.removeEventListener('pointerdown', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
    };
    window.addEventListener('pointerdown', unlockAudio, { once: true, passive: true });
    window.addEventListener('keydown', unlockAudio, { once: true, passive: true });
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.ctx) for (const category of ['ambient', 'engine', 'effects'] as const) {
      this.buses[category]?.gain.setTargetAtTime(this.isMuted ? 0 : this.volumes[category], this.ctx.currentTime, 0.04);
    }
    if (this.isMuted) {
      this.stopThrusterSound();
      this.stopRocketLaunch();
    } else if (this.ambientRequested && !this.isAmbientPlaying) {
      this.startAmbient();
    }
    return this.isMuted;
  }

  // Soft UI click
  public playClick() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.05);

      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(this.output('effects'));
      osc.start();
      osc.stop(this.ctx.currentTime + 0.05);
    } catch {
      // AudioContext error safe fallback
    }
  }

  public playBoundaryWarning() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const time = this.ctx.currentTime;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(660, time);
      osc.frequency.setValueAtTime(440, time + 0.13);
      gain.gain.setValueAtTime(0.001, time);
      gain.gain.linearRampToValueAtTime(0.045, time + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.32);
      osc.connect(gain);
      gain.connect(this.output('effects'));
      osc.onended = () => { osc.disconnect(); gain.disconnect(); };
      osc.start(time);
      osc.stop(time + 0.35);
    } catch {
      // Audio is optional; containment remains available when audio is blocked.
    }
  }

  // Thruster whoosh
  public playBoost() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(320, this.ctx.currentTime + 0.15);

      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);

      osc.connect(gain);
      gain.connect(this.output('effects'));
      osc.start();
      osc.stop(this.ctx.currentTime + 0.2);
    } catch {
      // safe fallback
    }
  }

  // Speed Ring Warp Chime / Sonic Whoosh
  public playSpeedRing() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      // High-tech ascending laser whoosh + resonant bell
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(1450, now + 0.16);
      gain.gain.setValueAtTime(0.14, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
      osc.connect(gain);
      gain.connect(this.output('effects'));
      osc.start(now);
      osc.stop(now + 0.32);

      // Harmonized sub-bass impact thump
      const sub = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      sub.type = 'triangle';
      sub.frequency.setValueAtTime(150, now);
      sub.frequency.exponentialRampToValueAtTime(50, now + 0.22);
      subGain.gain.setValueAtTime(0.22, now);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      sub.connect(subGain);
      subGain.connect(this.output('effects'));
      sub.start(now);
      sub.stop(now + 0.22);
    } catch {
      // safe fallback
    }
  }

  // Crystal Collect Coin chime
  public playCoin() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      
      const freqs = [987.77, 1318.51]; // B5 -> E6
      freqs.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);

        gain.gain.setValueAtTime(0.1, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.18);

        osc.connect(gain);
        gain.connect(this.output('effects'));
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.2);
      });
    } catch {
      // safe fallback
    }
  }

  // Retro 8-bit arcade insert coin / 1P ready arpeggio
  public playArcadeCoin() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const notes = [987.77, 1318.51, 1567.98, 2093.0]; // B5, E6, G6, C7
      notes.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, now + idx * 0.05);

        gain.gain.setValueAtTime(0.06, now + idx * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.12);

        osc.connect(gain);
        gain.connect(this.output('effects'));
        osc.start(now + idx * 0.05);
        osc.stop(now + idx * 0.05 + 0.14);
      });
    } catch {
      // safe fallback
    }
  }

  /** Island launch audio has its own graph, independent of the player's engine. */
  public playRocketLaunchPhase(phase: 'ignition' | 'liftoff' | 'flying', remainingSeconds = ROCKET_TIMING[phase]) {
    this.stopRocketLaunch();
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const ctx = this.ctx;
      const now = ctx.currentTime;
      const duration = Math.max(0.01, Math.min(ROCKET_TIMING[phase], remainingSeconds));
      if (!this.rocketLaunchNoise) {
        this.rocketLaunchNoise = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.5), ctx.sampleRate);
        const data = this.rocketLaunchNoise.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = this.rocketLaunchNoise;
      noise.loop = true;
      const rumble = ctx.createOscillator();
      rumble.type = 'triangle';
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      const gain = ctx.createGain();
      const pitch = phase === 'ignition' ? 38 : phase === 'liftoff' ? 52 : 76;
      const cutoff = phase === 'ignition' ? 180 : phase === 'liftoff' ? 350 : 700;
      const volume = phase === 'ignition' ? 0.07 : phase === 'liftoff' ? 0.10 : 0.14;
      rumble.frequency.setValueAtTime(pitch, now);
      rumble.frequency.linearRampToValueAtTime(pitch * 1.5, now + duration);
      filter.frequency.setValueAtTime(cutoff, now);
      filter.frequency.linearRampToValueAtTime(cutoff * 2, now + duration);
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(volume * 0.65, now + Math.min(0.06, duration * 0.2));
      gain.gain.linearRampToValueAtTime(volume, now + duration * 0.85);
      gain.gain.linearRampToValueAtTime(0, now + duration);
      noise.connect(filter);
      rumble.connect(filter);
      filter.connect(gain);
      gain.connect(this.output('effects'));
      let cleaned = false;
      const cleanup = () => {
        if (cleaned) return;
        cleaned = true;
        noise.onended = null;
        try { noise.stop(); } catch { /* Already ended. */ }
        try { rumble.stop(); } catch { /* Already ended. */ }
        noise.disconnect();
        rumble.disconnect();
        filter.disconnect();
        gain.disconnect();
        if (this.rocketLaunchCleanup === cleanup) this.rocketLaunchCleanup = null;
      };
      this.rocketLaunchCleanup = cleanup;
      noise.onended = cleanup;
      noise.start(now);
      rumble.start(now);
      noise.stop(now + duration);
      rumble.stop(now + duration);
    } catch {
      this.stopRocketLaunch();
    }
  }

  public stopRocketLaunch() {
    this.rocketLaunchCleanup?.();
  }

  // High-pressure pneumatic steam / nitrogen purge release
  public playPneumaticVent() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      // Bandpass noise burst
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.4);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1600, now);
      filter.frequency.exponentialRampToValueAtTime(600, now + 0.38);
      filter.Q.setValueAtTime(2.5, now);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.output('effects'));
      noise.start(now);
      noise.stop(now + 0.4);

      // Low thump impulse
      const thump = this.ctx.createOscillator();
      const thumpGain = this.ctx.createGain();
      thump.type = 'sine';
      thump.frequency.setValueAtTime(140, now);
      thump.frequency.exponentialRampToValueAtTime(40, now + 0.15);
      thumpGain.gain.setValueAtTime(0.12, now);
      thumpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      thump.connect(thumpGain);
      thumpGain.connect(this.output('effects'));
      thump.start(now);
      thump.stop(now + 0.15);
    } catch {
      // safe fallback
    }
  }

  // Sci-fi holographic projector scan & model switch chime
  public playHoloSwitch() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const notes = [739.99, 932.33, 1108.73, 1479.98]; // F#5, A#5, C#6, F#6
      notes.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.04);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.05, now + idx * 0.04 + 0.15);

        gain.gain.setValueAtTime(0.08, now + idx * 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 0.22);

        osc.connect(gain);
        gain.connect(this.output('effects'));
        osc.start(now + idx * 0.04);
        osc.stop(now + idx * 0.04 + 0.25);
      });
    } catch {
      // safe fallback
    }
  }

  // Satisfying mechanical keyboard tactile switch click ("thock")
  public playKeycapClick() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      // High-frequency click impulse
      const clickOsc = this.ctx.createOscillator();
      const clickGain = this.ctx.createGain();
      clickOsc.type = 'triangle';
      clickOsc.frequency.setValueAtTime(2800, now);
      clickOsc.frequency.exponentialRampToValueAtTime(800, now + 0.025);
      clickGain.gain.setValueAtTime(0.12, now);
      clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
      clickOsc.connect(clickGain);
      clickGain.connect(this.output('effects'));
      clickOsc.start(now);
      clickOsc.stop(now + 0.035);

      // Low bottom-out acoustic thud
      const thudOsc = this.ctx.createOscillator();
      const thudGain = this.ctx.createGain();
      thudOsc.type = 'sine';
      thudOsc.frequency.setValueAtTime(320, now);
      thudOsc.frequency.exponentialRampToValueAtTime(90, now + 0.05);
      thudGain.gain.setValueAtTime(0.15, now);
      thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
      thudOsc.connect(thudGain);
      thudGain.connect(this.output('effects'));
      thudOsc.start(now);
      thudOsc.stop(now + 0.065);
    } catch {
      // safe fallback
    }
  }

  // Hall Effect magnetic switch deep smooth actuation ("creamy lubed thock")
  public playMagneticSwitch(pitchFactor: number = 1.0) {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      // Soft magnetic bottom-out acoustic thock
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(380 * pitchFactor, now);
      osc.frequency.exponentialRampToValueAtTime(75 * pitchFactor, now + 0.07);

      gain.gain.setValueAtTime(0.22, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(this.output('effects'));
      osc.start(now);
      osc.stop(now + 0.085);

      // Magnetic flux resonance pulse (subtle damped hum)
      const fluxOsc = this.ctx.createOscillator();
      const fluxGain = this.ctx.createGain();
      fluxOsc.type = 'triangle';
      fluxOsc.frequency.setValueAtTime(840 * pitchFactor, now);
      fluxOsc.frequency.exponentialRampToValueAtTime(220 * pitchFactor, now + 0.045);

      fluxGain.gain.setValueAtTime(0.08, now);
      fluxGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      fluxOsc.connect(fluxGain);
      fluxGain.connect(this.output('effects'));
      fluxOsc.start(now);
      fluxOsc.stop(now + 0.055);
    } catch {
      // safe fallback
    }
  }

  // Rotary encoder metallic detent click
  public playEncoderClick() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(2200, now);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.015);
      gain.gain.setValueAtTime(0.09, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);
      osc.connect(gain);
      gain.connect(this.output('effects'));
      osc.start(now);
      osc.stop(now + 0.025);
    } catch {
      // safe fallback
    }
  }

  // Retro lamp switch mechanical click / clack toggle
  public playLampSwitch(isOn: boolean = true) {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      // Primary click
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(isOn ? 1850 : 1350, now);
      osc1.frequency.exponentialRampToValueAtTime(700, now + 0.025);
      gain1.gain.setValueAtTime(0.14, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
      osc1.connect(gain1);
      gain1.connect(this.output('effects'));
      osc1.start(now);
      osc1.stop(now + 0.035);

      // Secondary spring rebound click
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(isOn ? 2400 : 1900, now + 0.018);
      osc2.frequency.exponentialRampToValueAtTime(900, now + 0.04);
      gain2.gain.setValueAtTime(0.09, now + 0.018);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.045);
      osc2.connect(gain2);
      gain2.connect(this.output('effects'));
      osc2.start(now + 0.018);
      osc2.stop(now + 0.05);
    } catch {
      // safe fallback
    }
  }

  // Aerodynamic celestial glider whoosh for the paper plane
  public playPaperPlaneWhoosh() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const duration = 0.55;

      const bufferSize = Math.floor(this.ctx.sampleRate * duration);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(750, now);
      filter.frequency.exponentialRampToValueAtTime(1750, now + duration * 0.45);
      filter.frequency.exponentialRampToValueAtTime(550, now + duration);
      filter.Q.setValueAtTime(3.5, now);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.15, now + duration * 0.35);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.output('effects'));
      noise.start(now);
      noise.stop(now + duration);
    } catch {
      // safe fallback
    }
  }

  // Developer terminal / cyber console buffer switch chime
  public playTerminalBeep() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1280, now);
      osc.frequency.exponentialRampToValueAtTime(1760, now + 0.05);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
      osc.connect(gain);
      gain.connect(this.output('effects'));
      osc.start(now);
      osc.stop(now + 0.065);
    } catch {
      // safe fallback
    }
  }

  // Cozy ceramic coffee cup clink & steam relaxation
  public playSipCoffee() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      // High ceramic ping
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(2600, now);
      osc.frequency.exponentialRampToValueAtTime(1400, now + 0.08);
      gain.gain.setValueAtTime(0.09, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
      osc.connect(gain);
      gain.connect(this.output('effects'));
      osc.start(now);
      osc.stop(now + 0.095);

      // Warm hollow cup resonance
      const res = this.ctx.createOscillator();
      const resGain = this.ctx.createGain();
      res.type = 'triangle';
      res.frequency.setValueAtTime(520, now);
      res.frequency.exponentialRampToValueAtTime(320, now + 0.12);
      resGain.gain.setValueAtTime(0.06, now);
      resGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
      res.connect(resGain);
      resGain.connect(this.output('effects'));
      res.start(now);
      res.stop(now + 0.15);
    } catch {
      // safe fallback
    }
  }

  // GPU Triple-Fan aerodynamic turbine spool-up whoosh
  public playGpuTurbineBoost() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const duration = 0.55;

      // 1. High-speed turbine whine (sine sweep)
      const whine = this.ctx.createOscillator();
      const whineGain = this.ctx.createGain();
      whine.type = 'sine';
      whine.frequency.setValueAtTime(320, now);
      whine.frequency.exponentialRampToValueAtTime(1480, now + duration * 0.4);
      whine.frequency.exponentialRampToValueAtTime(720, now + duration);

      whineGain.gain.setValueAtTime(0.001, now);
      whineGain.gain.linearRampToValueAtTime(0.12, now + duration * 0.35);
      whineGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      whine.connect(whineGain);
      whineGain.connect(this.output('effects'));
      whine.start(now);
      whine.stop(now + duration);

      // 2. Aerodynamic airflow rushing (filtered noise)
      const bufferSize = Math.floor(this.ctx.sampleRate * duration);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(450, now);
      filter.frequency.exponentialRampToValueAtTime(2200, now + duration * 0.4);
      filter.frequency.exponentialRampToValueAtTime(800, now + duration);
      filter.Q.setValueAtTime(3.2, now);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.001, now);
      noiseGain.gain.linearRampToValueAtTime(0.16, now + duration * 0.35);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.output('effects'));
      noise.start(now);
      noise.stop(now + duration);
    } catch {
      // safe fallback
    }
  }

  // Waterblock & Hard Tubing liquid coolant pulse & bubble flow
  public playWaterblockPulse() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      // Series of tiny resonant liquid bubble blips
      const freqs = [420, 680, 890, 1150, 1420];
      freqs.forEach((f, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'sine';
        const startT = now + idx * 0.045;
        osc.frequency.setValueAtTime(f, startT);
        osc.frequency.exponentialRampToValueAtTime(f * 1.6, startT + 0.05);

        gain.gain.setValueAtTime(0.08, startT);
        gain.gain.exponentialRampToValueAtTime(0.001, startT + 0.055);

        osc.connect(gain);
        gain.connect(this.output('effects'));
        osc.start(startT);
        osc.stop(startT + 0.06);
      });

      // Coolant pump pressure surge whoosh
      const pump = this.ctx.createOscillator();
      const pumpGain = this.ctx.createGain();
      pump.type = 'triangle';
      pump.frequency.setValueAtTime(120, now);
      pump.frequency.exponentialRampToValueAtTime(260, now + 0.15);
      pump.frequency.exponentialRampToValueAtTime(80, now + 0.32);

      pumpGain.gain.setValueAtTime(0.10, now);
      pumpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      pump.connect(pumpGain);
      pumpGain.connect(this.output('effects'));
      pump.start(now);
      pump.stop(now + 0.36);
    } catch {
      // safe fallback
    }
  }

  // Quantum Holographic Processor dimensional resonance chime
  public playQuantumPulse() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      // Futuristic crystal-cyber chord: F#5 (739.99), A#5 (932.33), C#6 (1108.73), F6 (1396.91)
      const chord = [739.99, 932.33, 1108.73, 1396.91];
      chord.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'sine';
        const startTime = now + idx * 0.035;
        osc.frequency.setValueAtTime(freq, startTime);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.05, startTime + 0.45);

        gain.gain.setValueAtTime(0.09, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.5);

        osc.connect(gain);
        gain.connect(this.output('effects'));
        osc.start(startTime);
        osc.stop(startTime + 0.52);
      });

      // Quantum sub-harmonic hum
      const sub = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      sub.type = 'triangle';
      sub.frequency.setValueAtTime(185, now);
      subGain.gain.setValueAtTime(0.07, now);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      sub.connect(subGain);
      subGain.connect(this.output('effects'));
      sub.start(now);
      sub.stop(now + 0.42);
    } catch {
      // safe fallback
    }
  }

  // NVMe M.2 ultra-fast PCIe 5.0 read/write benchmark burst
  public playNvmeBenchmark() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const bursts = [2800, 3600, 4200, 4800, 5400, 6200];
      bursts.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'square';
        const t = now + idx * 0.022;
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(0.04, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.018);

        osc.connect(gain);
        gain.connect(this.output('effects'));
        osc.start(t);
        osc.stop(t + 0.02);
      });
    } catch {
      // safe fallback
    }
  }

  // Graduation Cap celebratory toss whoosh & fanfare chime
  public playCapToss() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      // 1. Upward buoyant whoosh
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(840, now + 0.22);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(this.output('effects'));
      osc.start(now);
      osc.stop(now + 0.26);

      // 2. Celebratory major chord chime: E5 (659.25), G#5 (830.61), B5 (987.77), E6 (1318.51)
      const chord = [659.25, 830.61, 987.77, 1318.51];
      chord.forEach((freq, idx) => {
        const cOsc = this.ctx!.createOscillator();
        const cGain = this.ctx!.createGain();
        cOsc.type = 'triangle';
        const startT = now + 0.12 + idx * 0.045;
        cOsc.frequency.setValueAtTime(freq, startT);

        cGain.gain.setValueAtTime(0.09, startT);
        cGain.gain.exponentialRampToValueAtTime(0.001, startT + 0.35);

        cOsc.connect(cGain);
        cGain.connect(this.output('effects'));
        cOsc.start(startT);
        cOsc.stop(startT + 0.38);
      });
    } catch {
      // safe fallback
    }
  }

  // Crisp book page flip / paper rustle
  public playBookPageFlip() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const duration = 0.08;

      const bufferSize = Math.floor(this.ctx.sampleRate * duration);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(2200, now);
      filter.frequency.exponentialRampToValueAtTime(900, now + duration);
      filter.Q.setValueAtTime(2.0, now);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.output('effects'));
      noise.start(now);
      noise.stop(now + duration);
    } catch {
      // safe fallback
    }
  }

  // Tactile graphite pencil sketching stroke
  public playPencilSketch() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      [0, 0.035, 0.075].forEach((offset, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'sine';
        const startT = now + offset;
        osc.frequency.setValueAtTime(1400 + idx * 300, startT);
        osc.frequency.exponentialRampToValueAtTime(2200, startT + 0.025);

        gain.gain.setValueAtTime(0.05, startT);
        gain.gain.exponentialRampToValueAtTime(0.001, startT + 0.028);

        osc.connect(gain);
        gain.connect(this.output('effects'));
        osc.start(startT);
        osc.stop(startT + 0.03);
      });
    } catch {
      // safe fallback
    }
  }

  // Resonant Big Ben / clock tower bronze bell chime
  public playClockChime() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      // Bell strike tone + fundamental + harmonics: 440Hz (strike), 880Hz, 1320Hz, 220Hz (hum)
      const partials = [
        { f: 440, g: 0.16, d: 1.8 },
        { f: 880, g: 0.08, d: 1.2 },
        { f: 1320, g: 0.04, d: 0.8 },
        { f: 220, g: 0.12, d: 2.2 },
      ];

      partials.forEach(({ f, g, d }) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now);

        gain.gain.setValueAtTime(g, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + d);

        osc.connect(gain);
        gain.connect(this.output('effects'));
        osc.start(now);
        osc.stop(now + d + 0.05);
      });
    } catch {
      // safe fallback
    }
  }

  // Crisp executive briefcase dual brass latch click
  public playBriefcaseClick() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      // Two rapid metallic snap clicks
      [0, 0.045].forEach((offset, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'triangle';
        const t = now + offset;
        osc.frequency.setValueAtTime(idx === 0 ? 1800 : 2400, t);
        osc.frequency.exponentialRampToValueAtTime(300, t + 0.03);

        gain.gain.setValueAtTime(0.12, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.035);

        osc.connect(gain);
        gain.connect(this.output('effects'));
        osc.start(t);
        osc.stop(t + 0.04);
      });
    } catch {
      // safe fallback
    }
  }

  // Skybridge optic light beam whoosh / pulse
  public playSkybridgePulse() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(580, now);
      osc.frequency.exponentialRampToValueAtTime(1160, now + 0.18);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.35);

      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

      osc.connect(gain);
      gain.connect(this.output('effects'));
      osc.start(now);
      osc.stop(now + 0.4);
    } catch {
      // safe fallback
    }
  }

  // Island Landing Chime
  public playIslandEnter() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.06);

        gain.gain.setValueAtTime(0.1, now + idx * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.3);

        osc.connect(gain);
        gain.connect(this.output('effects'));
        osc.start(now + idx * 0.06);
        osc.stop(now + idx * 0.06 + 0.32);
      });
    } catch {
      // safe fallback
    }
  }

  // Badge Unlocked Fanfare
  public playBadgeUnlocked() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const notes = [440, 554.37, 659.25, 880, 1108.73]; // A major triumphant chord
      notes.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);

        gain.gain.setValueAtTime(0.12, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.5);

        osc.connect(gain);
        gain.connect(this.output('effects'));
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.55);
      });
    } catch {
      // safe fallback
    }
  }

  // Cinematic Warp Entry (Descending hyperspace whoosh into scene)
  public playWarpEntry() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      // Resonant descending / leveling synth sweep
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(680, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.85);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1200, now);
      filter.frequency.exponentialRampToValueAtTime(350, now + 0.9);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.12, now + 0.25);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.output('effects'));
      osc.start(now);
      osc.stop(now + 1.2);

      // Sub-bass rumble
      const sub = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      sub.type = 'triangle';
      sub.frequency.setValueAtTime(80, now);
      sub.frequency.exponentialRampToValueAtTime(45, now + 0.7);
      subGain.gain.setValueAtTime(0.16, now);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
      sub.connect(subGain);
      subGain.connect(this.output('effects'));
      sub.start(now);
      sub.stop(now + 0.8);
    } catch {
      // safe fallback
    }
  }

  // Touchdown onto Island Helipad (Mechanical clamp + pneumatic air release)
  public playTouchdown() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      // Soft clamp metallic click
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(280, now);
      osc.frequency.exponentialRampToValueAtTime(90, now + 0.12);
      gain.gain.setValueAtTime(0.14, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
      osc.connect(gain);
      gain.connect(this.output('effects'));
      osc.start(now);
      osc.stop(now + 0.15);

      // Pneumatic release hiss
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.25);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1400, now);
      filter.Q.setValueAtTime(2.5, now);
      const hissGain = this.ctx.createGain();
      hissGain.gain.setValueAtTime(0.06, now);
      hissGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      noise.connect(filter);
      filter.connect(hissGain);
      hissGain.connect(this.output('effects'));
      noise.start(now);
      noise.stop(now + 0.26);
    } catch {
      // safe fallback
    }
  }

  // Island Liftoff (Vertical thruster blast + ascending harmonic tone)
  public playLiftoff() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.exponentialRampToValueAtTime(380, now + 0.5);
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.12, now + 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
      osc.connect(gain);
      gain.connect(this.output('effects'));
      osc.start(now);
      osc.stop(now + 0.65);

      // Ascending celestial chime
      const bell = this.ctx.createOscillator();
      const bellGain = this.ctx.createGain();
      bell.type = 'sine';
      bell.frequency.setValueAtTime(440, now + 0.1);
      bell.frequency.exponentialRampToValueAtTime(880, now + 0.45);
      bellGain.gain.setValueAtTime(0.06, now + 0.1);
      bellGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      bell.connect(bellGain);
      bellGain.connect(this.output('effects'));
      bell.start(now + 0.1);
      bell.stop(now + 0.5);
    } catch {
      // safe fallback
    }
  }

  // Cinematic Warp Exit (Accelerating into horizon / deep space)
  public playWarpExit() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      // Charging swell then ascending supersonic whoosh
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(90, now);
      osc.frequency.exponentialRampToValueAtTime(920, now + 0.9);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(250, now);
      filter.frequency.exponentialRampToValueAtTime(2400, now + 0.95);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.15, now + 0.5);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.15);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.output('effects'));
      osc.start(now);
      osc.stop(now + 1.15);
    } catch {
      // safe fallback
    }
  }

  // Ambient Cosmic Synth Drone (Warm, relaxing, ethereal Dm9 chord with breathing LFO lowpass filter)
  public startAmbient() {
    this.ambientRequested = true;
    if (this.isMuted || this.isAmbientPlaying) return;
    if (this.ambientStopping) {
      clearTimeout(this.ambientStopping);
      this.ambientStopping = null;
    }
    try {
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;

      // Master Ambient Gain Node (Smooth fade-in over 2.5s)
      const masterGain = this.ctx.createGain();
      masterGain.gain.setValueAtTime(0.0001, now);
      masterGain.gain.exponentialRampToValueAtTime(0.035, now + 2.5);
      masterGain.connect(this.output('ambient'));
      this.ambientGain = masterGain;

      // Warm 24dB Musical Lowpass Filter
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(320, now);
      filter.Q.setValueAtTime(1.0, now);
      filter.connect(masterGain);
      this.ambientFilter = filter;

      // Ultra-slow Cosmic Breathing LFO (0.04 Hz = ~25s period)
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(0.04, now);
      lfoGain.gain.setValueAtTime(80, now); // Sweeps cutoff between 240Hz and 400Hz
      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);
      lfo.start(now);
      this.ambientLfo = lfo;

      // Ethereal celestial Dm9 open chord voices:
      // D2 (73.42Hz), A2 (110.0Hz), E3 (164.81Hz), F3 (174.61Hz)
      const chordVoices = [
        { freq: 73.42, detune: 0, type: 'triangle' as OscillatorType, vol: 0.75 },
        { freq: 110.0, detune: 3, type: 'sine' as OscillatorType, vol: 0.65 },
        { freq: 164.81, detune: -4, type: 'sine' as OscillatorType, vol: 0.5 },
        { freq: 174.61, detune: 2, type: 'sine' as OscillatorType, vol: 0.45 },
      ];

      this.ambientOscs = chordVoices.map((voice) => {
        const osc = this.ctx!.createOscillator();
        const vGain = this.ctx!.createGain();
        osc.type = voice.type;
        osc.frequency.setValueAtTime(voice.freq, now);
        osc.detune.setValueAtTime(voice.detune, now);

        vGain.gain.setValueAtTime(voice.vol, now);
        osc.connect(vGain);
        vGain.connect(filter);
        osc.start(now);
        return osc;
      });

      // Every celestial landmark gets a restrained harmonic signature. PannerNode
      // handles real 3D distance/orientation while the shared ambient bus keeps the
      // mix subtle under UI cues and the ship engine.
      const spatialTones = [
        { id: 'projects', frequency: 293.66, type: 'sine' as OscillatorType, volume: 0.32, maxDistance: 68 },
        { id: 'experience', frequency: 196.00, type: 'triangle' as OscillatorType, volume: 0.29, maxDistance: 72 },
        { id: 'skills', frequency: 369.99, type: 'sine' as OscillatorType, volume: 0.24, maxDistance: 72 },
        { id: 'education', frequency: 261.63, type: 'sine' as OscillatorType, volume: 0.27, maxDistance: 72 },
        { id: 'about', frequency: 220.00, type: 'triangle' as OscillatorType, volume: 0.30, maxDistance: 64 },
        { id: 'sun', frequency: 55.00, type: 'sine' as OscillatorType, volume: 0.25, maxDistance: 118 },
      ];
      for (const tone of spatialTones) {
        const oscillator = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const panner = typeof this.ctx.createPanner === 'function' ? this.ctx.createPanner() : null;
        oscillator.type = tone.type;
        oscillator.frequency.setValueAtTime(tone.frequency, now);
        gain.gain.setValueAtTime(0, now);
        oscillator.connect(gain);
        if (panner) {
          panner.panningModel = 'HRTF';
          panner.distanceModel = 'linear';
          panner.refDistance = tone.id === 'sun' ? 12 : 8;
          panner.maxDistance = tone.maxDistance;
          panner.rolloffFactor = 1;
          panner.coneInnerAngle = 360;
          panner.coneOuterAngle = 360;
          gain.connect(panner);
          panner.connect(masterGain);
        } else {
          gain.connect(masterGain);
        }
        oscillator.start(now);
        this.spatialVoices.set(tone.id, { oscillator, gain, panner, volume: tone.volume });
      }

      this.isAmbientPlaying = true;
    } catch {
      // safe fallback
    }
  }

  public stopAmbient() {
    this.ambientRequested = false;
    try {
      if (this.ambientGain && this.ctx) {
        const now = this.ctx.currentTime;
        this.ambientGain.gain.cancelScheduledValues(now);
        this.ambientGain.gain.setValueAtTime(this.ambientGain.gain.value, now);
        this.ambientGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);
      }

      if (this.ambientStopping) clearTimeout(this.ambientStopping);
      this.ambientStopping = setTimeout(() => {
        for (const voice of this.spatialVoices.values()) {
          try { voice.oscillator.stop(); voice.oscillator.disconnect(); voice.gain.disconnect(); voice.panner?.disconnect(); } catch {}
        }
        this.spatialVoices.clear();
        this.ambientOscs.forEach((osc) => {
          try {
            osc.stop();
            osc.disconnect();
          } catch {}
        });
        this.ambientOscs = [];

        if (this.ambientLfo) {
          try {
            this.ambientLfo.stop();
            this.ambientLfo.disconnect();
          } catch {}
          this.ambientLfo = null;
        }

        if (this.ambientFilter) {
          try {
            this.ambientFilter.disconnect();
          } catch {}
          this.ambientFilter = null;
        }

        if (this.ambientGain) {
          try {
            this.ambientGain.disconnect();
          } catch {}
          this.ambientGain = null;
        }

        this.isAmbientPlaying = false;
        this.ambientStopping = null;
      }, 1250);
    } catch {
      this.isAmbientPlaying = false;
    }
  }

  public updateSpatialSoundscape(
    listenerPosition: readonly [number, number, number],
    heading: number,
    sources: ReadonlyArray<{ id: string; position: readonly [number, number, number]; focused?: boolean }>,
    speed: number,
  ) {
    if (!this.ctx || !this.isAmbientPlaying || this.isMuted || this.ctx.state !== 'running') return;
    const now = this.ctx.currentTime;
    if (now - this.lastSpatialUpdate < 0.12) return;
    this.lastSpatialUpdate = now;

    const listener = this.ctx.listener;
    const forwardX = Math.sin(heading);
    const forwardZ = Math.cos(heading);
    if (listener.positionX && listener.positionY && listener.positionZ) {
      listener.positionX.setTargetAtTime(listenerPosition[0], now, 0.08);
      listener.positionY.setTargetAtTime(listenerPosition[1], now, 0.08);
      listener.positionZ.setTargetAtTime(listenerPosition[2], now, 0.08);
      listener.forwardX.setTargetAtTime(forwardX, now, 0.08);
      listener.forwardY.setTargetAtTime(0, now, 0.08);
      listener.forwardZ.setTargetAtTime(forwardZ, now, 0.08);
      listener.upX.setTargetAtTime(0, now, 0.08);
      listener.upY.setTargetAtTime(1, now, 0.08);
      listener.upZ.setTargetAtTime(0, now, 0.08);
    } else {
      const legacyListener = listener as AudioListener & {
        setPosition?: (x: number, y: number, z: number) => void;
        setOrientation?: (x: number, y: number, z: number, xUp: number, yUp: number, zUp: number) => void;
      };
      legacyListener.setPosition?.(...listenerPosition);
      legacyListener.setOrientation?.(forwardX, 0, forwardZ, 0, 1, 0);
    }

    for (const source of sources) {
      const voice = this.spatialVoices.get(source.id);
      if (!voice) continue;
      const targetVolume = voice.volume * (source.focused ? 1.28 : 1);
      if (voice.panner) {
        if (voice.panner.positionX && voice.panner.positionY && voice.panner.positionZ) {
          voice.panner.positionX.setTargetAtTime(source.position[0], now, 0.18);
          voice.panner.positionY.setTargetAtTime(source.position[1], now, 0.18);
          voice.panner.positionZ.setTargetAtTime(source.position[2], now, 0.18);
        } else {
          voice.panner.setPosition(source.position[0], source.position[1], source.position[2]);
        }
        voice.gain.gain.setTargetAtTime(targetVolume, now, 0.32);
      } else {
        // Web Audio implementations without PannerNode still get distance-aware ambience.
        const distance = Math.hypot(
          source.position[0] - listenerPosition[0],
          source.position[1] - listenerPosition[1],
          source.position[2] - listenerPosition[2],
        );
        const proximity = Math.max(0, 1 - Math.max(0, distance - 8) / (source.id === 'sun' ? 110 : 64));
        voice.gain.gain.setTargetAtTime(targetVolume * proximity * proximity, now, 0.32);
      }
    }
    this.ambientFilter?.frequency.setTargetAtTime(320 + Math.min(1, Math.max(0, speed) / 24) * 180, now, 0.5);
  }

  // Dramatic Low-Poly Explosion Sound (Clean cinematic bass impact without harsh static noise)
  public playExplosion() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      // Deep bass rumble
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(28, now + 0.5);

      gain.gain.setValueAtTime(0.24, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

      osc.connect(gain);
      gain.connect(this.output('effects'));
      osc.start(now);
      osc.stop(now + 0.56);

      // Low-pitch punch thud (pure musical triangle wave, zero harsh white noise static)
      const thudOsc = this.ctx.createOscillator();
      const thudGain = this.ctx.createGain();
      thudOsc.type = 'triangle';
      thudOsc.frequency.setValueAtTime(90, now);
      thudOsc.frequency.exponentialRampToValueAtTime(22, now + 0.35);

      thudGain.gain.setValueAtTime(0.18, now);
      thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

      thudOsc.connect(thudGain);
      thudGain.connect(this.output('effects'));
      thudOsc.start(now);
      thudOsc.stop(now + 0.39);
    } catch {
      // safe fallback
    }
  }

  // Race Countdown Beeps (Low pitch for 3, 2, 1; High pitch for GO!)
  public playCountdownBeep(isFinal = false) {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      const freq = isFinal ? 880 : 440;
      const duration = isFinal ? 0.3 : 0.15;
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc.connect(gain);
      gain.connect(this.output('effects'));
      osc.start(now);
      osc.stop(now + duration);
    } catch {
      // safe fallback
    }
  }

  // Race Victory Fanfare
  public playRaceVictory() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51]; // C5, E5, G5, C6, E6
      notes.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);

        gain.gain.setValueAtTime(0.12, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.35);

        osc.connect(gain);
        gain.connect(this.output('effects'));
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.36);
      });
    } catch {
      // safe fallback
    }
  }

  // Kinetic Impact Sound (Satisfying low-poly metallic/ceramic collision thud in zero-g)
  public playKineticImpact(intensity = 1.0) {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const vol = Math.min(0.18, 0.06 * Math.max(0.4, intensity));

      // Primary kinetic thud
      const thud = this.ctx.createOscillator();
      const thudGain = this.ctx.createGain();
      thud.type = 'triangle';
      thud.frequency.setValueAtTime(160, now);
      thud.frequency.exponentialRampToValueAtTime(38, now + 0.12);

      thudGain.gain.setValueAtTime(vol, now);
      thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

      thud.connect(thudGain);
      thudGain.connect(this.output('effects'));
      thud.start(now);
      thud.stop(now + 0.14);

      // Subtle metallic body resonance
      const metal = this.ctx.createOscillator();
      const metalGain = this.ctx.createGain();
      metal.type = 'sine';
      metal.frequency.setValueAtTime(280, now);
      metal.frequency.exponentialRampToValueAtTime(110, now + 0.09);

      metalGain.gain.setValueAtTime(vol * 0.45, now);
      metalGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

      metal.connect(metalGain);
      metalGain.connect(this.output('effects'));
      metal.start(now);
      metal.stop(now + 0.1);
    } catch {
      // safe fallback
    }
  }

  // Lost Space Cargo Recovery Chime
  public playCargoRecovered() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const notes = [587.33, 783.99, 1174.66]; // D5 -> G5 -> D6
      notes.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.07);

        gain.gain.setValueAtTime(0.13, now + idx * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.28);

        osc.connect(gain);
        gain.connect(this.output('effects'));
        osc.start(now + idx * 0.07);
        osc.stop(now + idx * 0.07 + 0.3);
      });
    } catch {
      // safe fallback
    }
  }

  // Smooth Plasma Rocket Thruster Sound Synthesis
  private initThrusterSound() {
    if (!this.ctx || this.thrusterGain) return;
    try {
      const now = this.ctx.currentTime;

      // Master Thruster Gain Node (Starts silent at 0.0001)
      const masterGain = this.ctx.createGain();
      masterGain.gain.setValueAtTime(0.0001, now);
      masterGain.connect(this.output('engine'));
      this.thrusterGain = masterGain;

      // Dynamic Lowpass Filter (Warm plasma rushing tone)
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(260, now);
      filter.Q.setValueAtTime(1.2, now);
      filter.connect(masterGain);
      this.thrusterFilter = filter;

      // 1. Procedural Pink Noise Buffer (Smooth, non-fatiguing rushing wind)
      const bufferSize = this.ctx.sampleRate * 2;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
        b6 = white * 0.115926;
      }

      const noiseSource = this.ctx.createBufferSource();
      noiseSource.buffer = noiseBuffer;
      noiseSource.loop = true;
      noiseSource.connect(filter);
      noiseSource.start(now);
      this.thrusterNoiseSource = noiseSource;

      // 2. Sub-bass Harmonic Resonance Oscillator (Triangle wave for physical engine weight)
      const subOsc = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      subOsc.type = 'triangle';
      subOsc.frequency.setValueAtTime(54, now);
      subGain.gain.setValueAtTime(0.7, now);
      subOsc.connect(subGain);
      subGain.connect(filter);
      subOsc.start(now);
      this.thrusterSubOsc = subOsc;
    } catch {
      // safe fallback
    }
  }

  // Update rocket thruster sound dynamically based on pilot input
  public updateThrusterSound(thrust: number, isBoosting: boolean) {
    if (this.isMuted) {
      this.stopThrusterSound();
      return;
    }

    const isMoving = Math.abs(thrust) > 0.05;
    // Audio automation depends on throttle mode, not display refresh rate.
    // Avoid creating a running noise graph while the vehicle is idle.
    if (!isMoving && !this.isThrusterActive) return;
    if (isMoving && this.isThrusterActive && this.thrusterBoosting === isBoosting) {
      if (this.ctx?.state === 'suspended') this.initCtx();
      return;
    }

    this.initCtx();
    if (!this.ctx) return;
    if (!this.thrusterGain) {
      this.initThrusterSound();
    }
    if (!this.thrusterGain || !this.thrusterFilter || !this.thrusterSubOsc) return;

    const now = this.ctx.currentTime;

    if (isMoving) {
      // Soft target volume: ~0.038 for normal cruising, ~0.068 for turbo boost
      const targetVolume = isBoosting ? 0.068 : 0.036;
      // Filter cutoff: deeper 270Hz normal, 440Hz boosted
      const targetCutoff = isBoosting ? 440 : 270;
      // Sub-bass pitch: 54Hz normal, 68Hz boosted
      const targetPitch = isBoosting ? 68 : 54;

      this.thrusterGain.gain.setTargetAtTime(targetVolume, now, 0.08);
      this.thrusterFilter.frequency.setTargetAtTime(targetCutoff, now, 0.09);
      this.thrusterSubOsc.frequency.setTargetAtTime(targetPitch, now, 0.09);
      this.isThrusterActive = true;
      this.thrusterBoosting = isBoosting;
    } else if (this.isThrusterActive) {
      // Smooth decay to near-silence when releasing throttle
      this.thrusterGain.gain.setTargetAtTime(0.0001, now, 0.12);
      this.thrusterFilter.frequency.setTargetAtTime(200, now, 0.12);
      this.isThrusterActive = false;
    }
  }

  // Fade out thruster sound cleanly
  public stopThrusterSound() {
    if (this.isThrusterActive && this.thrusterGain && this.ctx) {
      const now = this.ctx.currentTime;
      this.thrusterGain.gain.setTargetAtTime(0.0001, now, 0.08);
    }
    this.isThrusterActive = false;
  }
}

export const sounds = new SoundEngine();
