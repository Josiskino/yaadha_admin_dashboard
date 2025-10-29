import { analytics, auth, db, storage } from '@/config/firebase'
import { ability } from '@/plugins/casl/ability'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'

// Define a Vue plugin object
const FirebasePlugin = {
  install(app) {
    // Make Firebase services available globally
    app.config.globalProperties.$auth = auth
    app.config.globalProperties.$db = db
    app.config.globalProperties.$storage = storage
    app.config.globalProperties.$analytics = analytics

    // Provide Firebase services to all components via dependency injection
    app.provide('$auth', auth)
    app.provide('$db', db)
    app.provide('$storage', storage)
    app.provide('$analytics', analytics)
    
    // Restore CASL abilities if user is already logged in
    onAuthStateChanged(auth, async user => {
      if (user) {
        try {
          // Check if abilities are already set in cookie
          const existingRules = useCookie('userAbilityRules').value
          if (existingRules && existingRules.length > 0) {
            ability.update(existingRules)
            
            return
          }
          
          // If not, fetch user data and initialize abilities
          const userDoc = await getDoc(doc(db, 'admin', user.uid))
          
          if (userDoc.exists()) {
            const userData = userDoc.data()
            
            if (userData && userData.role) {
              // Initialize CASL abilities based on role
              const abilityRules = userData.role === 'administrator' || userData.role === 'manager'
                ? [{ action: 'manage', subject: 'all' }]
                : []
              
              useCookie('userAbilityRules').value = abilityRules
              ability.update(abilityRules)
            }
          }
        } catch (error) {
          console.error('Error restoring CASL abilities:', error)
        }
      } else {
        // User logged out, clear abilities
        useCookie('userAbilityRules').value = null
        ability.update([])
      }
    })
  },
}

// Export as a function that uses the plugin
export default function (app) {
  app.use(FirebasePlugin)
}
