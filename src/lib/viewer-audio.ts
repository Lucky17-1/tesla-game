/** Synthesized electric-motor tone, deliberately not labeled a Tesla recording. */
export class ViewerAudio {
  private context: AudioContext | null = null;
  private oscillators: OscillatorNode[] = [];
  private gain: GainNode | null = null;
  async start(muted: boolean) {
    this.stop();
    this.context ??= new AudioContext();
    await this.context.resume();
    const ctx = this.context;
    const gain = ctx.createGain();
    gain.gain.value = muted ? 0 : 0.035;
    gain.connect(ctx.destination);
    this.gain = gain;
    this.oscillators = [110, 220].map((frequency) => {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(frequency * 1.8, ctx.currentTime + 2);
      osc.connect(gain); osc.start();
      return osc;
    });
  }
  mute(muted: boolean) {
    if (this.context && this.gain) this.gain.gain.setTargetAtTime(muted ? 0 : 0.035, this.context.currentTime, 0.05);
  }
  stop() {
    this.oscillators.forEach((osc) => { osc.stop(); osc.disconnect(); });
    this.oscillators = [];
    this.gain?.disconnect(); this.gain = null;
  }
  dispose() { this.stop(); void this.context?.close(); this.context = null; }
}