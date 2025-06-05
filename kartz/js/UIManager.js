// UIManager.js - Gestionnaire de l'interface utilisateur
class UIManager {    constructor(game) {
        this.game = game;
        this.startScreen = document.getElementById('startScreen');
        this.gameUI = document.getElementById('ui');
        this.trafficLight = document.getElementById('trafficLight');
        this.winner = document.getElementById('winner');
        
        // Menu pause
        this.pauseButton = document.getElementById('pauseButton');
        this.pauseMenu = document.getElementById('pauseMenu');
        this.resumeButton = document.getElementById('resumeButton');
        this.isPaused = false;
        
        // Boutons de contrôle dans le menu pause
        this.musicToggle = document.getElementById('musicToggle');
        this.volumeSlider = document.getElementById('volumeSlider');
        this.rainToggle = document.getElementById('rainToggle');

        // Minimap elements
        this.minimap = document.getElementById('minimap');
        this.minimapCanvas = document.getElementById('minimapCanvas');
        this.minimapCtx = this.minimapCanvas ? this.minimapCanvas.getContext('2d') : null;
        this.minimapScale = 0.5; // Scale factor for track to minimap conversion
        this.minimapCenter = { x: 100, y: 100 }; // Center of minimap canvas

        this.setupEventListeners();
        this.initVolumeSlider();
    }
    initVolumeSlider() {
        // Set initial slider value based on AudioManager's master volume
        // We delay this initialization to ensure the AudioManager is ready
        setTimeout(() => {
            if (this.volumeSlider && this.game.audioManager) {
                this.volumeSlider.value = this.game.audioManager.masterVolume * 100;
            }
        }, 100);
    }    setupEventListeners() {
        // Bouton de démarrage
        const startButton = document.getElementById('startButton');
        if (startButton) {
            startButton.addEventListener('click', () => {
                this.game.startGame();
            });
        }

        // Bouton pause et menu pause
        if (this.pauseButton) {
            this.pauseButton.addEventListener('click', () => {
                this.togglePause();
            });
        }

        if (this.resumeButton) {
            this.resumeButton.addEventListener('click', () => {
                this.togglePause();
            });
        }

        // Boutons de contrôle audio dans le menu pause
        if (this.musicToggle) {
            this.musicToggle.addEventListener('click', () => {
                this.toggleMusic();
            });
        }

        // Bouton de contrôle de la pluie dans le menu pause
        if (this.rainToggle) {
            this.rainToggle.addEventListener('click', () => {
                this.toggleRain();
            });
        }

        if (this.volumeSlider) {
            this.volumeSlider.addEventListener('input', (event) => {
                const value = parseFloat(event.target.value) / 100;
                console.log('Setting volume to:', value);
                this.game.audioManager.setVolume(value);
            });
        }

        // Bouton rejouer
        document.querySelector('#winner button')?.addEventListener('click', () => {
            location.reload();
        });

        // Redimensionnement de la fenêtre
        window.addEventListener('resize', () => {
            this.onWindowResize();
        });

        // Gestion de la touche Échap pour le menu pause
        document.addEventListener('keydown', (event) => {
            if (event.code === 'Escape' && this.game.gameStarted) {
                this.togglePause();
                event.preventDefault();
            }
        });
    }    hideStartScreen() {
        if (this.startScreen) {
            this.startScreen.style.display = 'none';
        }
    }    showGameUI() {
        if (this.gameUI) {
            this.gameUI.style.display = 'block';
        }
        if (this.pauseButton) {
            this.pauseButton.style.display = 'flex';
        }
        if (this.minimap) {
            this.minimap.style.display = 'block';
        }
        this.updateVolumeSlider();
        this.drawMinimapTrack();
    }
    updateVolumeSlider() {
        if (this.volumeSlider) {
            this.volumeSlider.value = this.game.audioManager.masterVolume * 100;
        }
    }    showTrafficLights() {
        if (this.trafficLight) {
            this.trafficLight.style.display = 'block';
        }
        this.resetTrafficLights();
    }

    hideTrafficLights() {
        setTimeout(() => {
            if (this.trafficLight) {
                this.trafficLight.style.display = 'none';
            }
        }, 1000);
    }resetTrafficLights() {
        const lights = ['redLight', 'yellowLight', 'greenLight'];
        lights.forEach(lightId => {
            const light = document.getElementById(lightId);
            if (light) {
                light.classList.remove('red', 'yellow', 'green');
                light.classList.add('off');
            }
        });
    }    updateTrafficLight(color, state) {
        const lightElement = document.getElementById(`${color}Light`);
        
        if (lightElement) {
            if (state) {
                lightElement.classList.remove('off');
                lightElement.classList.add(color);
            } else {
                lightElement.classList.remove(color);
                lightElement.classList.add('off');
            }
        }
    }updateGameStats(playerKart) {
        // Mettre à jour le compteur de tours
        const lapCountElement = document.getElementById('lapCount');
        if (lapCountElement) {
            lapCountElement.textContent = `${this.game.getPlayerLaps()}/3`;
        }

        // Mettre à jour la vitesse
        const speed = Math.floor(playerKart.getSpeed());
        const speedElement = document.getElementById('speed');
        if (speedElement) {
            speedElement.textContent = speed;
        }

        // Calculer et afficher la position (simple pour le moment)
        let position = 1;
        const playerProgress = playerKart.trackProgress;
        
        this.game.aiKarts.forEach(aiKart => {
            const aiProgress = aiKart.trackProgress;
            if (aiProgress > playerProgress) {
                position++;
            }
        });

        const positionElement = document.getElementById('position');
        if (positionElement) {
            positionElement.textContent = position;
        }

        // Update minimap
        this.updateMinimap();
    }    togglePause() {
        this.isPaused = !this.isPaused;
        
        if (this.isPaused) {
            if (this.pauseMenu) {
                this.pauseMenu.style.display = 'block';
            }
            this.game.pauseGame();
        } else {
            if (this.pauseMenu) {
                this.pauseMenu.style.display = 'none';
            }
            this.game.resumeGame();
        }
    }

