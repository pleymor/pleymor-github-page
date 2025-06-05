// InputManager.js - Gestionnaire des entrées utilisateur
class InputManager {
    constructor() {
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
        
        // Mobile device detection
        this.isMobile = this.detectMobileDevice();
        this.isTablet = this.detectTabletDevice();
        this.isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;        // Touch controls state
        this.touchStates = {
            up: false,
            down: false,
            left: false,
            right: false,
            drift: false
        };        // Mobile-specific control modes
        this.mobileControlModes = {
            autoAcceleration: false,  // Automatic forward acceleration
            persistentAcceleration: false,  // Toggle acceleration on/off
            tapToToggleAccel: false   // Tap accelerate button to toggle instead of hold
        };

        // Multi-touch tracking
        this.activeTouches = new Map(); // Track multiple touches by identifier
        this.touchAreas = {
            joystick: false,
            accelerate: false,
            brake: false,
            drift: false,
            camera: false
        };        // Virtual joystick state
        this.joystick = {
            active: false,
            knob: null,
            base: null,
            centerX: 0,
            centerY: 0,
            currentX: 0,
            currentY: 0,
            maxDistance: 45, // Maximum distance from center
            deadZone: 0.15,  // Reduced deadzone for better responsiveness
            normalizedX: 0,  // Initialize normalized values
            normalizedY: 0,
            activeTouchId: null  // Track which touch controls the joystick
        };
          // Camera touch controls
        this.isCameraTouching = false;
        this.cameraTouchId = null; // Track camera touch ID
        this.lastTouchX = 0;
        this.lastTouchY = 0;
        
        this.setupEventListeners();
        this.initializeMobileInterface();
    }
      setupEventListeners() {
        console.log('🎮 Setting up event listeners...');
        
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

        // Mouse events for camera rotation
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
    }

    detectMobileDevice() {
        const userAgent = navigator.userAgent.toLowerCase();
        const mobileKeywords = [
            'mobile', 'android', 'iphone', 'ipod', 'blackberry', 
            'windows phone', 'opera mini', 'iemobile'
        ];
        return mobileKeywords.some(keyword => userAgent.includes(keyword));
    }
    
    detectTabletDevice() {
        const userAgent = navigator.userAgent.toLowerCase();
        const tabletKeywords = ['ipad', 'tablet', 'kindle', 'silk', 'playbook'];
        return tabletKeywords.some(keyword => userAgent.includes(keyword)) ||
               (navigator.maxTouchPoints > 1 && !this.isMobile);
    }
      initializeMobileInterface() {
        console.log('🔍 Device detection:', {
            isMobile: this.isMobile,
            isTablet: this.isTablet,
            isTouchDevice: this.isTouchDevice,
            userAgent: navigator.userAgent.toLowerCase(),
            maxTouchPoints: navigator.maxTouchPoints,
            windowWidth: window.innerWidth
        });
        
        if (this.isMobile || this.isTablet || this.isTouchDevice) {
            console.log('📱 Appareil mobile/tactile détecté');
            
            // Show mobile UI info initially
            const mobileUIInfo = document.getElementById('mobileUIInfo');
            if (mobileUIInfo && window.innerWidth <= 768) {
                mobileUIInfo.style.display = 'block';
            }
            
            // Auto-hide after 5 seconds
            setTimeout(() => {
                if (mobileUIInfo) {
                    mobileUIInfo.style.display = 'none';
                }
            }, 5000);
            
            this.setupTouchControls();
            this.adaptUIForMobile();
        }
    }
    
