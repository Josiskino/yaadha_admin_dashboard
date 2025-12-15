# 🚀 Comment exécuter l'import des données

## 📝 Commande à exécuter

Dans le terminal, à la racine du projet, exécutez :

```bash
pnpm run import:data
```

ou directement :

```bash
node scripts/import-from-text.js
```

## ✅ Ce que le script va faire

### 1. Génération des données
Le script va générer toutes les données structurées depuis le PDF "Coupe.pdf" :
- ✅ **9 catégories** (Coiffure, Onglerie, Regard, Visage, Maquillage, Épilation, Beauté Corps, Cheveux & perruques, Options premium)
- ✅ **Sous-catégories** (Coiffure femme, Coiffure homme, Manucure, Pédicure, etc.)
- ✅ **Toutes les prestations** listées dans le PDF

### 2. Affichage d'aperçu
Le script affichera un aperçu JSON de toutes les données qui seront importées.

### 3. Demande de confirmation
Le script vous demandera : `❓ Voulez-vous importer ces données dans Firestore ? (oui/non):`

Tapez `oui` ou `o` pour confirmer.

### 4. Import dans Firestore
Le script va créer dans votre base de données Firestore :

#### Collection `categories`
- 9 documents avec les champs :
  - `name` : Nom de la catégorie
  - `description` : "" (vide pour l'instant)
  - `imageUrl` : "" (vide, à ajouter manuellement)
  - `order` : Numéro d'ordre (1, 2, 3, ...)
  - `createdAt` : Timestamp
  - `updatedAt` : Timestamp

#### Collection `subcategories`
- ~12 documents avec les champs :
  - `name` : Nom de la sous-catégorie
  - `description` : "" (vide)
  - `categoryId` : **ID de la catégorie parente** (relation correcte)
  - `imageUrl` : "" (vide, à ajouter manuellement)
  - `createdAt` : Timestamp
  - `updatedAt` : Timestamp

#### Collection `prestations`
- ~100+ documents avec les champs :
  - `name` : Nom de la prestation
  - `description` : "" (vide)
  - `categoryId` : **ID de la catégorie parente** (relation correcte)
  - `subCategoryId` : **ID de la sous-catégorie parente** (relation correcte)
  - `imageUrl` : "" (vide, à ajouter manuellement)
  - `createdAt` : Timestamp
  - `updatedAt` : Timestamp

## 🔗 Structure hiérarchique respectée

Oui, **la structure est exactement identique au PDF** :

```
Coiffure (catégorie)
  └── Coiffure femme (sous-catégorie)
      └── Coupe femme (court / mi-long / long) (prestation)
      └── Brushing (prestation)
      └── Lissage / brushing wavy (prestation)
      └── ... (toutes les prestations)
  └── Coiffure homme (sous-catégorie)
      └── Coupe homme (prestation)
      └── ... (toutes les prestations)
  └── Coiffure enfant (sous-catégorie)
  └── Coiffure Afro (sous-catégorie)

Onglerie (catégorie)
  └── Manucure (sous-catégorie)
      └── Manucure classique (prestation)
      └── ... (toutes les prestations)
  └── Pédicure (sous-catégorie)
      └── Pédicure classique (prestation)
      └── ... (toutes les prestations)

... (et ainsi de suite pour toutes les catégories)
```

## ⚠️ Important

1. **Vérification des doublons** : Le script vérifie si une catégorie/sous-catégorie/prestation existe déjà avant de la créer. Si elle existe, elle ne sera pas dupliquée.

2. **Images** : Les `imageUrl` seront vides. Vous devrez les ajouter manuellement via l'interface d'administration.

3. **Firebase configuré** : Assurez-vous que votre fichier `.env.local` contient les bonnes variables Firebase.

## 📊 Résultat attendu

Après l'exécution, vous devriez voir dans la console :

```
🎉 Import terminé !
   - Catégories: 9
   - Sous-catégories: ~12
   - Prestations: ~100+
```

Et dans Firestore, toutes les données seront créées avec les bonnes relations parent-enfant ! ✅

