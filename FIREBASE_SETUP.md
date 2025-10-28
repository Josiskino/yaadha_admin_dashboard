# Firebase Setup

## Installation ✅

Firebase a été installé avec succès dans le projet !

## Configuration ✅

### 1. Projet Firebase configuré

Le projet Firebase **yaadha-dev** est déjà configuré avec :
- **Project ID**: yaadha-dev
- **Auth Domain**: yaadha-dev.firebaseapp.com
- **Storage Bucket**: yaadha-dev.firebasestorage.app
- **Analytics**: Activé

### 2. Services disponibles

Les services suivants sont initialisés :
- ✅ **Authentication** : Gestion des utilisateurs
- ✅ **Firestore Database** : Base de données
- ✅ **Storage** : Stockage de fichiers
- ✅ **Analytics** : Analytics et métriques

### 3. Configuration automatique

Les clés Firebase sont directement intégrées dans le code (configuration de développement). Pour la production, utilisez des variables d'environnement.

### 4. Utilisation dans le projet

Le fichier de configuration Firebase est disponible dans :
- **Fichier**: `src/config/firebase.js`
- **Services disponibles**:
  - `auth`: Pour l'authentification
  - `db`: Pour Firestore
  - `storage`: Pour le stockage

**Exemple d'utilisation**:

```javascript
import { auth, db, storage } from '@/config/firebase'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { collection, getDocs } from 'firebase/firestore'

// Authentification
const user = await signInWithEmailAndPassword(auth, email, password)

// Firestore
const querySnapshot = await getDocs(collection(db, 'users'))
```

## Versions installées

- **Firebase**: v12.4.0
- **Firebase CLI**: v14.22.0
- **Services**: Auth, Firestore, Storage, Analytics

## Utilisation dans le projet

### 1. Authentication avec `useAuth()`

```vue
<script setup>
import { useAuth } from '@/composables/useAuth'

const { signIn, signUp, signOut, user, isAuthenticated, loading } = useAuth()

const handleLogin = async () => {
  await signIn(email.value, password.value)
}
</script>

<template>
  <div v-if="user">
    <p>Bienvenue {{ user.displayName }} ({{ user.email }})</p>
    <VBtn @click="signOut()">Déconnexion</VBtn>
  </div>
</template>
```

### 2. Firestore avec `useFirebase()`

```vue
<script setup>
import { useFirebase } from '@/composables/useFirebase'

const { addDocument, getDocuments, updateDocument } = useFirebase()

// Ajouter un document
const addUser = async () => {
  await addDocument('users', {
    name: 'John Doe',
    email: 'john@example.com'
  })
}

// Récupérer des documents
const users = ref([])
const fetchUsers = async () => {
  users.value = await getDocuments('users')
}
</script>
```

### 3. Direct access aux services

```javascript
import { auth, db, storage, analytics } from '@/config/firebase'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { collection, getDocs } from 'firebase/firestore'
import { logEvent } from 'firebase/analytics'
```

## Fichiers créés

- ✅ `src/config/firebase.js` - Configuration Firebase
- ✅ `src/plugins/firebase/index.js` - Plugin Firebase pour Vue
- ✅ `src/composables/useFirebase.js` - Composable pour Firestore et Auth
- ✅ `src/composables/useAuth.js` - Composable spécialisé pour l'authentification
- ✅ `src/pages/app/auth/LoginExample.vue` - Exemple de page de connexion
- ✅ `.firebaserc` - Configuration du projet Firebase
- ✅ `firebase.json` - Configuration des services Firebase
- ✅ `firestore.rules` - Règles de sécurité Firestore
- ✅ `firestore.indexes.json` - Index Firestore
- ✅ `storage.rules` - Règles de sécurité Storage

## Exemple de page

Une page d'exemple est disponible dans :
- **Route**: `/app/auth/login-example`
- **Fichier**: `src/pages/app/auth/LoginExample.vue`

## Firebase CLI

### Commandes utiles

```bash
# Connexion à Firebase (nécessaire pour les déploiements)
firebase login

# Déployer les règles Firestore
firebase deploy --only firestore:rules

# Déployer les règles Storage
firebase deploy --only storage

# Déployer l'application (après build)
npm run build
firebase deploy --only hosting

# Déployer tout
firebase deploy

# Voir les logs
firebase functions:log
```

### Configuration CLI

Le projet est configuré avec :
- **Projet**: yaadha-dev (dans `.firebaserc`)
- **Hosting**: Dossier `dist` (après build)
- **Firestore**: Règles de sécurité configurées
- **Storage**: Règles de sécurité configurées

## Configuration requise

✅ **Configuration terminée** - Le projet Firebase **yaadha-dev** est configuré et prêt à l'emploi.

Pour la production, créez un fichier `.env.local` avec vos clés Firebase.

## Documentation

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firebase Authentication](https://firebase.google.com/docs/auth)
- [Firebase Firestore](https://firebase.google.com/docs/firestore)
- [Firebase Storage](https://firebase.google.com/docs/storage)
