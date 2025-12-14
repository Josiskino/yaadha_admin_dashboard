# 📸 Configuration Cloudinary pour Yaadha Admin Dashboard

## 🎯 Pourquoi Cloudinary ?

Cloudinary offre **25 GB de stockage gratuit** et remplace Firebase Storage (qui nécessite le plan Blaze payant).

## 📋 Étapes de configuration

### 1️⃣ Créer un compte Cloudinary

1. Allez sur https://cloudinary.com/users/register_free
2. Inscrivez-vous avec votre email
3. Vérifiez votre email et connectez-vous

### 2️⃣ Récupérer vos credentials

Dans le **Dashboard Cloudinary**, vous verrez :

```
Cloud Name: your-cloud-name
API Key: 123456789012345
API Secret: aBcDeFgHiJkLmNoPqRsTuVwXyZ (gardez-le secret !)
```

### 3️⃣ Créer un Upload Preset (IMPORTANT)

1. Allez dans **Settings** (⚙️ en haut à droite)
2. Cliquez sur **Upload** dans le menu de gauche
3. Scrollez jusqu'à **Upload presets**
4. Cliquez sur **Add upload preset**
5. Configurez :
   - **Preset name** : `yaadha_preset`
   - **Signing Mode** : `Unsigned` ⚠️ IMPORTANT
   - **Folder** : Laissez vide (géré par l'app)
   - **Use filename or externally defined Public ID** : Cochez cette option
   - **Unique filename** : Cochez cette option
6. Cliquez sur **Save**

> ⚠️ **IMPORTANT** : Le mode "Unsigned" permet d'uploader depuis le navigateur sans révéler votre API Secret.

### 4️⃣ Configurer l'application

Créez un fichier `.env.local` à la racine du projet :

```bash
# Cloudinary Configuration
VITE_CLOUDINARY_CLOUD_NAME=your-cloud-name
VITE_CLOUDINARY_UPLOAD_PRESET=yaadha_preset
```

Remplacez `your-cloud-name` par votre Cloud Name réel.

### 5️⃣ Redémarrer le serveur de développement

```bash
# Arrêter le serveur (Ctrl+C)
# Puis redémarrer
pnpm run dev
```

## 🔄 Comment ça fonctionne ?

### Flux d'upload

```
1. Admin sélectionne une image dans le formulaire
   ↓
2. Prévisualisation immédiate (base64)
   ↓
3. Upload automatique vers Cloudinary
   Cloudinary organise par dossier :
   - yaadha/categories/
   - yaadha/subcategories/
   - yaadha/prestations/
   ↓
4. Cloudinary retourne l'URL publique
   Exemple : https://res.cloudinary.com/your-cloud/image/upload/v123/yaadha/categories/image.jpg
   ↓
5. L'URL est sauvegardée dans Firestore
   {
     name: "Coiffure",
     imageUrl: "https://res.cloudinary.com/..."
   }
   ↓
6. L'app mobile récupère l'URL depuis Firestore et affiche l'image
```

### Structure de stockage

```
CLOUDINARY (hébergement images)
  yaadha/
    ├── categories/
    │   ├── 1702564254123_coiffure.jpg
    │   └── 1702564289456_onglerie.png
    ├── subcategories/
    │   ├── 1702564312789_coiffure_femme.jpg
    │   └── 1702564356123_manucure.png
    └── prestations/
        ├── 1702564389012_coupe_femme.jpg
        └── 1702564423789_brushing.png

FIRESTORE (métadonnées)
  categories/categoryId
    {
      name: "Coiffure",
      description: "Services de coiffure professionnels",
      imageUrl: "https://res.cloudinary.com/.../coiffure.jpg",
      order: 1
    }
```

## 📊 Quotas Cloudinary (plan gratuit)

- ✅ **25 GB** de stockage
- ✅ **25 GB** de bande passante/mois
- ✅ **25,000** transformations/mois
- ✅ Optimisation automatique
- ✅ CDN mondial

## 🔒 Sécurité

- ✅ Upload depuis le navigateur sécurisé (unsigned upload)
- ✅ Pas besoin d'exposer l'API Secret
- ✅ Les images sont accessibles publiquement (nécessaire pour l'app mobile)
- ✅ Seuls les utilisateurs authentifiés peuvent uploader (vérifié par Firestore)

## 🚀 Fonctionnalités bonus Cloudinary

### Optimisation automatique
```javascript
// URL originale
https://res.cloudinary.com/demo/image/upload/v1234/sample.jpg

// URL optimisée (automatique dans l'app)
https://res.cloudinary.com/demo/image/upload/w_300,h_300,q_auto,f_auto/v1234/sample.jpg
```

Cloudinary :
- Redimensionne automatiquement
- Compresse intelligemment
- Convertit au meilleur format (WebP pour Chrome, JPEG pour Safari)
- Sert via CDN mondial

## ❓ FAQ

### Q : Que se passe-t-il si je dépasse les 25 GB ?
R : Cloudinary vous enverra un email. Vous pouvez upgrader ou nettoyer les anciennes images.

### Q : Les images sont-elles supprimées de Cloudinary quand je supprime une catégorie ?
R : Non, pour l'instant elles restent. La suppression nécessite une signature backend (Cloud Function). On peut l'implémenter plus tard si nécessaire.

### Q : Puis-je migrer vers Firebase Storage plus tard ?
R : Oui ! Il suffit de changer `useCloudinary()` par `useFirebaseStorage()` dans les formulaires.

## 🎉 C'est tout !

Une fois configuré, l'upload d'images fonctionnera automatiquement pour :
- ✅ Catégories
- ✅ Sous-catégories
- ✅ Prestations

