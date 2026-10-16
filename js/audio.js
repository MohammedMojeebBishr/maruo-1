/**
 * audio.js - Sound system using Web Audio API
 * All sounds are procedurally generated (no external files needed)
 * Can easily be swapped with real audio files later
 */

class AudioManager {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.musicGain = null;
        this.sfxGain = null;
        this.musicEnabled = true;
        this.sfxEnabled = true;
        this.volume = 0.7;
        this.currentMusic = null;
        this.musicOscillators = [];
        this._init();
    }

    _init() {
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.value = this.volume;
            this.masterGain.connect(this.ctx.destination);

            this.musicGain = this.ctx.createGain();
            this.musicGain.gain.value = 0.35;
            this.musicGain.connect(this.masterGain);

            this.sfxGain = this.ctx.createGain();
            this.sfxGain.gain.value = 0.7;
            this.sfxGain.connect(this.masterGain);
        } catch(e) {
            console.warn('Web Audio API not supported');
        }
    }

    _resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    setVolume(v) {
        this.volume = v;
        if (this.masterGain) this.masterGain.gain.value = v;
    }

    setMusicEnabled(enabled) {
        this.musicEnabled = enabled;
        if (!enabled) this.stopMusic();
        else this.playBgMusic();
    }

    setSfxEnabled(enabled) {
        this.sfxEnabled = enabled;
    }

    // === SFX Methods ===
    _playTone(freq, type, duration, gain, delay = 0) {
        if (!this.ctx || !this.sfxEnabled) return;
        this._resume();
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.connect(g);
        g.connect(this.sfxGain);
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime + delay);
        g.gain.setValueAtTime(gain, this.ctx.currentTime + delay);
        g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + delay + duration);
        osc.start(this.ctx.currentTime + delay);
        osc.stop(this.ctx.currentTime + delay + duration);
    }

    playJump() {
        if (!this.ctx || !this.sfxEnabled) return;
        this._resume();
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.connect(g);
        g.connect(this.sfxGain);
        osc.type = 'square';
        osc.frequency.setValueAtTime(300, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(700, this.ctx.currentTime + 0.12);
        g.gain.setValueAtTime(0.4, this.ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.18);
        osc.start(this.ctx.currentTime);
        osc.stop(this.ctx.currentTime + 0.2);
    }

    playCoin() {
        if (!this.ctx || !this.sfxEnabled) return;
        this._resume();
        this._playTone(880, 'sine', 0.08, 0.5);
        this._playTone(1320, 'sine', 0.1, 0.4, 0.06);
    }

    playEnemyHit() {
        if (!this.ctx || !this.sfxEnabled) return;
        this._resume();
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.connect(g);
        g.connect(this.sfxGain);
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(60, this.ctx.currentTime + 0.25);
        g.gain.setValueAtTime(0.5, this.ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);
        osc.start(this.ctx.currentTime);
        osc.stop(this.ctx.currentTime + 0.3);
    }

    playDamage() {
        if (!this.ctx || !this.sfxEnabled) return;
        this._resume();
        for (let i = 0; i < 3; i++) {
            this._playTone(180 - i * 30, 'square', 0.12, 0.4, i * 0.1);
        }
    }

    playCheckpoint() {
        if (!this.ctx || !this.sfxEnabled) return;
        this._resume();
        const notes = [523, 659, 784, 1047];
        notes.forEach((f, i) => this._playTone(f, 'sine', 0.2, 0.4, i * 0.1));
    }

    playLevelComplete() {
        if (!this.ctx || !this.sfxEnabled) return;
        this._resume();
        const notes = [523, 659, 784, 1047, 1319];
        notes.forEach((f, i) => this._playTone(f, 'sine', 0.25, 0.5, i * 0.12));
    }

    playGameOver() {
        if (!this.ctx || !this.sfxEnabled) return;
        this._resume();
        const notes = [440, 330, 220, 110];
        notes.forEach((f, i) => this._playTone(f, 'square', 0.3, 0.4, i * 0.2));
    }

    playMenuClick() {
        if (!this.ctx || !this.sfxEnabled) return;
        this._resume();
        this._playTone(600, 'sine', 0.1, 0.3);
    }

    // === Background Music ===
    playBgMusic() {
        if (!this.ctx || !this.musicEnabled) return;
        this._resume();
        this.stopMusic();

        // Simple chiptune melody
        const melody = [
            {n:523,d:0.25},{n:659,d:0.25},{n:784,d:0.25},{n:659,d:0.25},
            {n:523,d:0.25},{n:440,d:0.25},{n:392,d:0.5},
            {n:523,d:0.25},{n:659,d:0.25},{n:784,d:0.25},{n:880,d:0.25},
            {n:784,d:0.25},{n:659,d:0.25},{n:523,d:0.5},
        ];

        const bass = [
            {n:131,d:0.5},{n:131,d:0.5},{n:110,d:0.5},{n:110,d:0.5},
            {n:131,d:0.5},{n:131,d:0.5},{n:110,d:0.5},{n:110,d:0.5},
        ];

        const totalDuration = melody.reduce((s, n) => s + n.d, 0);

        const playMelody = () => {
            let t = this.ctx.currentTime;
            melody.forEach(note => {
                const osc = this.ctx.createOscillator();
                const g = this.ctx.createGain();
                osc.connect(g);
                g.connect(this.musicGain);
                osc.type = 'square';
                osc.frequency.setValueAtTime(note.n, t);
                g.gain.setValueAtTime(0.25, t);
                g.gain.setValueAtTime(0.25, t + note.d - 0.03);
                g.gain.linearRampToValueAtTime(0, t + note.d);
                osc.start(t);
                osc.stop(t + note.d);
                this.musicOscillators.push(osc);
                t += note.d;
            });
        };

        const playBass = () => {
            let t = this.ctx.currentTime;
            bass.forEach(note => {
                const osc = this.ctx.createOscillator();
                const g = this.ctx.createGain();
                osc.connect(g);
                g.connect(this.musicGain);
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(note.n, t);
                g.gain.setValueAtTime(0.15, t);
                g.gain.exponentialRampToValueAtTime(0.001, t + note.d);
                osc.start(t);
                osc.stop(t + note.d);
                this.musicOscillators.push(osc);
                t += note.d;
            });
        };

        playMelody();
        playBass();

        this._musicLoop = setInterval(() => {
            if (this.musicEnabled) {
                this.musicOscillators = [];
                playMelody();
                playBass();
            }
        }, totalDuration * 1000);
    }

    stopMusic() {
        if (this._musicLoop) {
            clearInterval(this._musicLoop);
            this._musicLoop = null;
        }
        this.musicOscillators.forEach(o => {
            try { o.stop(); } catch(e){}
        });
        this.musicOscillators = [];
    }
}

window.audioManager = new AudioManager();
