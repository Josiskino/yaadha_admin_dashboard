// Test Firebase Connection
// Ce script peut être exécuté dans la console du navigateur pour tester Firebase

console.log('🔥 Test de connexion Firebase...')

// Vérifier que Firebase est chargé
if (typeof window !== 'undefined') {
  // Attendre que Vue soit chargé
  setTimeout(() => {
    try {
      // Accéder aux services Firebase via l'instance Vue
      const app = document.querySelector('#app').__vue_app__
      if (app) {
        const auth = app.config.globalProperties.$auth
        const db = app.config.globalProperties.$db
        const analytics = app.config.globalProperties.$analytics
        const storage = app.config.globalProperties.$storage
        
        console.log('✅ Firebase Auth:', auth ? 'Connecté' : 'Non connecté')
        console.log('✅ Firebase Firestore:', db ? 'Connecté' : 'Non connecté')
        console.log('✅ Firebase Analytics:', analytics ? 'Connecté' : 'Non connecté')
        console.log('✅ Firebase Storage:', storage ? 'Connecté' : 'Non connecté')
        
        // Test de connexion Auth
        if (auth) {
          auth.onAuthStateChanged(user => {
            if (user) {
              console.log('✅ Auth state: Utilisateur connecté -', user.email)
            } else {
              console.log('ℹ️ Auth state: Aucun utilisateur connecté (normal)')
            }
          })
        }
        
        // Vérifier que Firestore est bien initialisé
        if (db) {
          console.log('✅ Firestore instance:', {
            app: db.app?.name,
            type: db.type,
            '_settings': db._settings ? 'Configuré' : 'Non configuré',
          })
          
          // Test simple de connexion (sans import dynamique)
          // La connexion réelle sera testée par le composable useFirebaseTest
          console.log('ℹ️ Pour tester la connexion Firestore en détail, utilisez le composable useFirebaseTest dans une page')
        }
      } else {
        console.log('❌ Vue app non trouvée')
      }
    } catch (error) {
      console.error('❌ Erreur lors du test Firebase:', error)
    }
  }, 2000)
}
