// Track.js - Classe pour la piste et le terrain
class Track {    constructor(game = null) {
        this.game = game;
        this.trackPoints = [];
        this.barriers = [];
        this.trees = [];
        // Nouveau système de checkpoints pour empêcher les raccourcis
        this.checkpoints = [];
        this.checkpointMeshes = [];
        this.trackMesh = null;
        this.terrainMesh = null;
        this.centerLine = null; // Ligne médiane pointillée blanche
        this.startLine = null; // Une seule ligne servant de départ ET d'arrivée
        this.finishLine = null; // Référence historique - identique à startLine
        this.shaderManager = new ShaderManager();
        this.wetness = 0.0; // Track wetness for rain effects
    }async create() {
        this.generateTrackPoints();
        this.createTrackGeometry();
        this.createTerrain();
        this.generateTrees();
        this.createStartLine();
        // Générer les checkpoints après avoir créé le circuit
        this.generateCheckpoints();
    }    generateTrackPoints() {
        console.log('🏁 Génération d\'un circuit réaliste avec sections variées...');
        
        // Réinitialiser les points
        this.trackPoints = [];
        
        // Configuration du circuit
        const trackSections = this.generateTrackSections();
        
        // Générer les points pour chaque section
        let currentPosition = new THREE.Vector3(0, 0, 0);
        let currentDirection = new THREE.Vector3(1, 0, 0); // Direction initiale : vers la droite
        
        for (let i = 0; i < trackSections.length; i++) {
            const section = trackSections[i];
            const sectionPoints = this.generateSectionPoints(section, currentPosition, currentDirection);
            
            // Ajouter les points de la section (sans dupliquer le premier point sauf pour la première section)
            if (i === 0) {
                this.trackPoints.push(...sectionPoints);
            } else {
                this.trackPoints.push(...sectionPoints.slice(1));
            }
            
            // Mettre à jour la position et direction courantes
            if (sectionPoints.length > 1) {
                currentPosition = sectionPoints[sectionPoints.length - 1].clone();
                const prevPoint = sectionPoints[sectionPoints.length - 2];
                currentDirection = new THREE.Vector3().subVectors(currentPosition, prevPoint).normalize();
            }
        }
        
        // Fermer le circuit en douceur
        this.closeCircuit();
        
        // Lisser le circuit final
        this.smoothTrack();
        
        console.log(`✅ Circuit généré avec ${trackSections.length} sections et ${this.trackPoints.length} points au total`);
    }
    
    generateTrackSections() {
        // Types de sections de circuit
        const sectionTypes = [
            { type: 'straight', name: 'Ligne droite', minLength: 80, maxLength: 150 },
            { type: 'corner', name: 'Virage', minAngle: 30, maxAngle: 90, radius: 60 },
            { type: 'hairpin', name: 'Épingle', angle: 180, radius: 40 },
            { type: 'chicane', name: 'Chicane', length: 120, amplitude: 30 },
            { type: 'esses', name: 'Esses', length: 180, turns: 2 },
            { type: 'long_corner', name: 'Courbe longue', minAngle: 45, maxAngle: 120, radius: 100 }
        ];
        
        const sections = [];
        const numSections = 6 + Math.floor(Math.random() * 4); // 6-9 sections
        
        // Toujours commencer par une ligne droite (ligne de départ)
        sections.push({
            type: 'straight',
            name: 'Ligne de départ',
            length: 100,
            isStart: true
        });
          // Générer les autres sections
        for (let i = 1; i < numSections; i++) {
            let availableTypes = [...sectionTypes];
            
            // Éviter trop de lignes droites consécutives
            if (sections[sections.length - 1].type === 'straight') {
                availableTypes = availableTypes.filter(t => t.type !== 'straight');
            }
            
            // Choisir un type de section
            const sectionType = availableTypes[Math.floor(Math.random() * availableTypes.length)];
            
            let section = { ...sectionType };
            
            // Personnaliser selon le type
            switch (sectionType.type) {
                case 'straight':
                    section.length = sectionType.minLength + Math.random() * (sectionType.maxLength - sectionType.minLength);
                    break;
                case 'corner':
                    section.angle = sectionType.minAngle + Math.random() * (sectionType.maxAngle - sectionType.minAngle);
                    section.direction = Math.random() < 0.5 ? 'left' : 'right';
                    section.radius = sectionType.radius + (Math.random() - 0.5) * 30;
                    break;
                case 'hairpin':
                    section.direction = Math.random() < 0.5 ? 'left' : 'right';
                    section.radius = sectionType.radius + (Math.random() - 0.5) * 20;
                    break;
                case 'chicane':
                    section.direction = Math.random() < 0.5 ? 'left' : 'right';
                    section.amplitude = sectionType.amplitude + (Math.random() - 0.5) * 20;
                    break;
                case 'esses':
                    section.direction = Math.random() < 0.5 ? 'left' : 'right';
                    section.turns = 2 + Math.floor(Math.random() * 2); // 2-3 virages
                    break;
                case 'long_corner':
                    section.angle = sectionType.minAngle + Math.random() * (sectionType.maxAngle - sectionType.minAngle);
                    section.direction = Math.random() < 0.5 ? 'left' : 'right';
                    section.radius = sectionType.radius + (Math.random() - 0.5) * 40;
                    break;
            }
            
            sections.push(section);
        }
        
        console.log(`🏎️ ${numSections} sections générées:`, sections.map(s => s.name).join(', '));
        return sections;
    }
    
