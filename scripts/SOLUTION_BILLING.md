# 🔧 Solution au problème de billing Firebase

## ❌ Problème actuel

L'erreur `PERMISSION_DENIED: This API method requires billing to be enabled` indique que Firebase Admin SDK nécessite que le billing soit activé sur votre projet.

## ✅ Solution 1 : Activer le billing (Recommandé)

### Pourquoi activer le billing ?

- Firebase Admin SDK nécessite le billing activé, **même pour le plan Spark (gratuit)**
- Activer le billing **ne vous coûtera rien** si vous restez dans les limites du plan Spark gratuit
- Le plan Spark gratuit inclut :
  - 50 000 lectures/jour
  - 20 000 écritures/jour
  - 20 000 suppressions/jour
  - 1 GB de stockage

### Étapes pour activer le billing

1. **Allez sur la page d'activation** :
   - https://console.developers.google.com/billing/enable?project=yaadha-dev
   - Ou : Firebase Console > Project Settings > Billing

2. **Activez le billing** :
   - Ajoutez une carte de crédit (requis mais ne sera pas facturée si vous restez dans les limites gratuites)
   - Sélectionnez le plan **Spark** (gratuit)

3. **Attendez la propagation** :
   - Attendez 2-5 minutes pour que les changements se propagent

4. **Relancez l'import** :
   ```bash
   pnpm run import:data
   ```

## ✅ Solution 2 : Utiliser l'interface d'administration

Si vous ne voulez pas activer le billing maintenant, vous pouvez créer les données manuellement via l'interface web de votre dashboard.

1. Connectez-vous à votre application
2. Allez dans la section "Categories"
3. Créez chaque catégorie, sous-catégorie et prestation manuellement

## 📊 Limites du plan Spark (gratuit)

- **Firestore** : 50K lectures/jour, 20K écritures/jour
- **Storage** : 5 GB
- **Hosting** : 10 GB
- **Functions** : 2 millions d'invocations/mois

Pour un projet de développement, ces limites sont généralement suffisantes.

## ⚠️ Important

- Le billing activé ne signifie **pas** que vous serez facturé automatiquement
- Vous ne serez facturé que si vous dépassez les limites gratuites
- Vous pouvez surveiller votre utilisation dans Firebase Console > Usage and billing

