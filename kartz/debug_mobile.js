// Debug script to test mobile input detection and kart movement
console.log('🔧 Debug script loaded');

// Wait for game to be loaded
setTimeout(() => {
    if (window.game && window.game.inputManager && window.game.playerKart) {
        console.log('🎮 Game objects found, starting mobile debug tests...');
        
        // Test 1: Check if mobile detection is working
        console.log('📱 Mobile detection:', {
            isMobile: window.game.inputManager.isMobile,
            isTablet: window.game.inputManager.isTablet,
            isTouchDevice: window.game.inputManager.isTouchDevice,
            userAgent: navigator.userAgent
        });
        
        // Test 2: Manually trigger touch states to see if they affect the kart
        console.log('🧪 Testing manual touch input simulation...');
        
        // Simulate accelerate button press
        window.game.inputManager.touchStates.up = true;
        console.log('✅ Set touchStates.up = true');
        
        // Test inputs after a short delay
        setTimeout(() => {
            const inputs = window.game.inputManager.getInputs();
            console.log('📊 Current inputs:', inputs);
            
            // Test the player kart update manually
            const oldPosition = window.game.playerKart.getPosition();
            console.log('🏁 Player kart position before:', oldPosition);
            
            // Manually call update with test inputs
            window.game.playerKart.update(inputs);
            
            const newPosition = window.game.playerKart.getPosition();
            console.log('🏁 Player kart position after:', newPosition);
            
            // Calculate distance moved
            const distance = oldPosition.distanceTo(newPosition);
            console.log('📏 Distance moved:', distance);
            
            // Reset touch state
            window.game.inputManager.touchStates.up = false;
            
        }, 100);
        
        // Test 3: Check if the game loop is running
        console.log('🔄 Checking if game loop is running...');
        let frameCount = 0;
        const originalAnimate = window.game.animate;
        window.game.animate = function() {
            frameCount++;
            if (frameCount % 60 === 0) {
                console.log(`🎞️ Animation frame ${frameCount} - Game loop is running`);
            }
            return originalAnimate.call(this);
        };
        
    } else {
        console.error('❌ Game objects not found:', {
            game: !!window.game,
            inputManager: !!(window.game && window.game.inputManager),
            playerKart: !!(window.game && window.game.playerKart)
        });
    }
}, 2000);

// Test 4: Monitor touch events
document.addEventListener('touchstart', (e) => {
    console.log('👆 Touch start detected:', {
        touches: e.touches.length,
        target: e.target.id || e.target.className,
        clientX: e.touches[0].clientX,
        clientY: e.touches[0].clientY
    });
});

document.addEventListener('touchend', (e) => {
    console.log('👆 Touch end detected');
});
