// Kart.js - Classe pour les véhicules
class Kart {    constructor(color, isPlayer = false, game) {
        this.isPlayer = isPlayer;
        this.game = game;
        this.shaderManager = new ShaderManager();

        // Propriétés du kart
        this.maxSpeed = isPlayer ? 80 : 80; // Vitesse maximale en km/h
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
    } createModel(color) {
        this.group = new THREE.Group();        // Châssis principal - forme plus réaliste
        const mainBodyGeometry = new THREE.BoxGeometry(1.4, 0.4, 2.2);
        const bodyMaterial = this.shaderManager.getKartMaterial(color, 0.0);
        this.body = new THREE.Mesh(mainBodyGeometry, bodyMaterial);
        this.body.position.set(0, 0.3, 0);
        this.body.castShadow = true;
        this.group.add(this.body);

        // Cockpit (partie avant surélevée)
        const cockpitGeometry = new THREE.BoxGeometry(1.0, 0.3, 1.0);
        const cockpitMaterial = this.shaderManager.getKartMaterial(new THREE.Color(color).multiplyScalar(0.8), 0.0);
        const cockpit = new THREE.Mesh(cockpitGeometry, cockpitMaterial);
        cockpit.position.set(0, 0.65, 0.3);
        cockpit.castShadow = true;
        this.group.add(cockpit);        // Siège du pilote
        const seatGeometry = new THREE.BoxGeometry(0.6, 0.4, 0.8);
        const seatMaterial = this.shaderManager.getKartMaterial(new THREE.Color(0x222222), 0.0);
        const seat = new THREE.Mesh(seatGeometry, seatMaterial);
        seat.position.set(0, 0.7, 0.2);
        seat.castShadow = true;
        this.group.add(seat);

        // Dossier du siège
        const backrestGeometry = new THREE.BoxGeometry(0.6, 0.6, 0.1);
        const backrest = new THREE.Mesh(backrestGeometry, seatMaterial);
        backrest.position.set(0, 0.8, -0.15);
        backrest.castShadow = true;
        this.group.add(backrest);

        // Volant
        const steeringWheelGeometry = new THREE.TorusGeometry(0.15, 0.02, 8, 16);
        const steeringWheelMaterial = this.shaderManager.getKartMaterial(new THREE.Color(0x111111), 0.0);
        const steeringWheel = new THREE.Mesh(steeringWheelGeometry, steeringWheelMaterial);
        steeringWheel.position.set(0, 0.9, 0.4);
        steeringWheel.rotation.x = -Math.PI / 6;
        steeringWheel.castShadow = true;
        this.group.add(steeringWheel);

        // Support du volant
        const steeringColumnGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.3, 8);
        const steeringColumn = new THREE.Mesh(steeringColumnGeometry, steeringWheelMaterial);
        steeringColumn.position.set(0, 0.75, 0.35);
        steeringColumn.rotation.x = -Math.PI / 6;
        steeringColumn.castShadow = true;
        this.group.add(steeringColumn);

        // Aileron arrière
        const rearWingGeometry = new THREE.BoxGeometry(1.6, 0.05, 0.3);
        const rearWingMaterial = this.shaderManager.getKartMaterial(new THREE.Color(color).multiplyScalar(0.7), 0.0);
        const rearWing = new THREE.Mesh(rearWingGeometry, rearWingMaterial);
        rearWing.position.set(0, 0.8, -1.2);
        rearWing.castShadow = true;
        this.group.add(rearWing);

        // Supports de l'aileron
        for (let x of [-0.6, 0.6]) {
            const wingSupportGeometry = new THREE.CylinderGeometry(0.03, 0.03, 0.4, 6);
            const wingSupportMaterial = this.shaderManager.getKartMaterial(new THREE.Color(0x444444), 0.0);
            const wingSupport = new THREE.Mesh(wingSupportGeometry, wingSupportMaterial);
            wingSupport.position.set(x, 0.6, -1.2);
            wingSupport.castShadow = true;
            this.group.add(wingSupport);
        }

        // Pare-chocs avant
        const frontBumperGeometry = new THREE.BoxGeometry(1.3, 0.15, 0.2);
        const bumperMaterial = this.shaderManager.getKartMaterial(new THREE.Color(0x666666), 0.0);
        const frontBumper = new THREE.Mesh(frontBumperGeometry, bumperMaterial);
        frontBumper.position.set(0, 0.2, 1.2);
        frontBumper.castShadow = true;
        this.group.add(frontBumper);

