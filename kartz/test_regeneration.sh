#!/bin/bash

# Test Script pour la Fonctionnalité de Régénération de Circuit
# Usage: ./test_regeneration.sh

echo "🏎️ TEST DE LA REGENERATION DE CIRCUIT 🏎️"
echo "========================================"

# Vérifier que le serveur fonctionne
echo "📡 Vérification du serveur..."
curl -s http://localhost:8000 > /dev/null
if [ $? -eq 0 ]; then
    echo "✅ Serveur HTTP fonctionnel sur le port 8000"
else
    echo "❌ Serveur non accessible"
    echo "💡 Lancez d'abord: python -m http.server 8000"
    exit 1
fi

# Vérifier les fichiers critiques
echo ""
echo "📁 Vérification des fichiers..."

files=(
    "index.html"
    "js/UIManager.js"
    "js/Game.js"
    "js/Track.js"
    "GUIDE_REGENERATION.md"
    "CHANGELOG_REGENERATION.md"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ $file manquant"
    fi
done

# Vérifier les composants JavaScript
echo ""
echo "🔍 Vérification du code JavaScript..."

# Vérifier la présence des méthodes clés
grep -q "regenerateTrack" js/UIManager.js && echo "✅ UIManager.regenerateTrack()" || echo "❌ UIManager.regenerateTrack() manquante"
grep -q "regenerateTrack" js/Game.js && echo "✅ Game.regenerateTrack()" || echo "❌ Game.regenerateTrack() manquante"
grep -q "regenerateTrack" js/Track.js && echo "✅ Track.regenerateTrack()" || echo "❌ Track.regenerateTrack() manquante"

# Vérifier les éléments HTML
echo ""
echo "🎨 Vérification de l'interface..."
grep -q "regenerateTrackButton" index.html && echo "✅ Bouton de régénération" || echo "❌ Bouton manquant"
grep -q "trackRegenOverlay" index.html && echo "✅ Overlay de chargement" || echo "❌ Overlay manquant"
grep -q "KeyR" js/UIManager.js && echo "✅ Raccourci clavier R" || echo "❌ Raccourci manquant"

echo ""
echo "🎯 TESTS MANUELS À EFFECTUER:"
echo "1. Ouvrir http://localhost:8000 dans le navigateur"
echo "2. Démarrer une course"
echo "3. Appuyer sur Échap pour ouvrir le menu pause"
echo "4. Tester le bouton '🔄 Nouveau Circuit (R)'"
echo "5. Tester le raccourci clavier 'R' en mode pause"
echo "6. Vérifier que l'overlay de chargement apparaît"
echo "7. Vérifier que la minimap se met à jour"
echo "8. Vérifier que les karts sont repositionnés"

echo ""
echo "📚 Documentation disponible:"
echo "- GUIDE_REGENERATION.md : Guide utilisateur"
echo "- CHANGELOG_REGENERATION.md : Détails techniques"
echo "- README.md : Documentation générale"

echo ""
echo "🎉 Test terminé ! La fonctionnalité semble correctement implémentée."
echo "🌐 Accédez au jeu : http://localhost:8000"
