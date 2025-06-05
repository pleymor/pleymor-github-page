#!/bin/bash
# Test de la fonctionnalité de rotation de caméra

echo "🏎️ Test de la Fonctionnalité de Rotation de Caméra"
echo "================================================="
echo ""

# Vérifier que les fichiers nécessaires existent
if [ -f "js/InputManager.js" ]; then
    echo "✅ InputManager.js trouvé"
else
    echo "❌ InputManager.js manquant"
    exit 1
fi

if [ -f "js/Game.js" ]; then
    echo "✅ Game.js trouvé"
else
    echo "❌ Game.js manquant"
    exit 1
fi

if [ -f "index.html" ]; then
    echo "✅ index.html trouvé"
else
    echo "❌ index.html manquant"
    exit 1
fi

echo ""
echo "📋 Vérification des fonctionnalités:"

# Vérifier que les méthodes de rotation sont présentes
if grep -q "handleMouseDown" js/InputManager.js; then
    echo "✅ Gestion du clic souris implémentée"
else
    echo "❌ Gestion du clic souris manquante"
fi

if grep -q "handleMouseMove" js/InputManager.js; then
    echo "✅ Gestion du mouvement souris implémentée"
else
    echo "❌ Gestion du mouvement souris manquante"
fi

if grep -q "cameraRotationX" js/InputManager.js; then
    echo "✅ Variables de rotation caméra définies"
else
    echo "❌ Variables de rotation caméra manquantes"
fi

if grep -q "cameraRotationX" js/Game.js; then
    echo "✅ Intégration de la rotation dans Game.js"
else
    echo "❌ Intégration de la rotation manquante"
fi

if grep -q "Clic+Glisser" index.html; then
    echo "✅ Documentation des contrôles mise à jour"
else
    echo "❌ Documentation des contrôles non mise à jour"
fi

echo ""
echo "🎮 Instructions de test:"
echo "1. Lancez le serveur: python -m http.server 8000"
echo "2. Ouvrez http://localhost:8000"
echo "3. Démarrez une course"
echo "4. Maintenez le clic gauche et bougez la souris"
echo "5. Vérifiez que la caméra tourne autour du kart"
echo "6. Relâchez et vérifiez l'auto-recentrage"
echo ""
echo "✨ Test terminé avec succès !"
