# 📱 Guide de récupération des données pour l'application mobile

## ✅ Structure actuelle des données

Vos données sont organisées de manière optimale pour le mobile :

```
categories (Collection)
  └── categoryId (Document)
      ├── name: string
      ├── description: string
      ├── imageUrl: string
      ├── order: number
      └── createdAt, updatedAt: timestamp

subcategories (Collection)
  └── subCategoryId (Document)
      ├── name: string
      ├── description: string
      ├── categoryId: string (FK → categories)
      ├── imageUrl: string
      └── createdAt, updatedAt: timestamp

prestations (Collection)
  └── prestationId (Document)
      ├── name: string
      ├── description: string
      ├── categoryId: string (FK → categories)
      ├── subCategoryId: string (FK → subcategories)
      ├── imageUrl: string
      └── createdAt, updatedAt: timestamp
```

## 🚀 Stratégies de récupération pour mobile

### 1. **Page d'accueil : Charger uniquement les catégories**

```javascript
// Flutter (Firebase)
import 'package:cloud_firestore/cloud_firestore.dart';

Future<List<Category>> fetchCategories() async {
  final snapshot = await FirebaseFirestore.instance
    .collection('categories')
    .orderBy('order')
    .get();
  
  return snapshot.docs.map((doc) => Category.fromFirestore(doc)).toList();
}

// React Native (Firebase)
import firestore from '@react-native-firebase/firestore';

const fetchCategories = async () => {
  const snapshot = await firestore()
    .collection('categories')
    .orderBy('order')
    .get();
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};
```

**Avantages :**
- ✅ Chargement rapide (seulement les catégories)
- ✅ Peu de données transférées
- ✅ Parfait pour l'affichage initial

### 2. **Page de détail catégorie : Charger sous-catégories + prestations**

```javascript
// Flutter
Future<CategoryDetails> fetchCategoryDetails(String categoryId) async {
  // Charger les sous-catégories
  final subCategoriesSnapshot = await FirebaseFirestore.instance
    .collection('subcategories')
    .where('categoryId', isEqualTo: categoryId)
    .get();
  
  // Charger les prestations
  final prestationsSnapshot = await FirebaseFirestore.instance
    .collection('prestations')
    .where('categoryId', isEqualTo: categoryId)
    .get();
  
  return CategoryDetails(
    subCategories: subCategoriesSnapshot.docs.map(...),
    prestations: prestationsSnapshot.docs.map(...),
  );
}

// React Native
const fetchCategoryDetails = async (categoryId) => {
  const [subCategories, prestations] = await Promise.all([
    firestore()
      .collection('subcategories')
      .where('categoryId', '==', categoryId)
      .get(),
    firestore()
      .collection('prestations')
      .where('categoryId', '==', categoryId)
      .get(),
  ]);
  
  return {
    subCategories: subCategories.docs.map(doc => ({ id: doc.id, ...doc.data() })),
    prestations: prestations.docs.map(doc => ({ id: doc.id, ...doc.data() })),
  };
};
```

**Avantages :**
- ✅ Chargement à la demande (lazy loading)
- ✅ Données filtrées par catégorie
- ✅ Requêtes parallèles pour performance

### 3. **Page de détail sous-catégorie : Charger prestations filtrées**

```javascript
// Flutter
Future<List<Prestation>> fetchPrestationsBySubCategory(
  String categoryId,
  String subCategoryId
) async {
  final snapshot = await FirebaseFirestore.instance
    .collection('prestations')
    .where('categoryId', isEqualTo: categoryId)
    .where('subCategoryId', isEqualTo: subCategoryId)
    .get();
  
  return snapshot.docs.map((doc) => Prestation.fromFirestore(doc)).toList();
}

// React Native
const fetchPrestationsBySubCategory = async (categoryId, subCategoryId) => {
  const snapshot = await firestore()
    .collection('prestations')
    .where('categoryId', '==', categoryId)
    .where('subCategoryId', '==', subCategoryId)
    .get();
  
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};
```

### 4. **Option : Chargement complet en une fois (pour cache offline)**

Si vous voulez mettre en cache toutes les données pour un mode offline :

```javascript
// Flutter
Future<CompleteData> fetchAllData() async {
  final [categories, subCategories, prestations] = await Future.wait([
    FirebaseFirestore.instance.collection('categories').orderBy('order').get(),
    FirebaseFirestore.instance.collection('subcategories').get(),
    FirebaseFirestore.instance.collection('prestations').get(),
  ]);
  
  // Reconstruire la hiérarchie côté client
  return CompleteData(
    categories: categories.docs.map(...),
    subCategories: subCategories.docs.map(...),
    prestations: prestations.docs.map(...),
  );
}
```

