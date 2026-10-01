// Web Audio API & Haptic Feedback Engine for Warehouse Scanning - Optimized for Maximum Loudness & Clarity

let audioCtx = null;

function getAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export const soundManager = {
  muted: false,
  hapticEnabled: true,

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  },

  toggleHaptic() {
    this.hapticEnabled = !this.hapticEnabled;
    return this.hapticEnabled;
  },

  vibrate(pattern) {
    if (!this.hapticEnabled) return;
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(pattern);
      } catch {
        // Ignore haptic errors on unsupported devices
      }
    }
  },

  // 1. Quét bình thường +1 (Âm thanh Tít lớn, đanh, chuẩn máy bắn mã vạch chuyên dụng)
  playScanBeep() {
    this.vibrate(60);
    if (this.muted) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      // Sử dụng square wave kết hợp filter lowpass cho tiếng bíp to, đanh, rõ nét như máy Zebra / Honeywell
      osc.type = 'square';
      osc.frequency.setValueAtTime(1850, now);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(4500, now);

      // ÂM LƯỢNG LỚN (0.85)
      gain.gain.setValueAtTime(0.85, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.10);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.10);
    } catch (e) {
      console.warn('Audio play error:', e);
    }
  },

  // 2. Quét vừa đủ số lượng yêu cầu (Âm thanh vang vui tai, âm lượng lớn)
  playItemCompleted() {
    this.vibrate([70, 50, 140]);
    if (this.muted) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      // Note 1: 880Hz (A5)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(880, now);
      gain1.gain.setValueAtTime(0.85, now);
      gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.14);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.14);

      // Note 2: 1320Hz (E6) vang cao
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(1320, now + 0.11);
      gain2.gain.setValueAtTime(0.9, now + 0.11);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.11);
      osc2.stop(now + 0.35);
    } catch (e) {
      console.warn('Audio play error:', e);
    }
  },

  // 3. Quét bị DƯ số lượng (Âm báo cảnh báo trầm, to rõ)
  playWarningOver() {
    this.vibrate([160, 70, 160]);
    if (this.muted) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(450, now);
      osc.frequency.linearRampToValueAtTime(280, now + 0.28);

      gain.gain.setValueAtTime(0.85, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.30);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.30);
    } catch (e) {
      console.warn('Audio play error:', e);
    }
  },

  // 4. Mã LẠ (Không có trong danh sách xuất kho - Âm còi báo động to)
  playErrorUnknown() {
    this.vibrate([140, 80, 200, 80, 250]);
    if (this.muted) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(240, now);
      osc.frequency.setValueAtTime(160, now + 0.15);

      gain.gain.setValueAtTime(0.95, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.40);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.40);
    } catch (e) {
      console.warn('Audio play error:', e);
    }
  },

  // 5. Hoàn tất toàn bộ đơn kiểm kê 100%
  playAllDoneChime() {
    this.vibrate([100, 50, 100, 50, 200]);
    if (this.muted) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const notes = [587.33, 739.99, 880.00, 1174.66]; // D5, F#5, A5, D6
      const now = ctx.currentTime;
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.12);
        gain.gain.setValueAtTime(0.8, now + idx * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.45);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.12);
        osc.stop(now + idx * 0.12 + 0.45);
      });
    } catch (e) {
      console.warn('Audio play error:', e);
    }
  }
};
