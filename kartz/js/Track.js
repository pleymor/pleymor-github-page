// Track.js - Classe pour la piste et le terrain
class Track {
    constructor(game = null) {
        this.game = game;
        this.trackPoints = [];
        this.barriers = [];
        this.trees = [];
        this.trackMesh = null;
        this.terrainMesh = null;
        this.startLine = null;
        this.finishLine = null;
        this.shaderManager = new ShaderManager();
        this.wetness = 0.0; // Track wetness for rain effects
    }async create() {
        this.generateTrackPoints();
        this.createTrackGeometry();
        this.createTerrain();
        this.generateTrees();
        this.createStartLine();
    }
      generateTrackPoints() {
        const numPoints = 1500;
        const baseRadius = 150;
        
        // Génération de paramètres aléatoires pour un circuit unique
        const randomSeed = Math.random() * 1000;
        const majorFreq1 = 0.3 + Math.random() * 0.4;  // Entre 0.3 et 0.7
        const majorFreq2 = 0.2 + Math.random() * 0.3;  // Entre 0.2 et 0.5
        const majorAmplitude1 = 60 + Math.random() * 40; // Entre 60 et 100
        const majorAmplitude2 = 40 + Math.random() * 40; // Entre 40 et 80
        
        const mediumFreq1 = 1.5 + Math.random() * 1.0;  // Entre 1.5 et 2.5
        const mediumFreq2 = 1.0 + Math.random() * 1.0;  // Entre 1.0 et 2.0
        const mediumAmplitude1 = 20 + Math.random() * 20; // Entre 20 et 40
        const mediumAmplitude2 = 15 + Math.random() * 20; // Entre 15 et 35
        
        const smallFreq1 = 6 + Math.random() * 4;       // Entre 6 et 10
        const smallFreq2 = 4 + Math.random() * 4;       // Entre 4 et 8
        const smallAmplitude1 = 5 + Math.random() * 10; // Entre 5 et 15
        const smallAmplitude2 = 3 + Math.random() * 10; // Entre 3 et 13
        
        // Variations supplémentaires pour plus de complexité
        const extraFreq = 0.1 + Math.random() * 0.2;   // Très basse fréquence
        const extraAmplitude = 20 + Math.random() * 30; // Amplitude significative
        
        console.log('🏁 Génération d\'un nouveau circuit aléatoire...');
        
        for (let i = 0; i < numPoints; i++) {
            const angle = (i / numPoints) * Math.PI * 2;
            
            // Variations complexes avec paramètres aléatoires
            const majorVariation = Math.sin(angle * majorFreq1 + randomSeed) * majorAmplitude1 + 
                                  Math.cos(angle * majorFreq2 + randomSeed * 0.7) * majorAmplitude2;
            
            const mediumVariation = Math.sin(angle * mediumFreq1 + randomSeed * 1.3) * mediumAmplitude1 + 
                                   Math.cos(angle * mediumFreq2 + randomSeed * 1.7) * mediumAmplitude2;
            
            const smallVariation = Math.sin(angle * smallFreq1 + randomSeed * 2.1) * smallAmplitude1 + 
                                  Math.cos(angle * smallFreq2 + randomSeed * 2.9) * smallAmplitude2;
            
            // Variation extra pour des formes plus organiques
            const extraVariation = Math.sin(angle * extraFreq + randomSeed * 0.5) * extraAmplitude;
            
            const totalRadius = baseRadius + majorVariation + mediumVariation + smallVariation + extraVariation;
            
            // S'assurer que le rayon reste dans des limites raisonnables
            const clampedRadius = Math.max(80, Math.min(300, totalRadius));
            
            const x = Math.cos(angle) * clampedRadius;
            const z = Math.sin(angle) * clampedRadius;
            const y = 0;
            
            this.trackPoints.push(new THREE.Vector3(x, y, z));
        }
        
        // Lisser le circuit pour éviter les angles trop brusques
        this.smoothTrack();
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
            const baseWidth = 36; // Élargi d'un facteur 3 (12 * 3)
            const widthVariation = Math.sin(anglePos * 4) * 18 + Math.cos(anglePos * 3) * 12; // Variations aussi multipliées par 3
            const trackWidth = Math.max(24, baseWidth + widthVariation); // Largeur minimale aussi multipliée par 3
            
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
        
        // Use enhanced shader material for track
        const trackMaterial = this.shaderManager.getTrackMaterial(this.wetness);
        this.trackMesh = new THREE.Mesh(trackGeometry, trackMaterial);
        this.trackMesh.receiveShadow = true;
    }      createTerrain() {
        const terrainSize = 800;
        const segments = 100;
        const terrainGeometry = new THREE.PlaneGeometry(terrainSize, terrainSize, segments, segments);
        
        // Use enhanced terrain shader
        const terrainMaterial = this.shaderManager.getTerrainMaterial();
        
        this.terrainMesh = new THREE.Mesh(terrainGeometry, terrainMaterial);
        this.terrainMesh.rotation.x = -Math.PI / 2;
        this.terrainMesh.position.y = -0.1;
        this.terrainMesh.receiveShadow = true;
        
        // Plan de base plus grand with enhanced materials
        const baseGeometry = new THREE.PlaneGeometry(1200, 1200);
        const baseMaterial = this.shaderManager.getTerrainMaterial();
        this.baseMesh = new THREE.Mesh(baseGeometry, baseMaterial);
        this.baseMesh.rotation.x = -Math.PI / 2;
        this.baseMesh.position.y = -0.2;
        this.baseMesh.receiveShadow = true;
    }

