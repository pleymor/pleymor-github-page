// ShaderManager.js - Enhanced materials for visual effects
class ShaderManager {
    constructor() {
        this.materials = {};
        this.initMaterials();
    }

    initMaterials() {
        // Use enhanced THREE.js materials with better properties
        // This provides visual improvement without complex shader compilation issues
        this.createEnhancedMaterials();
    }

    createEnhancedMaterials() {
        // Enhanced track material
        this.materials.track = {
            create: (wetness = 0.0) => {
                return new THREE.MeshPhongMaterial({
                    color: new THREE.Color(0.15, 0.15, 0.15),
                    shininess: 30 + wetness * 100, // Shinier when wet
                    specular: new THREE.Color(0.1 + wetness * 0.4, 0.1 + wetness * 0.4, 0.1 + wetness * 0.4),
                    reflectivity: wetness * 0.3,
                    transparent: false
                });
            }
        };

        // Enhanced kart material
        this.materials.kart = {
            create: (color, speed = 0.0) => {
                const baseColor = new THREE.Color(color);
                // Add slight glow based on speed
                const glowFactor = 1.0 + speed * 0.3;
                const finalColor = baseColor.clone().multiplyScalar(glowFactor);
                
                return new THREE.MeshPhongMaterial({
                    color: finalColor,
                    shininess: 120,
                    specular: new THREE.Color(0.8, 0.8, 0.8),
                    reflectivity: 0.4,
                    transparent: false
                });
            }
        };        // Enhanced terrain material with grass texture
        this.materials.terrain = {
            create: () => {
                // Create a procedural grass texture
                const grassTexture = this.createGrassTexture();
                const normalMap = this.createGrassNormalMap();
                
                return new THREE.MeshPhongMaterial({
                    map: grassTexture,
                    normalMap: normalMap,
                    color: new THREE.Color(0.95, 1.0, 0.92), // Slight green tint
                    shininess: 5, // Low shininess for natural grass look
                    specular: new THREE.Color(0.1, 0.2, 0.1), // Subtle green specular
                    transparent: false
                });
            }
        };

        // Enhanced particle material
        this.materials.particle = {
            create: () => {
                return new THREE.PointsMaterial({
                    color: 0xAAAAAA,
                    size: 1.2,
                    transparent: true,
                    opacity: 0.8,
                    depthWrite: false,
                    blending: THREE.AdditiveBlending,
                    sizeAttenuation: true,
                    alphaTest: 0.01
                });
            }
        };
    }

    // Public methods for getting materials
    getTrackMaterial(wetness = 0.0) {
        return this.materials.track.create(wetness);
    }

    getKartMaterial(color, speed = 0.0) {
        return this.materials.kart.create(color, speed);
    }

    getTerrainMaterial() {
        return this.materials.terrain.create();
    }

    getParticleMaterial() {
        return this.materials.particle.create();
    }

