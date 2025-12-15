# 📥 Guide d'import des données depuis le PDF "Coupe.pdf"

## ✅ Script créé

Un script d'import a été créé avec la structure complète des données extraites du PDF "Coupe.pdf".

## 🚀 Utilisation

### Option 1 : Import direct (recommandé)

Le script `import-from-text.js` contient déjà toute la structure des données codée en dur. Il suffit de l'exécuter :

```bash
pnpm run import:data
```

ou

```bash
node scripts/import-from-text.js
```

### Option 2 : Import depuis PDF (si pdf-parse fonctionne)

Si vous préférez parser directement le PDF :

```bash
pnpm run import:pdf ./Coupe.pdf
```

## 📋 Structure des données

Le script importe :

- **8 catégories** :
  1. Coiffure
  2. Onglerie
  3. Regard
  4. Visage
  5. Maquillage
  6. Épilation
  7. Cheveux & perruques
  8. Options premium

- **Sous-catégories** :
  - Coiffure : Coiffure femme, Coiffure homme, Coiffure enfant, Coiffure Afro
  - Onglerie : Manucure, Pédicure
  - Autres catégories : une sous-catégorie par défaut avec le nom de la catégorie

- **Prestations** : Toutes les prestations listées dans le PDF

## ⚙️ Configuration requise

1. **Variables d'environnement** : Le script utilise les variables Firebase de `.env.local`
2. **Firebase Admin** : Assurez-vous que votre projet Firebase est correctement configuré

## 🔄 Processus d'import

1. Le script génère les données structurées
2. Affiche un aperçu des données
3. Demande confirmation avant l'import
4. Crée les catégories dans Firestore
5. Crée les sous-catégories avec les bonnes références (`categoryId`)
6. Crée les prestations avec les bonnes références (`categoryId` et `subCategoryId`)
7. Vérifie les doublons (ne crée pas si existe déjà)

## 📝 Notes importantes

- **Pas de photos** : Les images seront ajoutées manuellement via l'interface d'administration
- **Doublons** : Le script vérifie les doublons et ne crée pas d'entrées existantes
- **Ordre** : Les catégories sont créées avec un ordre séquentiel (1, 2, 3, ...)

## 🎯 Résultat attendu

Après l'import, vous devriez avoir dans Firestore :

- **Collection `categories`** : 8 documents
- **Collection `subcategories`** : ~12 documents (avec `categoryId` correct)
- **Collection `prestations`** : ~100+ documents (avec `categoryId` et `subCategoryId` corrects)

## 🔍 Vérification

Après l'import, vérifiez dans la console Firebase ou dans votre interface d'administration que :

1. Toutes les catégories sont présentes
2. Les sous-catégories ont bien leur `categoryId`
3. Les prestations ont bien leur `categoryId` et `subCategoryId`

## 🛠️ Personnalisation

Si vous devez modifier les données, éditez le fichier `scripts/import-from-text.js` et modifiez la structure dans la fonction `parseTextContent()`.