    createStartLine() {
        // Position de départ - premier point de la piste
        const startPoint = this.trackPoints[0];
        const nextPoint = this.trackPoints[1];

        // Calculer la direction et la perpendiculaire
        const direction = new THREE.Vector3().subVectors(nextPoint, startPoint).normalize();
        const perpendicular = new THREE.Vector3(-direction.z, 0, direction.x);

        // Largeur de la ligne (même largeur que la piste)
        const trackWidth = 36;

        // Créer la ligne de départ/arrivée
        // Correction : la ligne doit être perpendiculaire à la piste
        // On utilise la direction pour l'orientation, pas la perpendiculaire
        this.createFinishLineVisual(startPoint, direction, trackWidth);

        // Créer des drapeaux à damier (toujours avec la perpendiculaire)
        this.createCheckeredFlags(startPoint, perpendicular, trackWidth);
    }

    createFinishLineVisual(position, perpendicular, width) {
        // Créer une ligne à damier noir et blanc
        const lineGeometry = new THREE.PlaneGeometry(width, 4);
        
        // Créer une texture à damier
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 8;
        const ctx = canvas.getContext('2d');
        
        // Dessiner le motif damier
        const squareSize = 8;
        for (let i = 0; i < canvas.width; i += squareSize) {
            const isWhite = Math.floor(i / squareSize) % 2 === 0;
            ctx.fillStyle = isWhite ? '#ffffff' : '#000000';
            ctx.fillRect(i, 0, squareSize, canvas.height);
        }
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        
        const lineMaterial = new THREE.MeshLambertMaterial({ 
            map: texture,
            transparent: true,
            opacity: 0.9
        });
        
        this.startLine = new THREE.Mesh(lineGeometry, lineMaterial);
        this.startLine.position.copy(position);
        this.startLine.position.y = 0.02; // Légèrement au-dessus de la piste
        this.startLine.rotation.x = -Math.PI / 2;
        
        // Orienter la ligne perpendiculairement à la direction de la piste
        const angle = Math.atan2(perpendicular.z, perpendicular.x);
        this.startLine.rotation.z = angle;
    }

