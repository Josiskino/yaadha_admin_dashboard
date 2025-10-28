<script setup>
import { useAuth } from '@/composables/useAuth'
import { useFirebase } from '@/composables/useFirebase'

const { signUp, signIn, signOut, user, isAuthenticated, loading, error } = useAuth()
const { addDocument, getDocuments, analytics } = useFirebase()

// Test data
const testEmail = ref('test@yaadha.com')
const testPassword = ref('test123456')
const testData = ref('')
const firestoreData = ref([])
const connectionStatus = ref('Vérification...')

// Test Firebase connection
const testConnection = async () => {
  try {
    connectionStatus.value = 'Test en cours...'
    
    // Test 1: Vérifier que Firebase est initialisé
    if (analytics) {
      connectionStatus.value = '✅ Firebase Analytics connecté'
    }
    
    // Test 2: Essayer de créer un document de test
    const testDoc = {
      message: 'Test de connexion Firebase',
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
    }
    
    const docId = await addDocument('connection-tests', testDoc)

    connectionStatus.value = `✅ Firestore connecté - Document créé: ${docId}`
    
    // Test 3: Récupérer les données
    const docs = await getDocuments('connection-tests')

    firestoreData.value = docs
    
  } catch (err) {
    connectionStatus.value = `❌ Erreur: ${err.message}`
    console.error('Firebase connection test failed:', err)
  }
}

// Test Authentication
const testAuth = async () => {
  try {
    if (isAuthenticated.value) {
      await signOut()
      testData.value = 'Utilisateur déconnecté'
    } else {
      await signUp(testEmail.value, testPassword.value)
      testData.value = `Utilisateur créé: ${user.value?.email}`
    }
  } catch (err) {
    testData.value = `Erreur Auth: ${err.message}`
  }
}

// Test de connexion au chargement
onMounted(() => {
  testConnection()
})
</script>

<template>
  <div class="pa-6">
    <VCard>
      <VCardTitle class="text-h4 mb-4">
        🔥 Test de Connexion Firebase
      </VCardTitle>
      
      <VCardText>
        <!-- Status de connexion -->
        <VAlert
          :type="connectionStatus.includes('✅') ? 'success' : connectionStatus.includes('❌') ? 'error' : 'info'"
          class="mb-4"
        >
          <strong>Status:</strong> {{ connectionStatus }}
        </VAlert>

        <!-- Test Authentication -->
        <VCard
          class="mb-4"
          variant="outlined"
        >
          <VCardTitle>Test Authentication</VCardTitle>
          <VCardText>
            <VRow>
              <VCol
                cols="12"
                md="6"
              >
                <VTextField
                  v-model="testEmail"
                  label="Email de test"
                  type="email"
                />
              </VCol>
              <VCol
                cols="12"
                md="6"
              >
                <VTextField
                  v-model="testPassword"
                  label="Mot de passe de test"
                  type="password"
                />
              </VCol>
            </VRow>
            
            <VBtn
              :loading="loading"
              :disabled="loading"
              class="mt-2"
              @click="testAuth"
            >
              {{ isAuthenticated ? 'Se déconnecter' : 'Créer un compte de test' }}
            </VBtn>
            
            <div
              v-if="testData"
              class="mt-2"
            >
              <VAlert type="info">
                {{ testData }}
              </VAlert>
            </div>
            
            <div
              v-if="user"
              class="mt-2"
            >
              <VAlert type="success">
                <strong>Utilisateur connecté:</strong><br>
                Email: {{ user.email }}<br>
                UID: {{ user.uid }}<br>
                Email vérifié: {{ user.emailVerified ? 'Oui' : 'Non' }}
              </VAlert>
            </div>
          </VCardText>
        </VCard>

        <!-- Test Firestore -->
        <VCard
          class="mb-4"
          variant="outlined"
        >
          <VCardTitle>Test Firestore</VCardTitle>
          <VCardText>
            <VBtn
              :loading="loading"
              class="mb-4"
              @click="testConnection"
            >
              Tester la connexion Firestore
            </VBtn>
            
            <div v-if="firestoreData.length > 0">
              <h4>Documents de test:</h4>
              <VList>
                <VListItem
                  v-for="doc in firestoreData"
                  :key="doc.id"
                  class="mb-2"
                >
                  <VCard variant="outlined">
                    <VCardText>
                      <strong>ID:</strong> {{ doc.id }}<br>
                      <strong>Message:</strong> {{ doc.message }}<br>
                      <strong>Timestamp:</strong> {{ doc.timestamp }}
                    </VCardText>
                  </VCard>
                </VListItem>
              </VList>
            </div>
          </VCardText>
        </VCard>

        <!-- Informations de configuration -->
        <VCard variant="outlined">
          <VCardTitle>Configuration Firebase</VCardTitle>
          <VCardText>
            <VList>
              <VListItem>
                <VListItemTitle>Projet:</VListItemTitle>
                <VListItemSubtitle>yaadha-dev</VListItemSubtitle>
              </VListItem>
              <VListItem>
                <VListItemTitle>Auth Domain:</VListItemTitle>
                <VListItemSubtitle>yaadha-dev.firebaseapp.com</VListItemSubtitle>
              </VListItem>
              <VListItem>
                <VListItemTitle>Storage Bucket:</VListItemTitle>
                <VListItemSubtitle>yaadha-dev.firebasestorage.app</VListItemSubtitle>
              </VListItem>
            </VList>
          </VCardText>
        </VCard>
      </VCardText>
    </VCard>
  </div>
</template>
