# 🔄 Flux de chargement en production

## 📋 **Ordre de chargement :**

### **1. index.html** (Point d'entrée)
- Charge le loader CSS
- Crée le `<div id="app">` (avec écran de chargement animé)
- Charge `main.js` (module ES6)

### **2. main.js** (Initialisation Vue)
```javascript
- Importe App.vue
- Crée l'instance Vue
- Enregistre tous les plugins (Firebase, Router, etc.)
- Monte l'app sur #app
```

### **3. App.vue** 
- Contient le `<RouterView>` qui affiche les pages selon la route

### **4. Router (Vue Router)**
- Initialise le router avec `vue-router/auto` (génération automatique des routes)
- Charge `additional-routes.js` qui définit :
  
  **Route racine `/` :**
  ```javascript
  {
    path: '/',
    redirect: { name: 'auth-login' }  // ← REDIRECTION VERS LOGIN
  }
  ```

### **5. Guards de navigation (guards.js)**
Avant chaque navigation, le guard vérifie :
1. **Attente de Firebase Auth** (max 2 secondes)
2. **Vérification de l'authentification** :
   - Si **NON connecté** → Laisse passer vers `/auth/login` ✅
   - Si **connecté** → Redirige vers :
     - `dashboard-dashboard` (si admin/manager)
     - `roles` (si pas de rôle)

### **6. Première page affichée**

#### **Scénario A : Utilisateur NON connecté**
```
/ → redirect → /auth/login → Login.vue ✅
```

#### **Scénario B : Utilisateur connecté**
```
/ → redirect → /auth/login 
  → Guard détecte utilisateur connecté
  → Redirige vers dashboard-dashboard ✅
```

---

## 🎯 **Résumé :**

**En production, la première page est TOUJOURS `/auth/login` :**
- Pour les utilisateurs NON connectés : la page de login s'affiche
- Pour les utilisateurs connectés : le guard redirige automatiquement vers le dashboard

---

## 📍 **Fichiers clés :**

1. **index.html** → Point d'entrée
2. **src/main.js** → Initialisation Vue
3. **src/plugins/1.router/additional-routes.js** (ligne 8-13) → Redirection `/` vers login
4. **src/plugins/1.router/guards.js** (ligne 41-67) → Redirection automatique si connecté
5. **src/pages/app/auth/login.vue** → Page de login

---

## 🔍 **Vérification :**

Pour changer le comportement, modifiez :
- **Route par défaut** : `additional-routes.js` ligne 10-12
- **Redirection si connecté** : `guards.js` ligne 41-67

