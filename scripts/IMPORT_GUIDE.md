# 📄 Guide d'import depuis PDF

Ce script permet d'importer automatiquement des catégories, sous-catégories et prestations depuis un fichier PDF vers Firestore.

## 🚀 Utilisation

### 1. Préparer votre PDF

Votre PDF doit avoir une structure hiérarchique claire. Exemples de formats acceptés :

#### Format 1 : Avec préfixes
```
CATÉGORIE: Coiffure
  SOUS-CATÉGORIE: Coiffure Femme
    - Coupe femme (court/mi-long/long)
    - Brushing
    - Extensions microring
  SOUS-CATÉGORIE: Coiffure Homme
    - Coupe homme
    - Barbe

CATÉGORIE: Onglerie
  SOUS-CATÉGORIE: Manucure
    - Manucure classique
    - French manucure
```

#### Format 2 : Avec numérotation
```
1. Coiffure
  a) Coiffure Femme
    - Coupe femme
    - Brushing
  b) Coiffure Homme
    - Coupe homme

2. Onglerie
  a) Manucure
    - Manucure classique
```

#### Format 3 : Simple (sans préfixes)
```
Coiffure
  Coiffure Femme
    - Coupe femme
    - Brushing
  Coiffure Homme
    - Coupe homme

Onglerie
  Manucure
    - Manucure classique
```

### 2. Exécuter le script

```bash
# Depuis la racine du projet
node scripts/import-from-pdf.js chemin/vers/votre/fichier.pdf
```

**Exemple :**
```bash
node scripts/import-from-pdf.js ./data/categories.pdf
```

### 3. Le script va :

1. ✅ Lire le PDF
2. ✅ Extraire le texte
3. ✅ Parser les données (catégories → sous-catégories → prestations)
4. ✅ Afficher un aperçu des données parsées
5. ✅ Demander confirmation
6. ✅ Créer les documents dans Firestore dans l'ordre :
   - D'abord les **catégories**
   - Puis les **sous-catégories** (avec référence à la catégorie)
   - Enfin les **prestations** (avec références à catégorie et sous-catégorie)

## 🔧 Personnalisation

Si votre PDF a une structure différente, modifiez la fonction `parsePDFContent()` dans `scripts/import-from-pdf.js`.

### Exemple : Adapter pour un format spécifique

```javascript
// Si vos catégories commencent par "## "
if (line.startsWith('## ')) {
  const categoryName = line.replace('## ', '').trim()
  // ...
}

// Si vos prestations sont numérotées "1.", "2.", etc.
if (line.match(/^\d+\.\s+(.+)$/)) {
  const prestationName = line.replace(/^\d+\.\s+/, '').trim()
  // ...
}
```

## ⚠️ Important

- Le script **vérifie les doublons** avant d'importer
- Si une catégorie/sous-catégorie/prestation existe déjà (même nom), elle sera ignorée
- Les images ne sont **pas** importées (imageUrl sera vide)
- Vous devrez ajouter les images manuellement après l'import

## 🐛 Dépannage

### Erreur : "Cannot find module"
```bash
# Assurez-vous d'avoir installé les dépendances
pnpm install
```

### Erreur : "Firebase: Error (auth/unauthorized)"
```bash
# Vérifiez que vous êtes connecté à Firebase
# Le script utilise les credentials de .env.local
```

### Le parsing ne fonctionne pas
1. Vérifiez le format de votre PDF
2. Regardez l'aperçu du texte extrait
3. Modifiez `parsePDFContent()` selon votre structure

## 📊 Exemple de sortie

```
📄 Lecture du PDF: ./data/categories.pdf

📊 Contenu extrait (15234 caractères)

--- Aperçu du contenu ---
CATÉGORIE: Coiffure
  SOUS-CATÉGORIE: Coiffure Femme
    - Coupe femme (court/mi-long/long)
...

🔍 Parsing des données...

📋 Données parsées:
{
  "categories": [
    {
      "name": "Coiffure",
      "subcategories": [
        {
          "name": "Coiffure Femme",
          "prestations": [
            { "name": "Coupe femme (court/mi-long/long)" },
            ...
          ]
        }
      ]
    }
  ]
}

❓ Voulez-vous importer ces données dans Firestore ? (oui/non): oui

🚀 Début de l'import...

📁 Création des catégories...
  ✅ Catégorie créée: "Coiffure" (ID: abc123)
  ✅ Catégorie créée: "Onglerie" (ID: def456)

📂 Création des sous-catégories...
  ✅ Sous-catégorie créée: "Coiffure Femme" (ID: ghi789)
  ✅ Sous-catégorie créée: "Manucure" (ID: jkl012)

🎯 Création des prestations...
  ✅ Prestation créée: "Coupe femme (court/mi-long/long)"
  ✅ Prestation créée: "Brushing"
  ...

🎉 Import terminé !
   - Catégories: 2
   - Sous-catégories: 3
   - Prestations: 15
```

