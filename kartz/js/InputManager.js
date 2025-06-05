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
          // Camera rotation control
        this.isMouseDown = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;
        this.cameraRotationX = 0; // Horizontal rotation (around Y axis)
        this.cameraRotationY = 0; // Vertical rotation (around X axis)
        this.rotationSensitivity = 0.005; // Mouse sensitivity
        this.maxVerticalRotation = Math.PI / 3; // Limit vertical rotation to 60 degrees
        
        // Smooth rotation damping
        this.rotationDamping = 0.9;
        
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
        }, { passive: false });        // Mouse events for camera rotation
        document.addEventListener('mousedown', (event) => {
            console.log('Document mousedown event triggered', event.button);
            this.handleMouseDown(event);
        }, { capture: true });
        
        document.addEventListener('mousemove', (event) => {
            this.handleMouseMove(event);
        }, { capture: true });
        
        document.addEventListener('mouseup', (event) => {
            console.log('Document mouseup event triggered', event.button);
            this.handleMouseUp(event);
        }, { capture: true });
        
        // Prevent context menu on right click
        document.addEventListener('contextmenu', (event) => {
            event.preventDefault();
        });
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
      handleMouseDown(event) {
        // Only handle left mouse button for camera rotation
        if (event.button === 0) {
            // Check if game UI is visible (game is running)
            const startScreen = document.getElementById('startScreen');
            if (startScreen && startScreen.style.display !== 'none') {
                console.log('Game not started yet, ignoring mouse input');
                return;
            }
            
            this.isMouseDown = true;
            this.lastMouseX = event.clientX;
            this.lastMouseY = event.clientY;
            document.body.style.cursor = 'grabbing';
            console.log('Mouse down - starting camera rotation');
            event.preventDefault();
        }
    }
      handleMouseMove(event) {
        if (!this.isMouseDown) return;
        
        const deltaX = event.clientX - this.lastMouseX;
        const deltaY = event.clientY - this.lastMouseY;
          // Update camera rotation
        this.cameraRotationX -= deltaX * this.rotationSensitivity;
        this.cameraRotationY += deltaY * this.rotationSensitivity; // Reversed for intuitive up/down
        
        // Limit vertical rotation to prevent camera flipping
        this.cameraRotationY = Math.max(
            -this.maxVerticalRotation, 
            Math.min(this.maxVerticalRotation, this.cameraRotationY)
        );
        
        this.lastMouseX = event.clientX;
        this.lastMouseY = event.clientY;
        
        console.log(`Camera rotation: X=${this.cameraRotationX.toFixed(3)}, Y=${this.cameraRotationY.toFixed(3)}`);
        event.preventDefault();
    }
    
    handleMouseUp(event) {
        if (event.button === 0) {
            this.isMouseDown = false;
            document.body.style.cursor = 'grab';
            console.log('Mouse up - ending camera rotation');
        }
    }

    // ...existing code...
    applyZoom() {
        // Cette fonction doit être implémentée pour appliquer le niveau de zoom
        // à la caméra ou à l'objet pertinent dans votre scène
        console.log(`Niveau de zoom actuel : ${this.zoomLevel}`);
    }    getInputs() {
        return {
            up: this.keys.up,
            down: this.keys.down,
            left: this.keys.left,
            right: this.keys.right,
            drift: this.keys.drift,
            zoomLevel: this.zoomLevel,  // Add zoom level to inputs
            cameraRotationX: this.cameraRotationX,  // Add camera rotation
            cameraRotationY: this.cameraRotationY
        };
    }
    
    isKeyPressed(key) {
        return this.keys[key] || false;
    }    // Add method to get just the zoom level
    getZoomLevel() {
        return this.zoomLevel;
    }
    
    // Add method to reset zoom
    resetZoom() {
        this.zoomLevel = 1.0;
    }    // Add method to get camera rotation
    getCameraRotation() {
        return {
            x: this.cameraRotationX,
            y: this.cameraRotationY
        };
    }
    
    // Add method to reset camera rotation
    resetCameraRotation() {
        this.cameraRotationX = 0;
        this.cameraRotationY = 0;
    }    reset() {
        this.keys = {
            up: false,
            down: false,
            left: false,
            right: false,
            drift: false
        };
        
        // Reset zoom to default
        this.zoomLevel = 1.0;
        
        // Reset camera rotation
        this.cameraRotationX = 0;
        this.cameraRotationY = 0;
        this.isMouseDown = false;
    }
      // Update method for smooth camera transitions
    update() {
        // Auto-center camera rotation when not being controlled by mouse
        if (!this.isMouseDown) {
            // Gradually return camera to center position behind the kart
            this.cameraRotationX *= this.rotationDamping;
            this.cameraRotationY *= this.rotationDamping;
            
            // Stop rotation when values are very small
            if (Math.abs(this.cameraRotationX) < 0.001) this.cameraRotationX = 0;
            if (Math.abs(this.cameraRotationY) < 0.001) this.cameraRotationY = 0;
        }
    }
}
