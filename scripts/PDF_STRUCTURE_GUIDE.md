# 📄 Guide : Structure du PDF "Coupe.pdf"

Pour adapter le parser automatique, j'ai besoin de connaître la structure de votre PDF.

## 🔍 Comment obtenir la structure ?

### Option 1 : Copier-coller un extrait
1. Ouvrez le PDF `Coupe.pdf`
2. Sélectionnez et copiez un extrait représentatif (ex: les 50-100 premières lignes)
3. Collez-le ici ou dans un fichier texte

### Option 2 : Utiliser un outil en ligne
1. Allez sur https://www.ilovepdf.com/pdf-to-txt
2. Uploadez `Coupe.pdf`
3. Téléchargez le fichier texte
4. Ouvrez-le et copiez un extrait

### Option 3 : Utiliser un outil système (macOS)
```bash
# Si vous avez pdftotext installé
pdftotext Coupe.pdf output.txt

# Ou avec Python
python3 -c "import PyPDF2; pdf = open('Coupe.pdf', 'rb'); reader = PyPDF2.PdfReader(pdf); print(''.join([page.extract_text() for page in reader.pages[:5]]))"
```

## 📋 Exemples de structures attendues

### Structure 1 : Hiérarchique avec préfixes
```
COIFFURE
  Coiffure Femme
    - Coupe femme (court/mi-long/long)
    - Brushing
    - Extensions microring
  Coiffure Homme
    - Coupe homme
    - Barbe

ONGLERIE
  Manucure
    - Manucure classique
    - French manucure
  Pédicure
    - Pédicure classique
```

### Structure 2 : Avec numérotation
```
1. COIFFURE
   a) Coiffure Femme
      - Coupe femme
      - Brushing
   b) Coiffure Homme
      - Coupe homme

2. ONGLERIE
   a) Manucure
      - Manucure classique
```

### Structure 3 : Tableau
```
| Catégorie | Sous-catégorie | Prestation |
|-----------|----------------|-----------|
| Coiffure  | Coiffure Femme | Coupe femme |
| Coiffure  | Coiffure Femme | Brushing |
```

## 🎯 Ce dont j'ai besoin

**Un extrait de 50-100 lignes** qui montre :
- Comment les **catégories** sont identifiées
- Comment les **sous-catégories** sont identifiées  
- Comment les **prestations** sont identifiées

Une fois que j'ai cet extrait, je pourrai adapter le parser automatiquement ! 🚀

