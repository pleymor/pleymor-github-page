// Test de la rotation de caméra
// Ajoutez ce code temporairement dans la console du navigateur pour tester

// Tester si l'InputManager est accessible
if (window.game && window.game.inputManager) {
    console.log("InputManager trouvé:", window.game.inputManager);
    
    // Forcer une rotation pour tester
    window.game.inputManager.cameraRotationX = 0.5;
    window.game.inputManager.cameraRotationY = 0.2;
    
    console.log("Rotation forcée appliquée");
    console.log("cameraRotationX:", window.game.inputManager.cameraRotationX);
    console.log("cameraRotationY:", window.game.inputManager.cameraRotationY);
} else {
    console.log("InputManager non trouvé - vérifiez que le jeu est démarré");
}

// Tester les event listeners
document.addEventListener('mousedown', function(e) {
    console.log('Test mousedown event caught');
});
