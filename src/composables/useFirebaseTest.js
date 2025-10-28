import { analytics, auth, db } from '@/config/firebase'
import { addDoc, collection, getDocs, serverTimestamp } from 'firebase/firestore'
import { ref } from 'vue'

/**
 * Composable pour tester la connexion Firebase
 */
export function useFirebaseTest() {
  const testResults = ref([])
  const isTesting = ref(false)

  const addTestResult = (test, status, message) => {
    testResults.value.push({
      test,
      status,
      message,
      timestamp: new Date().toISOString(),
    })
  }

  const testFirebaseInitialization = () => {
    try {
      if (auth && db && analytics) {
        addTestResult('Initialization', 'success', 'Tous les services Firebase sont initialisés')
        
        return true
      } else {
        addTestResult('Initialization', 'error', 'Certains services Firebase ne sont pas initialisés')
        
        return false
      }
    } catch (error) {
      addTestResult('Initialization', 'error', `Erreur d'initialisation: ${error.message}`)
      
      return false
    }
  }

  const testFirestoreConnection = async () => {
    try {
      const testCollection = collection(db, 'connection-tests')

      const testDoc = {
        test: 'Firestore Connection Test',
        timestamp: serverTimestamp(),
        browser: navigator.userAgent,
      }
      
      const docRef = await addDoc(testCollection, testDoc)

      addTestResult('Firestore Write', 'success', `Document créé avec l'ID: ${docRef.id}`)
      
      const snapshot = await getDocs(testCollection)

      addTestResult('Firestore Read', 'success', `${snapshot.size} documents trouvés`)
      
      return true
    } catch (error) {
      addTestResult('Firestore', 'error', `Erreur Firestore: ${error.message}`)
      
      return false
    }
  }

  const testAuthConnection = () => {
    try {
      if (auth.currentUser) {
        addTestResult('Auth', 'success', `Utilisateur connecté: ${auth.currentUser.email}`)
      } else {
        addTestResult('Auth', 'info', 'Aucun utilisateur connecté (normal)')
      }
      
      return true
    } catch (error) {
      addTestResult('Auth', 'error', `Erreur Auth: ${error.message}`)
      
      return false
    }
  }

  const testAnalyticsConnection = () => {
    try {
      if (analytics) {
        addTestResult('Analytics', 'success', 'Firebase Analytics est initialisé')
        
        return true
      } else {
        addTestResult('Analytics', 'error', 'Firebase Analytics non initialisé')
        
        return false
      }
    } catch (error) {
      addTestResult('Analytics', 'error', `Erreur Analytics: ${error.message}`)
      
      return false
    }
  }

  const runAllTests = async () => {
    isTesting.value = true
    testResults.value = []

    // Test 1: Initialisation
    testFirebaseInitialization()

    // Test 2: Auth
    testAuthConnection()

    // Test 3: Analytics
    testAnalyticsConnection()

    // Test 4: Firestore (async)
    await testFirestoreConnection()

    isTesting.value = false
  }

  const getTestSummary = () => {
    const total = testResults.value.length
    const success = testResults.value.filter(r => r.status === 'success').length
    const errors = testResults.value.filter(r => r.status === 'error').length
    const info = testResults.value.filter(r => r.status === 'info').length

    return {
      total,
      success,
      errors,
      info,
      percentage: total > 0 ? Math.round((success / total) * 100) : 0,
    }
  }

  return {
    testResults,
    isTesting,
    runAllTests,
    getTestSummary,
    testFirebaseInitialization,
    testFirestoreConnection,
    testAuthConnection,
    testAnalyticsConnection,
  }
}
