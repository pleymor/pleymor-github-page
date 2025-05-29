// Kart.js - Classe pour les véhicules
class Kart {
    constructor(color, isPlayer = false, game) {
        this.isPlayer = isPlayer;
        this.game = game;

        // Propriétés du kart
        this.maxSpeed = isPlayer ? 80 : 70; // Vitesse maximale en km/h
        this.acceleration = 1;
        this.deceleration = 0.025;
        this.mixTurnSpeed = 0.50;
        this.maxTurnSpeed = 0.30;
        this.traction = 0.95;

        // Propriétés de l'environnement
        this.friction = 0.95;
        this.airResistance = 0.99;
        this.driftFactor = 0.08;        // Variables de position et de mouvement
        this.position = new THREE.Vector3();
        this.velocity = new THREE.Vector3();
        this.rotation = 0;
        this.speed = 0;
        this.turnSpeed = 0;
        this.laps = 0;
        this.trackProgress = 0;
        this.lastCheckpoint = 0;

        // Variables pour une physique plus réaliste
        this.angularVelocity = 0;
        this.lateralVelocity = new THREE.Vector3();
        this.targetRotation = 0;
        this.steerInput = 0;

        // Variables pour les effets de dérapage
        this.isDrifting = false;
        this.driftEffects = null;
        this.driftAudioPlaying = false;

        this.createModel(color);
    }

