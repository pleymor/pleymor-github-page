// Track.js - Classe pour la piste et le terrain
class Track {    constructor() {
        this.trackPoints = [];
        this.barriers = [];
        this.trees = [];
        this.trackMesh = null;
        this.terrainMesh = null;
    }
      async create() {
        this.generateTrackPoints();
        this.createTrackGeometry();
        this.createTerrain();
        this.generateTrees();
    }
    
    generateTrackPoints() {
        const numPoints = 1500;
        const baseRadius = 150;
        
        for (let i = 0; i < numPoints; i++) {
            const angle = (i / numPoints) * Math.PI * 2;
            
            // Variations complexes pour créer un circuit intéressant
            const majorVariation = Math.sin(angle * 0.5) * 80 + Math.cos(angle * 0.3) * 60;
            const mediumVariation = Math.sin(angle * 2) * 30 + Math.cos(angle * 1.5) * 25;
            const smallVariation = Math.sin(angle * 8) * 10 + Math.cos(angle * 6) * 8;
            
            const totalRadius = baseRadius + majorVariation + mediumVariation + smallVariation;
            
            const x = Math.cos(angle) * totalRadius;
            const z = Math.sin(angle) * totalRadius;
            const y = 0;
            
            this.trackPoints.push(new THREE.Vector3(x, y, z));
        }
    }
    
    createTrackGeometry() {
        const trackGeometry = new THREE.BufferGeometry();
        const positions = [];
        const indices = [];
        
        for (let i = 0; i < this.trackPoints.length; i++) {
            const current = this.trackPoints[i];
            const next = this.trackPoints[(i + 1) % this.trackPoints.length];
            
            const direction = new THREE.Vector3().subVectors(next, current).normalize();
            const perpendicular = new THREE.Vector3(-direction.z, 0, direction.x);
            
            // Largeur variable
            const anglePos = (i / this.trackPoints.length) * Math.PI * 2;
            const baseWidth = 12;
            const widthVariation = Math.sin(anglePos * 4) * 6 + Math.cos(anglePos * 3) * 4;
            const trackWidth = Math.max(8, baseWidth + widthVariation);
            
            const left = new THREE.Vector3().addVectors(current, perpendicular.clone().multiplyScalar(trackWidth / 2));
            const right = new THREE.Vector3().addVectors(current, perpendicular.clone().multiplyScalar(-trackWidth / 2));
            
            positions.push(left.x, left.y, left.z);
            positions.push(right.x, right.y, right.z);
            
            const base = i * 2;
            const nextBase = ((i + 1) % this.trackPoints.length) * 2;
            
            indices.push(base, nextBase, base + 1);
            indices.push(base + 1, nextBase, nextBase + 1);
        }
        
        trackGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        trackGeometry.setIndex(indices);
        trackGeometry.computeVertexNormals();
        
        const trackMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
        this.trackMesh = new THREE.Mesh(trackGeometry, trackMaterial);
        this.trackMesh.receiveShadow = true;
    }
    
