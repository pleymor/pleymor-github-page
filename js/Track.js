// Track.js - Classe pour la piste et le terrain
class Track {
    constructor() {
        this.trackPoints = [];
        this.barriers = [];
        this.trackMesh = null;
        this.terrainMesh = null;
    }
    
    async create() {
        this.generateTrackPoints();
        this.createTrackGeometry();
        this.createTerrain();
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
    
    // Getters
    getTrackPoints() { return this.trackPoints; }
    getBarriers() { return this.barriers; }
}
