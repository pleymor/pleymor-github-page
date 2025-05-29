// InputManager.js - Gestionnaire des entrées utilisateur
class InputManager {
    constructor() {
        this.keys = {
            up: false,
            down: false,
            left: false,
            right: false
        };
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        document.addEventListener('keydown', (event) => {
            this.handleKeyDown(event);
        });
        
        document.addEventListener('keyup', (event) => {
            this.handleKeyUp(event);
        });
        
        // Empêcher le défilement de la page avec les flèches
        document.addEventListener('keydown', (event) => {
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.code)) {
                event.preventDefault();
            }
        });
    }
    
    handleKeyDown(event) {
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
        }
    }
    
    getInputs() {
        return {
            up: this.keys.up,
            down: this.keys.down,
            left: this.keys.left,
            right: this.keys.right
        };
    }
    
    isKeyPressed(key) {
        return this.keys[key] || false;
    }
    
    reset() {
        this.keys = {
            up: false,
            down: false,
            left: false,
            right: false
        };
    }
}
