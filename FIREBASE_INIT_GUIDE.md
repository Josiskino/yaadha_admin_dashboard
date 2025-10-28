# Configuration Firebase pour Vue.js

## Instructions détaillées pour `firebase init`

### 1. Services à sélectionner

Lorsque Firebase CLI vous demande "Which Firebase features do you want to set up?", sélectionnez :

```
❯◯ Data Connect: Set up a Firebase Data Connect service
 ◯ Firestore: Configure security rules and indexes files for Firestore  ← ESPACE pour sélectionner
 ◯ Genkit: Setup a new Genkit project with Firebase
 ◯ Functions: Configure a Cloud Functions directory and its files
 ◯ App Hosting: Set up deployments for full-stack web apps
 ◯ Hosting: Set up deployments for static web apps  ← ESPACE pour sélectionner
```

**Sélectionnez uniquement :**
- ✅ **Firestore** (ESPACE puis ENTRÉE)
- ✅ **Hosting** (ESPACE puis ENTRÉE)

### 2. Configuration Firestore

```
? What do you want to use as your public directory? dist
? Configure as a single-page app (rewrite all urls to /index.html)? Yes
? Set up automatic builds and deploys with GitHub? No
? File firestore.rules already exists. Do you want to keep it? Yes
? File firestore.indexes.json already exists. Do you want to keep it? Yes
```

### 3. Configuration Hosting

```
? What do you want to use as your public directory? dist
? Configure as a single-page app (rewrite all urls to /index.html)? Yes
? Set up automatic builds and deploys with GitHub? No
```

### 4. Résultat attendu

Après la configuration, vous devriez avoir :

```
✔ Firebase initialization complete!
```

Et ces fichiers mis à jour :
- `.firebaserc` ✅
- `firebase.json` ✅
- `firestore.rules` ✅ (conservé)
- `firestore.indexes.json` ✅ (conservé)

### 5. Commandes utiles après configuration

```bash
# Déployer les règles Firestore
firebase deploy --only firestore:rules

# Déployer l'application (après build)
npm run build
firebase deploy --only hosting

# Déployer tout
firebase deploy
```

### 6. Vérification

```bash
# Vérifier la configuration
firebase projects:list

# Vérifier les services configurés
firebase use --add
```

## Configuration manuelle (alternative)

Si vous préférez configurer manuellement, les fichiers sont déjà créés :

- `.firebaserc` : Projet Firebase
- `firebase.json` : Configuration des services
- `firestore.rules` : Règles de sécurité
- `firestore.indexes.json` : Index Firestore
- `storage.rules` : Règles Storage

Vous pouvez ignorer `firebase init` et utiliser directement :

```bash
firebase deploy --only firestore:rules,storage
```
