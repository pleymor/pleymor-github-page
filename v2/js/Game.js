// Game.js - Classe principale du jeu
class Game {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.playerKart = null;
        this.aiKarts = [];
        this.track = null;
        this.audioManager = null;
        this.uiManager = null;
        this.inputManager = null;
        
        this.gameStarted = false;
        this.raceFinished = false;
        this.playerLaps = 0;
        this.aiLaps = [];
        
        this.init();
    }
      async init() {
        this.setupScene();
        this.setupLighting();
        
        // Initialiser les managers
        this.audioManager = new AudioManager(this);
        this.uiManager = new UIManager(this);
        this.inputManager = new InputManager();
          // Créer les éléments de jeu
        this.track = new Track();
        await this.track.create();
        this.track.addToScene(this.scene);
        
        this.createKarts();
        
        // Démarrer la boucle de jeu
        this.animate();
    }
      setupScene() {
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.Fog(0x87CEEB, 50, 200);
        
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        // Position initiale de la caméra pour voir le circuit
        this.camera.position.set(0, 50, 100);
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
    }
    
    async startRaceSequence() {
        await this.audioManager.playTrafficLightSequence();
        this.gameStarted = true;
        this.uiManager.hideTrafficLights();
        this.audioManager.startRaceMusic();
    }
    
    update() {
        if (!this.gameStarted || this.raceFinished) return;
        
        // Mettre à jour les karts
        this.playerKart.update(this.inputManager.getInputs());
        this.aiKarts.forEach(kart => kart.update());
        
        // Mettre à jour la caméra
        this.updateCamera();
        
        // Mettre à jour l'interface
        this.uiManager.updateGameStats(this.playerKart);
    }
    
    updateCamera() {
        if (!this.playerKart) return;
        
        const kartPos = this.playerKart.getPosition();
        const kartRot = this.playerKart.getRotation();
        
        // Position de la caméra derrière le kart
        const cameraDistance = 15;
        const cameraHeight = 8;
        
        const cameraX = kartPos.x - Math.sin(kartRot) * cameraDistance;
        const cameraZ = kartPos.z - Math.cos(kartRot) * cameraDistance;
        const cameraY = kartPos.y + cameraHeight;
        
        this.camera.position.set(cameraX, cameraY, cameraZ);
        this.camera.lookAt(kartPos.x, kartPos.y + 2, kartPos.z);
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
        this.audioManager.stopMusic();
        this.uiManager.showWinner(message);
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
}
