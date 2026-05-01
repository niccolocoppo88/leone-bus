/**
 * Leone Bus - Audio Manager
 * Sintesi audio con Web Audio API - zero file esterni
 */

// ==================== AudioManager ==================== //

class AudioManager {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.bgmGain = null;
    this.sfxGain = null;
    this.bgmOscillators = [];
    this.isPlaying = false;
    this.bgmInterval = null;
  }

  // Inizializza AudioContext al primo gesture dell'utente
  init() {
    if (this.ctx) return;

    this.ctx = new (window.AudioContext || window.webkitAudioContext)();

    // Master gain
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.5;
    this.masterGain.connect(this.ctx.destination);

    // BGM gain indipendente
    this.bgmGain = this.ctx.createGain();
    this.bgmGain.gain.value = 0.3;
    this.bgmGain.connect(this.masterGain);

    // SFX gain indipendente
    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.value = 0.6;
    this.sfxGain.connect(this.masterGain);
  }

  // Helper per creare un'onda sonora
  playTone(frequency, duration, type = 'square', volume = 0.5, startTime = null) {
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, startTime || this.ctx.currentTime);

    gain.gain.setValueAtTime(volume, startTime || this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, (startTime || this.ctx.currentTime) + duration);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(startTime || this.ctx.currentTime);
    osc.stop((startTime || this.ctx.currentTime) + duration);
  }

  // Suono stella raccolta: ding 880Hz → 1760Hz, 100ms
  playStarCollect() {
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(880, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1760, this.ctx.currentTime + 0.1);

    gain.gain.setValueAtTime(0.4, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.15);
  }

  // Suono hit: boing triangle 200→100Hz, 200ms
  playHit() {
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(200, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.2);

    gain.gain.setValueAtTime(0.5, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.25);
  }

  // Suono arrivo fermata: ding dong 523+392Hz
  playStationArrive() {
    if (!this.ctx) return;

    // Prima nota: 523Hz (Do)
    this.playTone(523, 0.2, 'square', 0.3);
    // Seconda nota: 392Hz (Sol) dopo 150ms
    this.playTone(392, 0.3, 'square', 0.3, this.ctx.currentTime + 0.15);
  }

  // Suono fermata completata: yay
  playStationComplete() {
    if (!this.ctx) return;

    // Yay: arpeggio ascendente rumoroso
    const baseFreqs = [523, 659, 784];
    baseFreqs.forEach((freq, i) => {
      this.playTone(freq, 0.15, 'square', 0.25, this.ctx.currentTime + i * 0.08);
    });
  }

  // Fanfara vittoria: arpeggio 523 659 784 1047
  playVictory() {
    if (!this.ctx) return;

    const notes = [523, 659, 784, 1047];
    notes.forEach((freq, i) => {
      this.playTone(freq, 0.3, 'square', 0.35, this.ctx.currentTime + i * 0.15);
    });
  }

  // Suono bus in movimento: squeak noise burst 50ms
  playBusMove() {
    if (!this.ctx) return;

    // Creiamo un burst di rumore bianco
    const bufferSize = this.ctx.sampleRate * 0.05; // 50ms
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.5;
    }

    const noise = this.ctx.createBufferSource();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    noise.buffer = buffer;
    filter.type = 'highpass';
    filter.frequency.value = 2000;

    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start();
    noise.stop(this.ctx.currentTime + 0.05);
  }

  // BGM: melodia allegra Do Mi Sol La in loop
  startBGM() {
    if (!this.ctx || this.isPlaying) return;

    this.isPlaying = true;

    // Note della melodia: Do Mi Sol La
    // Secondi per nota a 120 BPM (beat = 0.5s per nota)
    const beatDuration = 0.25; // 120 BPM = 120/60 = 2 beat/s, 1 beat = 0.5s
    // Usiamo note da 1/8 (0.25s ciascuna)

    const melody = [
      // [frequenza, durata in beat]
      [523, 1], // Do
      [659, 1], // Mi
      [784, 1], // Sol
      [880, 1], // La
      [523, 1], // Do
      [659, 1], // Mi
      [784, 1], // Sol
      [880, 1], // La
      // Seconda frase
      [698, 1], // Fa
      [880, 1], // La
      [1047, 1], // Do+1
      [1175, 1], // Re+1
      [698, 1], // Fa
      [880, 1], // La
      [1047, 1], // Do+1
      [1175, 1], // Re+1
      // Terza frase
      [784, 1], // Sol
      [988, 1], // Si
      [1175, 1], // Re+1
      [1319, 1], // Mi+1
      [784, 1], // Sol
      [988, 1], // Si
      [1175, 1], // Re+1
      [1319, 1], // Mi+1
      // Pausa 2 beat
      [0, 2],
    ];

    let noteIndex = 0;
    const playNextNote = () => {
      if (!this.isPlaying) return;

      const [freq, beats] = melody[noteIndex];
      const duration = beats * beatDuration;

      if (freq > 0) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

        gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration * 0.9);

        osc.connect(gain);
        gain.connect(this.bgmGain);

        osc.start();
        osc.stop(this.ctx.currentTime + duration);
      }

      noteIndex = (noteIndex + 1) % melody.length;

      this.bgmInterval = setTimeout(playNextNote, duration * 1000);
    };

    playNextNote();
  }

  // Ferma BGM
  stopBGM() {
    this.isPlaying = false;
    if (this.bgmInterval) {
      clearTimeout(this.bgmInterval);
      this.bgmInterval = null;
    }
  }

  // Mute/unmute
  setMuted(muted) {
    if (this.masterGain) {
      this.masterGain.gain.value = muted ? 0 : 0.5;
    }
  }
}

// Istanza globale
const audioManager = new AudioManager();

// Esporta per uso nel gioco
window.audioManager = audioManager;
