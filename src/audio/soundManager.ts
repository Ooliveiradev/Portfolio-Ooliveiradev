// Procedural Web Audio API sound generator - no external dependencies or loading issues

class SoundEngine {
  private ctx: AudioContext | null = null;
  public isMuted: boolean = false;

  // Ambient Cosmic Synth Drone Nodes
  private ambientOscs: OscillatorNode[] = [];
  private ambientGain: GainNode | null = null;
  private ambientFilter: BiquadFilterNode | null = null;
  private ambientLfo: OscillatorNode | null = null;
  private isAmbientPlaying: boolean = false;

  // Smooth Rocket Thruster Sound Nodes
  private thrusterNoiseSource: AudioBufferSourceNode | null = null;
  private thrusterSubOsc: OscillatorNode | null = null;
  private thrusterGain: GainNode | null = null;
  private thrusterFilter: BiquadFilterNode | null = null;
  private isThrusterActive: boolean = false;

  private initCtx() {
    if (!this.ctx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        this.ctx = new AudioCtxClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      this.stopAmbient();
      this.stopThrusterSound();
    } else {
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
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.05);
    } catch {
      // AudioContext error safe fallback
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
      gain.connect(this.ctx.destination);
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
      gain.connect(this.ctx.destination);
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
      subGain.connect(this.ctx.destination);
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
        gain.connect(this.ctx!.destination);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.2);
      });
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
        gain.connect(this.ctx!.destination);
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
        gain.connect(this.ctx!.destination);
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
      gain.connect(this.ctx.destination);
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
      subGain.connect(this.ctx.destination);
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
      gain.connect(this.ctx.destination);
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
      hissGain.connect(this.ctx.destination);
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
      gain.connect(this.ctx.destination);
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
      bellGain.connect(this.ctx.destination);
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
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 1.15);
    } catch {
      // safe fallback
    }
  }

  // Ambient Cosmic Synth Drone (Warm, relaxing, ethereal Dm9 chord with breathing LFO lowpass filter)
  public startAmbient() {
    if (this.isMuted || this.isAmbientPlaying) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;

      // Master Ambient Gain Node (Smooth fade-in over 2.5s)
      const masterGain = this.ctx.createGain();
      masterGain.gain.setValueAtTime(0.0001, now);
      masterGain.gain.exponentialRampToValueAtTime(0.035, now + 2.5);
      masterGain.connect(this.ctx.destination);
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

      this.isAmbientPlaying = true;
    } catch {
      // safe fallback
    }
  }

  public stopAmbient() {
    try {
      if (this.ambientGain && this.ctx) {
        const now = this.ctx.currentTime;
        this.ambientGain.gain.cancelScheduledValues(now);
        this.ambientGain.gain.setValueAtTime(this.ambientGain.gain.value, now);
        this.ambientGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);
      }

      setTimeout(() => {
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
      }, 1250);
    } catch {
      this.isAmbientPlaying = false;
    }
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
      gain.connect(this.ctx.destination);
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
      thudGain.connect(this.ctx.destination);
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
      gain.connect(this.ctx.destination);
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
        gain.connect(this.ctx!.destination);
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
      thudGain.connect(this.ctx.destination);
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
      metalGain.connect(this.ctx.destination);
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
        gain.connect(this.ctx!.destination);
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
      masterGain.connect(this.ctx.destination);
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

    this.initCtx();
    if (!this.ctx) return;
    if (!this.thrusterGain) {
      this.initThrusterSound();
    }
    if (!this.thrusterGain || !this.thrusterFilter || !this.thrusterSubOsc) return;

    const now = this.ctx.currentTime;
    const isMoving = Math.abs(thrust) > 0.05;

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
    } else if (this.isThrusterActive) {
      // Smooth decay to near-silence when releasing throttle
      this.thrusterGain.gain.setTargetAtTime(0.0001, now, 0.12);
      this.thrusterFilter.frequency.setTargetAtTime(200, now, 0.12);
      this.isThrusterActive = false;
    }
  }

  // Fade out thruster sound cleanly
  public stopThrusterSound() {
    if (this.thrusterGain && this.ctx) {
      const now = this.ctx.currentTime;
      this.thrusterGain.gain.setTargetAtTime(0.0001, now, 0.08);
    }
    this.isThrusterActive = false;
  }
}

export const sounds = new SoundEngine();
