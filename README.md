# 📅 MessToCal — Convertisseur Intelligent de Messages & Événements vers Calendrier

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![Material Design 3](https://img.shields.io/badge/Design-Material%203-0b57d0.svg)](https://m3.material.io/)
[![PWA Ready](https://img.shields.io/badge/PWA-Ready-10b981.svg)](./manifest.json)
[![Security: Zero Server](https://img.shields.io/badge/Security-100%25%20Client--Side-purple.svg)](./SECURITY.md)

> **MessToCal** transforme instantanément vos messages Messenger, publications Facebook et textos SMS désordonnés en événements de calendrier prêts pour **Google Calendar, Apple (.ICS), Microsoft Outlook et Yahoo**, avec affiches d'invitation Glassmorphic, enveloppe 3D interactive et chiffrement par code PIN local !

---

## ✨ Fonctionnalités Majeures

### 🧠 Analyse Intelligente & Détection en Direct
- **Analyse Automatique** : Détection des titres, dates relatives (*"samedi prochain", "le 18 juillet"*), heures (*"12h30", "dès 18h"*), lieux, hôtes et consignes.
- **🎯 Badges Dynamiques en Direct** : 6 voyants lumineux qui passent du gris au vert au fur et à mesure de votre saisie ou dictée vocale.
- **🎙️ Dictée Vocale & Lecteur Audio Intégré** : Écoutez une note vocale importée tout en dictant en continu sans doublons.
- **📸 Reconnaissance OCR par Capture d'Écran** : Déposez une capture d'écran d'une discussion Messenger ou SMS pour extraire automatiquement le texte grâce à Tesseract.js en local.

### 💌 Expérience Invité & Déballage 3D
- **💌 Enveloppe 3D Interactive avec Sceau Doré** : Vos invités découvrent une animation d'ouverture 3D avec lancer de confettis et carte personnalisée qui glisse vers le haut.
- **✨ Créateur d'Affiches PNG Glassmorphic HD** : Choisissez parmi 5 modèles festifs ou importez votre propre photo avec curseur d'opacité du verre et teintes lumineuses.
- **🎁 Intégration GiftList / Liste de Souhaits** : Détecte vos listes de cadeaux et génère un QR code dédié ainsi qu'un badge sur l'affiche PNG.

### 🔒 Sécurité & Confidentialité Absolue (Zero-Server)
- **0 Serveur Tiers** : L'ensemble des calculs, du parsing et de la génération s'exécute **100% dans le navigateur de l'utilisateur**.
- **Chiffrement AES-GCM 256 bits avec Code PIN 4 chiffres** : Protégez vos invitations sensibles avec un mot de passe à 4 chiffres déchiffré uniquement côté client.
- **👤 Profil Hôte Local** : Enregistrez vos coordonnées par défaut dans votre navigateur (`localStorage`) pour pré-remplir vos événements en 1 clic.

### 👓 Mode Simple (Senior & Personnes Âgées)
- Basculez en un clic sur une interface grand format épurée avec très gros boutons pour une accessibilité totale et zéro surcharge visuelle.

---

## 🛠️ Stack Technique

- **Architecture** : Pure Vanilla HTML5 / CSS3 / Modern JavaScript (ES6+ Modules)
- **Design System** : Google Material Design 3 (M3) + Glassmorphism & Mesh Gradients
- **Chiffrement** : Web Crypto API (SubtleCrypto `AES-GCM` + `PBKDF2`)
- **Offline & PWA** : Service Worker (`sw.js`) + Web App Manifest
- **Librairies Locales** : `qrcode.min.js`, `canvas-confetti`, `tesseract.js`

---

## 🚀 Installation & Déploiement

### Déploiement en 1 clic sur GitHub Pages :
1. Allez dans les **Settings** de votre dépôt GitHub.
2. Cliquez sur l'onglet **Pages** (dans le menu de gauche).
3. Sous **Branch**, sélectionnez `main` et le dossier `/(root)`, puis cliquez sur **Save**.
4. Votre application est immédiatement accessible en ligne avec HTTPS et support PWA complet !

---

## 📄 Licence & Droits

Ce projet est sous licence [MIT](./LICENSE) — Créé avec passion par **William Guindon** © 2026.
Toute contribution doit respecter les directives de sécurité [SECURITY.md](./SECURITY.md).
