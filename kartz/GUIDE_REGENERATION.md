# 🔄 Guide de Régénération de Circuit

## 📖 Présentation

Le jeu de karting 3D dispose maintenant d'un système de **génération aléatoire de circuit** qui permet de créer des parcours uniques à chaque partie !

## 🎯 Comment utiliser cette fonctionnalité

### 1. 🚀 Démarrage automatique
- À chaque nouvelle partie, un circuit unique est généré automatiquement
- Chaque circuit a ses propres courbes, virages et disposition d'arbres

### 2. 🎮 Régénération en cours de jeu
1. **Pendant une course**, appuyez sur la touche `Échap` ou cliquez sur le bouton ⏸️ pour ouvrir le menu pause
2. **Dans le menu pause**, cliquez sur le bouton `🔄 Nouveau Circuit (R)` ou appuyez sur la touche `R`
3. **Attendez** que le nouveau circuit soit généré (un écran de chargement apparaîtra)
4. **Profitez** de votre nouveau parcours ! Les karts sont automatiquement repositionnés

### 3. 🎹 Raccourcis clavier
- **Échap** : Ouvrir/fermer le menu pause
- **R** : Régénérer le circuit (uniquement quand le jeu est en pause)

### 4. ✨ Ce qui change
- **Forme du circuit** : Nouvelles courbes et virages
- **Largeur de piste** : Variations dynamiques
- **Arbres** : Nouveau placement avec différentes stratégies
- **Position de départ** : Adaptée au nouveau circuit
- **Minimap** : Mise à jour automatique

### 5. 🎨 Expérience utilisateur
- **Écran de chargement** : Indicateur visuel avec spinner animé
- **Messages informatifs** : Feedback en temps réel
- **Bouton sécurisé** : Désactivation pendant la génération pour éviter les conflits

## 🎲 Variabilité

### Paramètres aléatoires
- **Fréquences** : Entre 0.3 et 0.7 pour les variations majeures
- **Amplitudes** : Entre 60 et 100 pour les déformations
- **Seed unique** : Chaque circuit est garanti unique
- **Arbres** : Entre 150 et 250 arbres avec placement intelligent

### Stratégies de placement d'arbres
- **60%** : Placement circulaire autour du circuit
- **25%** : Clusters d'arbres dans des zones spécifiques
- **15%** : Placement complètement aléatoire

## 🎮 Conseils d'utilisation

### ✅ Quand régénérer
- Quand vous voulez un nouveau défi
- Pour explorer différents types de circuits
- Pour jouer plusieurs courses variées
- Pour tester vos compétences sur des tracés inédits

### ⚠️ Points à retenir
- La régénération **remet à zéro** la progression de la course
- Tous les karts sont **repositionnés** au départ
- Les **compteurs de tours** sont remis à 0
- La **minimap** se met à jour automatiquement

## 🛠️ Technique

### Architecture
- **Track.js** : Génération du circuit avec paramètres aléatoires
- **Game.js** : Gestion de la mise à jour de la scène 3D
- **UIManager.js** : Interface utilisateur et bouton de régénération

### Méthodes principales
```javascript
// Régénération complète
await track.regenerateTrack()

// Mise à jour de la scène
game.onTrackRegenerated()

// Interface utilisateur
uiManager.regenerateTrack()
```

## 🏁 Bon jeu !

Profitez de circuits toujours différents et testez vos compétences de pilotage sur des tracés inédits !

---
*Développé avec ❤️ en JavaScript et Three.js*