    generateSectionPoints(section, startPos, startDir) {
        const points = [];
        const pointSpacing = 3; // Espacement entre les points
        
        switch (section.type) {
            case 'straight':
                return this.generateStraightPoints(section, startPos, startDir, pointSpacing);
                
            case 'corner':
            case 'long_corner':
                return this.generateCornerPoints(section, startPos, startDir, pointSpacing);
                
            case 'hairpin':
                return this.generateHairpinPoints(section, startPos, startDir, pointSpacing);
                
            case 'chicane':
                return this.generateChicanePoints(section, startPos, startDir, pointSpacing);
                
            case 'esses':
                return this.generateEssesPoints(section, startPos, startDir, pointSpacing);
                
            default:
                return this.generateStraightPoints(section, startPos, startDir, pointSpacing);
        }
    }
    
    generateStraightPoints(section, startPos, startDir, spacing) {
        const points = [];
        const length = section.length || 100;
        const numPoints = Math.floor(length / spacing);
        
        for (let i = 0; i <= numPoints; i++) {
            const distance = i * spacing;
            const point = startPos.clone().add(startDir.clone().multiplyScalar(distance));
            points.push(point);
        }
        
        return points;
    }
    
    generateCornerPoints(section, startPos, startDir, spacing) {
        const points = [];
        const radius = section.radius || 80;
        const angle = (section.angle || 90) * Math.PI / 180;
        const direction = section.direction === 'left' ? 1 : -1;
        
        // Calculer le centre du virage
        const perpendicular = new THREE.Vector3(-startDir.z, 0, startDir.x).multiplyScalar(direction);
        const center = startPos.clone().add(perpendicular.multiplyScalar(radius));
        
        // Générer les points le long de l'arc
        const arcLength = radius * angle;
        const numPoints = Math.floor(arcLength / spacing);
        
        for (let i = 0; i <= numPoints; i++) {
            const t = i / numPoints;
            const currentAngle = t * angle;
            
            // Calculer la position sur l'arc
            const angleFromCenter = Math.atan2(startPos.z - center.z, startPos.x - center.x) + direction * currentAngle;
            const x = center.x + radius * Math.cos(angleFromCenter);
            const z = center.z + radius * Math.sin(angleFromCenter);
            
            points.push(new THREE.Vector3(x, 0, z));
        }
        
        return points;
    }
    
    generateHairpinPoints(section, startPos, startDir, spacing) {
        const points = [];
        const radius = section.radius || 40;
        const direction = section.direction === 'left' ? 1 : -1;
        
        // Épingle = demi-cercle de 180°
        const angle = Math.PI;
        const perpendicular = new THREE.Vector3(-startDir.z, 0, startDir.x).multiplyScalar(direction);
        const center = startPos.clone().add(perpendicular.multiplyScalar(radius));
        
        const arcLength = radius * angle;
        const numPoints = Math.floor(arcLength / spacing);
        
        for (let i = 0; i <= numPoints; i++) {
            const t = i / numPoints;
            const currentAngle = t * angle;
            
            const angleFromCenter = Math.atan2(startPos.z - center.z, startPos.x - center.x) + direction * currentAngle;
            const x = center.x + radius * Math.cos(angleFromCenter);
            const z = center.z + radius * Math.sin(angleFromCenter);
            
            points.push(new THREE.Vector3(x, 0, z));
        }
        
        return points;
    }
    
