# 🔐 Configuration Firebase Admin SDK

Pour que le script d'import fonctionne, vous devez configurer Firebase Admin SDK avec une clé de service account.

## 📋 Étapes de configuration

### Option 1 : Fichier JSON (Recommandé)

1. **Générez une clé de service account** :
   - Allez dans [Firebase Console](https://console.firebase.google.com/)
   - Sélectionnez votre projet
   - Cliquez sur ⚙️ **Project settings**
   - Allez dans l'onglet **Service accounts**
   - Cliquez sur **Generate new private key**
   - Téléchargez le fichier JSON

2. **Placez le fichier à la racine du projet** :
   - Renommez le fichier téléchargé en `firebase-service-account.json`
   - Placez-le à la racine du projet (même niveau que `package.json`)

3. **Ajoutez le fichier au .gitignore** (important pour la sécurité) :
   ```bash
   echo "firebase-service-account.json" >> .gitignore
   ```

### Option 2 : Variable d'environnement

1. **Générez la clé de service account** (comme dans l'option 1)

2. **Ajoutez-la dans `.env.local`** :
   ```bash
   # Ouvrez le fichier JSON téléchargé et copiez tout son contenu
   # Puis ajoutez dans .env.local :
   FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"yaadha-dev",...}'
   ```
   
   ⚠️ **Important** : Le contenu JSON doit être sur une seule ligne et échappé correctement.

## ✅ Vérification

Après configuration, exécutez :

```bash
pnpm run import:data
```

Le script devrait maintenant pouvoir écrire dans Firestore sans erreur de permissions.

## 🔒 Sécurité

- ⚠️ **NE COMMITTEZ JAMAIS** le fichier `firebase-service-account.json` ou la clé dans `.env.local` dans Git
- ✅ Assurez-vous que `firebase-service-account.json` est dans `.gitignore`
- ✅ La clé de service account donne un accès complet à votre base de données, gardez-la secrète

