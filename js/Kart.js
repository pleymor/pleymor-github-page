// Kart.js - Classe pour les véhicules
class Kart {
    constructor(color, isPlayer = false, game) {
        this.isPlayer = isPlayer;
        this.game = game;
        this.position = new THREE.Vector3();
        this.velocity = new THREE.Vector3();
        this.rotation = 0;
        this.speed = 0;
        this.maxSpeed = isPlayer ? 0.8 : 0.6;
        this.acceleration = 0.02;
        this.friction = 0.95;
        this.turnSpeed = 0.05;
        this.laps = 0;
        this.trackProgress = 0;
        this.lastCheckpoint = 0;
        
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
    
    handlePlayerInput(inputs) {
        if (inputs.up) {
            this.speed = Math.min(this.speed + this.acceleration, this.maxSpeed);
        }
        if (inputs.down) {
            this.speed = Math.max(this.speed - this.acceleration, -this.maxSpeed * 0.5);
        }
        if (inputs.left && Math.abs(this.speed) > 0.01) {
            this.rotation += this.turnSpeed * (this.speed > 0 ? 1 : -1);
        }
        if (inputs.right && Math.abs(this.speed) > 0.01) {
            this.rotation -= this.turnSpeed * (this.speed > 0 ? 1 : -1);
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
        
        // Tourner vers la cible
        if (Math.abs(angleDiff) > 0.1) {
            this.rotation += Math.sign(angleDiff) * this.turnSpeed * 0.8;
        }
        
        // Accélérer
        this.speed = Math.min(this.speed + this.acceleration * 0.8, this.maxSpeed);
    }
    
    getNextTrackPoint(track) {
        const trackPoints = track.getTrackPoints();
        const nextIndex = (Math.floor(this.trackProgress) + 5) % trackPoints.length;
        return trackPoints[nextIndex];
    }
      applyPhysics() {
        // Friction
        this.speed *= this.friction;
        
        // Convertir la vitesse en vélocité
        this.velocity.x = Math.sin(this.rotation) * this.speed;
        this.velocity.z = Math.cos(this.rotation) * this.speed;
        
        // Barrières supprimées - plus de vérification de collision
        // this.checkBarrierCollisions();
        
        // Gravité et hauteur du terrain
        const terrainHeight = this.game.getTrack().getTerrainHeight(this.position.x, this.position.z);
        if (this.position.y > terrainHeight + 0.5) {
            this.velocity.y -= 0.02; // Gravité
        } else {
            this.position.y = terrainHeight + 0.5;
            this.velocity.y = 0;
        }
        
        // Appliquer la vélocité
        this.position.add(this.velocity);
    }
    
    checkBarrierCollisions() {
        const track = this.game.getTrack();
        const barriers = track.getBarriers();
        const kartRadius = 1.2;
        
        for (let barrier of barriers) {
            const distance = this.position.distanceTo(barrier.position);
            if (distance < kartRadius + barrier.radius) {
                // Notifier le jeu de la collision
                this.game.onCollision(this);
                
                // Calculer la direction de rebond
                const collisionNormal = new THREE.Vector3()
                    .subVectors(this.position, barrier.position)
                    .normalize();
                
                // Appliquer une force de rebond
                const penetrationDepth = (kartRadius + barrier.radius) - distance;
                const pushBack = collisionNormal.multiplyScalar(penetrationDepth * 0.5);
                this.position.add(pushBack);
                
                // Modifier la vélocité pour un rebond réaliste
                const velocityDirection = new THREE.Vector3(this.velocity.x, 0, this.velocity.z).normalize();
                const dotProduct = velocityDirection.dot(collisionNormal);
                
                const reflection = velocityDirection.sub(collisionNormal.multiplyScalar(2 * dotProduct));
                
                this.speed *= 0.7;
                this.velocity.x = reflection.x * this.speed;
                this.velocity.z = reflection.z * this.speed;
                
                const newAngle = Math.atan2(this.velocity.x, this.velocity.z);
                this.rotation = newAngle;
                
                break;
            }
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
        
        // Rotation des roues
        this.wheels.forEach(wheel => {
            wheel.rotation.x += this.speed * 5;
        });
        
        // Limiter les mouvements erratiques après collision
        if (Math.abs(this.velocity.x) > 2 || Math.abs(this.velocity.z) > 2) {
            this.velocity.multiplyScalar(0.8);
        }
    }
    
    getSpeed() {
        return Math.abs(this.speed) * 100; // Convertir en km/h pour l'affichage
    }
}