    adaptUIForMobile() {
        // Update start screen text for mobile
        const startScreenControls = document.querySelector('#startScreen p:nth-of-type(3)');
        if (startScreenControls && (this.isMobile || this.isTablet)) {
            startScreenControls.innerHTML = '📱 Contrôles tactiles • 📹 Glissez pour pivoter la caméra • 🎮 Boutons virtuels';
        }
    }
      setupTouchControls() {
        if (!this.isTouchDevice) return;
        
        // Setup virtual joystick
        this.setupVirtualJoystick();
        
        // Setup action buttons
        this.setupTouchButton('accelerateButton', 'up');
        this.setupTouchButton('brakeButton', 'down');
        this.setupTouchButton('driftButton', 'drift');
        
        // Setup zoom buttons
        this.setupZoomButton('touchZoomIn', true);
        this.setupZoomButton('touchZoomOut', false);
        
        // Setup camera touch area
        this.setupCameraTouchArea();
        
        // Show mobile controls when game starts
        document.addEventListener('gameStarted', () => {
            this.showMobileControls();
        });
    }
      setupVirtualJoystick() {
        const joystickContainer = document.getElementById('virtualJoystick');
        const joystickKnob = document.getElementById('joystickKnob');
        
        if (!joystickContainer || !joystickKnob) {
            console.warn('Virtual joystick elements not found');
            return;
        }
        
        this.joystick.knob = joystickKnob;
        this.joystick.base = joystickContainer;
        
        // Get joystick center position
        const updateJoystickCenter = () => {
            const rect = joystickContainer.getBoundingClientRect();
            this.joystick.centerX = rect.left + rect.width / 2;
            this.joystick.centerY = rect.top + rect.height / 2;
        };
        
        // Update center on window resize
        window.addEventListener('resize', updateJoystickCenter);
        updateJoystickCenter();
        
        // Multi-touch enabled joystick events
        joystickContainer.addEventListener('touchstart', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            if (e.touches.length >= 1) {
                // Find first available touch for joystick
                for (let touch of e.touches) {
                    if (this.isTouchInJoystickArea(touch)) {
                        this.joystick.active = true;
                        this.joystick.activeTouchId = touch.identifier;
                        this.touchAreas.joystick = true;
                        joystickKnob.classList.add('active');
                        updateJoystickCenter();
                        this.updateJoystickPosition(touch);
                        break;
                    }
                }
            }
        }, { passive: false });
        
        // Multi-touch move handling
        document.addEventListener('touchmove', (e) => {
            if (!this.joystick.active) return;
            e.preventDefault();
            
            // Find the specific touch that controls the joystick
            for (let touch of e.touches) {
                if (touch.identifier === this.joystick.activeTouchId) {
                    this.updateJoystickPosition(touch);
                    break;
                }
            }
        }, { passive: false });
        
        // Multi-touch end handling
        document.addEventListener('touchend', (e) => {
            if (!this.joystick.active) return;
            
            // Check if the joystick controlling touch ended
            let joystickTouchEnded = true;
            for (let touch of e.touches) {
                if (touch.identifier === this.joystick.activeTouchId) {
                    joystickTouchEnded = false;
                    break;
                }
            }
            
            if (joystickTouchEnded) {
                this.resetJoystick();
            }
        }, { passive: false });
        
