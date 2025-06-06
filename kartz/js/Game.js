// Game.js - Classe principale du jeu
class Game {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.playerKart = null;
        this.aiKarts = [];        this.track = null;        this.audioManager = null;
        this.uiManager = null;
        this.inputManager = null;
        this.rainManager = null;
        this.shaderManager = null;

        this.gameStarted = false;
        this.raceFinished = false;
        this.playerLaps = 0;
        this.aiLaps = [];
        
        // État de pause
        this.isPaused = false;

        this.init();
    }

    async init() {
        this.setupScene();
        this.setupLighting();        // Initialiser les managers
        this.shaderManager = new ShaderManager();
        this.audioManager = new AudioManager(this);
        this.uiManager = new UIManager(this);
        this.inputManager = new InputManager(this);
        this.rainManager = new RainManager(this);
        
        // Créer les éléments de jeu
        this.track = new Track(this);
        await this.track.create();
        this.track.addToScene(this.scene);

        this.createKarts();

        // Positionner la caméra derrière le kart du joueur dès le début
        this.updateCamera();

        // Démarrer la boucle de jeu
        this.animate();
    }    setupScene() {
        this.scene = new THREE.Scene();

        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        // Position initiale temporaire - sera mise à jour après création des karts
        this.camera.position.set(0, 10, 10);
        this.camera.lookAt(0, 0, 0);

        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0x87CEEB);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        document.getElementById('gameContainer').appendChild(this.renderer.domElement);
    }

    setupLighting() {
        const ambientLight = new THREE.AmbientLight(0x404040, 0.8);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
        directionalLight.position.set(50, 100, 50);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 500;
        directionalLight.shadow.camera.left = -100;
        directionalLight.shadow.camera.right = 100;
        directionalLight.shadow.camera.top = 100;
        directionalLight.shadow.camera.bottom = -100;
        this.scene.add(directionalLight);
    }

    createKarts() {
        // Créer le kart du joueur
        this.playerKart = new Kart(0xff4444, true, this);
        this.playerKart.setPosition(this.track.getStartPosition(0));

        // Créer les karts IA
        const aiColors = [0x44ff44, 0x4444ff, 0xffff44];
        for (let i = 0; i < 3; i++) {
            const aiKart = new Kart(aiColors[i], false, this);
            aiKart.setPosition(this.track.getStartPosition(i + 1));
            this.aiKarts.push(aiKart);
            this.aiLaps.push(0);
        }
    }

    startGame() {
        this.uiManager.hideStartScreen();
        this.uiManager.showGameUI();

        // Activer l'audio
        this.audioManager.activate();

        // Afficher les feux de circulation
        this.uiManager.showTrafficLights();
        this.startRaceSequence();
    }    async startRaceSequence() {
        await this.audioManager.playTrafficLightSequence();
        this.gameStarted = true;
        this.uiManager.hideTrafficLights();
        this.audioManager.playRaceMusic();
        
        // Show mobile controls if on mobile device
        if (this.inputManager.isMobile || this.inputManager.isTablet || this.inputManager.isTouchDevice) {
            this.inputManager.showMobileControls();
        }
        
        // Emit gameStarted event for any other listeners
        document.dispatchEvent(new CustomEvent('gameStarted'));
    }update() {
        if (!this.gameStarted || this.raceFinished || this.isPaused) return;

        // Mettre à jour l'input manager pour la rotation de caméra
        this.inputManager.update();

        // Mettre à jour les karts
        this.playerKart.update(this.inputManager.getInputs());
        this.aiKarts.forEach(kart => kart.update());

        // Mettre à jour la caméra
        this.updateCamera();

        // Mettre à jour l'interface
        this.uiManager.updateGameStats(this.playerKart);        // Mettre à jour les effets de pluie
        this.rainManager.update();
          // Update shader uniforms
        this.updateShaders();
    }

    updateShaders() {
        if (!this.shaderManager) return;
        
        const time = Date.now() * 0.001; // Current time in seconds
        const cameraPosition = this.camera.position;
        const isRaining = this.rainManager && this.rainManager.isRaining;
        
        // Update global shader uniforms
        this.shaderManager.updateUniforms(time, cameraPosition, isRaining);
        
        // Update track shader uniforms
        if (this.track) {
            this.track.updateShaders();
        }
    }updateCamera() {
        if (!this.playerKart) return;

        const kartPos = this.playerKart.getPosition();
        const kartRot = this.playerKart.getRotation();
        const zoomLevel = this.inputManager.getZoomLevel();
        const inputs = this.inputManager.getInputs();

        // Position de la caméra derrière le kart avec zoom
        const baseCameraDistance = 15;
        const baseCameraHeight = 8;
        
        // Apply zoom to both distance and height for better zoom effect
        const cameraDistance = baseCameraDistance * zoomLevel;
        const cameraHeight = baseCameraHeight * (0.7 + zoomLevel * 0.3); // Height changes less dramatically        // Calculate base camera angle from kart rotation
        let cameraAngleH = kartRot + inputs.cameraRotationX; // Horizontal rotation around kart
        let cameraAngleV = inputs.cameraRotationY; // Vertical angle
        
        // Debug logging
        if (Math.abs(inputs.cameraRotationX) > 0.001 || Math.abs(inputs.cameraRotationY) > 0.001) {
            console.log(`Using camera rotation: X=${inputs.cameraRotationX.toFixed(3)}, Y=${inputs.cameraRotationY.toFixed(3)}`);
        }
        
        // Calculate camera position with rotation
        const cameraX = kartPos.x - Math.sin(cameraAngleH) * cameraDistance * Math.cos(cameraAngleV);
        const cameraZ = kartPos.z - Math.cos(cameraAngleH) * cameraDistance * Math.cos(cameraAngleV);
        const cameraY = kartPos.y + cameraHeight + Math.sin(cameraAngleV) * cameraDistance;

        this.camera.position.set(cameraX, cameraY, cameraZ);
        
        // Look at target with slight vertical offset for better view
        const lookAtTarget = new THREE.Vector3(
            kartPos.x, 
            kartPos.y + 2, 
            kartPos.z
        );
        this.camera.lookAt(lookAtTarget);
    }

    onLapCompleted(kart) {
        if (kart.isPlayer) {
            this.playerLaps++;
            this.audioManager.playEffect('lap');

            if (this.playerLaps >= 3 && !this.raceFinished) {
                this.endRace("Félicitations! Vous avez gagné!");
            }
        } else {
            const aiIndex = this.aiKarts.indexOf(kart);
            if (aiIndex !== -1) {
                this.aiLaps[aiIndex]++;
                if (this.aiLaps[aiIndex] >= 3 && !this.raceFinished) {
                    this.endRace(`L'IA ${aiIndex + 1} a gagné!`);
                }
            }
        }
    }

    onCollision(kart) {
        if (kart.isPlayer) {
            this.audioManager.playEffect('collision');
        }
    }

    endRace(message) {
        this.raceFinished = true;
        this.audioManager.playEffect('victory');
        this.audioManager.stopRaceMusic();
        this.uiManager.showWinner(message);
    }

    pauseGame() {
        this.isPaused = true;
        
        // Mettre en pause la musique si elle joue
        if (this.audioManager && this.audioManager.currentMusicElement) {
            this.audioManager.currentMusicElement.pause();
        }
        
        console.log('Jeu mis en pause');
    }

    resumeGame() {
        this.isPaused = false;
        
        // Reprendre la musique si elle était en cours
        if (this.audioManager && this.audioManager.currentMusicElement && this.audioManager.musicEnabled) {
            this.audioManager.currentMusicElement.play().catch(error => {
                console.error('Erreur lors de la reprise de la musique:', error);
            });
        }
        
        console.log('Jeu repris');
    }

    // Méthode pour régénérer le circuit (appelée par l'UI)
    async onTrackRegenerated() {
        console.log('🔄 Circuit régénéré, mise à jour de la scène...');
        
        // Supprimer l'ancien circuit de la scène
        if (this.track) {
            // Supprimer tous les éléments du track de la scène
            if (this.track.trackMesh) this.scene.remove(this.track.trackMesh);
            if (this.track.terrainMesh) this.scene.remove(this.track.terrainMesh);
            if (this.track.baseMesh) this.scene.remove(this.track.baseMesh);
            if (this.track.startLine) this.scene.remove(this.track.startLine);
            
            // Supprimer les drapeaux
            if (this.track.flags) {
                this.track.flags.forEach(flag => this.scene.remove(flag));
            }
            
            // Supprimer les arbres
            this.track.trees.forEach(tree => {
                this.scene.remove(tree.group);
            });
        }
        
        // Ajouter le nouveau circuit à la scène
        this.track.addToScene(this.scene);
        
        // Repositionner les karts aux nouvelles positions de départ
        if (this.playerKart) {
            this.playerKart.setPosition(this.track.getStartPosition(0));
            this.playerKart.rotation = 0;
            this.playerKart.velocity.set(0, 0, 0);
            this.playerKart.speed = 0;
        }
        
        this.aiKarts.forEach((aiKart, index) => {
            aiKart.setPosition(this.track.getStartPosition(index + 1));
            aiKart.rotation = 0;
            aiKart.velocity.set(0, 0, 0);
            aiKart.speed = 0;
        });
        
        // Remettre à zéro les compteurs de tours
        this.playerLaps = 0;
        this.aiLaps = [0, 0, 0];
        
        // Remettre à zéro la progression sur le circuit
        if (this.playerKart) {
            this.playerKart.trackProgress = 0;
            this.playerKart.lastCheckpoint = 0;
        }
        this.aiKarts.forEach(kart => {
            kart.trackProgress = 0;
            kart.lastCheckpoint = 0;
        });
        
        // Mettre à jour la minimap
        if (this.uiManager) {
            this.uiManager.drawMinimapTrack();
        }
        
        // Jouer un effet sonore
        if (this.audioManager) {
            this.audioManager.playEffect('start');
        }
        
        console.log('✅ Nouveau circuit intégré dans le jeu !');
    }
      // Méthode publique pour régénérer le circuit (appelée par l'UI)
    async regenerateTrack() {
        if (this.track) {
            await this.track.regenerateTrack();
            await this.onTrackRegenerated();
        }
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        this.update();
        this.renderer.render(this.scene, this.camera);
    }

    // Getters pour accès aux propriétés
    getScene() { return this.scene; }
    getTrack() { return this.track; }
    getPlayerLaps() { return this.playerLaps; }
    
    // Retourne tous les karts (joueur + IA) pour les collisions
    getAllKarts() {
        return [this.playerKart, ...this.aiKarts];
    }
}
