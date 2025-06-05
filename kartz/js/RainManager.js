// RainManager.js - Gestionnaire des effets de pluie
class RainManager {
    constructor(game) {
        this.game = game;
        this.rainParticles = null;
        this.rainGeometry = null;
        this.rainMaterial = null;
        this.rainEnabled = false;
        this.rainIntensity = 1000; // Nombre de gouttes de pluie
        this.rainArea = 200; // Zone couverte par la pluie
        this.rainSpeed = 0.5; // Vitesse de chute de la pluie
        
        this.init();
    }

    init() {
        this.createRainSystem();
    }

    createRainSystem() {
        // Créer la géométrie pour les particules de pluie
        this.rainGeometry = new THREE.BufferGeometry();
        
        // Créer un tableau de positions pour les gouttes de pluie
        const positions = new Float32Array(this.rainIntensity * 3);
        const velocities = new Float32Array(this.rainIntensity * 3);
        
        for (let i = 0; i < this.rainIntensity; i++) {
            const i3 = i * 3;
            
            // Position aléatoire dans une zone autour du joueur
            positions[i3] = (Math.random() - 0.5) * this.rainArea;     // x
            positions[i3 + 1] = Math.random() * 100 + 50;              // y (hauteur)
            positions[i3 + 2] = (Math.random() - 0.5) * this.rainArea; // z
            
            // Vitesse de chute
            velocities[i3] = 0;
            velocities[i3 + 1] = -this.rainSpeed - Math.random() * 0.5;
            velocities[i3 + 2] = 0;
        }
        
        this.rainGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        this.rainGeometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
        
        // Matériau pour les gouttes de pluie
        this.rainMaterial = new THREE.PointsMaterial({
            color: 0x87CEEB,
            size: 0.5,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending
        });
        
        // Créer le système de particules
        this.rainParticles = new THREE.Points(this.rainGeometry, this.rainMaterial);
        this.rainParticles.visible = false; // Initialement invisible
    }

    enable() {
        if (!this.rainEnabled) {
            this.rainEnabled = true;
            this.rainParticles.visible = true;
            this.game.scene.add(this.rainParticles);
            
            // Assombrir légèrement la scène
            this.game.renderer.setClearColor(0x4A5568);
            
            console.log("Pluie activée");
        }
    }

    disable() {
        if (this.rainEnabled) {
            this.rainEnabled = false;
            this.rainParticles.visible = false;
            this.game.scene.remove(this.rainParticles);
            
            // Restaurer la couleur normale du ciel
            this.game.renderer.setClearColor(0x87CEEB);
            
            console.log("Pluie désactivée");
        }
    }

    toggle() {
        if (this.rainEnabled) {
            this.disable();
        } else {
            this.enable();
        }
    }

    update() {
        if (!this.rainEnabled || !this.rainParticles) return;
        
        const positions = this.rainGeometry.attributes.position.array;
        const velocities = this.rainGeometry.attributes.velocity.array;
        
        // Obtenir la position du joueur pour centrer la pluie
        let playerX = 0, playerZ = 0;
        if (this.game.playerKart && this.game.playerKart.mesh) {
            playerX = this.game.playerKart.mesh.position.x;
            playerZ = this.game.playerKart.mesh.position.z;
        }
        
        for (let i = 0; i < this.rainIntensity; i++) {
            const i3 = i * 3;
            
            // Mettre à jour la position avec la vitesse
            positions[i3 + 1] += velocities[i3 + 1];
            
            // Si la goutte touche le sol, la repositionner en haut
            if (positions[i3 + 1] < 0) {
                positions[i3] = playerX + (Math.random() - 0.5) * this.rainArea;
                positions[i3 + 1] = Math.random() * 50 + 50;
                positions[i3 + 2] = playerZ + (Math.random() - 0.5) * this.rainArea;
                
                // Varier légèrement la vitesse
                velocities[i3 + 1] = -this.rainSpeed - Math.random() * 0.5;
            }
        }
        
        // Marquer les attributs comme nécessitant une mise à jour
        this.rainGeometry.attributes.position.needsUpdate = true;
    }

    setIntensity(intensity) {
        this.rainIntensity = Math.max(100, Math.min(2000, intensity));
        // Recréer le système de pluie avec la nouvelle intensité
        if (this.rainParticles) {
            this.game.scene.remove(this.rainParticles);
            this.createRainSystem();
            if (this.rainEnabled) {
                this.game.scene.add(this.rainParticles);
                this.rainParticles.visible = true;
            }
        }
    }

    setSpeed(speed) {
        this.rainSpeed = Math.max(0.1, Math.min(2.0, speed));
    }

    // Méthode pour nettoyer les ressources
    dispose() {
        if (this.rainGeometry) {
            this.rainGeometry.dispose();
        }
        if (this.rainMaterial) {
            this.rainMaterial.dispose();
        }
        if (this.rainParticles && this.game.scene) {
            this.game.scene.remove(this.rainParticles);
        }
    }
}