    createModel(color) {
        this.group = new THREE.Group();

        // Corps du kart
        const bodyGeometry = new THREE.BoxGeometry(1.5, 0.5, 2.5);
        const bodyMaterial = new THREE.MeshLambertMaterial({ color: color });
        this.body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        this.body.position.y = 0.25;
        this.body.castShadow = true;
        this.group.add(this.body);

        // Roues
        const wheelGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.2, 8);
        const wheelMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });

        const wheelPositions = [
            [-0.8, 0, 1], [0.8, 0, 1],
            [-0.8, 0, -1], [0.8, 0, -1]
        ];

        this.wheels = [];
        wheelPositions.forEach(pos => {
            const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
            wheel.position.set(pos[0], pos[1], pos[2]);
            wheel.rotation.z = Math.PI / 2;
            wheel.castShadow = true;
            this.group.add(wheel);
            this.wheels.push(wheel);
        });

        this.game.getScene().add(this.group);
        
        // Créer le système de particules pour la fumée de dérapage
        this.createDriftEffects();
    }

    createDriftEffects() {
        // Géométrie des particules
        const particleCount = 50;
        const particles = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const velocities = new Float32Array(particleCount * 3);
        const ages = new Float32Array(particleCount);

        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = 0;
            positions[i * 3 + 1] = 0;
            positions[i * 3 + 2] = 0;
            velocities[i * 3] = 0;
            velocities[i * 3 + 1] = 0;
            velocities[i * 3 + 2] = 0;
            ages[i] = 0;
        }

        particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particles.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
        particles.setAttribute('age', new THREE.BufferAttribute(ages, 1));

        // Matériau des particules
        const particleMaterial = new THREE.PointsMaterial({
            color: 0x888888,
            size: 0.8,
            transparent: true,
            opacity: 0.6,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });

        this.driftEffects = new THREE.Points(particles, particleMaterial);
        this.driftEffects.visible = false;
        this.game.getScene().add(this.driftEffects);
    }

    setPosition(position) {
        this.position.copy(position);
        this.updateTransform();
    }

    getPosition() {
        return this.position.clone();
    }

    getRotation() {
        return this.rotation;
    }

    update(inputs = null) {
        if (!this.game.gameStarted || this.game.raceFinished) return;

        if (this.isPlayer && inputs) {
            this.handlePlayerInput(inputs);
        } else if (!this.isPlayer) {
            this.handleAI();
        }        this.applyPhysics();
        this.updateTransform();
        this.updateDriftEffects();
        this.checkLapProgress();
    }

    // Accélération progressive avec courbe non-linéaire
    handlePlayerInput(inputs) {
        if (inputs.up) {
            if (this.speed < this.maxSpeed) {
                // Courbe plus équilibrée - progression rapide puis ralentissement
                const speedFactor = Math.pow(1 - (this.speed / this.maxSpeed), 2)
                const addedSpeed = this.acceleration * speedFactor;

                this.speed = Math.max(this.speed + addedSpeed, 0);
                console.log(`Added Speed: ${addedSpeed}, Current Speed: ${this.speed}`);
            }
        }

        // Direction avec sensibilité variable selon la vitesse (logarithmique, jamais 0)
        const minTurnSpeed = 0.05;
        const speedNorm = Math.max(Math.abs(this.speed) / this.maxSpeed, 0.001);
        // Logarithmic scaling: higher speed = lower turn, but never zero
        this.turnSpeed = Math.max(
            this.maxTurnSpeed * (1 - Math.log10(1 + 9 * speedNorm)),
            minTurnSpeed
        );

        this.steerInput = 0;
        if (inputs.left && Math.abs(this.speed) > 0.02) {
            this.steerInput = speedNorm * (this.speed > 0 ? 1 : -1) * 0.7;
        }
        if (inputs.right && Math.abs(this.speed) > 0.02) {
            this.steerInput = -speedNorm * (this.speed > 0 ? 1 : -1) * 0.7;
        }

        // Application progressive de la rotation
        this.angularVelocity += this.steerInput * this.turnSpeed * 0.15;
        this.angularVelocity *= 0.75; // Amortissement plus fort
        this.rotation += this.angularVelocity;        // Gestion du dérapage avec la barre d'espace
        if (inputs.drift && Math.abs(this.speed) > this.maxSpeed * 0.3) {
            // Mode dérapage activé - réduire la traction pour permettre le glissement
            this.traction = 0.4; // Traction très réduite pour dérapage
            this.driftFactor = 0.25; // Augmenter l'effet de dérapage
            
            // Légère perte de vitesse pendant le dérapage
            this.speed *= 0.985;
            
            // Améliorer la capacité de virage en dérapage
            this.turnSpeed = Math.max(this.turnSpeed * 1.5, 0.1);
            
            // Activer les effets de dérapage
            if (!this.isDrifting) {
                this.isDrifting = true;
                this.startDriftEffects();
            }
        } else {
            // Mode normal - restaurer les valeurs par défaut
            this.traction = 0.95;
            this.driftFactor = 0.08;
            
            // Désactiver les effets de dérapage
            if (this.isDrifting) {
                this.isDrifting = false;
                this.stopDriftEffects();
            }
        }

        // Dérapage naturel à haute vitesse
        if (Math.abs(this.steerInput) > 0.5 && Math.abs(this.speed) > this.maxSpeed * 0.6) {
            this.speed *= 0.98; // Légère perte de vitesse en virage serré
        }

        // Pas d'entrée - décélération naturelle avec inertie
        if (!inputs.up && !inputs.down) {
            // Décélération naturelle modérée
            this.speed *= this.airResistance;
        }
        // Freinage avec inertie
        if (inputs.down) {
            // Freinage efficace mais pas trop brutal
            this.speed *= (this.airResistance * 0.95);
        }
    }    
    
    handleAI() {
        const track = this.game.getTrack();
        const targetPoint = this.getNextTrackPoint(track);
        const direction = new THREE.Vector3()
            .subVectors(targetPoint, this.position)
            .normalize();
        
        const targetAngle = Math.atan2(direction.x, direction.z);
        let angleDiff = targetAngle - this.rotation;
        
        // Normaliser l'angle
        while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
        while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
        
        // Calculer la vitesse de rotation pour l'IA
        const minTurnSpeed = 0.05;
        const speedNorm = Math.max(Math.abs(this.speed) / this.maxSpeed, 0.001);
        const aiTurnSpeed = Math.max(
            this.maxTurnSpeed * (1 - Math.log10(1 + 9 * speedNorm)),
            minTurnSpeed
        );
          // Calculer l'input de direction pour l'IA
        let aiSteerInput = 0;
        if (Math.abs(angleDiff) > 0.1) {
            aiSteerInput = Math.sign(angleDiff) * Math.min(Math.abs(angleDiff) / Math.PI, 1.0);
            this.angularVelocity += aiSteerInput * aiTurnSpeed * 0.12;
        }
        
        // Appliquer l'amortissement comme pour le joueur
        this.angularVelocity *= 0.75;
        this.rotation += this.angularVelocity;
        
        // Perte de vitesse en virage comme pour le joueur
        if (Math.abs(aiSteerInput) > 0.5 && Math.abs(this.speed) > this.maxSpeed * 0.6) {
            this.speed *= 0.98;
        }
        
        // Accélération avec courbe progressive comme pour le joueur
        if (this.speed < this.maxSpeed) {
            const speedFactor = Math.pow(1 - (this.speed / this.maxSpeed), 2);
            const addedSpeed = this.acceleration * speedFactor * 0.7; // Légèrement plus lent que le joueur
            this.speed = Math.min(this.speed + addedSpeed, this.maxSpeed);
        }
        
        // Appliquer la résistance de l'air
        this.speed *= this.airResistance;
    }

    getNextTrackPoint(track) {
        const trackPoints = track.getTrackPoints();
        const nextIndex = (Math.floor(this.trackProgress) + 5) % trackPoints.length;
        return trackPoints[nextIndex];
    }

    applyPhysics() {
        // Conversion de la vitesse en unités par seconde
        this.speedPixels = this.speed * 0.01; // Convertir km/h en pixels par seconde

        // Calculer la direction avant du kart
        const forwardDirection = new THREE.Vector3(
            Math.sin(this.rotation),
            0,
            Math.cos(this.rotation)
        );

        // Calculer la direction latérale (perpendiculaire)
        const lateralDirection = new THREE.Vector3(
            Math.cos(this.rotation),
            0,
            -Math.sin(this.rotation)
        );

        // Vélocité dans la direction avant
        const forwardVelocity = forwardDirection.clone().multiplyScalar(this.speedPixels);

        // Calculer la composante latérale de la vélocité actuelle
        const currentLateralSpeed = this.velocity.dot(lateralDirection);

        // Appliquer la traction (résistance au dérapage latéral)
        const lateralVelocity = lateralDirection.clone().multiplyScalar(currentLateralSpeed * this.traction);

        // Combiner les vélocités avant et latérale
        this.velocity.copy(forwardVelocity).add(lateralVelocity);

        // Ajout d'un léger dérapage pour plus de réalisme
        if (Math.abs(this.angularVelocity) > 0.02) {
            const driftOffset = lateralDirection.clone().multiplyScalar(
                this.angularVelocity * this.driftFactor * Math.abs(this.speedPixels)
            );
            this.velocity.add(driftOffset);
        }

        // Gravité et hauteur du terrain
        const terrainHeight = this.game.getTrack().getTerrainHeight(this.position.x, this.position.z);
        if (this.position.y > terrainHeight + 0.5) {
            this.velocity.y -= 0.025; // Gravité légèrement plus forte
        } else {
            this.position.y = terrainHeight + 0.5;
            this.velocity.y = 0;
        }        // Appliquer la vélocité avec limitation pour éviter les mouvements trop rapides
        const maxVelocityMagnitude = this.maxSpeed * 1.8;
        if (this.velocity.length() > maxVelocityMagnitude) {
            this.velocity.normalize().multiplyScalar(maxVelocityMagnitude);
        }        // Vérifier les collisions avant de mettre à jour la position
        const newPosition = this.position.clone().add(this.velocity);
        
        // Collision avec les arbres
        const collidedTree = this.game.getTrack().checkTreeCollision(newPosition, 1.5);
        
        // Collision avec les autres karts
        const collidedKart = this.checkKartCollision(newPosition, 1.8);
        
        if (collidedTree) {
            // Collision avec un arbre
            const collisionDirection = new THREE.Vector3()
                .subVectors(this.position, collidedTree.position)
                .normalize();
            
            // Arrêter le kart et le faire rebondir légèrement
            this.speed *= 0.3; // Réduction drastique de la vitesse
            this.velocity.multiplyScalar(0.2); // Réduire la vélocité
            
            // Ajouter un rebond dans la direction opposée à l'arbre
            const bounceForce = collisionDirection.multiplyScalar(2);
            this.velocity.add(bounceForce);
            
            // Éviter que le kart reste coincé dans l'arbre
            const pushDistance = (collidedTree.radius + 1.5) - this.position.distanceTo(collidedTree.position);
            if (pushDistance > 0) {
                const pushDirection = collisionDirection.clone().multiplyScalar(pushDistance);
                this.position.add(pushDirection);
            }
        } else if (collidedKart) {
            // Collision avec un autre kart
            this.handleKartCollision(collidedKart);
        } else {
            // Pas de collision - mise à jour normale de la position
            this.position.add(this.velocity);
        }    }

    checkKartCollision(newPosition, kartRadius = 1.8) {
        // Obtenir tous les karts du jeu
        const allKarts = this.game.getAllKarts();
        
        for (let otherKart of allKarts) {
            // Ne pas vérifier la collision avec soi-même
            if (otherKart === this) continue;
            
            const distance = newPosition.distanceTo(otherKart.position);
            if (distance < kartRadius) {
                return otherKart;
            }
        }
        return null;
    }
    
    handleKartCollision(otherKart) {
        // Calculer la direction de collision
        const collisionDirection = new THREE.Vector3()
            .subVectors(this.position, otherKart.position)
            .normalize();
        
        // Calculer les vitesses relatives
        const relativeVelocity = this.velocity.clone().sub(otherKart.velocity);
        const collisionSpeed = relativeVelocity.dot(collisionDirection);
        
        // Ne traiter que les collisions frontales (objets qui se rapprochent)
        if (collisionSpeed > 0) return;
        
        // Facteur d'élasticité (0 = collision parfaitement inélastique, 1 = parfaitement élastique)
        const elasticity = 0.6;
        
        // Masses des karts (on peut les considérer égales)
        const mass1 = 1;
        const mass2 = 1;
        
        // Calcul de l'impulsion de collision
        const impulse = -(1 + elasticity) * collisionSpeed / (mass1 + mass2);
        
        // Appliquer l'impulsion aux deux karts
        const impulseVector = collisionDirection.clone().multiplyScalar(impulse);
        
        // Mise à jour des vélocités
        this.velocity.add(impulseVector.clone().multiplyScalar(mass2));
        otherKart.velocity.sub(impulseVector.clone().multiplyScalar(mass1));
        
        // Réduction de vitesse due à la collision
        this.speed *= 0.8;
        otherKart.speed *= 0.8;
        
        // Séparer les karts pour éviter qu'ils restent coincés
        const separationDistance = 3.6; // 2 * kartRadius
        const currentDistance = this.position.distanceTo(otherKart.position);
        const overlap = separationDistance - currentDistance;
        
        if (overlap > 0) {
            const separationVector = collisionDirection.clone().multiplyScalar(overlap * 0.5);
            this.position.add(separationVector);
            otherKart.position.sub(separationVector);
        }
        
        // Ajouter un léger effet de rotation due à la collision
        const rotationEffect = Math.sign(collisionDirection.cross(new THREE.Vector3(0, 1, 0)).y) * 0.1;
        this.angularVelocity += rotationEffect;
        otherKart.angularVelocity -= rotationEffect;
    }

    checkLapProgress() {
        const track = this.game.getTrack();
        const trackPoints = track.getTrackPoints();

        // Calculer la progression sur la piste
        let closestDistance = Infinity;
        let closestIndex = 0;

        trackPoints.forEach((point, index) => {
            const distance = this.position.distanceTo(point);
            if (distance < closestDistance) {
                closestDistance = distance;
                closestIndex = index;
            }
        });

        // Vérifier si on a franchi la ligne d'arrivée
        if (closestIndex < 10 && this.lastCheckpoint > trackPoints.length - 10) {
            this.laps++;
            this.game.onLapCompleted(this);
        }

        this.trackProgress = closestIndex;
        this.lastCheckpoint = closestIndex;
    }    updateTransform() {
        this.group.position.copy(this.position);
        this.group.rotation.y = this.rotation;

        // Rotation des roues basée sur la vitesse réelle
        const wheelRotationSpeed = Math.abs(this.speed) * 8;
        this.wheels.forEach(wheel => {
            wheel.rotation.x += wheelRotationSpeed;
        });
        
        // Incliner le kart dans les virages pour plus de réalisme
        let tiltAmount = this.angularVelocity * 0.15;
        
        // Incliner davantage pendant le dérapage si c'est le joueur
        if (this.isPlayer && this.traction < 0.5) { // En mode dérapage
            tiltAmount *= 2.5; // Inclinaison plus prononcée
        }
        
        this.group.rotation.z = THREE.MathUtils.lerp(this.group.rotation.z, tiltAmount, 0.08);

        // Limiter les mouvements erratiques après collision
        if (Math.abs(this.velocity.x) > 3 || Math.abs(this.velocity.z) > 3) {
            this.velocity.multiplyScalar(0.7);
        }
    }    destroy() {
        // Nettoyer les effets de dérapage
        this.stopDriftEffects();
        
        if (this.driftEffects) {
            this.game.getScene().remove(this.driftEffects);
            this.driftEffects.geometry.dispose();
            this.driftEffects.material.dispose();
        }
        
        // Nettoyer le modèle du kart
        if (this.group) {
            this.game.getScene().remove(this.group);
        }
    }

    getSpeed() {
        return Math.abs(this.speed); // Convertir en km/h pour l'affichage
    }

    startDriftEffects() {
        if (!this.isPlayer) return; // Effets seulement pour le joueur
        
        // Afficher les particules de fumée
        if (this.driftEffects) {
            this.driftEffects.visible = true;
        }
        
        // Jouer l'effet audio de dérapage
        if (this.game.audioManager && !this.driftAudioPlaying) {
            this.game.audioManager.playEffect('drift');
            this.driftAudioPlaying = true;
            
            // Répéter l'effet audio tant que le dérapage continue
            this.driftAudioInterval = setInterval(() => {
                if (this.isDrifting) {
                    this.game.audioManager.playEffect('drift');
                }
            }, 500);
        }
    }

    stopDriftEffects() {
        // Masquer les particules de fumée
        if (this.driftEffects) {
            this.driftEffects.visible = false;
        }
        
        // Arrêter l'effet audio
        if (this.driftAudioInterval) {
            clearInterval(this.driftAudioInterval);
            this.driftAudioInterval = null;
        }
        this.driftAudioPlaying = false;
    }

    updateDriftEffects() {
        if (!this.driftEffects || !this.isDrifting) return;

        const positions = this.driftEffects.geometry.attributes.position.array;
        const velocities = this.driftEffects.geometry.attributes.velocity.array;
        const ages = this.driftEffects.geometry.attributes.age.array;
        const particleCount = positions.length / 3;

        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            
            // Vieillissement des particules
            ages[i] += 0.02;
            
            // Si la particule est trop vieille, la réinitialiser
            if (ages[i] > 1.0) {
                // Position initiale près des roues arrière
                positions[i3] = this.position.x + (Math.random() - 0.5) * 2;
                positions[i3 + 1] = this.position.y + 0.1;
                positions[i3 + 2] = this.position.z + (Math.random() - 0.5) * 2;
                
                // Vélocité aléatoire vers l'arrière et vers le haut
                velocities[i3] = (Math.random() - 0.5) * 0.2;
                velocities[i3 + 1] = Math.random() * 0.1;
                velocities[i3 + 2] = (Math.random() - 0.5) * 0.2;
                
                ages[i] = 0;
            } else {
                // Mettre à jour la position en fonction de la vélocité
                positions[i3] += velocities[i3];
                positions[i3 + 1] += velocities[i3 + 1];
                positions[i3 + 2] += velocities[i3 + 2];
                
                // Appliquer la gravité et la résistance de l'air
                velocities[i3] *= 0.98;
                velocities[i3 + 1] -= 0.002; // Gravité
                velocities[i3 + 2] *= 0.98;
            }
        }

        // Marquer les attributs comme modifiés
        this.driftEffects.geometry.attributes.position.needsUpdate = true;
        this.driftEffects.geometry.attributes.velocity.needsUpdate = true;
        this.driftEffects.geometry.attributes.age.needsUpdate = true;
        
        // Ajuster l'opacité en fonction de la vitesse de dérapage
        const driftIntensity = Math.min(Math.abs(this.speed) / this.maxSpeed, 1.0);
        this.driftEffects.material.opacity = 0.3 + driftIntensity * 0.3;
    }
}
