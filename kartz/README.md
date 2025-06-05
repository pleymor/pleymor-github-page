# 🏎️ Karting 3D

Un jeu de karting 3D immersif développé en JavaScript avec Three.js, featuring un système audio riche et des effets météorologiques dynamiques.

![Version](https://img.shields.io/badge/version-3.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![JavaScript](https://img.shields.io/badge/javascript-ES6-yellow.svg)

## 🎮 Aperçu

Ce projet présente un jeu de karting 3D complet avec :
- **Circuit procédural** de 1500 points avec largeur variable
- **Physique réaliste** avec course libre (sans barrières)
- **IA compétitive** pour 3 adversaires
- **Système audio immersif** avec musiques de fond et effets sonores
- **Effets météorologiques** avec système de pluie dynamique
- **Minimap en temps réel** pour la navigation

## 🚀 Fonctionnalités

### 🏁 Gameplay
- **Course de 3 tours** avec système de classement en temps réel
- **Contrôles fluides** : Flèches directionnelles ou WASD
- **Caméra dynamique** suivant le kart du joueur avec contrôle de zoom
- **Feux de circulation** avec séquence de départ authentique
- **Interface utilisateur** avec vitesse, position et progression
- **Minimap interactive** affichant la position des karts sur le circuit

### 🎵 Système Audio
- **Musique de fond** : Sélection aléatoire parmi 8 pistes musicales
- **Effets sonores** : Départ, passage de tour, victoire, collision
- **Contrôles audio** : Activation/désactivation et réglage du volume
- **Web Audio API** : Génération d'effets sonores procéduraux

### 🌧️ Effets Météorologiques
- **Système de pluie** : Particules de pluie dynamiques
- **Contrôle interactif** : Activation/désactivation en temps réel
- **Effets visuels** : Ambiance atmosphérique réaliste

### 🎨 Graphismes 3D
- **Rendu Three.js** avec ombres et éclairage
- **Circuit élargi** 30x plus grand que la version initiale
- **Course libre** sans obstacles physiques
- **Terrain procédural** adaptatif
- **Effets visuels** : Brouillard, ombres portées, pluie

## 📁 Structure du Projet

```
kartz/
├── README.md
├── index.html                  # Jeu de karting 3D
├── favicon.ico                 # Icône du site
├── favicon.svg                 # Icône vectorielle
├── assets/
│   └── musics/                 # Fichiers audio de fond
│       ├── jazzy-electric-218797.mp3
│       ├── lan-party-142331.mp3
│       ├── okay.mp3
│       ├── ripples-in-a-puddle-349233.mp3
│       ├── shattered-339166.mp3
│       ├── subterfuge-342945.mp3
│       ├── synthetiseur-fire-remix-216315.mp3
│       └── time-to-332609.mp3
├── js/
│   ├── AudioManager.js         # Gestion audio et effets sonores
│   ├── Game.js                 # Logique principale du jeu
│   ├── InputManager.js         # Gestion des contrôles
│   ├── Kart.js                 # Classe des karts et physique
│   ├── RainManager.js          # Système d'effets de pluie
│   ├── Track.js                # Génération et gestion du circuit
│   └── UIManager.js            # Interface utilisateur et minimap
└── sounds/                     # Dossier pour futurs effets sonores
```

## 🛠️ Installation et Lancement

### Prérequis
- Navigateur web moderne (Chrome, Firefox, Safari, Edge)
- Python 3.x (pour le serveur local) ou autre serveur HTTP

### Méthode 1 : Serveur Python
```bash
# Naviguer vers le dossier du projet
cd c:\Users\pleym\Projects\kart\kartz

# Démarrer le serveur HTTP local
python -m http.server 8000

# Ouvrir dans le navigateur
# http://localhost:8000
```

### Méthode 2 : Extension VS Code
1. Installer l'extension "Live Server"
2. Clic droit sur `index.html`
3. Sélectionner "Open with Live Server"

### Méthode 3 : Autres serveurs
```bash
# Node.js
npx serve .

# PHP
php -S localhost:8000
```

## 🎮 Contrôles

| Touche | Action |
|--------|--------|
| ↑ / W | Accélérer |
| ↓ / S | Freiner / Reculer |
| ← / A | Tourner à gauche |
| → / D | Tourner à droite |
| 🖱️ Molette | Zoom caméra |
| + / - | Zoom caméra (clavier) |

### Contrôles Interface
- **🔇 Désactiver Musique** : Active/désactive la musique de fond
- **🌧️ Activer Pluie** : Active/désactive les effets de pluie

## ⚙️ Architecture Technique

### Technologies Utilisées
- **Three.js r128** : Moteur 3D
- **Web Audio API** : Génération d'effets sonores et gestion audio
- **JavaScript ES6** : Logique de jeu moderne
- **HTML5 Canvas** : Rendu graphique et minimap
- **CSS3** : Interface utilisateur et animations

### Composants Principaux

#### 🏎️ Classe Kart
```javascript
// Dans js/Kart.js
class Kart {
    constructor(color, isPlayer = false)
    handlePlayerInput()     // Gestion des contrôles
    handleAI()             // Intelligence artificielle
    applyPhysics()         // Physique et collisions
    checkLapProgress()     // Détection des tours
}
```

#### 🌧️ Classe RainManager
```javascript
// Dans js/RainManager.js
class RainManager {
    constructor(scene, camera)
    createRainParticles()   // Création des particules de pluie
    updateRain()           // Animation des gouttes
    toggleRain()           // Activation/désactivation
}
```

#### 🎵 Classe AudioManager
```javascript
// Dans js/AudioManager.js
class AudioManager {
    constructor(game)
    playRaceMusic()        // Musique de fond aléatoire
    playSound()            // Effets sonores procéduraux
    toggleMusic()          // Contrôle de la musique
}
```

#### 🗺️ Interface UIManager
```javascript
// Dans js/UIManager.js
class UIManager {
    constructor(game)
    updateMinimap()        // Mise à jour de la minimap
    updateUI()             // Interface utilisateur
    updateVolumeSlider()   // Contrôles audio
}
```

#### 🏁 Fonctions Principales
- `createTrack()` : Génération procédurale du circuit (Track.js)
- `startRaceSequence()` : Séquence de départ avec feux (Game.js)
- `applyPhysics()` : Physique libre sans collisions (Kart.js)
- `updateRain()` : Système de particules de pluie (RainManager.js)

## 🎨 Personnalisation

### Modification du Circuit
```javascript
// Dans js/Track.js - fonction createTrack()
const numPoints = 1500;           // Nombre de points du circuit
const baseRadius = 150;           // Rayon de base
const baseWidth = 12;             // Largeur de piste de base
```

### Configuration Audio
```javascript
// Dans js/AudioManager.js - AudioManager constructor
this.tempo = 120;                     // BPM pour les effets rythmiques
this.masterVolume = 0.3;              // Volume général
this.musicEnabled = true;             // État de la musique
// Musiques disponibles dans assets/musics/
const musicFiles = this.getMp3FilesFromAssets();
```

### Configuration de la Pluie
```javascript
// Dans js/RainManager.js - RainManager constructor
this.rainCount = 1000;                // Nombre de gouttes
this.rainGeometry = new THREE.BufferGeometry();
this.rainSpeed = 0.1;                 // Vitesse de chute
this.rainRange = 400;                 // Zone de pluie
```

### Paramètres de Jeu
```javascript
// Dans js/Kart.js - Kart constructor
this.maxSpeed = isPlayer ? 0.8 : 0.6;     // Vitesse maximale
this.acceleration = 0.02;                  // Accélération
this.turnSpeed = 0.05;                     // Vitesse de rotation
```

## 🎵 Système Audio Détaillé

### Musiques de Fond
Le jeu sélectionne aléatoirement une piste parmi 8 morceaux disponibles :
- **jazzy-electric-218797.mp3** : Ambiance électro-jazz
- **lan-party-142331.mp3** : Énergie gaming
- **okay.mp3** : Rythme décontracté
- **ripples-in-a-puddle-349233.mp3** : Atmosphère contemplative
- **shattered-339166.mp3** : Intensité dramatique
- **subterfuge-342945.mp3** : Suspense et mystère
- **synthetiseur-fire-remix-216315.mp3** : Synthwave énergique
- **time-to-332609.mp3** : Urgence temporelle

### Effets Sonores Procéduraux
1. **Feux de circulation** : Tons différents pour rouge, jaune, vert
2. **Passage de tour** : Mélodie de confirmation
3. **Victoire** : Séquence musicale ascendante
4. **Collision** : Son de caisse claire
5. **Dérapage** : Effet de bruit filtré

### Architecture Audio
```
HTML5 Audio Element → Musique de fond (MP3)
     +
Web Audio API → Effets sonores procéduraux
     ↓
AudioContext → OscillatorNode → FilterNode → GainNode → Destination
```

## 🐛 Résolution de Problèmes

### La musique ne fonctionne pas
- **Cause** : AudioContext suspendu par le navigateur (politique de sécurité)
- **Solution** : Cliquer sur "Démarrer la Course" pour activer l'audio

### Pas de son au démarrage
- **Cause** : Les navigateurs bloquent l'audio automatique
- **Solution** : Interagir avec la page (clic ou touche) pour activer l'AudioContext

### Fichiers JavaScript non chargés
- **Cause** : Politique CORS du navigateur
- **Solution** : Utiliser un serveur HTTP local (pas file://)

### Performance dégradée avec la pluie
- **Cause** : Trop de particules pour le GPU
- **Solution** : Désactiver la pluie ou réduire le nombre de particules

### Problèmes de zoom caméra
- **Cause** : Conflits entre molette et clavier
- **Solution** : Utiliser soit la molette, soit les touches +/- exclusivement

## 📈 Évolutions Futures

### Fonctionnalités Prévues
- [ ] **Multijoueur local** : Course à plusieurs joueurs
- [ ] **Modes de jeu** : Contre-la-montre, élimination
- [ ] **Power-ups** : Boost, bouclier, ralentissement
- [ ] **Circuits multiples** : Sélection de pistes
- [ ] **Personnalisation** : Couleurs et modèles de karts
- [ ] **Système de replay** : Enregistrement et lecture des courses
- [ ] **Classements** : Sauvegarde des meilleurs temps

### Améliorations Techniques
- [ ] **Physique avancée** : Suspension, adhérence variable selon météo
- [ ] **IA améliorée** : Stratégies de course, overtaking intelligent
- [ ] **Audio spatial** : Son 3D positionnel pour les effets
- [ ] **Optimisation** : LOD, frustum culling, instancing
- [ ] **Mobile** : Contrôles tactiles et responsive design
- [ ] **Effets météo avancés** : Neige, brouillard, vent
- [ ] **Post-processing** : Bloom, motion blur, anti-aliasing

## 🤝 Contribution

Les contributions sont les bienvenues ! Pour contribuer :

1. **Fork** le projet
2. **Créer** une branche feature (`git checkout -b feature/AmazingFeature`)
3. **Commit** les changements (`git commit -m 'Add AmazingFeature'`)
4. **Push** vers la branche (`git push origin feature/AmazingFeature`)
5. **Ouvrir** une Pull Request

### Guide de Style
- Utiliser **ES6+** syntax
- **Commenter** le code complexe
- **Tester** sur différents navigateurs
- **Documenter** les nouvelles fonctionnalités

## 📜 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

```
MIT License

Copyright (c) 2025

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
```

## 🙏 Remerciements

- **Three.js** pour le moteur 3D exceptionnel
- **Web Audio API** pour les capacités audio avancées
- **Freesound.org** et contributeurs pour les ressources audio
- **MDN Web Docs** pour la documentation technique
- **Communauté open source** pour l'inspiration et les outils

## 📊 Statistiques du Projet

- **Lignes de code** : ~2000+ lignes JavaScript
- **Fichiers audio** : 8 pistes musicales
- **Effets 3D** : Ombres, éclairage, particules
- **Contrôles** : Clavier + souris
- **Compatibilité** : Navigateurs modernes (ES6+)

## 📞 Contact

Pour questions, suggestions ou support :
- **GitHub Issues** : Ouvrir un ticket sur le repository
- **Email** : [votre-email]
- **Discord** : [votre-discord]

---

**🎮 Bon jeu et bonne course ! 🏁**