        // Pare-chocs arrière
        const rearBumper = new THREE.Mesh(frontBumperGeometry, bumperMaterial);
        rearBumper.position.set(0, 0.2, -1.2);
        rearBumper.castShadow = true;
        this.group.add(rearBumper);

        // Roues améliorées
        this.wheels = [];
        const wheelPositions = [
            [-0.8, 0, 1], [0.8, 0, 1],    // Roues avant
            [-0.8, 0, -1], [0.8, 0, -1]  // Roues arrière
        ];

        wheelPositions.forEach((pos, index) => {            // Pneu
            const tireGeometry = new THREE.CylinderGeometry(0.35, 0.35, 0.25, 12);
            const tireMaterial = this.shaderManager.getKartMaterial(new THREE.Color(0x222222), 0.0);
            const tire = new THREE.Mesh(tireGeometry, tireMaterial);
            tire.position.set(pos[0], pos[1], pos[2]);
            tire.rotation.z = Math.PI / 2;
            tire.castShadow = true;
            this.group.add(tire);// Jante
            const rimGeometry = new THREE.CylinderGeometry(0.25, 0.25, 0.15, 8);
            const rimMaterial = this.shaderManager.getKartMaterial(new THREE.Color(0xCCCCCC), 0.0);
            const rim = new THREE.Mesh(rimGeometry, rimMaterial);
            rim.position.set(pos[0], pos[1], pos[2]);
            rim.rotation.z = Math.PI / 2;
            rim.castShadow = true;
            this.group.add(rim);

            // Rayons de jante
            for (let i = 0; i < 5; i++) {
                const spokeGeometry = new THREE.BoxGeometry(0.02, 0.2, 0.02);
                const spoke = new THREE.Mesh(spokeGeometry, rimMaterial);
                const angle = (i / 5) * Math.PI * 2;
                spoke.position.set(
                    pos[0] + Math.cos(angle) * 0.1,
                    pos[1] + Math.sin(angle) * 0.1,
                    pos[2]
                );
                spoke.rotation.z = angle + Math.PI / 2;
                spoke.castShadow = true;
                this.group.add(spoke);
            }

            this.wheels.push(tire);
        });        // Détails décoratifs - bandes colorées
        const stripeGeometry = new THREE.BoxGeometry(1.5, 0.05, 0.3);
        const brightColor = new THREE.Color(color).multiplyScalar(1.5);
        // Limiter les valeurs RGB entre 0 et 1
        brightColor.r = Math.min(brightColor.r, 1);
        brightColor.g = Math.min(brightColor.g, 1);
        brightColor.b = Math.min(brightColor.b, 1);        const stripeMaterial = this.shaderManager.getKartMaterial(brightColor, 0.0);

        // Bande sur le côté
        for (let side of [-1, 1]) {
            const stripe = new THREE.Mesh(stripeGeometry, stripeMaterial);
            stripe.position.set(0, 0.45, 0);
            stripe.rotation.y = side * Math.PI / 2;
            stripe.position.x = side * 0.7;
            this.group.add(stripe);
        }

        // Numéro sur le kart (pour différencier les karts)
        if (!this.isPlayer) {
            const numberGeometry = new THREE.BoxGeometry(0.3, 0.3, 0.02);
            const numberMaterial = this.shaderManager.getKartMaterial(new THREE.Color(0xFFFFFF), 0.0);
            const numberPlate = new THREE.Mesh(numberGeometry, numberMaterial);
            numberPlate.position.set(0, 0.6, 1.1);
            numberPlate.castShadow = true;
            this.group.add(numberPlate);
        }

        // Échappement
        const exhaustGeometry = new THREE.CylinderGeometry(0.08, 0.08, 0.4, 8);        const exhaustMaterial = this.shaderManager.getKartMaterial(new THREE.Color(0x444444), 0.0);
        const exhaust = new THREE.Mesh(exhaustGeometry, exhaustMaterial);
        exhaust.position.set(-0.4, 0.3, -1.1);
        exhaust.rotation.x = Math.PI / 2;
        exhaust.castShadow = true;
        this.group.add(exhaust);