    hidePauseMenu() {
        this.isPaused = false;
        if (this.pauseMenu) {
            this.pauseMenu.style.display = 'none';
        }
    }    showWinner(message) {
        const winnerTextElement = document.getElementById('winnerText');
        if (winnerTextElement) {
            winnerTextElement.textContent = message;
        }
        if (this.winner) {
            this.winner.style.display = 'block';
        }
        // Masquer le bouton pause quand le jeu est terminé
        if (this.pauseButton) {
            this.pauseButton.style.display = 'none';
        }
    }    toggleMusic() {
        const isEnabled = this.game.audioManager.toggleTheMusic();
        if (this.musicToggle) {
            this.musicToggle.innerHTML = isEnabled ? '🔇 Désactiver Musique' : '🔊 Activer Musique';
        }
    }    toggleRain() {
        if (this.game.rainManager) {
            this.game.rainManager.toggle();
            const isEnabled = this.game.rainManager.rainEnabled;
            if (this.rainToggle) {
                this.rainToggle.innerHTML = isEnabled ? '🌤️ Désactiver Pluie' : '🌧️ Activer Pluie';
            }
        }
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
    }    // Minimap methods
    drawMinimapTrack() {
        const ctx = this.minimapCtx;
        const track = this.game.getTrack();
        
        if (!ctx || !track || !track.trackPoints) return;

        // Clear canvas
        ctx.clearRect(0, 0, 200, 200);
        
        // Draw background
        ctx.fillStyle = 'rgba(20, 20, 20, 0.8)';
        ctx.fillRect(0, 0, 200, 200);
        
        // Calculate track bounds for proper scaling
        let minX = Infinity, maxX = -Infinity;
        let minZ = Infinity, maxZ = -Infinity;
        
        track.trackPoints.forEach(point => {
            minX = Math.min(minX, point.x);
            maxX = Math.max(maxX, point.x);
            minZ = Math.min(minZ, point.z);
            maxZ = Math.max(maxZ, point.z);
        });
        
        const trackWidth = maxX - minX;
        const trackHeight = maxZ - minZ;
        const scale = Math.min(180 / trackWidth, 180 / trackHeight);
        
        this.minimapScale = scale;
        this.trackBounds = { minX, maxX, minZ, maxZ };
        
        // Draw track
        ctx.beginPath();
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 3;
        
        track.trackPoints.forEach((point, index) => {
            const x = (point.x - minX) * scale + 10;
            const y = (point.z - minZ) * scale + 10;
            
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        
        ctx.closePath();
        ctx.stroke();
        
        // Draw start/finish line
        if (track.trackPoints.length > 0) {
            const startPoint = track.trackPoints[0];
            const startX = (startPoint.x - minX) * scale + 10;
            const startY = (startPoint.z - minZ) * scale + 10;
            
            ctx.beginPath();
            ctx.arc(startX, startY, 4, 0, 2 * Math.PI);
            ctx.fillStyle = '#fff';
            ctx.fill();
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 1;
            ctx.stroke();
        }
    }    updateMinimap() {
        if (!this.game.gameStarted || !this.trackBounds || !this.minimapCtx) return;
        
        const ctx = this.minimapCtx;
        
        // Redraw track background
        this.drawMinimapTrack();
        
        // Draw player kart
        this.drawKartOnMinimap(this.game.playerKart, '#ff4444', true);
        
        // Draw AI karts
        const aiColors = ['#44ff44', '#4444ff', '#ffff44'];
        this.game.aiKarts.forEach((kart, index) => {
            this.drawKartOnMinimap(kart, aiColors[index], false);
        });
    }    drawKartOnMinimap(kart, color, isPlayer = false) {
        const ctx = this.minimapCtx;
        const position = kart.getPosition();
        
        if (!ctx || !position || !this.trackBounds) return;
        
        const x = (position.x - this.trackBounds.minX) * this.minimapScale + 10;
        const y = (position.z - this.trackBounds.minZ) * this.minimapScale + 10;
        
        // Draw kart dot
        ctx.beginPath();
        ctx.arc(x, y, isPlayer ? 4 : 3, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.fill();
        
        // Add glow effect for player
        if (isPlayer) {
            ctx.shadowColor = color;
            ctx.shadowBlur = 6;
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, 2 * Math.PI);
            ctx.fill();
            ctx.shadowBlur = 0;
        }
        
        // Draw direction indicator
        const rotation = kart.getRotation();
        const dirLength = 6;
        const dirX = x + Math.sin(rotation) * dirLength;
        const dirY = y + Math.cos(rotation) * dirLength;
        
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(dirX, dirY);
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Add white border
        ctx.beginPath();
        ctx.arc(x, y, isPlayer ? 4 : 3, 0, 2 * Math.PI);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.stroke();
    }
}