    generateChicanePoints(section, startPos, startDir, spacing) {
        const points = [];
        const length = section.length || 120;
        const amplitude = section.amplitude || 30;
        const direction = section.direction === 'left' ? 1 : -1;
        
        const numPoints = Math.floor(length / spacing);
        const perpendicular = new THREE.Vector3(-startDir.z, 0, startDir.x);
        
        for (let i = 0; i <= numPoints; i++) {
            const t = i / numPoints;
            const distance = t * length;
            
            // Forme sinusoïdale pour la chicane
            const sideOffset = Math.sin(t * Math.PI * 2) * amplitude * direction;
            
            const basePoint = startPos.clone().add(startDir.clone().multiplyScalar(distance));
            const point = basePoint.add(perpendicular.clone().multiplyScalar(sideOffset));
            
            points.push(point);
        }
        
        return points;
    }
    
    generateEssesPoints(section, startPos, startDir, spacing) {
        const points = [];
        const length = section.length || 180;
        const amplitude = 40;
        const turns = section.turns || 2;
        const direction = section.direction === 'left' ? 1 : -1;
        
        const numPoints = Math.floor(length / spacing);
        const perpendicular = new THREE.Vector3(-startDir.z, 0, startDir.x);
        
        for (let i = 0; i <= numPoints; i++) {
            const t = i / numPoints;
            const distance = t * length;
            
            // Forme d'esses avec plusieurs virages
            const sideOffset = Math.sin(t * Math.PI * turns) * amplitude * direction;
            
            const basePoint = startPos.clone().add(startDir.clone().multiplyScalar(distance));
            const point = basePoint.add(perpendicular.clone().multiplyScalar(sideOffset));
            
            points.push(point);
        }
        
        return points;
    }
    
    closeCircuit() {
        if (this.trackPoints.length < 3) return;
        
        const startPoint = this.trackPoints[0];
        const endPoint = this.trackPoints[this.trackPoints.length - 1];
        const distance = startPoint.distanceTo(endPoint);
        
        // Si le circuit n'est pas fermé, créer une transition douce
        if (distance > 10) {
            const transitionPoints = Math.floor(distance / 3);
            
            for (let i = 1; i <= transitionPoints; i++) {
                const t = i / (transitionPoints + 1);
                const point = new THREE.Vector3().lerpVectors(endPoint, startPoint, t);
                this.trackPoints.push(point);
            }
        }
        
        console.log('🔄 Circuit fermé avec une transition douce');
    }    smoothTrack() {
        console.log('🔧 Lissage avancé du circuit pour des transitions fluides...');
        
        if (this.trackPoints.length < 10) return;
        
        // Paramètres de lissage adaptés au nouveau système
        const smoothingPasses = 3; // Moins de passes car le tracé est déjà plus naturel
        const baseSmoothingFactor = 0.15; // Lissage plus doux pour préserver les formes
        
        for (let pass = 0; pass < smoothingPasses; pass++) {
            const smoothingFactor = baseSmoothingFactor * (1 - pass / smoothingPasses * 0.3);
            const smoothedPoints = [];
            
            for (let i = 0; i < this.trackPoints.length; i++) {
                const current = this.trackPoints[i];
                
                // Fenêtre de lissage avec 3 points de chaque côté
                const window = [];
                for (let j = -2; j <= 2; j++) {
                    const idx = (i + j + this.trackPoints.length) % this.trackPoints.length;
                    window.push(this.trackPoints[idx]);
                }
                
                // Calculer l'angle du virage
                const prev = this.trackPoints[(i - 1 + this.trackPoints.length) % this.trackPoints.length];
                const next = this.trackPoints[(i + 1) % this.trackPoints.length];
                const dir1 = new THREE.Vector3().subVectors(current, prev).normalize();
                const dir2 = new THREE.Vector3().subVectors(next, current).normalize();
                const angle = Math.acos(Math.max(-1, Math.min(1, dir1.dot(dir2))));
                
                // Appliquer un lissage adaptatif basé sur l'angle
                const angleStrength = Math.max(0, (Math.PI - angle) / Math.PI);
                const adaptiveFactor = smoothingFactor + (angleStrength * 0.2);
                
                // Lissage gaussien pondéré
                const weights = [0.1, 0.25, 0.3, 0.25, 0.1]; // Distribution gaussienne
                let smoothed = new THREE.Vector3();
                let totalWeight = 0;
                
                for (let j = 0; j < window.length; j++) {
                    const weight = weights[j];
                    smoothed.add(window[j].clone().multiplyScalar(weight));
                    totalWeight += weight;
                }
                
                smoothed.divideScalar(totalWeight);
                
                // Mélanger avec le point original
                const finalPoint = current.clone().lerp(smoothed, adaptiveFactor);
                finalPoint.y = 0; // Garder Y = 0
                
                smoothedPoints.push(finalPoint);
            }
            
            this.trackPoints = smoothedPoints;
        }
          console.log('✨ Circuit lissé avec des transitions naturelles');
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
              
            // Largeur variable adaptée aux types de sections
            const baseWidth = 36; // Largeur de base élargie
            const widthVariation = Math.sin((i / this.trackPoints.length) * Math.PI * 6) * 6;
            const trackWidth = Math.max(30, baseWidth + widthVariation);
            
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
        
        // Créer la ligne médiane en pointillés
        this.createCenterLine();
    }

