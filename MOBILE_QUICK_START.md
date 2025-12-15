# 🚀 Guide rapide : Récupération des données sur mobile

## ✅ Réponse courte : OUI, c'est très facile !

Votre structure de données est **parfaitement optimisée** pour le mobile. Voici comment récupérer les données :

## 📱 Exemples de code pour mobile

### Flutter (Dart)

```dart
// 1. Charger les catégories (page d'accueil)
Future<List<Category>> getCategories() async {
  final snapshot = await FirebaseFirestore.instance
    .collection('categories')
    .orderBy('order')
    .get();
  
  return snapshot.docs.map((doc) => Category.fromFirestore(doc)).toList();
}

// 2. Charger les sous-catégories d'une catégorie
Future<List<SubCategory>> getSubCategories(String categoryId) async {
  final snapshot = await FirebaseFirestore.instance
    .collection('subcategories')
    .where('categoryId', isEqualTo: categoryId)
    .get();
  
  return snapshot.docs.map((doc) => SubCategory.fromFirestore(doc)).toList();
}

// 3. Charger les prestations d'une sous-catégorie
Future<List<Prestation>> getPrestations(String categoryId, String subCategoryId) async {
  final snapshot = await FirebaseFirestore.instance
    .collection('prestations')
    .where('categoryId', isEqualTo: categoryId)
    .where('subCategoryId', isEqualTo: subCategoryId)
    .get();
  
  return snapshot.docs.map((doc) => Prestation.fromFirestore(doc)).toList();
}
```

### React Native (JavaScript)

```javascript
import firestore from '@react-native-firebase/firestore';

// 1. Charger les catégories
const getCategories = async () => {
  const snapshot = await firestore()
    .collection('categories')
    .orderBy('order')
    .get();
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};

// 2. Charger les sous-catégories
const getSubCategories = async (categoryId) => {
  const snapshot = await firestore()
    .collection('subcategories')
    .where('categoryId', '==', categoryId)
    .get();
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};

// 3. Charger les prestations
const getPrestations = async (categoryId, subCategoryId) => {
  const snapshot = await firestore()
    .collection('prestations')
    .where('categoryId', '==', categoryId)
    .where('subCategoryId', '==', subCategoryId)
    .get();
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};
```

## 🎯 Flux recommandé pour l'app mobile

```
1. Page d'accueil
   → Charger uniquement les catégories (9 documents)
   → Affichage rapide et léger

2. Page catégorie (ex: "Coiffure")
   → Charger sous-catégories filtrées par categoryId
   → Charger prestations filtrées par categoryId
   → Affichage des options disponibles

3. Page sous-catégorie (ex: "Coiffure femme")
   → Filtrer les prestations déjà chargées par subCategoryId
   → Ou recharger uniquement les prestations de cette sous-catégorie
```

## ⚡ Performance

- **Catégories** : ~9 documents = ~5 KB
- **Sous-catégories par catégorie** : ~2-4 documents = ~2 KB
- **Prestations par sous-catégorie** : ~10-30 documents = ~10-30 KB

**Temps de chargement** : < 1 seconde sur 4G

## 🔒 Sécurité

Les règles Firestore ont été mises à jour pour permettre :
- ✅ **Lecture publique** : Les utilisateurs mobiles peuvent lire les catégories, sous-catégories et prestations sans authentification
- ✅ **Écriture protégée** : Seuls les admins authentifiés peuvent modifier les données

## 📝 Important : Déployer les règles

N'oubliez pas de déployer les nouvelles règles Firestore :

```bash
firebase deploy --only firestore:rules
```

## ✅ Conclusion

Votre structure est **parfaite** pour le mobile ! Les données sont :
- ✅ Bien organisées (hiérarchie claire)
- ✅ Facilement récupérables (requêtes simples)
- ✅ Optimisées (chargement progressif)
- ✅ Scalables (peut gérer des milliers de prestations)

Vous pouvez commencer à développer votre app mobile dès maintenant ! 🎉

