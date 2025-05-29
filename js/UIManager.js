// UIManager.js - Gestionnaire de l'interface utilisateur
class UIManager {
    constructor(game) {
        this.game = game;
        this.startScreen = document.getElementById('startScreen');
        this.gameUI = document.getElementById('ui');
        this.trafficLight = document.getElementById('trafficLight');
        this.winner = document.getElementById('winner');
        this.musicToggle = document.getElementById('musicToggle');
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Bouton de démarrage
        const startButton = document.getElementById('startButton');
        startButton.addEventListener('click', () => {
            this.game.startGame();
        });
        
        // Boutons de contrôle audio
        this.musicToggle.addEventListener('click', () => {
            this.toggleMusic();
        });
        
        document.querySelector('button[onclick="changeVolume(-0.1)"]')?.addEventListener('click', () => {
            this.game.audioManager.changeVolume(-0.1);
        });
        
        document.querySelector('button[onclick="changeVolume(0.1)"]')?.addEventListener('click', () => {
            this.game.audioManager.changeVolume(0.1);
        });
        
        // Bouton rejouer
        document.querySelector('#winner button')?.addEventListener('click', () => {
            location.reload();
        });
        
        // Redimensionnement de la fenêtre
        window.addEventListener('resize', () => {
            this.onWindowResize();
        });
    }
    
    hideStartScreen() {
        this.startScreen.style.display = 'none';
    }
    
    showGameUI() {
        this.gameUI.style.display = 'block';
    }
    
    showTrafficLights() {
        this.trafficLight.style.display = 'block';
        this.resetTrafficLights();
    }
    
    hideTrafficLights() {
        setTimeout(() => {
            this.trafficLight.style.display = 'none';
        }, 1000);
    }
    
    resetTrafficLights() {
        const lights = ['redLight', 'yellowLight', 'greenLight'];
        lights.forEach(lightId => {
            const light = document.getElementById(lightId);
            light.classList.remove('red', 'yellow', 'green');
            light.classList.add('off');
        });
    }
    
    updateTrafficLight(color, state) {
        const lightElement = document.getElementById(`${color}Light`);
        
        if (state) {
            lightElement.classList.remove('off');
            lightElement.classList.add(color);
        } else {
            lightElement.classList.remove(color);
            lightElement.classList.add('off');
        }
    }
    
    updateGameStats(playerKart) {
        // Mettre à jour le compteur de tours
        document.getElementById('lapCount').textContent = `${this.game.getPlayerLaps()}/3`;
        
        // Mettre à jour la vitesse
        const speed = Math.floor(playerKart.getSpeed());
        document.getElementById('speed').textContent = speed;
        
        // Calculer et afficher la position (simple pour le moment)
        let position = 1;
        this.game.aiKarts.forEach(aiKart => {
            if (aiKart.laps > playerKart.laps || 
                (aiKart.laps === playerKart.laps && aiKart.trackProgress > playerKart.trackProgress)) {
                position++;
            }
        });
        document.getElementById('position').textContent = position;
    }
    
    showWinner(message) {
        document.getElementById('winnerText').textContent = message;
        this.winner.style.display = 'block';
    }
    
    toggleMusic() {
        const isEnabled = this.game.audioManager.toggleMusic();
        this.musicToggle.innerHTML = isEnabled ? '🔇 Désactiver Musique' : '🔊 Activer Musique';
    }
    
    onWindowResize() {
        const camera = this.game.camera;
        const renderer = this.game.renderer;
        
        if (camera && renderer) {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        }
    }
    
    showMessage(message, duration = 3000) {
        // Créer un élément de message temporaire
        const messageElement = document.createElement('div');
        messageElement.textContent = message;
        messageElement.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 20px;
            border-radius: 10px;
            z-index: 500;
            font-size: 24px;
            text-align: center;
        `;
        
        document.body.appendChild(messageElement);
        
        setTimeout(() => {
            document.body.removeChild(messageElement);
        }, duration);
    }
}
