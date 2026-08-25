# 🛡️ Politique de Sécurité & Confidentialité (Security Policy)

## 🔒 Architecture 100% Client-Side (Zero-Server)

**MessToCal** est conçu selon le principe de **Confidentialité par Conception (Privacy by Design)** :
- **0 Serveur Tiers** : Aucune donnée, aucun message analysé, aucun mot de passe n'est envoyé à un serveur externe.
- **Chiffrement AES-GCM 256 bits** : Lorsque la protection par code PIN à 4 chiffres est activée, l'intégralité du contenu est chiffrée localement dans votre navigateur à l'aide de l'API native `crypto.subtle` (Web Crypto API) avec dérivation de clé PBKDF2 (100 000 itérations).
- **Stockage Local Sécurisé** : Le profil hôte est conservé exclusivement dans le `localStorage` de votre propre appareil.

---

## 🛑 Protection du Code & Règles de Contribution

1. **Aucune Modification Directe sur la Branche Principale (`main`)** :
   - Les contributions doivent obligatoirement faire l'objet d'une Pull Request (PR) et être validées par le propriétaire du dépôt (`@Bwillou1`).
2. **Intégrité Cryptographique** :
   - Le code de chiffrement situé dans `js/crypto-vault.js` ne doit pas être altéré sans audit de sécurité strict.
3. **Protection contre l'Injection** :
   - Tous les textes injectés dans le DOM sont systématiquement échappés ou assainis pour prévenir toute vulnérabilité de type Cross-Site Scripting (XSS).

---

## 📢 Signalement de Vulnérabilité

Si vous découvrez une faille de sécurité ou une vulnérabilité potentielle, merci de ne pas ouvrir de ticket public. Veuillez contacter directement le responsable du projet via GitHub ou en signalant une alerte de sécurité privée sur le dépôt.

---

*MessToCal © 2026 — William Guindon.*
