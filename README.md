# 🎮 GTA 3D Open World

> GTA-style 3D open-world game running in the browser — Built with React Three Fiber, Three.js, and Cannon physics.

![Three.js](https://img.shields.io/badge/Three.js-0.170-black?logo=three.js)
![React](https://img.shields.io/badge/React-18.3-61dafb?logo=react)
![Vite](https://img.shields.io/badge/Vite-5.4-646cff?logo=vite)

## 🚀 Installation & Lancement

```bash
npm install
npm run dev
```

Ouvrir http://localhost:8011 dans votre navigateur.

## 🎮 Contrôles

| Touche | Action |
|---|---|
| `WASD` / Flèches | Déplacer le personnage |
| `Shift` | Sprinter |
| `Espace` | Sauter |
| Clic + glisser souris | Orienter la caméra |

## 🏗️ Architecture

```
src/
├── App.jsx                    # Composant principal (Canvas 3D)
├── main.jsx                   # Bootstrap React
├── components/
│   ├── Player.jsx             # Contrôleur 3ème personne (cannon physics)
│   ├── City.jsx               # Ville procédurale (bâtiments, routes, trottoirs, lampadaires)
│   ├── Vehicles.jsx           # 20 véhicules NPC autonomes
│   ├── DayNightCycle.jsx      # Cycle jour/nuit avec ombres dynamiques
│   ├── PostProcessing.jsx     # Bloom, DOF, ChromaticAberration, Vignette
│   └── UI.jsx                 # Mini-map, barre de vie, FPS, contrôles
├── shaders/
│   └── wetGround.js           # Shaders GLSL personnalisés (reflets eau/pluie)
└── hooks/
    ├── useGameStore.js         # Store Zustand (état global)
    └── useKeyboardControls.js  # Contrôles clavier
```

## ✨ Fonctionnalités

- 🏙️ **Ville procédurale** — 50+ bâtiments, routes en grille, trottoirs, lampadaires
- 🚗 **20 véhicules NPC** — IA autonome sur le réseau routier
- 🌅 **Cycle jour/nuit** — DirectionalLight dynamique avec ombres PCFSoftShadowMap (2048x2048)
- 🎨 **Post-processing** — Bloom, Depth of Field, Chromatic Aberration, Vignette, Tone Mapping ACES
- 💧 **Shaders GLSL** — Sol mouillé avec reflets, flaques d'eau, ondulations (simplex noise)
- 🏃 **Physique réaliste** — @react-three/cannon avec gravité, friction, saut
- 🎥 **Caméra 3ème personne** — Suivi fluide avec damping
- 🗺️ **Mini-map dynamique** — Rotation joueur, positions NPCs, boussole
- ❤️ **Barre de vie** — Gradient coloré selon la santé
- 📊 **Compteur FPS** — Temps réel avec couleur adaptative

## 🛠️ Stack Technique

| Technologie | Usage |
|---|---|
| React 18 | UI framework |
| Three.js | Moteur 3D |
| @react-three/fiber | Bindings React pour Three.js |
| @react-three/cannon | Moteur physique |
| @react-three/postprocessing | Effets post-processing |
| Zustand | State management |
| Vite | Build tool & dev server |
