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
    }    async create() {
        this.generateHighQualityTrackPoints();
        this.createTrackGeometry();
        this.createTerrain();
        this.generateTrees();
        this.createStartLine();
        // Générer les checkpoints après avoir créé le circuit
        this.generateCheckpoints();
    }generateTrackPoints() {
        console.log('🏁 Génération d\'un circuit fermé fluide...');
        this.trackPoints = [];

        // 1. Points de contrôle répartis autour d'une ellipse : la boucle est
        //    fermée par construction (pas de "fermeture" forcée ensuite).
        const controlPoints = this.generateControlPoints();

        // 2. Interpolation par spline Catmull-Rom centripète fermée : un seul
        //    passage produit une courbe lisse et continue, sans cusps.
        const splinePoints = this.sampleClosedCatmullRom(controlPoints, 16);

        // 3. Rééchantillonnage à pas d'arc constant pour un ruban et des
        //    pointillés réguliers.
        this.trackPoints = this.resampleByArcLength(splinePoints, 6);

        console.log(`✅ Circuit fermé généré avec ${this.trackPoints.length} points`);
    }

    // Génère les points de contrôle en RADIAL : un rayon par angle, parcouru en
    // tournant toujours dans le même sens. Tant que le rayon reste > 0 et que
    // les angles sont strictement croissants, la boucle est SIMPLE (jamais de
    // croisement) — ce qui permet de creuser des baies vers l'intérieur sans
    // risque. On alterne sommets "extérieurs" (lobes) et "intérieurs" (baies)
    // pour obtenir un tracé concave et nerveux plutôt qu'un ovale convexe.
    generateControlPoints() {
        const numPoints = 10 + Math.floor(Math.random() * 3); // 10-12 sommets
        const maxRadius = 300;
        const step = (Math.PI * 2) / numPoints;

        // Bandes de rayon : extérieur ~proche du max, intérieur creusé.
        const outerLo = 0.85, outerHi = 1.0;
        const innerLo = 0.6, innerHi = 0.78;

        const points = [];
        for (let i = 0; i < numPoints; i++) {
            // Gigue angulaire < demi-pas : garde les angles strictement croissants.
            const angle = i * step + (Math.random() - 0.5) * step * 0.5;

            // Alternance lobe/baie, avec saut occasionnel pour casser la régularité.
            const isOuter = (i % 2 === 0) !== (Math.random() < 0.2);
            const band = isOuter
                ? outerLo + Math.random() * (outerHi - outerLo)
                : innerLo + Math.random() * (innerHi - innerLo);
            const radius = maxRadius * band;

            points.push(new THREE.Vector3(
                Math.cos(angle) * radius,
                0,
                Math.sin(angle) * radius
            ));
        }
        return points;
    }

    // Spline Catmull-Rom centripète (alpha = 0.5) fermée. Le paramétrage
    // centripète évite les boucles et les cusps que produit la version uniforme.
    sampleClosedCatmullRom(points, samplesPerSegment) {
        const result = [];
        const n = points.length;
        const alpha = 0.5;

        for (let i = 0; i < n; i++) {
            const p0 = points[(i - 1 + n) % n];
            const p1 = points[i];
            const p2 = points[(i + 1) % n];
            const p3 = points[(i + 2) % n];

            const t0 = 0;
            const t1 = t0 + Math.pow(p0.distanceTo(p1), alpha);
            const t2 = t1 + Math.pow(p1.distanceTo(p2), alpha);
            const t3 = t2 + Math.pow(p2.distanceTo(p3), alpha);

            for (let j = 0; j < samplesPerSegment; j++) {
                const t = t1 + (t2 - t1) * (j / samplesPerSegment);
                result.push(this.catmullRomPoint(p0, p1, p2, p3, t0, t1, t2, t3, t));
            }
        }
        return result;
    }

    catmullRomPoint(p0, p1, p2, p3, t0, t1, t2, t3, t) {
        const lerp = (A, B, s) => A.clone().multiplyScalar(1 - s).add(B.clone().multiplyScalar(s));
        const a1 = lerp(p0, p1, (t - t0) / (t1 - t0));
        const a2 = lerp(p1, p2, (t - t1) / (t2 - t1));
        const a3 = lerp(p2, p3, (t - t2) / (t3 - t2));
        const b1 = lerp(a1, a2, (t - t0) / (t2 - t0));
        const b2 = lerp(a2, a3, (t - t1) / (t3 - t1));
        const c = lerp(b1, b2, (t - t1) / (t2 - t1));
        c.y = 0;
        return c;
    }

    // Rééchantillonne une polyligne fermée à pas d'arc constant.
    resampleByArcLength(points, spacing) {
        const n = points.length;
        let total = 0;
        for (let i = 0; i < n; i++) {
            total += points[i].distanceTo(points[(i + 1) % n]);
        }

        const count = Math.max(20, Math.round(total / spacing));
        const step = total / count;
        const result = [points[0].clone()];

        let segIdx = 0;
        let distInSeg = 0;
        let segLen = points[0].distanceTo(points[1 % n]);

        for (let i = 1; i < count; i++) {
            let remaining = step;
            while (remaining > segLen - distInSeg) {
                remaining -= (segLen - distInSeg);
                segIdx = (segIdx + 1) % n;
                distInSeg = 0;
                segLen = points[segIdx].distanceTo(points[(segIdx + 1) % n]);
            }
            distInSeg += remaining;
            const a = points[segIdx];
            const b = points[(segIdx + 1) % n];
            const t = segLen > 0 ? distInSeg / segLen : 0;
            const p = new THREE.Vector3().lerpVectors(a, b, t);
            p.y = 0;
            result.push(p);
        }
        return result;
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
                
                // Orienter le tiret selon la direction de la piste. Le plan est
                // d'abord couché (rotation.x = -90°) ; avec l'ordre d'Euler XYZ
                // la rotation.z s'applique APRÈS et l'axe Z est inversé, d'où le
                // signe négatif pour aligner réellement le tiret sur la route.
                const direction = new THREE.Vector3().subVectors(endPos, startPos);
                const angle = Math.atan2(direction.z, direction.x);
                dash.rotation.z = -angle;
                
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
        const startIndex = 0; // début réel du circuit
        const startPoint = this.trackPoints[startIndex];
        const nextPoint = this.trackPoints[startIndex + 1];

        console.log(`🏁 Ligne de départ positionnée au point ${startIndex} sur le circuit`);

        // Calculer la direction et la perpendiculaire
        const direction = new THREE.Vector3().subVectors(nextPoint, startPoint).normalize();
        const perpendicular = new THREE.Vector3(-direction.z, 0, direction.x);

        // Largeur de la ligne (même largeur que la piste)
        const trackWidth = 36;
        
        // Créer la ligne de départ/arrivée (une seule ligne pour les deux
        // fonctions). On passe la PERPENDICULAIRE : la bande doit traverser la
        // route, pas la suivre.
        this.createStartFinishLineVisual(startPoint, perpendicular, trackWidth);

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
        
        // Orienter la bande le long de la perpendiculaire (en travers de la
        // route). Plan couché + ordre d'Euler XYZ inversent l'axe Z, d'où le
        // -perpendicular.z (même correction que pour les tirets médians).
        const angle = Math.atan2(-perpendicular.z, perpendicular.x);
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
        
        const startIndex = 0; // même position que la ligne de départ
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

    // Cap (en radians) aligné sur la route au départ. Le vecteur avant d'un kart
    // est (sin(rotation), 0, cos(rotation)), donc pour suivre la direction d on
    // pose rotation = atan2(d.x, d.z).
    getStartRotation() {
        if (this.trackPoints.length < 2) return 0;
        const direction = new THREE.Vector3()
            .subVectors(this.trackPoints[1], this.trackPoints[0]).normalize();
        return Math.atan2(direction.x, direction.z);
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
        
        const startIndex = 0;
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
        // Portique de course : deux poteaux de part et d'autre de la piste, une
        // poutre au-dessus et une banderole numérotée face aux karts. Le tout
        // s'illumine en vert au passage.
        const group = new THREE.Group();

        const trackHalf = 18;              // demi-largeur de piste
        const postOffset = trackHalf + 2;  // poteaux juste à l'extérieur des bords
        const postHeight = 13;
        const postRadius = 0.6;

        const postMaterial = new THREE.MeshLambertMaterial({ color: 0x4a4a55 });
        const beamMaterial = new THREE.MeshLambertMaterial({ color: 0xcc2222 });

        // Deux poteaux verticaux (le long de l'axe X local = en travers de la piste).
        for (const side of [-1, 1]) {
            const post = new THREE.Mesh(
                new THREE.CylinderGeometry(postRadius, postRadius, postHeight, 10),
                postMaterial
            );
            post.position.set(side * postOffset, postHeight / 2, 0);
            post.castShadow = true;
            post.userData.glow = true;
            group.add(post);
        }

        // Poutre supérieure reliant les poteaux.
        const beam = new THREE.Mesh(
            new THREE.BoxGeometry(postOffset * 2 + 2, 1.4, 1.4),
            beamMaterial
        );
        beam.position.set(0, postHeight, 0);
        beam.castShadow = true;
        beam.userData.glow = true;
        group.add(beam);

        // Banderole numérotée, face à la piste (plan dans le plan XY local).
        const banner = new THREE.Mesh(
            new THREE.PlaneGeometry(18, 5),
            new THREE.MeshLambertMaterial({
                map: this.createCheckpointNumberTexture(checkpoint.id + 1),
                transparent: true,
                side: THREE.DoubleSide
            })
        );
        banner.position.set(0, postHeight - 3.2, 0);
        banner.userData.glow = true;
        group.add(banner);

        // Placement + orientation : la barrière traverse la route. On aligne
        // l'axe X local sur la perpendiculaire à la piste (rotation.y), avec le
        // -perpendicular.z dû à la convention de rotation Y.
        group.position.copy(checkpoint.position);
        group.position.y = 0;
        group.rotation.y = Math.atan2(-checkpoint.perpendicular.z, checkpoint.perpendicular.x);

        group.userData = { isCheckpoint: true, checkpointId: checkpoint.id, lit: false };

        this.checkpointMeshes.push(group);
    }

    // Texture de banderole : numéro blanc sur fond rouge.
    createCheckpointNumberTexture(num) {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 72;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#cc2222';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 6;
        ctx.strokeRect(3, 3, canvas.width - 6, canvas.height - 6);

        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = 'bold 26px Arial';
        ctx.fillText('CHECKPOINT', canvas.width / 2, 22);
        ctx.font = 'bold 36px Arial';
        ctx.fillText(String(num), canvas.width / 2, 50);

        return new THREE.CanvasTexture(canvas);
    }

    // Allume/éteint l'illumination verte d'un portique de checkpoint.
    setCheckpointGlow(group, on) {
        const color = on ? 0x00aa00 : 0x000000;
        group.traverse(obj => {
            if (obj.material && obj.userData.glow) {
                obj.material.emissive.setHex(color);
            }
        });
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
                
                // Illuminer le portique brièvement au passage.
                const group = this.checkpointMeshes[checkpoint.id];
                if (group && !group.userData.lit) {
                    group.userData.lit = true;
                    this.setCheckpointGlow(group, true);
                    setTimeout(() => {
                        this.setCheckpointGlow(group, false);
                        group.userData.lit = false;
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
        
        // Régénérer tous les éléments (même chemin validé que create())
        this.generateHighQualityTrackPoints();
        this.createTrackGeometry();
        this.generateTrees();
        this.createStartLine();
        this.generateCheckpoints();
        
        console.log('✅ Nouveau circuit généré avec système anti-raccourcis !');
    }

    // Méthode de diagnostic pour analyser la qualité du circuit
    diagnoseTrackQuality() {
        if (this.trackPoints.length < 10) return;
        
        console.log('📊 Diagnostic de la qualité du circuit...');
        
        let minSegmentLength = Infinity;
        let maxSegmentLength = 0;
        let totalLength = 0;
        let sharpAngles = 0;
        let segments = [];
        
        const maxSafeAngle = Math.PI / 3; // 60°
        
        for (let i = 0; i < this.trackPoints.length; i++) {
            const current = this.trackPoints[i];
            const next = this.trackPoints[(i + 1) % this.trackPoints.length];
            const segmentLength = current.distanceTo(next);
            
            segments.push(segmentLength);
            minSegmentLength = Math.min(minSegmentLength, segmentLength);
            maxSegmentLength = Math.max(maxSegmentLength, segmentLength);
            totalLength += segmentLength;
            
            // Analyser les angles
            if (i > 0) {
                const prev = this.trackPoints[i - 1];
                const dir1 = new THREE.Vector3().subVectors(current, prev).normalize();
                const dir2 = new THREE.Vector3().subVectors(next, current).normalize();
                const angle = Math.acos(Math.max(-1, Math.min(1, dir1.dot(dir2))));
                
                if (angle > maxSafeAngle) {
                    sharpAngles++;
                }
            }
        }
        
        const avgSegmentLength = totalLength / segments.length;
        
        console.log(`📏 Longueur totale: ${totalLength.toFixed(1)}m`);
        console.log(`📐 Segments - Min: ${minSegmentLength.toFixed(1)}m, Max: ${maxSegmentLength.toFixed(1)}m, Moy: ${avgSegmentLength.toFixed(1)}m`);
        console.log(`⚠️ Angles potentiellement problématiques: ${sharpAngles}`);
        
        // Évaluation de la qualité
        const qualityScore = Math.max(0, 100 - (sharpAngles * 5) - (minSegmentLength < 5 ? 20 : 0));
        console.log(`⭐ Score de qualité: ${qualityScore.toFixed(0)}/100`);
        
        if (qualityScore >= 80) {
            console.log('✅ Circuit de haute qualité - Conduite fluide garantie !');
        } else if (qualityScore >= 60) {
            console.log('⚠️ Circuit acceptable - Quelques zones peuvent être moins fluides');
        } else {
            console.log('❌ Circuit de qualité insuffisante - Risque de zones problématiques');
        }
        
        return { qualityScore, sharpAngles, minSegmentLength, avgSegmentLength, totalLength };
    }
    // Génération avec validation. On génère plusieurs candidats et on garde le
    // plus INTÉRESSANT (virages cumulés max) parmi ceux qui sont valides — pas
    // simplement le premier valide, qui est souvent le plus plat. Un circuit est
    // valide s'il ne se croise pas et si aucun virage n'est trop serré pour la
    // largeur de piste (sinon le ruban se pince).
    generateHighQualityTrackPoints(maxAttempts = 50) {
        console.log('🎯 Génération d\'un circuit valide et intéressant...');
        const minAllowedRadius = 22; // > demi-largeur de piste (~18) : autorise les épingles

        let bestValid = null;
        let bestValidTurning = -Infinity;
        let bestFallback = null;
        let bestFallbackScore = -Infinity;
        let validCount = 0;

        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            this.generateTrackPoints();

            const selfIntersects = this.hasSelfIntersection();
            const minRadius = this.getMinCurvatureRadius();

            if (!selfIntersects && minRadius >= minAllowedRadius) {
                validCount++;
                // Parmi les circuits valides, préférer celui qui tourne le plus
                // (plus de virages = plus technique).
                const turning = this.getTotalTurning();
                if (turning > bestValidTurning) {
                    bestValidTurning = turning;
                    bestValid = this.trackPoints.map(p => p.clone());
                }
            } else {
                // Garder un repli au cas où aucun candidat valide n'émerge.
                const score = (selfIntersects ? -1000 : 0) + Math.min(minRadius, minAllowedRadius);
                if (score > bestFallbackScore) {
                    bestFallbackScore = score;
                    bestFallback = this.trackPoints.map(p => p.clone());
                }
            }
        }

        if (bestValid) {
            this.trackPoints = bestValid;
            console.log(`✅ Circuit retenu sur ${validCount} candidats valides (virages cumulés ${bestValidTurning.toFixed(1)} rad)`);
        } else if (bestFallback) {
            this.trackPoints = bestFallback;
            console.warn(`⚠️ Aucun circuit parfait — meilleur repli conservé (score ${bestFallbackScore.toFixed(1)})`);
        }
        this.diagnoseTrackQuality();
    }

    // Somme des changements de cap absolus le long de la boucle (un cercle vaut
    // 2π ≈ 6.28 ; plus la valeur est élevée, plus le circuit enchaîne de virages).
    getTotalTurning() {
        const pts = this.trackPoints;
        const n = pts.length;
        let turning = 0;
        for (let i = 0; i < n; i++) {
            const a = pts[(i - 1 + n) % n];
            const b = pts[i];
            const c = pts[(i + 1) % n];
            const d1x = b.x - a.x, d1z = b.z - a.z;
            const d2x = c.x - b.x, d2z = c.z - b.z;
            const cross = d1x * d2z - d1z * d2x;
            const dot = d1x * d2x + d1z * d2z;
            turning += Math.abs(Math.atan2(cross, dot));
        }
        return turning;
    }

    // Test de croisement de la boucle (segment-segment dans le plan XZ).
    hasSelfIntersection() {
        const pts = this.trackPoints;
        const n = pts.length;
        for (let i = 0; i < n; i++) {
            const a1 = pts[i];
            const a2 = pts[(i + 1) % n];
            for (let j = i + 2; j < n; j++) {
                // Ignorer les segments adjacents (dont la paire début/fin).
                if (i === 0 && j === n - 1) continue;
                const b1 = pts[j];
                const b2 = pts[(j + 1) % n];
                if (this.segmentsIntersect(a1, a2, b1, b2)) return true;
            }
        }
        return false;
    }

    segmentsIntersect(p1, p2, p3, p4) {
        const cross = (a, b, c) => (b.x - a.x) * (c.z - a.z) - (b.z - a.z) * (c.x - a.x);
        const d1 = cross(p3, p4, p1);
        const d2 = cross(p3, p4, p2);
        const d3 = cross(p1, p2, p3);
        const d4 = cross(p1, p2, p4);
        return (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) &&
                ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0)));
    }

    // Plus petit rayon de courbure le long de la boucle (cercle circonscrit
    // à trois points consécutifs).
    getMinCurvatureRadius() {
        const pts = this.trackPoints;
        const n = pts.length;
        let minR = Infinity;
        for (let i = 0; i < n; i++) {
            const r = this.circumRadius(pts[(i - 1 + n) % n], pts[i], pts[(i + 1) % n]);
            if (r < minR) minR = r;
        }
        return minR;
    }

    circumRadius(a, b, c) {
        const ab = a.distanceTo(b);
        const bc = b.distanceTo(c);
        const ca = c.distanceTo(a);
        const area = Math.abs((b.x - a.x) * (c.z - a.z) - (b.z - a.z) * (c.x - a.x)) / 2;
        if (area < 1e-6) return Infinity; // points colinéaires = ligne droite
        return (ab * bc * ca) / (4 * area);
    }
}
