/**
 * Web Audio manager for VoltEdge Circuit. All sound is synthesized — no
 * audio files. The AudioContext is created lazily on the first user gesture.
 */
class AudioManager {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private muted = false;
  private engineOsc: OscillatorNode | null = null;
  private engineGain: GainNode | null = null;
  private engineSub: OscillatorNode | null = null;

  constructor() {
    if (typeof window !== "undefined") {
      try {
        this.muted = localStorage.getItem("voltedge-muted") === "1";
      } catch {
        // ignore
      }
    }
  }

  get isMuted() {
    return this.muted;
  }

  init() {
    if (this.ctx) {
      if (this.ctx.state === "suspended") void this.ctx.resume();
      return;
    }
    try {
      this.ctx = new AudioContext();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.5;
      this.master.connect(this.ctx.destination);
    } catch {
      this.ctx = null;
    }
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    try {
      localStorage.setItem("voltedge-muted", muted ? "1" : "0");
    } catch {
      // ignore
    }
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(muted ? 0 : 0.5, this.ctx.currentTime, 0.05);
    }
  }

  toggleMute() {
    this.setMuted(!this.muted);
    return this.muted;
  }

  private noiseBuffer(): AudioBuffer | null {
    if (!this.ctx) return null;
    const buffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.4, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    return buffer;
  }

  /* ---------- Engine loop ---------- */

  startEngine() {
    if (!this.ctx || !this.master || this.engineOsc) return;
    const ctx = this.ctx;
    this.engineOsc = ctx.createOscillator();
    this.engineOsc.type = "sawtooth";
    this.engineOsc.frequency.value = 55;
    // Sub-octave for body
    this.engineSub = ctx.createOscillator();
    this.engineSub.type = "triangle";
    this.engineSub.frequency.value = 27;
    this.engineGain = ctx.createGain();
    this.engineGain.gain.value = 0;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 700;
    this.engineOsc.connect(filter);
    this.engineSub.connect(filter);
    filter.connect(this.engineGain);
    this.engineGain.connect(this.master);
    this.engineOsc.start();
    this.engineSub.start();
  }

  updateEngine(speedMs: number, throttle: boolean) {
    if (!this.engineOsc || !this.engineGain || !this.engineSub || !this.ctx) return;
    const t = this.ctx.currentTime;
    const freq = 50 + speedMs * 2.6;
    this.engineOsc.frequency.setTargetAtTime(freq, t, 0.08);
    this.engineSub.frequency.setTargetAtTime(freq / 2, t, 0.08);
    const vol = 0.02 + (throttle ? 0.05 : 0.015) + speedMs * 0.0012;
    this.engineGain.gain.setTargetAtTime(vol, t, 0.1);
  }

  stopEngine() {
    if (!this.engineOsc || !this.engineGain || !this.ctx) {
      this.engineOsc = this.engineGain = this.engineSub = null;
      return;
    }
    const t = this.ctx.currentTime;
    this.engineGain.gain.setTargetAtTime(0, t, 0.08);
    this.engineOsc.stop(t + 0.3);
    this.engineSub?.stop(t + 0.3);
    this.engineOsc = this.engineGain = this.engineSub = null;
  }

  /* ---------- One-shot effects ---------- */

  playCrash() {
    if (!this.ctx || !this.master) return;
    const ctx = this.ctx;
    const t = ctx.currentTime;
    const buffer = this.noiseBuffer();
    if (buffer) {
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(2500, t);
      filter.frequency.exponentialRampToValueAtTime(200, t + 0.5);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.6, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.master);
      noise.start();
      noise.stop(t + 0.5);
    }
    const boom = ctx.createOscillator();
    boom.type = "sine";
    boom.frequency.setValueAtTime(120, t);
    boom.frequency.exponentialRampToValueAtTime(30, t + 0.4);
    const boomGain = ctx.createGain();
    boomGain.gain.setValueAtTime(0.5, t);
    boomGain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
    boom.connect(boomGain);
    boomGain.connect(this.master);
    boom.start();
    boom.stop(t + 0.5);
  }

  playPickup() {
    if (!this.ctx || !this.master) return;
    const ctx = this.ctx;
    const t = ctx.currentTime;
    [523, 659, 784].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = "square";
      osc.frequency.value = freq;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.12, t + i * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.05 + 0.12);
      osc.connect(gain);
      if (this.master) gain.connect(this.master);
      osc.start(t + i * 0.05);
      osc.stop(t + i * 0.05 + 0.14);
    });
  }

  playNearMiss() {
    if (!this.ctx || !this.master) return;
    const ctx = this.ctx;
    const t = ctx.currentTime;
    const buffer = this.noiseBuffer();
    if (!buffer) return;
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(400, t);
    filter.frequency.exponentialRampToValueAtTime(2200, t + 0.2);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.25, t + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    noise.start();
    noise.stop(t + 0.3);
  }

  playUi() {
    if (!this.ctx || !this.master) return;
    const ctx = this.ctx;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = "square";
    osc.frequency.setValueAtTime(660, t);
    osc.frequency.exponentialRampToValueAtTime(880, t + 0.06);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.08, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start();
    osc.stop(t + 0.12);
  }

  playGameOver() {
    if (!this.ctx || !this.master) return;
    const ctx = this.ctx;
    const t = ctx.currentTime;
    [392, 311, 262, 196].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = "triangle";
      osc.frequency.value = freq;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.15, t + i * 0.16);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.16 + 0.3);
      osc.connect(gain);
      if (this.master) gain.connect(this.master);
      osc.start(t + i * 0.16);
      osc.stop(t + i * 0.16 + 0.32);
    });
  }
}

export const audio = new AudioManager();

if (typeof document !== "undefined") {
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && audio["ctx"]) {
      void audio["ctx"].resume?.();
    }
  });
}
