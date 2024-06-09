# Jeu Pierre, Papier, Ciseaux

## Description
Il s'agit d'un jeu multijoueur en temps réel "Pierre, Papier, Ciseaux" construit avec Node.js et Socket.IO pour le backend, et JavaScript, HTML et CSS pour le frontend. Le jeu permet à deux joueurs de rejoindre une salle, de jouer plusieurs manches et de voir les scores en direct. Le gagnant est célébré avec des feux d'artifice continus, tandis que le perdant voit une animation de pluie continue.

## Fonctionnalités
- Jeu en temps réel utilisant les WebSockets
- Rejoindre et quitter des salles de jeu
- Suivi des scores
- Feux d'artifice continus pour le gagnant
- Pluie continue pour le perdant
- Interface utilisateur simple et responsive

## Installation

1. Cloner le dépôt :
   ```bash
   git clone <repository_url>
   cd <repository_directory>

## Backend (script.js)

### Express et Socket.IO
- Configure un serveur Express et un serveur Socket.IO pour la communication en temps réel.

### Gestion des erreurs
- Capture les exceptions non interceptées et les rejets de promesses non gérés.

### Événements WebSocket
- **connection** : Gère les nouvelles connexions d'utilisateurs.
- **join** : Ajoute les utilisateurs à une salle et démarre le jeu si deux joueurs sont présents.
- **leave** : Supprime les utilisateurs d'une salle.
- **rps_choice** : Gère les choix des joueurs et détermine le résultat de la manche.
- **reset_game** : Réinitialise les scores et les manches du jeu.
- **message** : Gère les messages de chat en jeu.
- **disconnect** : Gère les déconnexions d'utilisateurs.

### Logique de jeu
- Gère l'état du jeu, les choix des joueurs, le suivi des scores et détermine le gagnant.

## Frontend (script.js)

### Connexion Socket
- Se connecte au serveur Socket.IO.

### Gestionnaires d'événements
- Gère les événements émis par le serveur pour mettre à jour l'interface utilisateur :
  - **connect**, **disconnect**
  - **rps_result**
  - **start_game**
  - **next_round**
  - **game_end**
  - **waiting**
  - **user disconnected**
  - **stop_game**

### Interactions Utilisateur
- Fonctions pour rejoindre/quitter une salle, faire des choix, et rejouer.

### Animations
- **launchFireworks** : Animation continue des feux d'artifice pour le gagnant.
- **startRain** : Animation continue de la pluie pour le perdant.

## HTML (index.html)

### Structure de l'interface du jeu
- **Header** : Affiche le titre du jeu et les scores des joueurs.
- **Join Room** : Formulaire pour rejoindre une salle de jeu.
- **Game** : Interface pour jouer au jeu.
- **Final Score** : Affiche les scores finaux et permet de rejouer.
- **Canvas** : Deux éléments canvas pour les animations de feux d'artifice et de pluie.

## CSS (style.css)

### Styles
- Mise en page et design général.
- Styles pour les boutons, zones de texte et éléments du jeu.
- Styles spécifiques pour les canvas de pluie et de feux d'artifice.

## Utilisation

1. Ouvrir `index.html` dans votre navigateur.
2. Entrer un nom de salle et votre pseudo.
3. Choisir le nombre de manches à gagner.
4. Cliquer sur "Join Room".
5. Jouer à "Pierre, Papier, Ciseaux" avec un autre joueur dans la même salle.
6. Voir les mises à jour en temps réel et les animations en fonction du résultat du jeu.