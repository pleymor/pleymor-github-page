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
        this.currentMusicElement = null;

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

        // Apply master volume to individual volume
        const adjustedVolume = volume * this.masterVolume;

        // Enveloppe ADSR
        const attack = 0.1;
        const decay = 0.2;
        const sustain = adjustedVolume * 0.7;
        const release = 0.3;

        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(adjustedVolume, startTime + attack);
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

            // Apply master volume
            const adjustedVolume = volume * this.masterVolume;

            gainNode.gain.setValueAtTime(0, startTime);
            gainNode.gain.linearRampToValueAtTime(adjustedVolume, startTime + 0.01);
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

            // Apply master volume
            const adjustedVolume = volume * this.masterVolume;

            gainNode.gain.setValueAtTime(0, startTime);
            gainNode.gain.linearRampToValueAtTime(adjustedVolume, startTime + 0.01);
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

    getMp3FilesFromAssets() {
        return [
            'assets/musics/jazzy-electric-218797.mp3',
            'assets/musics/lan-party-142331.mp3',
            'assets/musics/okay.mp3',
            'assets/musics/ripples-in-a-puddle-349233.mp3',
            'assets/musics/shattered-339166.mp3',
            'assets/musics/subterfuge-342945.mp3',
            'assets/musics/synthetiseur-fire-remix-216315.mp3',
            'assets/musics/time-to-332609.mp3',
        ];
    }

    /**
     * Joue un mp3 au hasard, présent dans le dossier assets/musics
     */
    playRaceMusic() {
        if (!this.audioContext || !this.musicEnabled) return;

        // Stop any currently playing music first
        this.stopRaceMusic();

        const musicFiles = this.getMp3FilesFromAssets();

        const randomIndex = Math.floor(Math.random() * musicFiles.length);
        const musicFile = musicFiles[randomIndex];

        this.audioContext.resume().then(() => {
            this.currentMusicElement = new Audio(musicFile);
            this.currentMusicElement.loop = true;
            this.currentMusicElement.volume = this.masterVolume;
            this.currentMusicElement.play().catch(error => {
                console.error('Erreur lors de la lecture de la musique:', error);
            });
            this.isPlaying = true;
        });
    }

    stopRaceMusic() {
        this.isPlaying = false;
        console.log('Arrêt de la musique');

        // Stop and clean up the current music element
        if (this.currentMusicElement) {
            this.currentMusicElement.pause();
            this.currentMusicElement.currentTime = 0;
            this.currentMusicElement = null;
        }

        // Suspend the AudioContext for other sounds
        if (this.audioContext) {
            this.audioContext.suspend().then(() => {
                console.log('AudioContext suspendu');
            }).catch(error => {
                console.error('Erreur lors de la suspension de l\'AudioContext:', error);
            });
        }
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

    toggleTheMusic() {
        this.musicEnabled = !this.musicEnabled;
        console.log('toggleTheMusic - musicEnabled:', this.musicEnabled);

        if (!this.musicEnabled) {
            console.log('Désactivation de la musique');
            this.stopRaceMusic();
        } else {
            console.log('Activation de la musique');
            // Activer l'AudioContext au cas où il serait suspendu
            this.activate();

            // Redémarrer la musique si le jeu est en cours
            if (this.game && this.game.gameStarted && !this.game.raceFinished) {
                console.log('Conditions remplies pour redémarrer la musique - gameStarted:', this.game.gameStarted, 'raceFinished:', this.game.raceFinished);
                this.playRaceMusic();
            } else {
                console.log('Conditions non remplies pour redémarrer la musique - game:', !!this.game, 'gameStarted:', this.game?.gameStarted, 'raceFinished:', this.game?.raceFinished);
            }
        }

        return this.musicEnabled;
    }

    setVolume(volume) {
        this.masterVolume = Math.max(0, Math.min(1, volume));

        // Update all active nodes with the new volume
        this.updateActiveNodesVolume();

        // Update the volume of the currently playing music
        if (this.currentMusicElement) {
            this.currentMusicElement.volume = this.masterVolume;
        }

        // Update the volume slider if the UI manager exists
        if (this.game && this.game.uiManager) {
            this.game.uiManager.updateVolumeSlider();
        }
    }

    updateActiveNodesVolume() {
        // No active nodes or no audio context, nothing to update
        if (!this.audioContext || this.activeNodes.length === 0) return;

        const currentTime = this.audioContext.currentTime;

        // Adjust gain for all active nodes
        this.activeNodes.forEach(nodeGroup => {
            if (nodeGroup.gainNode && !nodeGroup.originalVolume) {
                // Store the original volume if not stored yet
                const currentValue = nodeGroup.gainNode.gain.value;
                nodeGroup.originalVolume = currentValue > 0 ? currentValue / this.masterVolume : 0.1;

                // Apply new volume
                if (currentValue > 0) { // Only adjust if the sound is active (not in release phase)
                    nodeGroup.gainNode.gain.cancelScheduledValues(currentTime);
                    nodeGroup.gainNode.gain.setValueAtTime(nodeGroup.originalVolume * this.masterVolume, currentTime);
                }
            }
        });
    }

    changeVolume(delta) {
        this.setVolume(this.masterVolume + delta);
    }
}
