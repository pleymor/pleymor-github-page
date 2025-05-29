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
        this.driftFactor = 0.08;

        // Variables de position et de mouvement
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
        }

        this.applyPhysics();
        this.updateTransform();
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
        this.rotation += this.angularVelocity;

        // Dérapage naturel à haute vitesse
        if (Math.abs(this.steerInput) > 0.5 && Math.abs(this.speed) > this.maxSpeed * 0.6) {
            this.speed *= 0.98; // Légère perte de vitesse en virage serré
        }        // Pas d'entrée - décélération naturelle avec inertie
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
        }

        // Vérifier les collisions avec les arbres avant de mettre à jour la position
        const newPosition = this.position.clone().add(this.velocity);
        const collidedTree = this.game.getTrack().checkTreeCollision(newPosition, 1.5);
        
        if (collidedTree) {
            // Collision détectée - calculer la direction de rebond
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
        } else {
            // Pas de collision - mise à jour normale de la position
            this.position.add(this.velocity);
        }
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
    }
    updateTransform() {
        this.group.position.copy(this.position);
        this.group.rotation.y = this.rotation;

        // Rotation des roues basée sur la vitesse réelle
        const wheelRotationSpeed = Math.abs(this.speed) * 8;
        this.wheels.forEach(wheel => {
            wheel.rotation.x += wheelRotationSpeed;
        });
        // Incliner légèrement le kart dans les virages pour plus de réalisme
        const tiltAmount = this.angularVelocity * 0.15;
        this.group.rotation.z = THREE.MathUtils.lerp(this.group.rotation.z, tiltAmount, 0.08);

        // Limiter les mouvements erratiques après collision
        if (Math.abs(this.velocity.x) > 3 || Math.abs(this.velocity.z) > 3) {
            this.velocity.multiplyScalar(0.7);
        }
    }

    getSpeed() {
        return Math.abs(this.speed); // Convertir en km/h pour l'affichage
    }
}
