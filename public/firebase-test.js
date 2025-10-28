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
        
        console.log('✅ Firebase Auth:', auth ? 'Connecté' : 'Non connecté')
        console.log('✅ Firebase Firestore:', db ? 'Connecté' : 'Non connecté')
        console.log('✅ Firebase Analytics:', analytics ? 'Connecté' : 'Non connecté')
        
        // Test de connexion Firestore
        if (db) {
          import('firebase/firestore').then(({ collection, getDocs }) => {
            getDocs(collection(db, 'connection-tests'))
              .then(snapshot => {
                console.log('✅ Firestore accessible:', snapshot.size, 'documents trouvés')
              })
              .catch(err => {
                console.error('❌ Erreur Firestore:', err)
              })
          })
        }
        
        // Test de connexion Auth
        if (auth) {
          console.log('✅ Auth state:', auth.currentUser ? 'Utilisateur connecté' : 'Aucun utilisateur')
        }
      } else {
        console.log('❌ Vue app non trouvée')
      }
    } catch (error) {
      console.error('❌ Erreur lors du test Firebase:', error)
    }
  }, 2000)
}