    createCenterLine() {
        const centerLineGroup = new THREE.Group();
        
        // Paramètres pour les pointillés
        const dashLength = 4;  // Longueur d'un tiret
        const gapLength = 6;   // Longueur d'un espacement
        const lineWidth = 0.4; // Largeur de la ligne
        const segmentLength = dashLength + gapLength;
        
        // Calculer la longueur totale du circuit
        let totalLength = 0;
        for (let i = 0; i < this.trackPoints.length; i++) {
            const current = this.trackPoints[i];
            const next = this.trackPoints[(i + 1) % this.trackPoints.length];
            totalLength += current.distanceTo(next);
        }
        
        // Nombre de segments de pointillés
        const numSegments = Math.floor(totalLength / segmentLength);
        
        for (let segmentIndex = 0; segmentIndex < numSegments; segmentIndex++) {
            const segmentStart = segmentIndex * segmentLength;
            const segmentEnd = segmentStart + dashLength;
            
            // Trouver les positions de début et fin du tiret
            const startPos = this.getPositionAtDistance(segmentStart);
            const endPos = this.getPositionAtDistance(segmentEnd);
            
            if (startPos && endPos) {
                // Créer la géométrie du tiret
                const dashGeometry = new THREE.PlaneGeometry(startPos.distanceTo(endPos), lineWidth);
                const dashMaterial = new THREE.MeshBasicMaterial({
                    color: 0xffffff,
                    transparent: true,
                    opacity: 0.9
                });
                
                const dash = new THREE.Mesh(dashGeometry, dashMaterial);
                
                // Positionner le tiret
                const midPos = new THREE.Vector3().addVectors(startPos, endPos).multiplyScalar(0.5);
                dash.position.copy(midPos);
                dash.position.y = 0.01; // Légèrement au-dessus de la piste
                dash.rotation.x = -Math.PI / 2;
                
                // Orienter le tiret selon la direction de la piste
                const direction = new THREE.Vector3().subVectors(endPos, startPos);
                const angle = Math.atan2(direction.z, direction.x);
                dash.rotation.z = angle;
                
                centerLineGroup.add(dash);
            }
        }
        
        this.centerLine = centerLineGroup;
        console.log(`✅ Ligne médiane créée avec ${centerLineGroup.children.length} pointillés`);
    }

    // Méthode utilitaire pour obtenir une position à une distance donnée le long du circuit
    getPositionAtDistance(distance) {
        let currentDistance = 0;
        
        for (let i = 0; i < this.trackPoints.length; i++) {
            const current = this.trackPoints[i];
            const next = this.trackPoints[(i + 1) % this.trackPoints.length];
            const segmentLength = current.distanceTo(next);
            
            if (currentDistance + segmentLength >= distance) {
                // La distance cible est dans ce segment
                const remainingDistance = distance - currentDistance;
                const t = remainingDistance / segmentLength;
                
                return new THREE.Vector3().lerpVectors(current, next, t);
            }
            
            currentDistance += segmentLength;
        }
        
        return null;
    }
    
