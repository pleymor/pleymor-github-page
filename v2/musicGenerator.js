// Générateur de musique aléatoire pour le jeu de karting
class MusicGenerator {    constructor() {
        this.audioContext = null;
        this.isPlaying = false;
        this.currentTrack = null;
        this.masterVolume = 0.3;
        this.tempo = 120; // BPM
        this.noteTime = (60 / this.tempo) / 4; // Durée d'une note (16ème)
        this.sequenceTimeout = null; // Pour pouvoir annuler les séquences programmées
        this.activeNodes = []; // Suivi de tous les nodes audio actifs
        
        // Gammes musicales pour la génération
        this.scales = {
            major: [0, 2, 4, 5, 7, 9, 11],
            minor: [0, 2, 3, 5, 7, 8, 10],
            pentatonic: [0, 2, 4, 7, 9],
            dorian: [0, 2, 3, 5, 7, 9, 10]
        };
        
        this.currentScale = this.scales.pentatonic;
        this.baseFreq = 220; // La3
        
        this.init();
    }
    
    async init() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            console.log('Générateur de musique initialisé');
        } catch (error) {
            console.warn('Web Audio API non supportée:', error);
        }
    }
    
    // Convertir une note de la gamme en fréquence
    noteToFreq(note, octave = 0) {
        const semitone = this.currentScale[note % this.currentScale.length];
        const octaveShift = Math.floor(note / this.currentScale.length) + octave;
        return this.baseFreq * Math.pow(2, (semitone + octaveShift * 12) / 12);
    }    // Créer un oscillateur avec enveloppe ADSR
    createTone(freq, startTime, duration, type = 'sine', volume = 0.1) {
        if (!this.audioContext) return;
        
        // Activer l'AudioContext de manière synchrone si possible
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        const filterNode = this.audioContext.createBiquadFilter();
        
        // Configuration de l'oscillateur
        oscillator.type = type;
        oscillator.frequency.setValueAtTime(freq, startTime);
        
        // Configuration du filtre passe-bas pour adoucir le son
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
          // Connexions
        oscillator.connect(filterNode);
        filterNode.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        // Enregistrer les nodes actifs pour pouvoir les arrêter
        const nodeGroup = { oscillator, gainNode, filterNode };
        this.activeNodes.push(nodeGroup);
        
        // Démarrage et arrêt
        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
        
        // Nettoyer la liste des nodes actifs quand l'oscillateur s'arrête
        oscillator.onended = () => {
            const index = this.activeNodes.indexOf(nodeGroup);
            if (index > -1) {
                this.activeNodes.splice(index, 1);
            }
        };
        
        return nodeGroup;
    }
    
    // Générer une mélodie aléatoire
    generateMelody(length = 16, octaveRange = 2) {
        const melody = [];
        let currentNote = Math.floor(Math.random() * this.currentScale.length);
        
        for (let i = 0; i < length; i++) {
            // Mouvement mélodique plus naturel
            const movement = Math.random();
            if (movement < 0.4) {
                // Mouvement vers le haut
                currentNote += Math.floor(Math.random() * 3) + 1;
            } else if (movement < 0.8) {
                // Mouvement vers le bas
                currentNote -= Math.floor(Math.random() * 3) + 1;
            }
            // Sinon, reste sur la même note
            
            // Limiter la plage
            currentNote = Math.max(0, Math.min(currentNote, this.currentScale.length * octaveRange - 1));
            
            melody.push({
                note: currentNote,
                duration: this.noteTime * (Math.random() < 0.7 ? 1 : 2), // Parfois des notes plus longues
                volume: 0.05 + Math.random() * 0.05
            });
        }
        
        return melody;
    }
    
    // Générer une ligne de basse
    generateBass(length = 8) {
        const bassline = [];
        const bassNotes = [0, 2, 4]; // Notes de base de l'accord
        
        for (let i = 0; i < length; i++) {
            const note = bassNotes[Math.floor(Math.random() * bassNotes.length)];
            bassline.push({
                note: note,
                duration: this.noteTime * 4, // Notes plus longues pour la basse
                volume: 0.08
            });
        }
        
        return bassline;
    }
    
    // Générer des percussions rythmiques
    generateDrums(length = 16) {
        const drums = [];
        
        for (let i = 0; i < length; i++) {
            const beat = {
                kick: i % 4 === 0, // Grosse caisse sur les temps forts
                snare: i % 8 === 4, // Caisse claire sur les temps 2 et 4
                hihat: Math.random() < 0.6, // Charleston aléatoire
                duration: this.noteTime,
                volume: 0.1
            };
            drums.push(beat);
        }
        
        return drums;
    }    // Créer des sons de percussion
    createDrumSound(type, startTime, volume = 0.1) {
        if (!this.audioContext) return;
        
        // Activer l'AudioContext de manière synchrone si possible
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
        
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
            // Bruit blanc pour la charleston
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
            
            // Enregistrer les nodes actifs
            const nodeGroup = { source: noise, gainNode, filterNode };
            this.activeNodes.push(nodeGroup);
            
            noise.start(startTime);
            noise.stop(startTime + duration);
            
            // Nettoyer la liste quand le son s'arrête
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
            
            // Enregistrer les nodes actifs
            const nodeGroup = { oscillator, gainNode, filterNode };
            this.activeNodes.push(nodeGroup);
            
            oscillator.start(startTime);
            oscillator.stop(startTime + duration);
            
            // Nettoyer la liste quand le son s'arrête
            oscillator.onended = () => {
                const index = this.activeNodes.indexOf(nodeGroup);
                if (index > -1) {
                    this.activeNodes.splice(index, 1);
                }
            };
        }
    }    // Jouer une séquence musicale complète
    playSequence() {
        if (!this.audioContext || this.isPlaying) return;
        
        // Activer l'AudioContext de manière synchrone si possible
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
        
        this.isPlaying = true;
        const startTime = this.audioContext.currentTime + 0.1;
        
        // Générer les éléments musicaux
        const melody = this.generateMelody(32);
        const bassline = this.generateBass(8);
        const drums = this.generateDrums(32);
        
        let currentTime = startTime;
        
        // Jouer la mélodie
        melody.forEach((note, index) => {
            const freq = this.noteToFreq(note.note, 1);
            this.createTone(freq, currentTime, note.duration, 'sawtooth', note.volume);
            currentTime += note.duration;
        });
        
        // Jouer la basse
        currentTime = startTime;
        bassline.forEach((note, index) => {
            const freq = this.noteToFreq(note.note, -1);
            this.createTone(freq, currentTime, note.duration, 'sine', note.volume);
            currentTime += note.duration;
        });
        
        // Jouer les percussions
        currentTime = startTime;
        drums.forEach((beat, index) => {
            if (beat.kick) this.createDrumSound('kick', currentTime, beat.volume);
            if (beat.snare) this.createDrumSound('snare', currentTime, beat.volume * 0.8);
            if (beat.hihat) this.createDrumSound('hihat', currentTime, beat.volume * 0.5);
            currentTime += beat.duration;
        });
          // Programmer la prochaine séquence
        const sequenceDuration = melody.reduce((total, note) => total + note.duration, 0);
        this.sequenceTimeout = setTimeout(() => {
            this.isPlaying = false;
            if (this.currentTrack === 'game') {
                this.playSequence(); // Boucle continue pendant le jeu
            }
        }, sequenceDuration * 1000);
    }
    
    // Démarrer la musique de course
    startRaceMusic() {
        if (!this.audioContext) {
            console.warn('AudioContext non disponible');
            return;
        }
        
        // Réveiller l'AudioContext si nécessaire
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
        
        this.currentTrack = 'game';
        this.tempo = 130; // Tempo plus rapide pour la course
        this.noteTime = (60 / this.tempo) / 4;
        this.currentScale = this.scales.dorian; // Gamme plus énergique
        
        if (!this.isPlaying) {
            this.playSequence();
        }
    }    // Arrêter la musique
    stopMusic() {
        this.currentTrack = null;
        this.isPlaying = false;
        
        // Annuler les séquences programmées
        if (this.sequenceTimeout) {
            clearTimeout(this.sequenceTimeout);
            this.sequenceTimeout = null;
        }
        
        // Arrêter immédiatement tous les sons en cours
        this.stopAllActiveSounds();
        
        console.log('Musique arrêtée immédiatement');
    }
    
    // Nouvelle méthode pour arrêter tous les sons actifs
    stopAllActiveSounds() {
        if (!this.audioContext) return;
        
        const currentTime = this.audioContext.currentTime;
        
        // Arrêter tous les nodes actifs
        this.activeNodes.forEach(nodeGroup => {
            try {
                // Couper le gain immédiatement pour un arrêt silencieux
                if (nodeGroup.gainNode) {
                    nodeGroup.gainNode.gain.cancelScheduledValues(currentTime);
                    nodeGroup.gainNode.gain.setValueAtTime(0, currentTime);
                }
                
                // Arrêter l'oscillateur ou la source audio
                if (nodeGroup.oscillator && nodeGroup.oscillator.stop) {
                    nodeGroup.oscillator.stop(currentTime + 0.01);
                }
                if (nodeGroup.source && nodeGroup.source.stop) {
                    nodeGroup.source.stop(currentTime + 0.01);
                }
            } catch (error) {
                // Ignorer les erreurs si le node est déjà arrêté
                console.debug('Node déjà arrêté:', error);
            }
        });
        
        // Vider la liste des nodes actifs
        this.activeNodes = [];
        
        console.log('Tous les sons actifs arrêtés');
    }    // Vérifier et activer l'AudioContext si nécessaire
    async ensureAudioContextActive() {
        if (!this.audioContext) return false;
        
        if (this.audioContext.state === 'suspended') {
            try {
                await this.audioContext.resume();
                console.log('AudioContext activé automatiquement');
            } catch (error) {
                console.error('Erreur lors de l\'activation de l\'AudioContext:', error);
                return false;
            }
        }
        
        return this.audioContext.state === 'running';
    }    // Jouer un son d'effet spécial
    playEffect(type) {
        if (!this.audioContext) return;
        
        // Activer l'AudioContext de manière synchrone si possible
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
        
        const startTime = this.audioContext.currentTime;        switch (type) {
            case 'start':
                // Son de départ de course
                this.createTone(440, startTime, 0.5, 'square', 0.15);
                this.createTone(660, startTime + 0.1, 0.4, 'square', 0.1);
                break;
            case 'redLight':
                // Son du feu rouge - ton grave et sérieux
                this.createTone(220, startTime, 0.6, 'sine', 0.12);
                this.createTone(165, startTime + 0.1, 0.5, 'sine', 0.08);
                break;
            case 'yellowLight':
                // Son du feu jaune - ton moyen, préparatoire
                this.createTone(330, startTime, 0.4, 'triangle', 0.1);
                this.createTone(440, startTime + 0.2, 0.3, 'triangle', 0.08);
                break;
            case 'greenLight':
                // Son du feu vert - ton aigu et énergique
                this.createTone(660, startTime, 0.3, 'sawtooth', 0.15);
                this.createTone(880, startTime + 0.1, 0.3, 'sawtooth', 0.12);
                this.createTone(1100, startTime + 0.2, 0.2, 'sawtooth', 0.1);
                break;
            case 'lap':
                // Son de passage de tour
                this.createTone(880, startTime, 0.2, 'sine', 0.1);
                this.createTone(1320, startTime + 0.1, 0.2, 'sine', 0.08);
                break;
            case 'collision':
                // Son de collision
                this.createDrumSound('snare', startTime, 0.2);
                break;
            case 'victory':
                // Son de victoire
                const victoryNotes = [0, 2, 4, 7, 9];
                victoryNotes.forEach((note, index) => {
                    const freq = this.noteToFreq(note, 2);
                    this.createTone(freq, startTime + index * 0.15, 0.3, 'sine', 0.12);
                });
                break;
        }
    }
    
    // Ajuster le volume général
    setVolume(volume) {
        this.masterVolume = Math.max(0, Math.min(1, volume));
    }
}

// Instance globale du générateur de musique
window.musicGenerator = new MusicGenerator();
