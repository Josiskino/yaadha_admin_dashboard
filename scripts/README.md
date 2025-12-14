# 📄 Script d'import depuis PDF

## 🚀 Utilisation rapide

```bash
# Méthode 1 : Avec npm script
pnpm run import:pdf ./chemin/vers/votre/fichier.pdf

# Méthode 2 : Directement avec node
node scripts/import-from-pdf.js ./chemin/vers/votre/fichier.pdf
```

## 📋 Structure du PDF attendue

Le script peut parser plusieurs formats. Voici les formats supportés :

### Format 1 : Avec préfixes explicites
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
  SOUS-CATÉGORIE: Pédicure
    - Pédicure classique
    - Pédicure avec vernis
```

### Format 2 : Avec numérotation
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

### Format 3 : Simple (sans préfixes)
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

## ⚙️ Personnalisation

Si votre PDF a une structure différente, modifiez la fonction `parsePDFContent()` dans `scripts/import-from-pdf.js`.

## ⚠️ Notes importantes

- ✅ Le script **vérifie les doublons** automatiquement
- ✅ Les images ne sont **pas** importées (vous devrez les ajouter manuellement)
- ✅ Le script demande **confirmation** avant d'importer
- ✅ Les données sont créées dans l'ordre : Catégories → Sous-catégories → Prestations

## 🔍 Dépannage

### Le parsing ne fonctionne pas bien

1. **Vérifiez l'aperçu** : Le script affiche les 500 premiers caractères du PDF
2. **Regardez la structure** : Comparez avec les formats supportés ci-dessus
3. **Modifiez le parser** : Éditez `parsePDFContent()` dans `import-from-pdf.js`

### Exemple de modification du parser

```javascript
// Si vos catégories commencent par "## "
if (line.startsWith('## ')) {
  const categoryName = line.replace('## ', '').trim()
  // ...
}
```

## 📊 Exemple de sortie

```
📄 Lecture du PDF: ./data/categories.pdf

📊 Contenu extrait (15234 caractères)

--- Aperçu du contenu ---
CATÉGORIE: Coiffure
  SOUS-CATÉGORIE: Coiffure Femme
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
            { "name": "Coupe femme (court/mi-long/long)" }
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

📂 Création des sous-catégories...
  ✅ Sous-catégorie créée: "Coiffure Femme" (ID: ghi789)

🎯 Création des prestations...
  ✅ Prestation créée: "Coupe femme (court/mi-long/long)"

🎉 Import terminé !
   - Catégories: 1
   - Sous-catégories: 1
   - Prestations: 1
```

