// AudioManager.js - Gestionnaire audio refactorisé
class AudioManager {
    constructor(game = null) {
        this.game = game;
        this.audioContext = null;
        this.isPlaying = false;
        this.musicEnabled = true;
        this.masterVolume = 0.3;
        this.tempo = 120;
        this.noteTime = (60 / this.tempo) / 4;
        this.sequenceTimeout = null;
        this.activeNodes = [];
        
        // Gammes musicales
        this.scales = {
            major: [0, 2, 4, 5, 7, 9, 11],
            minor: [0, 2, 3, 5, 7, 8, 10],
            pentatonic: [0, 2, 4, 7, 9],
            dorian: [0, 2, 3, 5, 7, 9, 10]
        };
        
        this.currentScale = this.scales.pentatonic;
        this.baseFreq = 220;
        
        this.init();
    }
    
    async init() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            console.log('AudioManager initialisé');
        } catch (error) {
            console.warn('Web Audio API non supportée:', error);
        }
    }
    
    async activate() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            try {
                await this.audioContext.resume();
                console.log('AudioContext activé');
            } catch (error) {
                console.error('Erreur activation AudioContext:', error);
            }
        }
    }
      async playTrafficLightSequence() {
        await this.activate();
        
        return new Promise((resolve) => {
            // Feu rouge
            setTimeout(() => {
                this.playEffect('redLight');
                if (this.game && this.game.uiManager) {
                    this.game.uiManager.updateTrafficLight('red', true);
                }
            }, 1200);
            
            // Feu jaune
            setTimeout(() => {
                this.playEffect('yellowLight');
                if (this.game && this.game.uiManager) {
                    this.game.uiManager.updateTrafficLight('yellow', true);
                }
            }, 2000);
            
            // Feu vert
            setTimeout(() => {
                this.playEffect('greenLight');
                if (this.game && this.game.uiManager) {
                    this.game.uiManager.updateTrafficLight('red', false);
                    this.game.uiManager.updateTrafficLight('yellow', false);
                    this.game.uiManager.updateTrafficLight('green', true);
                }
                setTimeout(() => {
                    this.playEffect('start');
                    resolve();
                }, 300);
            }, 3500);
        });
    }
    
    playEffect(type) {
        if (!this.audioContext || !this.musicEnabled) return;
        
        // Activer l'AudioContext si nécessaire
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
        
        const startTime = this.audioContext.currentTime;
        
        switch (type) {
            case 'start':
                this.createTone(440, startTime, 0.5, 'square', 0.15);
                this.createTone(660, startTime + 0.1, 0.4, 'square', 0.1);
                break;
            case 'redLight':
                this.createTone(220, startTime, 0.6, 'sine', 0.12);
                this.createTone(165, startTime + 0.1, 0.5, 'sine', 0.08);
                break;
            case 'yellowLight':
                this.createTone(330, startTime, 0.4, 'triangle', 0.1);
                this.createTone(440, startTime + 0.2, 0.3, 'triangle', 0.08);
                break;
            case 'greenLight':
                this.createTone(660, startTime, 0.3, 'sawtooth', 0.15);
                this.createTone(880, startTime + 0.1, 0.3, 'sawtooth', 0.12);
                this.createTone(1100, startTime + 0.2, 0.2, 'sawtooth', 0.1);
                break;
            case 'lap':
                this.createTone(880, startTime, 0.2, 'sine', 0.1);
                this.createTone(1320, startTime + 0.1, 0.2, 'sine', 0.08);
                break;
            case 'collision':
                this.createDrumSound('snare', startTime, 0.2);
                break;
            case 'victory':
                const victoryNotes = [0, 2, 4, 7, 9];
                victoryNotes.forEach((note, index) => {
                    const freq = this.noteToFreq(note, 2);
                    this.createTone(freq, startTime + index * 0.15, 0.3, 'sine', 0.12);
                });
                break;
        }
    }
    
    createTone(freq, startTime, duration, type = 'sine', volume = 0.1) {
        if (!this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        const filterNode = this.audioContext.createBiquadFilter();
        
        oscillator.type = type;
        oscillator.frequency.setValueAtTime(freq, startTime);
        
        filterNode.type = 'lowpass';
        filterNode.frequency.setValueAtTime(2000, startTime);
        filterNode.Q.setValueAtTime(1, startTime);
        
        // Enveloppe ADSR
        const attack = 0.1;
        const decay = 0.2;
        const sustain = volume * 0.7;
        const release = 0.3;
        
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(volume, startTime + attack);
        gainNode.gain.linearRampToValueAtTime(sustain, startTime + attack + decay);
        gainNode.gain.setValueAtTime(sustain, startTime + duration - release);
        gainNode.gain.linearRampToValueAtTime(0, startTime + duration);
        
        oscillator.connect(filterNode);
        filterNode.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        const nodeGroup = { oscillator, gainNode, filterNode };
        this.activeNodes.push(nodeGroup);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
        
        oscillator.onended = () => {
            const index = this.activeNodes.indexOf(nodeGroup);
            if (index > -1) {
                this.activeNodes.splice(index, 1);
            }
        };
        
        return nodeGroup;
    }
    
    createDrumSound(type, startTime, volume = 0.1) {
        if (!this.audioContext) return;
        
        let freq, duration, filterFreq;
        
        switch (type) {
            case 'kick':
                freq = 60;
                duration = 0.5;
                filterFreq = 100;
                break;
            case 'snare':
                freq = 200;
                duration = 0.2;
                filterFreq = 2000;
                break;
            case 'hihat':
                freq = 8000;
                duration = 0.1;
                filterFreq = 12000;
                break;
        }
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        const filterNode = this.audioContext.createBiquadFilter();
        
        if (type === 'hihat') {
            const bufferSize = this.audioContext.sampleRate * duration;
            const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
            const output = buffer.getChannelData(0);
            
            for (let i = 0; i < bufferSize; i++) {
                output[i] = Math.random() * 2 - 1;
            }
            
            const noise = this.audioContext.createBufferSource();
            noise.buffer = buffer;
            
            filterNode.type = 'highpass';
            filterNode.frequency.setValueAtTime(filterFreq, startTime);
            
            gainNode.gain.setValueAtTime(0, startTime);
            gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
            
            noise.connect(filterNode);
            filterNode.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            const nodeGroup = { source: noise, gainNode, filterNode };
            this.activeNodes.push(nodeGroup);
            
            noise.start(startTime);
            noise.stop(startTime + duration);
            
            noise.onended = () => {
                const index = this.activeNodes.indexOf(nodeGroup);
                if (index > -1) {
                    this.activeNodes.splice(index, 1);
                }
            };
        } else {
            oscillator.type = type === 'kick' ? 'sine' : 'triangle';
            oscillator.frequency.setValueAtTime(freq, startTime);
            oscillator.frequency.exponentialRampToValueAtTime(freq * 0.1, startTime + duration);
            
            filterNode.type = 'lowpass';
            filterNode.frequency.setValueAtTime(filterFreq, startTime);
            
            gainNode.gain.setValueAtTime(0, startTime);
            gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
            
            oscillator.connect(filterNode);
            filterNode.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            const nodeGroup = { oscillator, gainNode, filterNode };
            this.activeNodes.push(nodeGroup);
            
            oscillator.start(startTime);
            oscillator.stop(startTime + duration);
            
            oscillator.onended = () => {
                const index = this.activeNodes.indexOf(nodeGroup);
                if (index > -1) {
                    this.activeNodes.splice(index, 1);
                }
            };
        }
    }
    
    noteToFreq(note, octave = 0) {
        const semitone = this.currentScale[note % this.currentScale.length];
        const octaveShift = Math.floor(note / this.currentScale.length) + octave;
        return this.baseFreq * Math.pow(2, (semitone + octaveShift * 12) / 12);
    }
    
    startRaceMusic() {
        if (!this.audioContext || !this.musicEnabled) return;
        
        this.tempo = 130;
        this.noteTime = (60 / this.tempo) / 4;
        this.currentScale = this.scales.dorian;
        
        if (!this.isPlaying) {
            this.playSequence();
        }
    }
    
    playSequence() {
        if (!this.audioContext || this.isPlaying) return;
        
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
        
        this.isPlaying = true;
        const startTime = this.audioContext.currentTime + 0.1;
        
        // Générer et jouer la musique
        const melody = this.generateMelody(32);
        const bassline = this.generateBass(8);
        const drums = this.generateDrums(32);
        
        this.playMelody(melody, startTime);
        this.playBass(bassline, startTime);
        this.playDrums(drums, startTime);
        
        const sequenceDuration = melody.reduce((total, note) => total + note.duration, 0);
        this.sequenceTimeout = setTimeout(() => {
            this.isPlaying = false;
            if (this.musicEnabled) {
                this.playSequence();
            }
        }, sequenceDuration * 1000);
    }
    
    generateMelody(length = 16, octaveRange = 2) {
        const melody = [];
        let currentNote = Math.floor(Math.random() * this.currentScale.length);
        
        for (let i = 0; i < length; i++) {
            const movement = Math.random();
            if (movement < 0.4) {
                currentNote += Math.floor(Math.random() * 3) + 1;
            } else if (movement < 0.8) {
                currentNote -= Math.floor(Math.random() * 3) + 1;
            }
            
            currentNote = Math.max(0, Math.min(currentNote, this.currentScale.length * octaveRange - 1));
            
            melody.push({
                note: currentNote,
                duration: this.noteTime * (Math.random() < 0.7 ? 1 : 2),
                volume: 0.05 + Math.random() * 0.05
            });
        }
        
        return melody;
    }
    
    generateBass(length = 8) {
        const bassline = [];
        const bassNotes = [0, 2, 4];
        
        for (let i = 0; i < length; i++) {
            const note = bassNotes[Math.floor(Math.random() * bassNotes.length)];
            bassline.push({
                note: note,
                duration: this.noteTime * 4,
                volume: 0.08
            });
        }
        
        return bassline;
    }
    
    generateDrums(length = 16) {
        const drums = [];
        
        for (let i = 0; i < length; i++) {
            const beat = {
                kick: i % 4 === 0,
                snare: i % 8 === 4,
                hihat: Math.random() < 0.6,
                duration: this.noteTime,
                volume: 0.1
            };
            drums.push(beat);
        }
        
        return drums;
    }
    
    playMelody(melody, startTime) {
        let currentTime = startTime;
        melody.forEach((note) => {
            const freq = this.noteToFreq(note.note, 1);
            this.createTone(freq, currentTime, note.duration, 'sawtooth', note.volume);
            currentTime += note.duration;
        });
    }
    
    playBass(bassline, startTime) {
        let currentTime = startTime;
        bassline.forEach((note) => {
            const freq = this.noteToFreq(note.note, -1);
            this.createTone(freq, currentTime, note.duration, 'sine', note.volume);
            currentTime += note.duration;
        });
    }
    
    playDrums(drums, startTime) {
        let currentTime = startTime;
        drums.forEach((beat) => {
            if (beat.kick) this.createDrumSound('kick', currentTime, beat.volume);
            if (beat.snare) this.createDrumSound('snare', currentTime, beat.volume * 0.8);
            if (beat.hihat) this.createDrumSound('hihat', currentTime, beat.volume * 0.5);
            currentTime += beat.duration;
        });
    }
    
    stopMusic() {
        this.isPlaying = false;
        
        if (this.sequenceTimeout) {
            clearTimeout(this.sequenceTimeout);
            this.sequenceTimeout = null;
        }
        
        this.stopAllActiveSounds();
    }
    
    stopAllActiveSounds() {
        if (!this.audioContext) return;
        
        const currentTime = this.audioContext.currentTime;
        
        this.activeNodes.forEach(nodeGroup => {
            try {
                if (nodeGroup.gainNode) {
                    nodeGroup.gainNode.gain.cancelScheduledValues(currentTime);
                    nodeGroup.gainNode.gain.setValueAtTime(0, currentTime);
                }
                
                if (nodeGroup.oscillator && nodeGroup.oscillator.stop) {
                    nodeGroup.oscillator.stop(currentTime + 0.01);
                }
                if (nodeGroup.source && nodeGroup.source.stop) {
                    nodeGroup.source.stop(currentTime + 0.01);
                }
            } catch (error) {
                console.debug('Node déjà arrêté:', error);
            }
        });
        
        this.activeNodes = [];
    }
    
    toggleMusic() {
        this.musicEnabled = !this.musicEnabled;
        
        if (!this.musicEnabled) {
            this.stopMusic();
        }
        
        return this.musicEnabled;
    }
    
    setVolume(volume) {
        this.masterVolume = Math.max(0, Math.min(1, volume));
    }
    
    changeVolume(delta) {
        this.setVolume(this.masterVolume + delta);
    }
}