        this.game.getScene().add(this.group);

        // Créer le système de particules pour la fumée de dérapage
        this.createDriftEffects();
    } createDriftEffects() {
        // Géométrie des particules améliorée
        const particleCount = 100; // Plus de particules pour un effet plus dense
        const particles = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const velocities = new Float32Array(particleCount * 3);
        const ages = new Float32Array(particleCount);
        const sizes = new Float32Array(particleCount);

        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = 0;
            positions[i * 3 + 1] = 0;
            positions[i * 3 + 2] = 0;
            velocities[i * 3] = 0;
            velocities[i * 3 + 1] = 0;
            velocities[i * 3 + 2] = 0;
            ages[i] = 0;
            sizes[i] = Math.random() * 2 + 0.5; // Tailles variables
        }

        particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particles.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
        particles.setAttribute('age', new THREE.BufferAttribute(ages, 1));
        particles.setAttribute('size', new THREE.BufferAttribute(sizes, 1));        // Matériau des particules amélioré
        const particleMaterial = this.shaderManager.getParticleMaterial();

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

        // Debug logging for mobile troubleshooting
        if (this.isPlayer && inputs) {
            // Log input states for debugging
            const hasMovementInput = inputs.up || inputs.down || inputs.left || inputs.right || Math.abs(inputs.joystickX) > 0.1 || Math.abs(inputs.joystickY) > 0.1;
            if (hasMovementInput) {
                console.log('🎮 Player inputs received:', {
                    up: inputs.up,
                    down: inputs.down,
                    left: inputs.left,
                    right: inputs.right,
                    joystickX: inputs.joystickX?.toFixed(2),
                    joystickY: inputs.joystickY?.toFixed(2),
                    currentSpeed: this.speed.toFixed(2),
                    position: `(${this.position.x.toFixed(1)}, ${this.position.z.toFixed(1)})`
                });
            }
            this.handlePlayerInput(inputs);
        } else if (!this.isPlayer) {
            this.handleAI();
        }

        // Log physics and transform updates
        const oldPosition = this.position.clone();
        this.applyPhysics();
        const newPosition = this.position.clone();

        // Check if position actually changed
        const positionChanged = oldPosition.distanceTo(newPosition) > 0.001;
        if (this.isPlayer && this.speed > 0.1 && !positionChanged) {
            console.warn('⚠️ Player kart has speed but position not changing!', {
                speed: this.speed.toFixed(2),
                velocity: `(${this.velocity.x.toFixed(3)}, ${this.velocity.z.toFixed(3)})`,
                oldPos: `(${oldPosition.x.toFixed(2)}, ${oldPosition.z.toFixed(2)})`,
                newPos: `(${newPosition.x.toFixed(2)}, ${newPosition.z.toFixed(2)})`
            });
        }        this.updateTransform();
        this.updateDriftEffects();
        this.updateShaders();
        this.checkLapProgress();
    }    updateShaders() {
        // Update kart materials based on current speed
        const speedNormalized = Math.abs(this.speed) / this.maxSpeed;
        
        // Update materials with speed-based effects by recreating them
        if (this.shaderManager) {
            // Update main body material
            if (this.body && this.body.material) {
                this.body.material = this.shaderManager.getKartMaterial(0xff4444, speedNormalized);
            }
            
            // Update other major components for performance (optional - can be expanded)
            if (this.cockpit && this.cockpit.material) {
                this.cockpit.material = this.shaderManager.getKartMaterial(0x222222, speedNormalized);
            }
        }
    }

    // Accélération progressive avec courbe non-linéaire
    handlePlayerInput(inputs) {
        // Debug log for speed changes
        const initialSpeed = this.speed;

        if (inputs.up) {
            if (this.speed < this.maxSpeed) {
                // Courbe plus équilibrée - progression rapide puis ralentissement
                const speedFactor = Math.pow(1 - (this.speed / this.maxSpeed), 2)
                const addedSpeed = this.acceleration * speedFactor;

                this.speed = Math.max(this.speed + addedSpeed, 0);
                console.log(`🚀 Speed increased from ${initialSpeed.toFixed(2)} to ${this.speed.toFixed(2)} (added: ${addedSpeed.toFixed(3)})`);
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

        // Enhanced steering with analog joystick support
        if (inputs.joystickX && Math.abs(inputs.joystickX) > 0.1 && Math.abs(this.speed) > 0.02) {
            // Use analog joystick input for smooth steering
            this.steerInput = -inputs.joystickX * speedNorm * (this.speed > 0 ? 1 : -1) * 0.8;
            console.log(`🕹️ Joystick steering: ${this.steerInput.toFixed(3)} (joystickX: ${inputs.joystickX.toFixed(2)})`);
        } else {
            // Fallback to digital input (keyboard/discrete touch)
            if (inputs.left && Math.abs(this.speed) > 0.02) {
                this.steerInput = speedNorm * (this.speed > 0 ? 1 : -1) * 0.7;
                console.log(`⬅️ Left steering: ${this.steerInput.toFixed(3)}`);
            }
            if (inputs.right && Math.abs(this.speed) > 0.02) {
                this.steerInput = -speedNorm * (this.speed > 0 ? 1 : -1) * 0.7;
                console.log(`➡️ Right steering: ${this.steerInput.toFixed(3)}`);
            }
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
            this.speed *= 0.90;
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
        // Debug initial state
        const initialPosition = this.position.clone();
        const initialVelocity = this.velocity.clone();

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

        // Debug velocity calculation
        if (this.isPlayer && this.speed > 0.1) {
            console.log(`⚡ Physics calculation:`, {
                speed: this.speed.toFixed(2),
                speedPixels: this.speedPixels.toFixed(4),
                forwardVel: `(${forwardVelocity.x.toFixed(3)}, ${forwardVelocity.z.toFixed(3)})`,
                finalVel: `(${this.velocity.x.toFixed(3)}, ${this.velocity.z.toFixed(3)})`,
                rotation: this.rotation.toFixed(3)
            });
        }

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
        }
    }

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
    } updateTransform() {

        this.group.position.copy(this.position);
        this.group.rotation.y = this.rotation;

        // Animation des roues - rotation basée sur la vitesse réelle
        const wheelRotationSpeed = Math.abs(this.speed) * 0.08;
        this.wheels.forEach((wheel, index) => {
            wheel.rotation.x += wheelRotationSpeed;

            // Rotation des roues avant pour la direction (effet de braquage)
            if (index < 2) { // Roues avant
                const steerAngle = this.steerInput * 0.3;
                wheel.rotation.y = THREE.MathUtils.lerp(wheel.rotation.y, steerAngle, 0.1);
            }
        });

        // Incliner le kart dans les virages pour plus de réalisme
        let tiltAmount = this.angularVelocity * 0.2;

        // Incliner davantage pendant le dérapage si c'est le joueur
        if (this.isPlayer && this.traction < 0.5) { // En mode dérapage
            tiltAmount *= 3.0; // Inclinaison plus prononcée
        }

        this.group.rotation.z = THREE.MathUtils.lerp(this.group.rotation.z, tiltAmount, 0.12);

        // Effet de rebond vertical basé sur la vitesse et les virages
        const baseHeight = this.position.y;
        const bounceAmount = Math.abs(this.speed) * 0.002 + Math.abs(this.angularVelocity) * 0.05;
        const bounceOffset = Math.sin(Date.now() * 0.01) * bounceAmount;
        this.group.position.y = baseHeight + bounceOffset;

        // Animation du volant selon la direction
        if (this.group.children.length > 6) { // Vérifier que le volant existe
            const steeringWheel = this.group.children.find(child =>
                child.geometry && child.geometry.type === 'TorusGeometry'
            );
            if (steeringWheel) {
                const targetRotation = this.steerInput * 0.5;
                steeringWheel.rotation.z = THREE.MathUtils.lerp(
                    steeringWheel.rotation.z,
                    targetRotation,
                    0.15
                );
            }
        }

        // Effet de compression/extension des suspensions dans les virages
        if (this.wheels.length === 4) {
            const suspensionEffect = this.angularVelocity * 0.1;

            // Roues extérieures s'abaissent, roues intérieures se relèvent
            this.wheels[0].position.y = suspensionEffect; // Roue avant gauche
            this.wheels[1].position.y = -suspensionEffect; // Roue avant droite
            this.wheels[2].position.y = suspensionEffect; // Roue arrière gauche
            this.wheels[3].position.y = -suspensionEffect; // Roue arrière droite
        }

        // Limiter les mouvements erratiques après collision
        if (Math.abs(this.velocity.x) > 3 || Math.abs(this.velocity.z) > 3) {
            this.velocity.multiplyScalar(0.7);
        }

        // Effet de fumée d'échappement basé sur l'accélération
        if (this.speed > this.maxSpeed * 0.7) {
            // Créer occasionnellement des particules d'échappement
            if (Math.random() < 0.1) {
                this.createExhaustParticle();
            }
        }
    } destroy() {
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
                // Position initiale près des roues arrière avec direction réaliste
                const rearOffset = new THREE.Vector3(
                    Math.sin(this.rotation),
                    0,
                    Math.cos(this.rotation)
                ).multiplyScalar(-0.8); // Vers l'arrière du kart

                positions[i3] = this.position.x + rearOffset.x + (Math.random() - 0.5) * 1.5;
                positions[i3 + 1] = this.position.y + 0.05;
                positions[i3 + 2] = this.position.z + rearOffset.z + (Math.random() - 0.5) * 1.5;

                // Vélocité latérale basée sur la direction du dérapage
                const lateralDirection = new THREE.Vector3(
                    Math.cos(this.rotation),
                    0,
                    -Math.sin(this.rotation)
                );

                const driftDirection = lateralDirection.multiplyScalar(this.angularVelocity * 2);

                velocities[i3] = driftDirection.x + (Math.random() - 0.5) * 0.3;
                velocities[i3 + 1] = Math.random() * 0.15;
                velocities[i3 + 2] = driftDirection.z + (Math.random() - 0.5) * 0.3;

                ages[i] = 0;
            } else {
                // Mettre à jour la position en fonction de la vélocité
                positions[i3] += velocities[i3];
                positions[i3 + 1] += velocities[i3 + 1];
                positions[i3 + 2] += velocities[i3 + 2];
                // Appliquer la gravité et la résistance de l'air
                velocities[i3] *= 0.96;
                velocities[i3 + 1] -= 0.003; // Gravité plus forte
                velocities[i3 + 2] *= 0.96;
            }
        }

        // Marquer les attributs comme modifiés
        this.driftEffects.geometry.attributes.position.needsUpdate = true;
        this.driftEffects.geometry.attributes.velocity.needsUpdate = true;
        this.driftEffects.geometry.attributes.age.needsUpdate = true;
        if (this.driftEffects.geometry.attributes.size) {
            this.driftEffects.geometry.attributes.size.needsUpdate = true;
        }

        // Ajuster l'opacité en fonction de la vitesse de dérapage
        const driftIntensity = Math.min(Math.abs(this.speed) / this.maxSpeed, 1.0);
        this.driftEffects.material.opacity = 0.4 + driftIntensity * 0.4;
    }

    createExhaustParticle() {
        // Créer une particule de fumée d'échappement temporaire
        const particleGeometry = new THREE.SphereGeometry(0.05, 6, 6);
        const particleMaterial = new THREE.MeshBasicMaterial({
            color: 0x666666,
            transparent: true,
            opacity: 0.6
        });

        const particle = new THREE.Mesh(particleGeometry, particleMaterial);

        // Position à l'échappement
        const exhaustPos = new THREE.Vector3(-0.4, 0.3, -1.1);
        exhaustPos.applyMatrix4(this.group.matrixWorld);
        particle.position.copy(exhaustPos);

        // Ajouter une vélocité aléatoire vers l'arrière
        const velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 0.1,
            Math.random() * 0.05,
            -Math.random() * 0.1
        );

        this.game.getScene().add(particle);

        // Animer et supprimer la particule
        let life = 1.0;
        const animate = () => {
            life -= 0.02;
            particle.position.add(velocity);
            particle.material.opacity = life * 0.6;
            particle.scale.multiplyScalar(1.02);

            velocity.y -= 0.001; // Gravité légère
            velocity.multiplyScalar(0.98); // Résistance de l'air

            if (life > 0) {
                requestAnimationFrame(animate);
            } else {
                this.game.getScene().remove(particle);
                particleGeometry.dispose();
                particleMaterial.dispose();
            }
        };

        animate();
    }
}
