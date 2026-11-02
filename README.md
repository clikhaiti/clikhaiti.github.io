# ANDERSON THE BEST FRIEND

Application web (PWA) intelligente de rencontres et de relations humaines de qualité, avec un assistant personnel nommé **Anderson**.

100 % **HTML / CSS / JavaScript vanilla** — aucun backend, aucune base de données distante. Toutes les données sont stockées dans le navigateur via `localStorage` / `sessionStorage`.

---

## ⚠️ Avertissements importants (à lire)

- **Version de démonstration** : les comptes, messages, matchs, paiements, traductions et réponses d'« Anderson IA » sont **simulés localement**.
- **Non synchronisé** : les données ne quittent jamais ce navigateur et ne sont **pas partagées entre appareils**.
- **Non sécurisé** : les mots de passe sont stockés en clair dans `localStorage`. **Ne pas utiliser de vrai mot de passe.**
- **Pas prête pour un lancement commercial** : un vrai produit exige un backend sécurisé (authentification chiffrée, base de données, modération serveur, paiement réel, API IA/translation côté serveur).
- **Modération limitée** : bloquer/signaler ne fait qu'écrire dans le stockage local de ce navigateur.
- **Administration non sécurisée** : le compte « admin » côté client peut être contourné (démo uniquement).
- **Google / Apple** : les boutons d'authentification sont des démonstrations, sans service OAuth réel.

---

## Installation / lancement

Aucune installation de dépendances : c'est du statique.

```bash
# À la racine du dossier anderson-the-best-friend/
python -m http.server 8080
# puis ouvrir http://localhost:8080
```

ou n'importe quel serveur statique (Live Server, `npx serve`, hébergement GitHub Pages, etc.).

L'application est installable (PWA) : bouton « Installer » dans le navigateur, fonctionne hors ligne après la première visite grâce au service worker.

## Identifiants de démonstration

| Rôle  | Identifiant            | Mot de passe |
|-------|------------------------|--------------|
| Utilisateur | `demo@anderson.app` | `demo1234`  |
| Administrateur | `admin@anderson.app` | `admin1234` |

Il est aussi possible de créer un compte local via l'écran d'inscription.

---

## Fonctionnalités

- Écran de bienvenue, connexion, inscription (18+), mot de passe oublié (démo)
- Profil complet : photo (upload local → aperçu), infos, centres d'intérêt, préférences de recherche, confidentialité
- **Test de personnalité** : 12 questions, 4 tempéraments (mélancolique, sanguin, colérique, flegmatique), résultat sauvegardé
- **Moteur de compatibilité** : score réel calculé (tempérament, intérêts, objectifs, langues, ville, préférences)
- **Découverte** : cartes de profils, filtres (ville, âge, langue, relation, intérêt, compatibilité), Passer / J'aime / Favoris / Message
- **Matchs** : animation + overlay, sauvegarde locale
- **Messagerie locale** : conversations, envoi, emojis, statuts simulés, suppression, réponses simulées des profils démo
- **Traduction de démonstration** : créole haïtien, français, anglais, espagnol, portugais (dictionnaire limité, architecture prête pour une vraie API)
- **Anderson IA** : assistant à réponses de démo par règles JS (emplacement prévu pour une future API sécurisée — ne jamais y mettre de clé)
- **Premium** : avantages, comparaison, plans tarifaires d'exemple, souscription simulée
- **Notifications** : centre local avec compteur et « tout marquer lu »
- **Sécurité** : bloquer, signaler, masquer, supprimer favoris/conversations, réinitialisation des données
- **Tableau de bord admin** (compte admin uniquement) : statistiques, comptes, signalements, profils démo, paramètres
- **Mode sombre (vert/or) et mode clair**, sauvegardé
- Responsive : sidebar + grilles sur ordinateur, navigation inférieure fixe sur mobile, safe-areas

## Structure

```
anderson-the-best-friend/
├── index.html
├── manifest.json
├── service-worker.js
├── README.md
├── assets/
│   ├── css/ (themes.css, styles.css, responsive.css)
│   ├── js/  (storage, translation, auth, profile, personality,
│   │         matching, discovery, chat, anderson-ai,
│   │         notifications, premium, admin, app)
│   └── images/ (logo, couple, anderson-bot, profiles/)
```

## Réinitialisation des données de démo

- **Paramètres → Réinitialiser mes données de démo** (utilisateur courant)
- **Administration → Paramètres → Réinitialiser** (tout, y compris les comptes)
- Ou vider le stockage du site dans les outils développeur du navigateur.

## Sources des visuels

Tous les visuels (couple, portraits de profils, robot Anderson, logo) ont été **générés spécifiquement pour ce projet** (aucune image externe sous licence). Le logo et l'icône PWA sont en SVG.