    // Placeholder methods for future shader implementation
    updateUniforms(time, cameraPosition, isRaining = false) {
        // For now, this is a placeholder
        // In the future, we can implement actual shader uniform updates here
    }    createGrassTexture() {
        // Create a canvas for the grass texture
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');
        
        // Create base grass color gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#3a6b47'); // Darker forest green at top
        gradient.addColorStop(0.2, '#4a7c59'); // Dark green
        gradient.addColorStop(0.5, '#5d9467'); // Medium green
        gradient.addColorStop(0.8, '#6ba170'); // Lighter green
        gradient.addColorStop(1, '#7ab57a'); // Brightest green at bottom
        
        // Fill base color
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Add clover-like circular patches
        for (let i = 0; i < 150; i++) {
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height;
            const size = Math.random() * 15 + 8;
            
            ctx.fillStyle = `rgba(${30 + Math.random() * 20}, ${100 + Math.random() * 40}, ${40 + Math.random() * 20}, ${0.4 + Math.random() * 0.4})`;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
            
            // Add small highlights on clover patches
            ctx.fillStyle = `rgba(${60 + Math.random() * 30}, ${140 + Math.random() * 30}, ${60 + Math.random() * 20}, ${0.3})`;
            ctx.beginPath();
            ctx.arc(x - size/3, y - size/3, size/3, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Add grass blade patterns with more variety
        for (let i = 0; i < 3000; i++) {
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height;
            const length = Math.random() * 12 + 3;
            const width = Math.random() * 2 + 0.8;
            
            // More varied grass blade colors
            const greenBase = 110 + Math.random() * 50;
            const red = Math.random() * 40 + 15;
            const blue = Math.random() * 30 + 10;
            
            ctx.fillStyle = `rgb(${red}, ${greenBase}, ${blue})`;
            
            // Draw grass blade with more natural shape
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(Math.random() * 0.6 - 0.3); // More rotation variation
            
            // Create blade shape (tapered)
            ctx.beginPath();
            ctx.moveTo(-width/2, 0);
            ctx.lineTo(-width/4, length * 0.7);
            ctx.lineTo(0, length);
            ctx.lineTo(width/4, length * 0.7);
            ctx.lineTo(width/2, 0);
            ctx.closePath();
            ctx.fill();
            
            ctx.restore();
        }
        
        // Add some small flowers for natural look
        for (let i = 0; i < 80; i++) {
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height;
            const size = Math.random() * 3 + 1;
            
            // Tiny white/yellow flowers
            const colors = ['rgba(255, 255, 255, 0.8)', 'rgba(255, 255, 150, 0.8)', 'rgba(255, 200, 200, 0.6)'];
            ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Add some dirt patches for realism
        for (let i = 0; i < 40; i++) {
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height;
            const size = Math.random() * 25 + 8;
            
            ctx.fillStyle = `rgba(${70 + Math.random() * 40}, ${55 + Math.random() * 25}, ${35 + Math.random() * 20}, ${0.2 + Math.random() * 0.4})`;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Add subtle noise for texture variation
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
            const noise = (Math.random() - 0.5) * 15;
            data[i] = Math.max(0, Math.min(255, data[i] + noise));     // Red
            data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise)); // Green
            data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise)); // Blue
        }
        
        ctx.putImageData(imageData, 0, 0);
        
        // Create Three.js texture
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(20, 20); // More repetition for finer detail
        texture.needsUpdate = true;
        
        return texture;
    }    createGrassNormalMap() {
        // Create a canvas for the normal map
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');
        
        // Start with neutral normal map color (128, 128, 255)
        ctx.fillStyle = 'rgb(128, 128, 255)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Add grass blade normal variations
        for (let i = 0; i < 1500; i++) {
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height;
            const length = Math.random() * 8 + 3;
            const width = Math.random() * 3 + 1;
            
            // Create normal variation for grass blades
            const normalR = 128 + (Math.random() - 0.5) * 30; // X normal
            const normalG = 128 + (Math.random() - 0.5) * 30; // Y normal  
            const normalB = 255 - Math.random() * 20; // Z normal (pointing up mostly)
            
            ctx.fillStyle = `rgb(${Math.max(0, Math.min(255, normalR))}, ${Math.max(0, Math.min(255, normalG))}, ${Math.max(0, Math.min(255, normalB))})`;
            
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(Math.random() * Math.PI * 2);
            ctx.fillRect(-width/2, 0, width, length);
            ctx.restore();
        }
        
        // Add some subtle bumps for ground variation
        for (let i = 0; i < 200; i++) {
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height;
            const size = Math.random() * 20 + 5;
            
            const gradient = ctx.createRadialGradient(x, y, 0, x, y, size);
            gradient.addColorStop(0, 'rgba(140, 140, 255, 0.3)');
            gradient.addColorStop(1, 'rgba(128, 128, 255, 0)');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Create Three.js normal map texture
        const normalTexture = new THREE.CanvasTexture(canvas);
        normalTexture.wrapS = THREE.RepeatWrapping;
        normalTexture.wrapT = THREE.RepeatWrapping;
        normalTexture.repeat.set(20, 20);
        normalTexture.needsUpdate = true;
        
        return normalTexture;
    }
}
