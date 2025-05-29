# 🏎️ Karting 3D avec Musique Procédurale

Un jeu de karting 3D développé en JavaScript avec Three.js, featuring un système de musique générée aléatoirement en temps réel.

![Version](https://img.shields.io/badge/version-2.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![JavaScript](https://img.shields.io/badge/javascript-ES6-yellow.svg)

## 🎮 Aperçu

Ce projet présente un jeu de karting 3D complet avec :
- **Circuit procédural** de 1500 points avec largeur variable
- **Physique réaliste** avec collisions et rebonds
- **IA compétitive** pour 3 adversaires
- **Système de musique procédurale** utilisant Web Audio API
- **Effets sonores dynamiques** (départ, collision, victoire)

## 🚀 Fonctionnalités

### 🏁 Gameplay
- **Course de 3 tours** avec système de classement en temps réel
- **Contrôles fluides** : Flèches directionnelles ou WASD
- **Caméra dynamique** suivant le kart du joueur
- **Feux de circulation** avec séquence de départ authentique
- **Interface utilisateur** avec vitesse, position et progression

### 🎵 Système Audio
- **Musique procédurale** : Génération automatique de mélodies, basses et percussions
- **4 gammes musicales** : Majeure, mineure, pentatonique, dorienne
- **Effets sonores** : Départ, passage de tour, collisions, victoire
- **Contrôles audio** : Activation/désactivation et réglage du volume
- **Enveloppes ADSR** pour des sons naturels

### 🎨 Graphismes 3D
- **Rendu Three.js** avec ombres et éclairage
- **Circuit élargi** 30x plus grand que la version initiale
- **Barrières de sécurité** avec détection de collision
- **Terrain procédural** adaptatif
- **Effets visuels** : Brouillard, ombres portées

## 📁 Structure du Projet

```
kart/
├── README.md
├── v1/
│   └── index.html              # Version originale simple
└── v2/
    ├── index.html              # Version complète avec musique
    └── musicGenerator.js       # Système de musique procédurale
```

## 🛠️ Installation et Lancement

### Prérequis
- Navigateur web moderne (Chrome, Firefox, Safari, Edge)
- Python 3.x (pour le serveur local) ou autre serveur HTTP

### Méthode 1 : Serveur Python
```bash
# Naviguer vers le dossier v2
cd c:\Users\pleym\Projects\kart\v2

# Démarrer le serveur HTTP local
python -m http.server 8000

# Ouvrir dans le navigateur
# http://localhost:8000
```

### Méthode 2 : Extension VS Code
1. Installer l'extension "Live Server"
2. Clic droit sur `v2/index.html`
3. Sélectionner "Open with Live Server"

### Méthode 3 : Autres serveurs
```bash
# Node.js
npx serve v2

# PHP
cd v2 && php -S localhost:8000
```

## 🎮 Contrôles

| Touche | Action |
|--------|--------|
| ↑ / W | Accélérer |
| ↓ / S | Freiner / Reculer |
| ← / A | Tourner à gauche |
| → / D | Tourner à droite |

### Contrôles Audio
- **🔇 Désactiver Musique** : Active/désactive le système musical (activé par défaut)
- **🔉 Volume -** : Diminue le volume général
- **🔊 Volume +** : Augmente le volume général

## ⚙️ Architecture Technique

### Technologies Utilisées
- **Three.js r128** : Moteur 3D
- **Web Audio API** : Génération et traitement audio
- **JavaScript ES6** : Logique de jeu moderne
- **HTML5 Canvas** : Rendu graphique
- **CSS3** : Interface utilisateur

### Composants Principaux

#### 🏎️ Classe Kart
```javascript
class Kart {
    constructor(color, isPlayer = false)
    handlePlayerInput()     // Gestion des contrôles
    handleAI()             // Intelligence artificielle
    applyPhysics()         // Physique et collisions
    checkLapProgress()     // Détection des tours
}
```

#### 🎵 Classe MusicGenerator
```javascript
class MusicGenerator {
    generateMelody()       // Création de mélodies
    generateBass()         // Lignes de basse
    generateDrums()        // Patterns rythmiques
    playEffect(type)       // Effets sonores
    startRaceMusic()       // Musique de course
}
```

#### 🏁 Fonctions Principales
- `createTrack()` : Génération procédurale du circuit
- `createBarriers()` : Placement des barrières de sécurité
- `startRaceSequence()` : Séquence de départ avec feux
- `checkBarrierCollisions()` : Système de collision réaliste

## 🎨 Personnalisation

### Modification du Circuit
```javascript
// Dans createTrack()
const numPoints = 1500;           // Nombre de points du circuit
const baseRadius = 150;           // Rayon de base
const baseWidth = 12;             // Largeur de piste de base
```

### Configuration Audio
```javascript
// Dans MusicGenerator constructor
this.tempo = 130;                 // BPM de la musique
this.masterVolume = 0.3;          // Volume général
this.currentScale = this.scales.dorian;  // Gamme musicale
```

### Paramètres de Jeu
```javascript
// Dans Kart constructor
this.maxSpeed = isPlayer ? 0.8 : 0.6;     // Vitesse maximale
this.acceleration = 0.02;                  // Accélération
this.turnSpeed = 0.05;                     // Vitesse de rotation
```

## 🎵 Système Musical Détaillé

### Gammes Disponibles
- **Majeure** : Do-Ré-Mi-Fa-Sol-La-Si
- **Mineure** : Do-Ré-Mib-Fa-Sol-Lab-Sib
- **Pentatonique** : Do-Ré-Mi-Sol-La
- **Dorienne** : Do-Ré-Mib-Fa-Sol-La-Sib

### Génération Procédurale
1. **Mélodie** : Mouvement mélodique naturel avec sauts contrôlés
2. **Basse** : Progression d'accords sur les notes fondamentales
3. **Percussions** : Grosse caisse, caisse claire, charleston
4. **Effets** : Sons contextuel selon les événements de jeu

### Architecture Audio
```
AudioContext → OscillatorNode → FilterNode → GainNode → Destination
```

## 🐛 Résolution de Problèmes

### La musique ne fonctionne pas
- **Cause** : AudioContext suspendu par le navigateur (politique de sécurité)
- **Solution** : La musique s'active automatiquement après la première interaction (clic ou touche)

### Pas de son au démarrage
- **Cause** : Les navigateurs bloquent l'audio automatique
- **Solution** : Cliquer n'importe où ou appuyer sur une touche pour activer l'AudioContext

### Fichiers JavaScript non chargés
- **Cause** : Politique CORS du navigateur
- **Solution** : Utiliser un serveur HTTP local (pas file://)

### Performance dégradée
- **Cause** : Trop d'oscillateurs audio simultanés
- **Solution** : Réduire le volume ou désactiver la musique

### Collisions imprécises
- **Cause** : Physique trop simplifiée
- **Solution** : Ajuster `kartRadius` dans `checkBarrierCollisions()`

## 📈 Évolutions Futures

### Fonctionnalités Prévues
- [ ] **Multijoueur local** : Course à plusieurs joueurs
- [ ] **Modes de jeu** : Contre-la-montre, élimination
- [ ] **Power-ups** : Boost, bouclier, ralentissement
- [ ] **Circuits multiples** : Sélection de pistes
- [ ] **Personnalisation** : Couleurs et modèles de karts

### Améliorations Techniques
- [ ] **Physique avancée** : Suspension, adhérence variable
- [ ] **IA améliorée** : Stratégies de course, overtaking
- [ ] **Audio spatial** : Son 3D positionnel
- [ ] **Optimisation** : LOD, frustum culling
- [ ] **Mobile** : Contrôles tactiles

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

- **Three.js** pour le moteur 3D
- **Web Audio API** pour les capacités audio
- **MDN Web Docs** pour la documentation technique
- **Communauté open source** pour l'inspiration

## 📞 Contact

Pour questions, suggestions ou support :
- **GitHub Issues** : Ouvrir un ticket sur le repository
- **Email** : [votre-email]
- **Discord** : [votre-discord]

---

**🎮 Bon jeu et bonne course ! 🏁**
