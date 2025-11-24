
class AudioManager {
  private audioCtx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isMusicPlaying: boolean = false;
  
  private musicVolume: number = 0.3;
  private sfxVolume: number = 0.5;

  // Sequencer state
  private schedulerTimer: number | null = null;
  private nextNoteTime: number = 0;
  private currentNoteIndex: number = 0;
  private tempo: number = 110; 

  // Mystery Theme Sequence (Frequency, Duration in 16th notes)
  // A dark, driving bassline and melody
  private sequence = [
    // Bar 1
    { freq: 110.00, dur: 2 }, // A2
    { freq: 220.00, dur: 2 }, // A3
    { freq: 130.81, dur: 2 }, // C3
    { freq: 164.81, dur: 2 }, // E3
    { freq: 196.00, dur: 2 }, // G3
    { freq: 164.81, dur: 2 }, // E3
    { freq: 130.81, dur: 2 }, // C3
    { freq: 123.47, dur: 2 }, // B2
    // Bar 2
    { freq: 103.83, dur: 2 }, // G#2
    { freq: 207.65, dur: 2 }, // G#3
    { freq: 123.47, dur: 2 }, // B2
    { freq: 164.81, dur: 2 }, // E3
    { freq: 174.61, dur: 2 }, // F3
    { freq: 164.81, dur: 2 }, // E3
    { freq: 123.47, dur: 2 }, // B2
    { freq: 207.65, dur: 2 }, // G#3
  ];

  constructor() {
    // Initialize on first user interaction
  }

  private init() {
    if (!this.audioCtx) {
      this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterGain = this.audioCtx.createGain();
      this.masterGain.connect(this.audioCtx.destination);
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  setVolumes(music: number, sfx: number) {
    this.musicVolume = music;
    this.sfxVolume = sfx;
  }

  playClick() {
    this.init();
    if (!this.audioCtx || this.sfxVolume === 0) return;

    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.connect(gain);
    gain.connect(this.masterGain!);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, this.audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, this.audioCtx.currentTime + 0.05);
    
    gain.gain.setValueAtTime(this.sfxVolume * 0.5, this.audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.05);

    osc.start();
    osc.stop(this.audioCtx.currentTime + 0.05);
  }

  playRetry() {
    this.init();
    if (!this.audioCtx || this.sfxVolume === 0) return;

    const now = this.audioCtx.currentTime;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.connect(gain);
    gain.connect(this.masterGain!);

    // Rising pitch effect for retry/reload
    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.linearRampToValueAtTime(600, now + 0.2);
    
    gain.gain.setValueAtTime(this.sfxVolume * 0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

    osc.start();
    osc.stop(now + 0.2);
  }

  playCorrect() {
    this.init();
    if (!this.audioCtx || this.sfxVolume === 0) return;

    const now = this.audioCtx.currentTime;
    const masterSFX = this.audioCtx.createGain();
    masterSFX.connect(this.masterGain!);
    masterSFX.gain.value = this.sfxVolume;

    const notes = [523.25, 659.25, 783.99, 987.77, 1046.50]; // C Major 7
    
    notes.forEach((freq, i) => {
      const osc = this.audioCtx!.createOscillator();
      const gain = this.audioCtx!.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      
      osc.connect(gain);
      gain.connect(masterSFX);
      
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.1, now + 0.05 + (i * 0.05));
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
      
      osc.start(now);
      osc.stop(now + 2);
    });
  }

  playWrong() {
    this.init();
    if (!this.audioCtx || this.sfxVolume === 0) return;

    const now = this.audioCtx.currentTime;
    const osc1 = this.audioCtx.createOscillator();
    const osc2 = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(100, now);
    osc1.frequency.linearRampToValueAtTime(60, now + 0.5);

    osc2.type = 'square';
    osc2.frequency.setValueAtTime(106, now); 
    osc2.frequency.linearRampToValueAtTime(64, now + 0.5);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.masterGain!);

    gain.gain.setValueAtTime(this.sfxVolume * 0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

    osc1.start();
    osc2.start();
    osc1.stop(now + 0.5);
    osc2.stop(now + 0.5);
  }

  toggleMusic(shouldPlay: boolean) {
    this.init();
    if (!this.audioCtx) return;

    if (shouldPlay && !this.isMusicPlaying) {
        this.isMusicPlaying = true;
        this.nextNoteTime = this.audioCtx.currentTime + 0.1;
        this.currentNoteIndex = 0;
        this.scheduler();
    } else if (!shouldPlay && this.isMusicPlaying) {
        this.isMusicPlaying = false;
        if (this.schedulerTimer) clearTimeout(this.schedulerTimer);
    }
  }

  private scheduler() {
    if (!this.isMusicPlaying || !this.audioCtx) return;

    // Schedule notes up to 0.1s ahead (Lookahead)
    while (this.nextNoteTime < this.audioCtx.currentTime + 0.1) {
      this.scheduleNote(this.nextNoteTime);
      this.advanceNote();
    }
    
    this.schedulerTimer = window.setTimeout(() => this.scheduler(), 25);
  }

  private scheduleNote(time: number) {
    if (!this.audioCtx) return;

    const noteData = this.sequence[this.currentNoteIndex % this.sequence.length];
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    const filter = this.audioCtx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.value = noteData.freq;

    // Filter for dark ambient sound
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(400, time);
    filter.frequency.exponentialRampToValueAtTime(100, time + (noteData.dur * 0.2));
    
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain!);

    // Envelope
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(this.musicVolume * 0.3, time + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, time + (60 / this.tempo) * (noteData.dur * 0.25));

    osc.start(time);
    osc.stop(time + 1); // Safety stop
  }

  private advanceNote() {
    const noteData = this.sequence[this.currentNoteIndex % this.sequence.length];
    const secondsPerBeat = 60.0 / this.tempo;
    this.nextNoteTime += 0.25 * secondsPerBeat * noteData.dur; 
    this.currentNoteIndex++;
  }
}

export const audioManager = new AudioManager();