## 📊 Optimisations recommandées

### 1. **Index Firestore**

Créez ces index dans Firebase Console pour améliorer les performances :

```javascript
// Collection: subcategories
- categoryId (Ascending)

// Collection: prestations
- categoryId (Ascending)
- subCategoryId (Ascending)
- categoryId (Ascending) + subCategoryId (Ascending) [Composite]
```

### 2. **Pagination pour grandes listes**

```javascript
// Flutter
Future<List<Prestation>> fetchPrestationsPaginated({
  String? categoryId,
  String? subCategoryId,
  int limit = 20,
  DocumentSnapshot? lastDocument,
}) async {
  Query query = FirebaseFirestore.instance.collection('prestations');
  
  if (categoryId != null) {
    query = query.where('categoryId', isEqualTo: categoryId);
  }
  if (subCategoryId != null) {
    query = query.where('subCategoryId', isEqualTo: subCategoryId);
  }
  
  if (lastDocument != null) {
    query = query.startAfterDocument(lastDocument);
  }
  
  final snapshot = await query.limit(limit).get();
  return snapshot.docs.map((doc) => Prestation.fromFirestore(doc)).toList();
}
```

### 3. **Cache local (Recommandé)**

Utilisez un cache local pour éviter les requêtes répétées :

```javascript
// Flutter - Utiliser Hive ou SharedPreferences
// React Native - Utiliser AsyncStorage ou MMKV

// Exemple avec cache simple
class DataCache {
  static Map<String, dynamic> _cache = {};
  static DateTime? _lastFetch;
  
  static Future<List<Category>> getCategories({bool forceRefresh = false}) async {
    // Vérifier le cache (valide 1 heure)
    if (!forceRefresh && _cache['categories'] != null && 
        _lastFetch != null && 
        DateTime.now().difference(_lastFetch!) < Duration(hours: 1)) {
      return _cache['categories'];
    }
    
    // Charger depuis Firestore
    final categories = await fetchCategories();
    _cache['categories'] = categories;
    _lastFetch = DateTime.now();
    
    return categories;
  }
}
```

## 🔒 Règles de sécurité Firestore

Assurez-vous que vos règles Firestore permettent la lecture publique (pour l'app mobile) :

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Catégories - Lecture publique
    match /categories/{categoryId} {
      allow read: if true; // Public pour l'app mobile
      allow write: if request.auth != null; // Écriture admin uniquement
    }
    
    // Sous-catégories - Lecture publique
    match /subcategories/{subCategoryId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // Prestations - Lecture publique
    match /prestations/{prestationId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

## 📈 Performance attendue

Avec cette structure :

- **Page d'accueil** : ~9 catégories = ~5-10 KB de données
- **Page catégorie** : ~2-4 sous-catégories + ~20-50 prestations = ~20-50 KB
- **Page sous-catégorie** : ~10-30 prestations = ~10-30 KB

**Temps de chargement estimé :**
- 4G : < 500ms
- 3G : < 1s
- 2G : < 2s

## ✅ Avantages de cette structure

1. **Scalable** : Peut gérer des milliers de prestations
2. **Efficace** : Chargement progressif (lazy loading)
3. **Flexible** : Facile d'ajouter/modifier des données
4. **Optimisé** : Requêtes filtrées par index
5. **Cache-friendly** : Structure simple à mettre en cache

## 🎯 Exemple de flux utilisateur

```
1. App démarre
   ↓
   Charger catégories (9 docs) → Afficher page d'accueil
   
2. Utilisateur clique sur "Coiffure"
   ↓
   Charger sous-catégories de "Coiffure" (4 docs)
   Charger prestations de "Coiffure" (50 docs)
   → Afficher page catégorie
   
3. Utilisateur clique sur "Coiffure femme"
   ↓
   Filtrer prestations déjà chargées par subCategoryId
   → Afficher page sous-catégorie (instantané)
```

## 💡 Recommandations finales

1. ✅ **Utilisez le lazy loading** : Ne chargez que ce qui est nécessaire
2. ✅ **Mettez en cache** : Cachez les catégories (rarement modifiées)
3. ✅ **Créez les index** : Améliorez les performances des requêtes
4. ✅ **Utilisez la pagination** : Pour les listes longues de prestations
5. ✅ **Gérez le mode offline** : Cachez les données essentielles

Votre structure actuelle est **parfaite** pour le mobile ! 🎉

