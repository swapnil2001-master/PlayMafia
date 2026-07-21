/**
 * Play a beautiful, premium morning chime using the Web Audio API.
 * This is completely offline, lightweight, and requires no external audio assets.
 */
export function playMorningSound() {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    const playNote = (freq: number, startTime: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      // Use a triangle wave for a softer, warmer bell-like timbre
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, startTime);

      // Attack, Decay, Sustain, Release envelope
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.25, startTime + 0.03); // Quick attack
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration); // Smooth decay

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    const now = ctx.currentTime;
    // Play a bright, ascending major arpeggio (C5 -> E5 -> G5 -> C6)
    playNote(523.25, now, 0.8);        // C5
    playNote(659.25, now + 0.12, 0.8);  // E5
    playNote(783.99, now + 0.24, 0.8);  // G5
    playNote(1046.50, now + 0.36, 1.2); // C6
  } catch (e) {
    console.error("Failed to play morning sound:", e);
  }
}