        document.addEventListener('touchcancel', (e) => {
            if (this.joystick.active) {
                this.resetJoystick();
            }
        }, { passive: false });
    }
    
    isTouchInJoystickArea(touch) {
        const rect = this.joystick.base.getBoundingClientRect();
        const margin = 50; // Allow some margin around the joystick
        return touch.clientX >= rect.left - margin &&
               touch.clientX <= rect.right + margin &&
               touch.clientY >= rect.top - margin &&
               touch.clientY <= rect.bottom + margin;
    }
      updateJoystickPosition(touch) {
        const deltaX = touch.clientX - this.joystick.centerX;
        const deltaY = touch.clientY - this.joystick.centerY;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        // Limit joystick movement to max distance
        const limitedDistance = Math.min(distance, this.joystick.maxDistance);
        const angle = Math.atan2(deltaY, deltaX);
        
        this.joystick.currentX = limitedDistance * Math.cos(angle);
        this.joystick.currentY = limitedDistance * Math.sin(angle);
        
        // Update knob visual position
        this.joystick.knob.style.transform = 
            `translate(-50%, -50%) translate(${this.joystick.currentX}px, ${this.joystick.currentY}px)`;
        
        // Update touch states based on joystick position
        this.updateTouchStatesFromJoystick();
        
        // Add visual feedback based on steering intensity
        const normalizedDistance = limitedDistance / this.joystick.maxDistance;
        const intensity = Math.max(0.3, normalizedDistance);
        this.joystick.knob.style.opacity = intensity;
    }
      updateTouchStatesFromJoystick() {
        const normalizedX = this.joystick.currentX / this.joystick.maxDistance;
        const normalizedY = this.joystick.currentY / this.joystick.maxDistance;
        
        // Apply dead zone with smooth transition
        const deadZone = this.joystick.deadZone;
        
        // Calculate smooth analog values with deadzone compensation
        let smoothX = 0;
        let smoothY = 0;
        
        if (Math.abs(normalizedX) > deadZone) {
            const sign = Math.sign(normalizedX);
            const adjustedValue = (Math.abs(normalizedX) - deadZone) / (1 - deadZone);
            smoothX = sign * Math.min(adjustedValue, 1.0);
        }
        
        if (Math.abs(normalizedY) > deadZone) {
            const sign = Math.sign(normalizedY);
            const adjustedValue = (Math.abs(normalizedY) - deadZone) / (1 - deadZone);
            smoothY = sign * Math.min(adjustedValue, 1.0);
        }
        
        // Store smooth analog values
        this.joystick.normalizedX = smoothX;
        this.joystick.normalizedY = smoothY;
        
        // Digital touch states for backward compatibility
        this.touchStates.left = normalizedX < -deadZone;
        this.touchStates.right = normalizedX > deadZone;
    }    resetJoystick() {
        this.joystick.active = false;
        this.joystick.currentX = 0;
        this.joystick.currentY = 0;
        this.joystick.normalizedX = 0;
        this.joystick.normalizedY = 0;
        this.joystick.activeTouchId = null;
        this.joystick.knob.classList.remove('active');
        this.joystick.knob.style.transform = 'translate(-50%, -50%)';
        this.joystick.knob.style.opacity = ''; // Reset opacity
        this.touchAreas.joystick = false;
        
        // Reset digital touch states (but keep toggle states)
        this.touchStates.left = false;
        this.touchStates.right = false;
    }    setupTouchButton(elementId, action) {
        const button = document.getElementById(elementId);
        if (!button) return;
        
        // Standard button behavior for all buttons (hold to activate)
        button.addEventListener('touchstart', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.touchStates[action] = true;
            button.classList.add('pressed');
            this.touchAreas[action.replace('up', 'accelerate').replace('down', 'brake')] = true;
        }, { passive: false });
        
        button.addEventListener('touchend', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.touchStates[action] = false;
            button.classList.remove('pressed');
            this.touchAreas[action.replace('up', 'accelerate').replace('down', 'brake')] = false;
        }, { passive: false });
        
        button.addEventListener('touchcancel', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.touchStates[action] = false;
            button.classList.remove('pressed');
            this.touchAreas[action.replace('up', 'accelerate').replace('down', 'brake')] = false;
        }, { passive: false });
    }
    
    setupZoomButton(elementId, zoomIn) {
        const button = document.getElementById(elementId);
        if (!button) return;
        
        button.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const delta = zoomIn ? -this.zoomSpeed : this.zoomSpeed;
            this.zoomLevel = Math.max(this.minZoom, Math.min(this.maxZoom, this.zoomLevel + delta));
            button.classList.add('pressed');
        }, { passive: false });
        
        button.addEventListener('touchend', (e) => {
            e.preventDefault();
            button.classList.remove('pressed');
        }, { passive: false });
    }
      setupCameraTouchArea() {
        const touchArea = document.getElementById('cameraTouchArea');
        if (!touchArea) return;
        
        touchArea.addEventListener('touchstart', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            if (e.touches.length === 1) {
                // Only activate camera if touch is not on other controls
                const touch = e.touches[0];
                if (!this.isTouchOnControl(touch)) {
                    this.isCameraTouching = true;
                    this.cameraTouchId = touch.identifier;
                    this.lastTouchX = touch.clientX;
                    this.lastTouchY = touch.clientY;
                    this.touchAreas.camera = true;
                    touchArea.classList.add('active');
                }
            }
        }, { passive: false });
        
        touchArea.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (!this.isCameraTouching) return;
            
            // Find the specific touch for camera
            for (let touch of e.touches) {
                if (touch.identifier === this.cameraTouchId) {
                    const deltaX = touch.clientX - this.lastTouchX;
                    const deltaY = touch.clientY - this.lastTouchY;
                    
                    // Update camera rotation (same logic as mouse)
                    this.cameraRotationX -= deltaX * this.rotationSensitivity;
                    this.cameraRotationY += deltaY * this.rotationSensitivity;
                    
                    // Limit vertical rotation
                    this.cameraRotationY = Math.max(
                        -this.maxVerticalRotation, 
                        Math.min(this.maxVerticalRotation, this.cameraRotationY)
                    );
                    
                    this.lastTouchX = touch.clientX;
                    this.lastTouchY = touch.clientY;
                    break;
                }
            }
        }, { passive: false });
        
        touchArea.addEventListener('touchend', (e) => {
            e.preventDefault();
            
            // Check if camera touch ended
            let cameraTouchEnded = true;
            for (let touch of e.touches) {
                if (touch.identifier === this.cameraTouchId) {
                    cameraTouchEnded = false;
                    break;
                }
            }
            
            if (cameraTouchEnded) {
                this.isCameraTouching = false;
                this.cameraTouchId = null;
                this.touchAreas.camera = false;
                touchArea.classList.remove('active');
            }
        }, { passive: false });
        
        touchArea.addEventListener('touchcancel', (e) => {
            e.preventDefault();
            this.isCameraTouching = false;
            this.cameraTouchId = null;
            this.touchAreas.camera = false;
            touchArea.classList.remove('active');
        }, { passive: false });
    }
    
    // Helper method to check if touch is on a control element
    isTouchOnControl(touch) {
        const x = touch.clientX;
        const y = touch.clientY;
        
        // Check joystick area
        if (this.joystick.base) {
            const joystickRect = this.joystick.base.getBoundingClientRect();
            const margin = 20;
            if (x >= joystickRect.left - margin && x <= joystickRect.right + margin &&
                y >= joystickRect.top - margin && y <= joystickRect.bottom + margin) {
                return true;
            }
        }
        
        // Check action buttons
        const actionButtons = ['accelerateButton', 'brakeButton', 'driftButton'];
        for (let buttonId of actionButtons) {
            const button = document.getElementById(buttonId);
            if (button) {
                const rect = button.getBoundingClientRect();
                const margin = 10;
                if (x >= rect.left - margin && x <= rect.right + margin &&
                    y >= rect.top - margin && y <= rect.bottom + margin) {
                    return true;
                }
            }
        }
        
        return false;
    }
    
    showMobileControls() {
        const mobileControls = document.getElementById('mobileControls');
        if (mobileControls && (this.isMobile || this.isTablet || this.isTouchDevice)) {
            mobileControls.classList.add('show');
        }
    }
    
    hideMobileControls() {
        const mobileControls = document.getElementById('mobileControls');
        if (mobileControls) {
            mobileControls.classList.remove('show');
        }
    }

    // Method called by the game loop for any update logic
    update() {
        // This method can be used for any ongoing input management updates
        // Currently no ongoing updates needed for input management
    }

    // Getter methods for camera properties
    getZoomLevel() {
        return this.zoomLevel;
    }

    getCameraRotationX() {
        return this.cameraRotationX;
    }

    getCameraRotationY() {
        return this.cameraRotationY;
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
    }    // Main method to get combined inputs from keyboard/mouse and touch controls
    getInputs() {
        return {
            // Combine keyboard and touch inputs
            up: this.keys.up || this.touchStates.up,
            down: this.keys.down || this.touchStates.down,
            left: this.keys.left || this.touchStates.left,
            right: this.keys.right || this.touchStates.right,
            drift: this.keys.drift || this.touchStates.drift,
            
            // Joystick analog input for smoother steering
            joystickX: this.joystick.normalizedX || 0,
            joystickY: this.joystick.normalizedY || 0,
            
            // Camera rotation from mouse or touch
            cameraRotationX: this.cameraRotationX,
            cameraRotationY: this.cameraRotationY,
            
            // Zoom level from mouse wheel, keyboard, or touch
            zoomLevel: this.zoomLevel
        };
    }
}
