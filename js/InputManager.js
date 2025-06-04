// InputManager.js - Gestionnaire des entrées utilisateur
class InputManager {    constructor() {
        this.keys = {
            up: false,
            down: false,
            left: false,
            right: false,
            drift: false
        };
        
        // Camera zoom control
        this.zoomLevel = 1.0; // 1.0 = normal, <1.0 = zoomed in, >1.0 = zoomed out
        this.minZoom = 0.3;   // Closest zoom
        this.maxZoom = 2.5;   // Farthest zoom
        this.zoomSpeed = 0.1; // How fast zoom changes
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        document.addEventListener('keydown', (event) => {
            this.handleKeyDown(event);
        });
        
        document.addEventListener('keyup', (event) => {
            this.handleKeyUp(event);
        });
        
        // Mouse wheel event for camera zoom
        document.addEventListener('wheel', (event) => {
            this.handleMouseWheel(event);
        }, { passive: false });
          // Empêcher le défilement de la page avec les flèches et l'espace
        document.addEventListener('keydown', (event) => {
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Equal', 'Minus', 'NumpadAdd', 'NumpadSubtract'].includes(event.code)) {
                event.preventDefault();
            }
        });
    }    handleKeyDown(event) {
        switch(event.code) {
            case 'ArrowUp':
            case 'KeyW':
                this.keys.up = true;
                break;
            case 'ArrowDown':
            case 'KeyS':
                this.keys.down = true;
                break;
            case 'ArrowLeft':
            case 'KeyA':
                this.keys.left = true;
                break;
            case 'ArrowRight':
            case 'KeyD':
                this.keys.right = true;
                break;
            case 'Space':
                this.keys.drift = true;
                break;
            case 'Equal':
            case 'NumpadAdd':
                // Zoom in with + key
                this.zoomLevel = Math.max(this.minZoom, this.zoomLevel - this.zoomSpeed);
                break;
            case 'Minus':
            case 'NumpadSubtract':
                // Zoom out with - key
                this.zoomLevel = Math.min(this.maxZoom, this.zoomLevel + this.zoomSpeed);
                break;
        }
    }
      handleKeyUp(event) {
        switch(event.code) {
            case 'ArrowUp':
            case 'KeyW':
                this.keys.up = false;
                break;
            case 'ArrowDown':
            case 'KeyS':
                this.keys.down = false;
                break;
            case 'ArrowLeft':
            case 'KeyA':
                this.keys.left = false;
                break;
            case 'ArrowRight':
            case 'KeyD':
                this.keys.right = false;
                break;
            case 'Space':
                this.keys.drift = false;
                break;
        }
    }
    
    handleMouseWheel(event) {
        event.preventDefault();
        
        // Normalize wheel delta across different browsers
        const delta = event.deltaY > 0 ? this.zoomSpeed : -this.zoomSpeed;
        
        // Update zoom level with constraints
        this.zoomLevel = Math.max(this.minZoom, Math.min(this.maxZoom, this.zoomLevel + delta));
    }
      applyZoom() {
        // Cette fonction doit être implémentée pour appliquer le niveau de zoom
        // à la caméra ou à l'objet pertinent dans votre scène
        console.log(`Niveau de zoom actuel : ${this.zoomLevel}`);
    }
      getInputs() {
        return {
            up: this.keys.up,
            down: this.keys.down,
            left: this.keys.left,
            right: this.keys.right,
            drift: this.keys.drift,
            zoomLevel: this.zoomLevel  // Add zoom level to inputs
        };
    }
    
    isKeyPressed(key) {
        return this.keys[key] || false;
    }
    
    // Add method to get just the zoom level
    getZoomLevel() {
        return this.zoomLevel;
    }
    
    // Add method to reset zoom
    resetZoom() {
        this.zoomLevel = 1.0;
    }
      reset() {
        this.keys = {
            up: false,
            down: false,
            left: false,
            right: false,
            drift: false
        };
        
        // Reset zoom to default
        this.zoomLevel = 1.0;
    }
}