    createCheckeredFlags(position, perpendicular, width) {
        // Créer des drapeaux à damier de chaque côté de la piste
        const flagPositions = [
            position.clone().add(perpendicular.clone().multiplyScalar(width / 2 + 5)),
            position.clone().add(perpendicular.clone().multiplyScalar(-width / 2 - 5))
        ];

        this.flags = [];
        
        flagPositions.forEach((flagPos, index) => {
            const flagGroup = new THREE.Group();
            
            // Mât du drapeau
            const poleGeometry = new THREE.CylinderGeometry(0.1, 0.1, 12);
            const poleMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 });
            const pole = new THREE.Mesh(poleGeometry, poleMaterial);
            pole.position.y = 6;
            pole.castShadow = true;
            flagGroup.add(pole);
            
            // Drapeau à damier
            const flagGeometry = new THREE.PlaneGeometry(8, 6);
            
            // Créer texture damier pour le drapeau
            const flagCanvas = document.createElement('canvas');
            flagCanvas.width = 64;
            flagCanvas.height = 48;
            const flagCtx = flagCanvas.getContext('2d');
            
            const checkSize = 8;
            for (let x = 0; x < flagCanvas.width; x += checkSize) {
                for (let y = 0; y < flagCanvas.height; y += checkSize) {
                    const isWhite = (Math.floor(x / checkSize) + Math.floor(y / checkSize)) % 2 === 0;
                    flagCtx.fillStyle = isWhite ? '#ffffff' : '#000000';
                    flagCtx.fillRect(x, y, checkSize, checkSize);
                }
            }
            
            const flagTexture = new THREE.CanvasTexture(flagCanvas);
            const flagMaterial = new THREE.MeshLambertMaterial({ 
                map: flagTexture,
                side: THREE.DoubleSide
            });
            
            const flag = new THREE.Mesh(flagGeometry, flagMaterial);
            flag.position.set(4, 9, 0);
            flag.castShadow = true;
            flagGroup.add(flag);
            
            // Positionner le groupe
            flagGroup.position.copy(flagPos);
            flagGroup.position.y = 0;
            
            this.flags.push(flagGroup);
        });
    }    addToScene(scene) {
        if (this.trackMesh) scene.add(this.trackMesh);
        if (this.terrainMesh) scene.add(this.terrainMesh);
        if (this.baseMesh) scene.add(this.baseMesh);
        
        // Ajouter la ligne de départ/arrivée
        if (this.startLine) scene.add(this.startLine);
        
        // Ajouter les drapeaux
        if (this.flags) {
            this.flags.forEach(flag => scene.add(flag));
        }
        
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
        const spacing = 9; // Espacement multiplié par 3 pour s'adapter à la route élargie
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
    }      generateTrees() {
        // Paramètres aléatoires pour la génération d'arbres
        const baseNumTrees = 150 + Math.floor(Math.random() * 100); // Entre 150 et 250 arbres
        const minDistanceFromTrack = 18 + Math.random() * 8; // Distance minimale variable
        const maxDistanceFromTrack = 120 + Math.random() * 60; // Distance maximale variable
        const terrainSize = 400; 
        const minDistanceBetweenTrees = 6 + Math.random() * 4; // Espacement variable
        
        console.log(`🌳 Génération de ${baseNumTrees} arbres avec espacement aléatoire...`);
        
        // Densité variable selon les zones
        const zoneDensities = [
            { probability: 0.8, multiplier: 1.2 }, // Zone dense
            { probability: 0.5, multiplier: 0.8 }, // Zone clairsemée
            { probability: 0.3, multiplier: 0.6 }  // Zone très clairsemée
        ];
        
        // Choisir une densité aléatoire pour cette génération
        const selectedDensity = zoneDensities[Math.floor(Math.random() * zoneDensities.length)];
        const actualNumTrees = Math.floor(baseNumTrees * selectedDensity.multiplier);
        const treePlacementProbability = selectedDensity.probability;
        
        // Utiliser un algorithme de placement par grille avec variation aléatoire
        const gridSize = Math.ceil(Math.sqrt(actualNumTrees));
        const cellSize = terrainSize / gridSize;
        
        for (let gridX = 0; gridX < gridSize; gridX++) {
            for (let gridZ = 0; gridZ < gridSize; gridZ++) {
                // Probabilité variable de placer un arbre dans cette cellule
                if (Math.random() > treePlacementProbability) continue;
                
                let position;
                let validPosition = false;
                let attempts = 0;
                
                // Essayer de trouver une position valide dans cette cellule de grille
                while (!validPosition && attempts < 25) {
                    // Position de base de la cellule avec variation aléatoire plus importante
                    const baseCellX = (gridX - gridSize/2 + 0.5) * cellSize;
                    const baseCellZ = (gridZ - gridSize/2 + 0.5) * cellSize;
                    
                    // Variation aléatoire plus importante pour des patterns moins réguliers
                    const variation = cellSize * (0.7 + Math.random() * 0.6); // Entre 70% et 130%
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
                    
                    // Vérifier la distance avec tous les points de la piste (sampling variable)
                    validPosition = true;
                    const sampleStep = 8 + Math.floor(Math.random() * 6); // Entre 8 et 14 points
                    for (let j = 0; j < this.trackPoints.length; j += sampleStep) {
                        const distanceToTrack = position.distanceTo(this.trackPoints[j]);
                        if (distanceToTrack < minDistanceFromTrack) {
                            validPosition = false;
                            break;
                        }
                    }
                    
                    // Vérifier que l'arbre n'est pas trop loin du centre (limite variable)
                    const maxCenterDistance = maxDistanceFromTrack + Math.random() * 20;
                    if (validPosition && position.length() > maxCenterDistance) {
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
        
        // Ajouter quelques arbres supplémentaires dans des zones aléatoires
        this.fillEmptyAreas(minDistanceFromTrack, maxDistanceFromTrack, terrainSize, minDistanceBetweenTrees);
        
        console.log(`🌲 ${this.trees.length} arbres générés avec un placement aléatoire`);
    }
      fillEmptyAreas(minDistanceFromTrack, maxDistanceFromTrack, terrainSize, minDistanceBetweenTrees) {
        // Nombre variable d'arbres supplémentaires
        const additionalTrees = 30 + Math.floor(Math.random() * 40); // Entre 30 et 70 arbres
        
        console.log(`🌿 Ajout de ${additionalTrees} arbres supplémentaires dans les zones vides...`);
        
        for (let i = 0; i < additionalTrees; i++) {
            let position;
            let validPosition = false;
            let attempts = 0;
            
            while (!validPosition && attempts < 35) {
                // Placement aléatoire avec différentes stratégies
                const strategy = Math.random();
                
                if (strategy < 0.6) {
                    // Stratégie 1: Placement circulaire autour du centre (60%)
                    const angle = Math.random() * Math.PI * 2;
                    const radius = minDistanceFromTrack + Math.random() * (maxDistanceFromTrack - minDistanceFromTrack);
                    
                    position = new THREE.Vector3(
                        Math.cos(angle) * radius,
                        0,
                        Math.sin(angle) * radius
                    );
                } else if (strategy < 0.85) {
                    // Stratégie 2: Placement en clusters (25%)
                    const clusterCenter = new THREE.Vector3(
                        (Math.random() - 0.5) * terrainSize * 0.8,
                        0,
                        (Math.random() - 0.5) * terrainSize * 0.8
                    );
                    
                    const clusterRadius = 15 + Math.random() * 25;
                    const clusterAngle = Math.random() * Math.PI * 2;
                    
                    position = new THREE.Vector3(
                        clusterCenter.x + Math.cos(clusterAngle) * clusterRadius,
                        0,
                        clusterCenter.z + Math.sin(clusterAngle) * clusterRadius
                    );
                } else {
                    // Stratégie 3: Placement complètement aléatoire (15%)
                    position = new THREE.Vector3(
                        (Math.random() - 0.5) * terrainSize,
                        0,
                        (Math.random() - 0.5) * terrainSize
                    );
                }
                
                // Vérifier que la position est dans les limites du terrain
                if (Math.abs(position.x) > terrainSize/2 || Math.abs(position.z) > terrainSize/2) {
                    attempts++;
                    continue;
                }
                
                // Vérifier la distance avec la piste (sampling aléatoire)
                validPosition = true;
                const sampleStep = 12 + Math.floor(Math.random() * 8); // Entre 12 et 20
                for (let j = 0; j < this.trackPoints.length; j += sampleStep) {
                    const distanceToTrack = position.distanceTo(this.trackPoints[j]);
                    if (distanceToTrack < minDistanceFromTrack) {
                        validPosition = false;
                        break;
                    }
                }
                
                // Vérifier la distance avec les autres arbres (distance variable)
                if (validPosition) {
                    const dynamicMinDistance = minDistanceBetweenTrees * (0.7 + Math.random() * 0.6); // ±30%
                    for (let existingTree of this.trees) {
                        const distanceToTree = position.distanceTo(existingTree.position);
                        if (distanceToTree < dynamicMinDistance) {
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

    checkLapCompletion(kartPosition, kartRadius = 2) {
        if (!this.startLine) return false;
        
        // Vérifier si le kart passe près de la ligne de départ/arrivée
        const startPoint = this.trackPoints[0];
        const distance = kartPosition.distanceTo(startPoint);
        
        // Si le kart est proche de la ligne de départ (dans un rayon de 10 unités)
        if (distance < 10) {
            // Animation de passage de ligne
            this.animateFinishLine();
            return true;
        }
        
        return false;
    }

    animateFinishLine() {
        if (!this.startLine) return;
        
        // Animation de scintillement de la ligne de départ
        const originalOpacity = this.startLine.material.opacity;
        
        // Séquence d'animation
        let flashCount = 0;
        const maxFlashes = 6;
        
        const flash = () => {
            if (flashCount >= maxFlashes) {
                this.startLine.material.opacity = originalOpacity;
                return;
            }
            
            this.startLine.material.opacity = flashCount % 2 === 0 ? 1.0 : 0.3;
            flashCount++;
            
            setTimeout(flash, 150);
        };
        
        flash();
        
        // Animer les drapeaux
        if (this.flags) {
            this.flags.forEach(flagGroup => {
                const flag = flagGroup.children[1]; // Le drapeau est le 2ème enfant (après le mât)
                if (flag) {
                    // Animation de balancement
                    const originalRotation = flag.rotation.z;
                    let swayCount = 0;
                    
                    const sway = () => {
                        if (swayCount >= 20) {
                            flag.rotation.z = originalRotation;
                            return;
                        }
                        
                        flag.rotation.z = originalRotation + Math.sin(swayCount * 0.5) * 0.3;
                        swayCount++;
                        
                        requestAnimationFrame(sway);
                    };
                    
                    sway();
                }
            });
        }
    }    // Getters
    getTrackPoints() { return this.trackPoints; }
    getBarriers() { return this.barriers; }
    getTrees() { return this.trees; }
    
    // Update shader effects
    updateShaders(time, camera, rainEnabled = false) {
        if (this.shaderManager) {
            // Update wetness based on rain
            if (rainEnabled) {
                this.wetness = Math.min(1.0, this.wetness + 0.01);
            } else {
                this.wetness = Math.max(0.0, this.wetness - 0.005);
            }
            
            // Update track material wetness
            if (this.trackMesh && this.trackMesh.material.uniforms) {
                this.trackMesh.material.uniforms.wetness.value = this.wetness;
            }
            
            // Update all shader uniforms
            this.shaderManager.updateUniforms(time, camera);
        }
    }
    
    // Get wetness level for other systems
    getWetness() {
        return this.wetness;
    }
    
    smoothTrack() {
        // Lissage du circuit pour éviter les changements de direction trop brusques
        const smoothingPasses = 2;
        const smoothingFactor = 0.1;
        
        for (let pass = 0; pass < smoothingPasses; pass++) {
            const smoothedPoints = [];
            
            for (let i = 0; i < this.trackPoints.length; i++) {
                const current = this.trackPoints[i];
                const prev = this.trackPoints[(i - 1 + this.trackPoints.length) % this.trackPoints.length];
                const next = this.trackPoints[(i + 1) % this.trackPoints.length];
                
                // Calculer la moyenne pondérée
                const smoothed = new THREE.Vector3(
                    current.x * (1 - smoothingFactor) + (prev.x + next.x) * smoothingFactor * 0.5,
                    current.y,
                    current.z * (1 - smoothingFactor) + (prev.z + next.z) * smoothingFactor * 0.5
                );
                
                smoothedPoints.push(smoothed);
            }
            
            this.trackPoints = smoothedPoints;
        }
        
        console.log('✨ Circuit lissé pour une meilleure cohérence');
    }
      // Méthode pour régénérer un nouveau circuit
    async regenerateTrack() {
        console.log('🔄 Régénération du circuit...');
        
        // Nettoyer les anciens éléments
        this.trackPoints = [];
        this.trees = [];
        
        // Régénérer tous les éléments
        this.generateTrackPoints();
        this.createTrackGeometry();
        this.generateTrees();
        this.createStartLine();
        
        console.log('✅ Nouveau circuit généré !');
    }
}