    createTerrain() {
        const terrainSize = 800;
        const segments = 100;
        const terrainGeometry = new THREE.PlaneGeometry(terrainSize, terrainSize, segments, segments);
        
        const terrainMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x228B22,
            transparent: false
        });
        
        this.terrainMesh = new THREE.Mesh(terrainGeometry, terrainMaterial);
        this.terrainMesh.rotation.x = -Math.PI / 2;
        this.terrainMesh.position.y = -0.1;
        this.terrainMesh.receiveShadow = true;
        
        // Plan de base plus grand
        const baseGeometry = new THREE.PlaneGeometry(1200, 1200);
        const baseMaterial = new THREE.MeshLambertMaterial({ color: 0x90EE90 });
        this.baseMesh = new THREE.Mesh(baseGeometry, baseMaterial);
        this.baseMesh.rotation.x = -Math.PI / 2;
        this.baseMesh.position.y = -0.2;
        this.baseMesh.receiveShadow = true;
    }
      addToScene(scene) {
        if (this.trackMesh) scene.add(this.trackMesh);
        if (this.terrainMesh) scene.add(this.terrainMesh);
        if (this.baseMesh) scene.add(this.baseMesh);
        
        // Ajouter les arbres à la scène
        this.trees.forEach(tree => {
            scene.add(tree.group);
        });
    }
    
    getStartPosition(index) {
        const startPoint = this.trackPoints[0];
        const direction = new THREE.Vector3().subVectors(this.trackPoints[1], startPoint).normalize();
        const perpendicular = new THREE.Vector3(-direction.z, 0, direction.x);
        
        // Positionner les karts côte à côte
        const spacing = 3;
        const offset = (index - 1.5) * spacing; // Centrer autour de 0
        
        const position = new THREE.Vector3().addVectors(
            startPoint, 
            perpendicular.multiplyScalar(offset)
        );
        position.y = 0.5;
        
        return position;
    }
      getTerrainHeight(x, z) {
        // Pour un terrain plat, retourner 0
        return 0;
    }
      generateTrees() {
        const numTrees = 200; // Nombre d'arbres à générer
        const minDistanceFromTrack = 20; // Distance minimale de la piste
        const maxDistanceFromTrack = 150; // Distance maximale de la piste
        const terrainSize = 400; // Taille de la zone où placer les arbres
        const minDistanceBetweenTrees = 8; // Distance minimale entre les arbres
        
        // Utiliser un algorithme de placement par grille avec variation aléatoire
        const gridSize = Math.sqrt(numTrees); // Approximation pour une grille carrée
        const cellSize = terrainSize / gridSize;
        
        for (let gridX = 0; gridX < gridSize; gridX++) {
            for (let gridZ = 0; gridZ < gridSize; gridZ++) {
                // Probabilité de placer un arbre dans cette cellule (permet des variations)
                if (Math.random() > 0.7) continue; // 30% de chance de placer un arbre
                
                let position;
                let validPosition = false;
                let attempts = 0;
                
                // Essayer de trouver une position valide dans cette cellule de grille
                while (!validPosition && attempts < 20) {
                    // Position de base de la cellule avec variation aléatoire
                    const baseCellX = (gridX - gridSize/2 + 0.5) * cellSize;
                    const baseCellZ = (gridZ - gridSize/2 + 0.5) * cellSize;
                    
                    // Ajouter une variation aléatoire dans la cellule
                    const variation = cellSize * 0.8; // 80% de la taille de cellule pour la variation
                    position = new THREE.Vector3(
                        baseCellX + (Math.random() - 0.5) * variation,
                        0,
                        baseCellZ + (Math.random() - 0.5) * variation
                    );
                    
                    // Vérifier que la position est dans les limites du terrain
                    if (Math.abs(position.x) > terrainSize/2 || Math.abs(position.z) > terrainSize/2) {
                        attempts++;
                        continue;
                    }
                    
                    // Vérifier la distance avec tous les points de la piste
                    validPosition = true;
                    for (let j = 0; j < this.trackPoints.length; j += 10) { // Vérifier tous les 10 points pour optimiser
                        const distanceToTrack = position.distanceTo(this.trackPoints[j]);
                        if (distanceToTrack < minDistanceFromTrack) {
                            validPosition = false;
                            break;
                        }
                    }
                    
                    // Vérifier que l'arbre n'est pas trop loin du centre
                    if (validPosition && position.length() > maxDistanceFromTrack) {
                        validPosition = false;
                    }
                    
                    // Vérifier la distance avec les autres arbres déjà placés
                    if (validPosition) {
                        for (let existingTree of this.trees) {
                            const distanceToTree = position.distanceTo(existingTree.position);
                            if (distanceToTree < minDistanceBetweenTrees) {
                                validPosition = false;
                                break;
                            }
                        }
                    }
                    
                    attempts++;
                }
                
                if (validPosition) {
                    const tree = this.createTree(position);
                    this.trees.push(tree);
                }
            }
        }
        
        // Ajouter quelques arbres supplémentaires pour remplir les zones vides
        this.fillEmptyAreas(minDistanceFromTrack, maxDistanceFromTrack, terrainSize, minDistanceBetweenTrees);
    }
    
    fillEmptyAreas(minDistanceFromTrack, maxDistanceFromTrack, terrainSize, minDistanceBetweenTrees) {
        const additionalTrees = 50; // Nombre d'arbres supplémentaires à essayer de placer
        
        for (let i = 0; i < additionalTrees; i++) {
            let position;
            let validPosition = false;
            let attempts = 0;
            
            while (!validPosition && attempts < 30) {
                // Placement aléatoire dans une zone circulaire autour du centre
                const angle = Math.random() * Math.PI * 2;
                const radius = minDistanceFromTrack + Math.random() * (maxDistanceFromTrack - minDistanceFromTrack);
                
                position = new THREE.Vector3(
                    Math.cos(angle) * radius,
                    0,
                    Math.sin(angle) * radius
                );
                
                // Vérifier que la position est dans les limites du terrain
                if (Math.abs(position.x) > terrainSize/2 || Math.abs(position.z) > terrainSize/2) {
                    attempts++;
                    continue;
                }
                
                // Vérifier la distance avec la piste
                validPosition = true;
                for (let j = 0; j < this.trackPoints.length; j += 15) {
                    const distanceToTrack = position.distanceTo(this.trackPoints[j]);
                    if (distanceToTrack < minDistanceFromTrack) {
                        validPosition = false;
                        break;
                    }
                }
                
                // Vérifier la distance avec les autres arbres
                if (validPosition) {
                    for (let existingTree of this.trees) {
                        const distanceToTree = position.distanceTo(existingTree.position);
                        if (distanceToTree < minDistanceBetweenTrees) {
                            validPosition = false;
                            break;
                        }
                    }
                }
                
                attempts++;
            }
            
            if (validPosition) {
                const tree = this.createTree(position);
                this.trees.push(tree);
            }
        }
    }
    
    createTree(position) {
        const treeGroup = new THREE.Group();
        
        // Tronc de l'arbre
        const trunkGeometry = new THREE.CylinderGeometry(0.8, 1.2, 8, 8);
        const trunkMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.y = 4;
        trunk.castShadow = true;
        treeGroup.add(trunk);
        
        // Feuillage de l'arbre (plusieurs sphères pour un aspect plus naturel)
        const foliageColors = [0x228B22, 0x32CD32, 0x006400];
        for (let i = 0; i < 3; i++) {
            const foliageGeometry = new THREE.SphereGeometry(3 + Math.random() * 2, 8, 6);
            const foliageColor = foliageColors[Math.floor(Math.random() * foliageColors.length)];
            const foliageMaterial = new THREE.MeshLambertMaterial({ color: foliageColor });
            const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
            
            foliage.position.set(
                (Math.random() - 0.5) * 2,
                6 + Math.random() * 3,
                (Math.random() - 0.5) * 2
            );
            foliage.castShadow = true;
            treeGroup.add(foliage);
        }
        
        // Positionner le groupe d'arbre
        treeGroup.position.copy(position);
        
        // Rotation aléatoire
        treeGroup.rotation.y = Math.random() * Math.PI * 2;
        
        return {
            group: treeGroup,
            position: position.clone(),
            radius: 2.5 // Rayon de collision
        };
    }
    
    checkTreeCollision(kartPosition, kartRadius = 1.5) {
        for (let tree of this.trees) {
            const distance = kartPosition.distanceTo(tree.position);
            if (distance < tree.radius + kartRadius) {
                return tree;
            }
        }
        return null;
    }
      // Getters
    getTrackPoints() { return this.trackPoints; }
    getBarriers() { return this.barriers; }
    getTrees() { return this.trees; }
}