    createTerrain() {
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
    }    createStartLine() {
        // Avec le nouveau système, la ligne de départ est au début du premier segment (ligne droite)
        if (this.trackPoints.length < 10) {
            console.warn('⚠️ Pas assez de points pour créer la ligne de départ');
            return;
        }
        
        // Utiliser les premiers points du circuit (qui correspondent à la ligne droite de départ)
        const startIndex = Math.floor(this.trackPoints.length * 0.1); // 10% du circuit
        const startPoint = this.trackPoints[startIndex];
        const nextPoint = this.trackPoints[startIndex + 1];

        console.log(`🏁 Ligne de départ positionnée au point ${startIndex} sur le circuit`);

        // Calculer la direction et la perpendiculaire
        const direction = new THREE.Vector3().subVectors(nextPoint, startPoint).normalize();
        const perpendicular = new THREE.Vector3(-direction.z, 0, direction.x);

        // Largeur de la ligne (même largeur que la piste)
        const trackWidth = 36;
        
        // Créer la ligne de départ/arrivée (une seule ligne pour les deux fonctions)
        this.createStartFinishLineVisual(startPoint, direction, trackWidth);

        // Créer des drapeaux à damier
        this.createCheckeredFlags(startPoint, perpendicular, trackWidth);
    }createStartFinishLineVisual(position, perpendicular, width) {
        // Créer une ligne à damier noir et blanc (sert de départ ET d'arrivée)
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
        
        // Ajouter la ligne médiane pointillée blanche
        if (this.centerLine) scene.add(this.centerLine);
        
        // Ajouter les drapeaux
        if (this.flags) {
            this.flags.forEach(flag => scene.add(flag));
        }
        
        // Ajouter les checkpoints à la scène
        if (this.checkpointMeshes) {
            this.checkpointMeshes.forEach(checkpoint => scene.add(checkpoint));
        }
        
        // Ajouter les arbres à la scène
        this.trees.forEach(tree => {
            scene.add(tree.group);
        });
    }getStartPosition(index) {
        // Avec le nouveau système, utiliser les premiers points du circuit
        if (this.trackPoints.length < 20) {
            console.warn('⚠️ Pas assez de points pour calculer les positions de départ');
            return new THREE.Vector3(0, 0.5, 0);
        }
        
        const startIndex = Math.floor(this.trackPoints.length * 0.1); // Même position que la ligne de départ
        const startPoint = this.trackPoints[startIndex];
        const direction = new THREE.Vector3().subVectors(this.trackPoints[startIndex + 1], startPoint).normalize();
        const perpendicular = new THREE.Vector3(-direction.z, 0, direction.x);
          
        // Positionner les karts côte à côte
        const spacing = 9; // Espacement entre les karts
        const offset = (index - 1.5) * spacing; // Centrer autour de 0
        
        const position = new THREE.Vector3().addVectors(
            startPoint, 
            perpendicular.multiplyScalar(offset)
        );
        position.y = 0.5;
        
        console.log(`🏎️ Kart ${index} positionné sur la ligne de départ`);
        
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
        }        return null;
    }
    
    checkLapCompletion(kartPosition, kartRadius = 2) {
        if (!this.startLine) return false;
        
        // Avec le nouveau système, utiliser la position de la ligne de départ
        if (this.trackPoints.length < 20) return false;
        
        const startIndex = Math.floor(this.trackPoints.length * 0.1);
        const startLineCenter = this.trackPoints[startIndex];
        const distance = kartPosition.distanceTo(startLineCenter);
        
        // Si le kart est proche de la ligne de départ (dans un rayon de 15 unités)
        if (distance < 15) {
            // Animation de passage de ligne
            this.animateFinishLine();
            
            console.log(`🏁 Tour complété ! Distance à la ligne: ${distance.toFixed(2)}m`);
            return true;
        }
        
        return false;
    }

    // Système de checkpoints pour empêcher les raccourcis
    generateCheckpoints() {
        if (this.trackPoints.length < 50) {
            console.warn('⚠️ Pas assez de points pour créer des checkpoints');
            return;
        }

        this.checkpoints = [];
        this.checkpointMeshes = [];

        // Créer des checkpoints tous les 25% du circuit (4 checkpoints au total)
        const numCheckpoints = 4;
        
        for (let i = 0; i < numCheckpoints; i++) {
            const progress = (i + 1) / (numCheckpoints + 1); // Éviter le début et la fin
            const pointIndex = Math.floor(this.trackPoints.length * progress);
            const checkpointPoint = this.trackPoints[pointIndex];
            const nextPoint = this.trackPoints[(pointIndex + 1) % this.trackPoints.length];
            
            // Calculer la direction et la perpendiculaire pour orientation du checkpoint
            const direction = new THREE.Vector3().subVectors(nextPoint, checkpointPoint).normalize();
            const perpendicular = new THREE.Vector3(-direction.z, 0, direction.x);
            
            const checkpoint = {
                id: i,
                position: checkpointPoint.clone(),
                direction: direction.clone(),
                perpendicular: perpendicular.clone(),
                radius: 20, // Rayon de détection
                pointIndex: pointIndex
            };
            
            this.checkpoints.push(checkpoint);
            
            // Créer une représentation visuelle du checkpoint (invisible en temps normal)
            this.createCheckpointVisual(checkpoint);
        }
        
        console.log(`✅ ${numCheckpoints} checkpoints générés pour empêcher les raccourcis`);
    }    createCheckpointVisual(checkpoint) {
        // Créer un portique visible pour debug
        const portalGeometry = new THREE.PlaneGeometry(40, 15);
        const portalMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ff00,
            transparent: true,
            opacity: 0.3, // Visible pour debug
            side: THREE.DoubleSide
        });
        
        const portalMesh = new THREE.Mesh(portalGeometry, portalMaterial);
        portalMesh.position.copy(checkpoint.position);
        portalMesh.position.y = 7.5; // Hauteur du portique
        portalMesh.rotation.x = -Math.PI / 2;
        
        // Orienter selon la direction de la piste
        const angle = Math.atan2(checkpoint.direction.z, checkpoint.direction.x);
        portalMesh.rotation.z = angle;
        
        // Marquer ce mesh comme checkpoint
        portalMesh.userData = {
            isCheckpoint: true,
            checkpointId: checkpoint.id
        };
        
        this.checkpointMeshes.push(portalMesh);
    }    // Valider le passage par un checkpoint
    checkCheckpointProgress(kartPosition, kartRadius = 2) {
        const validatedCheckpoints = [];
        
        // Vérifier que les checkpoints sont initialisés
        if (!this.checkpoints || this.checkpoints.length === 0) {
            console.warn('⚠️ Checkpoints non initialisés - validation de tour normale');
            return validatedCheckpoints;
        }
        
        this.checkpoints.forEach(checkpoint => {
            const distance = kartPosition.distanceTo(checkpoint.position);
            if (distance < checkpoint.radius) {
                validatedCheckpoints.push(checkpoint.id);
                
                // Animation temporaire du checkpoint (pour debug)
                const mesh = this.checkpointMeshes[checkpoint.id];
                if (mesh && mesh.material.opacity < 0.5) {
                    mesh.material.opacity = 0.8;
                    setTimeout(() => {
                        mesh.material.opacity = 0.3;
                    }, 1000);
                }
            }
        });
        
        return validatedCheckpoints;
    }

    // Nouvelle méthode pour validation complète des tours avec checkpoints
    validateLapCompletion(kartPosition, passedCheckpoints, kartRadius = 2) {
        // Vérifier que tous les checkpoints ont été passés
        const requiredCheckpoints = this.checkpoints.length;
        const uniqueCheckpoints = [...new Set(passedCheckpoints)];
        
        if (uniqueCheckpoints.length < requiredCheckpoints) {
            console.log(`🚫 Raccourci détecté ! Checkpoints validés: ${uniqueCheckpoints.length}/${requiredCheckpoints}`);
            return false;
        }
        
        // Tous les checkpoints sont validés, vérifier la ligne d'arrivée
        return this.checkLapCompletion(kartPosition, kartRadius);
    }
    
    // Getters
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
    }      // Méthode pour régénérer un nouveau circuit
    async regenerateTrack() {
        console.log('🔄 Régénération du circuit...');
        
        // Nettoyer les anciens éléments
        this.trackPoints = [];
        this.trees = [];
        this.checkpoints = [];
        this.checkpointMeshes = [];
        this.centerLine = null;
        
        // Régénérer tous les éléments
        this.generateTrackPoints();
        this.createTrackGeometry();
        this.generateTrees();
        this.createStartLine();
        this.generateCheckpoints();
        
        console.log('✅ Nouveau circuit généré avec système anti-raccourcis !');
    }
}
