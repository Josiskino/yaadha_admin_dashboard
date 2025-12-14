<script setup>
import { useFirebase } from '@/composables/useFirebase'
import { auth, db } from '@/config/firebase'
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { useRouter } from 'vue-router'

// Firebase config for logging
const FIREBASE_PROJECT_ID = 'yaadha-dev'
const FIREBASE_DATABASE_ID = 'yaadha-db-dev'

definePage({
  meta: {
    layout: 'blank',
    public: true, // Make this page accessible without authentication
  },
})

const router = useRouter()
const { signUp, loading: firebaseLoading, error: firebaseError } = useFirebase()

const refForm = ref()
const fullName = ref('')
const email = ref('')
const password = ref('yaadhapassword')
const showPassword = ref(true)
const country = ref()
const contact = ref('')
const status = ref('pending')
const countrySearch = ref('')
const snackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref('success')

// Countries list with flags
const countries = ref([
  { title: 'Afghanistan', value: 'af', flag: '🇦🇫' },
  { title: 'Albania', value: 'al', flag: '🇦🇱' },
  { title: 'Algeria', value: 'dz', flag: '🇩🇿' },
  { title: 'Argentina', value: 'ar', flag: '🇦🇷' },
  { title: 'Australia', value: 'au', flag: '🇦🇺' },
  { title: 'Austria', value: 'at', flag: '🇦🇹' },
  { title: 'Bangladesh', value: 'bd', flag: '🇧🇩' },
  { title: 'Belgium', value: 'be', flag: '🇧🇪' },
  { title: 'Brazil', value: 'br', flag: '🇧🇷' },
  { title: 'Bulgaria', value: 'bg', flag: '🇧🇬' },
  { title: 'Canada', value: 'ca', flag: '🇨🇦' },
  { title: 'Chile', value: 'cl', flag: '🇨🇱' },
  { title: 'China', value: 'cn', flag: '🇨🇳' },
  { title: 'Colombia', value: 'co', flag: '🇨🇴' },
  { title: 'Croatia', value: 'hr', flag: '🇭🇷' },
  { title: 'Czech Republic', value: 'cz', flag: '🇨🇿' },
  { title: 'Denmark', value: 'dk', flag: '🇩🇰' },
  { title: 'Egypt', value: 'eg', flag: '🇪🇬' },
  { title: 'Estonia', value: 'ee', flag: '🇪🇪' },
  { title: 'Finland', value: 'fi', flag: '🇫🇮' },
  { title: 'France', value: 'fr', flag: '🇫🇷' },
  { title: 'Germany', value: 'de', flag: '🇩🇪' },
  { title: 'Ghana', value: 'gh', flag: '🇬🇭' },
  { title: 'Greece', value: 'gr', flag: '🇬🇷' },
  { title: 'Hungary', value: 'hu', flag: '🇭🇺' },
  { title: 'Iceland', value: 'is', flag: '🇮🇸' },
  { title: 'India', value: 'in', flag: '🇮🇳' },
  { title: 'Indonesia', value: 'id', flag: '🇮🇩' },
  { title: 'Ireland', value: 'ie', flag: '🇮🇪' },
  { title: 'Israel', value: 'il', flag: '🇮🇱' },
  { title: 'Italy', value: 'it', flag: '🇮🇹' },
  { title: 'Japan', value: 'jp', flag: '🇯🇵' },
  { title: 'Kenya', value: 'ke', flag: '🇰🇪' },
  { title: 'Latvia', value: 'lv', flag: '🇱🇻' },
  { title: 'Lithuania', value: 'lt', flag: '🇱🇹' },
  { title: 'Luxembourg', value: 'lu', flag: '🇱🇺' },
  { title: 'Malaysia', value: 'my', flag: '🇲🇾' },
  { title: 'Mexico', value: 'mx', flag: '🇲🇽' },
  { title: 'Morocco', value: 'ma', flag: '🇲🇦' },
  { title: 'Netherlands', value: 'nl', flag: '🇳🇱' },
  { title: 'New Zealand', value: 'nz', flag: '🇳🇿' },
  { title: 'Nigeria', value: 'ng', flag: '🇳🇬' },
  { title: 'Norway', value: 'no', flag: '🇳🇴' },
  { title: 'Pakistan', value: 'pk', flag: '🇵🇰' },
  { title: 'Peru', value: 'pe', flag: '🇵🇪' },
  { title: 'Philippines', value: 'ph', flag: '🇵🇭' },
  { title: 'Poland', value: 'pl', flag: '🇵🇱' },
  { title: 'Portugal', value: 'pt', flag: '🇵🇹' },
  { title: 'Romania', value: 'ro', flag: '🇷🇴' },
  { title: 'Russia', value: 'ru', flag: '🇷🇺' },
  { title: 'Saudi Arabia', value: 'sa', flag: '🇸🇦' },
  { title: 'Singapore', value: 'sg', flag: '🇸🇬' },
  { title: 'Slovakia', value: 'sk', flag: '🇸🇰' },
  { title: 'Slovenia', value: 'si', flag: '🇸🇮' },
  { title: 'South Africa', value: 'za', flag: '🇿🇦' },
  { title: 'South Korea', value: 'kr', flag: '🇰🇷' },
  { title: 'Spain', value: 'es', flag: '🇪🇸' },
  { title: 'Sweden', value: 'se', flag: '🇸🇪' },
  { title: 'Switzerland', value: 'ch', flag: '🇨🇭' },
  { title: 'Thailand', value: 'th', flag: '🇹🇭' },
  { title: 'Togo', value: 'tg', flag: '🇹🇬' },
  { title: 'Turkey', value: 'tr', flag: '🇹🇷' },
  { title: 'Ukraine', value: 'ua', flag: '🇺🇦' },
  { title: 'United Arab Emirates', value: 'ae', flag: '🇦🇪' },
  { title: 'United Kingdom', value: 'gb', flag: '🇬🇧' },
  { title: 'United States', value: 'us', flag: '🇺🇸' },
  { title: 'Vietnam', value: 'vn', flag: '🇻🇳' },
])

// Filtered countries based on search
const filteredCountries = computed(() => {
  if (!countrySearch.value) return countries.value
  
  return countries.value.filter(country => 
    country.title.toLowerCase().includes(countrySearch.value.toLowerCase()),
  )
})

const showNotification = (message, type = 'success') => {
  snackbarText.value = message
  snackbarColor.value = type
  snackbar.value = true
}

const onSubmit = async () => {
  const isValid = await refForm.value?.validate()
  
  if (isValid?.valid) {
    try {
      // 1. Create Firebase Auth account
      console.log('Creating Firebase Auth account...')

      const userCredential = await signUp(email.value, password.value)

      console.log('Firebase Auth account created:', userCredential.user.uid)
      console.log('Current auth user:', auth.currentUser?.uid)
      
      // Wait a bit to ensure auth state is updated
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Verify user is authenticated
      if (!auth.currentUser || auth.currentUser.uid !== userCredential.user.uid) {
        throw new Error('User authentication state not properly set after account creation')
      }
      
      console.log('User authenticated, proceeding with Firestore write...')
      
      // 2. Create admin document in Firestore
      const adminData = {
        email: email.value,
        fullName: fullName.value,
        country: country.value,
        contact: contact.value,
        status: status.value,
        role: 'administrator', // Add role field for login verification
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }
      
      console.log('Creating Firestore document...', {
        collection: 'admin',
        documentId: userCredential.user.uid,
        authUID: auth.currentUser?.uid,
        data: adminData,
      })
      
      // Use Firebase UID as document ID
      const docRef = doc(db, 'admin', userCredential.user.uid)
      
      // Log database information
      console.log('=== FIREBASE DATABASE INFO ===')
      console.log('Project ID:', FIREBASE_PROJECT_ID)
      console.log('Database ID:', FIREBASE_DATABASE_ID)
      console.log('Database instance:', db._delegate?.databaseId || FIREBASE_DATABASE_ID)
      console.log('Auth user UID:', auth.currentUser?.uid)
      console.log('Document path:', `admin/${userCredential.user.uid}`)
      console.log('Full document reference:', docRef.path)
      console.log('=============================')
      
      try {
        console.log('Attempting to write to Firestore...')
        await setDoc(docRef, adminData)
        console.log('✅ Firestore document write successful!')
        
        // Wait a bit for the write to propagate
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Verify document was created
        console.log('Verifying document exists...')

        const docSnapshot = await getDoc(docRef)
        if (docSnapshot.exists()) {
          console.log('✅ Document verified in Firestore:', docSnapshot.data())
          console.log('Document ID:', docSnapshot.id)
          console.log('Document path:', docSnapshot.ref.path)
        } else {
          console.error('❌ Document does not exist after write!')
          throw new Error('Document was not created in Firestore')
        }
      } catch (firestoreError) {
        console.error('❌ Firestore write error:', firestoreError)
        console.error('Error code:', firestoreError.code)
        console.error('Error message:', firestoreError.message)
        console.error('Error stack:', firestoreError.stack)
        
        // Additional debugging info
        if (firestoreError.code === 'permission-denied') {
          console.error('⚠️ PERMISSION DENIED - Check:')
          console.error('1. Firestore rules are deployed')
          console.error('2. User is authenticated:', !!auth.currentUser)
          console.error('3. User UID matches document ID:', auth.currentUser?.uid === userCredential.user.uid)
          console.error('4. Rules allow create for authenticated users')
        }
        
        throw firestoreError
      }
      
      showNotification('Admin account created successfully! Redirecting to login...', 'success')
      
      // Redirect to login page after 2 seconds
      setTimeout(() => {
        router.push({ name: 'auth-login' })
      }, 2000)
      
    } catch (error) {
      console.error('Error creating admin account:', error)
      console.error('Error code:', error.code)
      console.error('Error message:', error.message)
      console.error('Full error object:', error)
      
      // More detailed error message
      let errorMessage = 'Error creating admin account'
      if (error.code === 'permission-denied') {
        errorMessage = 'Permission denied. Please check Firestore rules. User UID: ' + (auth.currentUser?.uid || 'not authenticated')
      } else if (error.code === 'unavailable') {
        errorMessage = 'Firestore is temporarily unavailable. Please try again.'
      } else if (error.message) {
        errorMessage = error.message
      }
      
      showNotification(errorMessage, 'error')
    }
  }
}
</script>

<template>
  <div class="auth-wrapper d-flex align-center justify-center pa-4">
    <VCard
      class="auth-card"
      max-width="600"
      :class="$vuetify.display.smAndUp ? 'pa-6' : 'pa-4'"
    >
      <VCardItem class="justify-center">
        <VCardTitle class="text-h4">
          Create Admin Account
        </VCardTitle>
      </VCardItem>

      <VCardText>
        <VAlert
          type="info"
          variant="tonal"
          class="mb-4"
        >
          <p class="text-sm mb-2">
            <strong>Note:</strong> This page is for creating the first admin account.
          </p>
          <p class="text-sm mb-0">
            Default password: <strong>yaadhapassword</strong>
          </p>
        </VAlert>

        <VForm
          ref="refForm"
          @submit.prevent="onSubmit"
        >
          <VRow>
            <!-- Full Name -->
            <VCol cols="12">
              <AppTextField
                v-model="fullName"
                :rules="[requiredValidator]"
                label="Full Name"
                placeholder="John Doe"
              />
            </VCol>

            <!-- Email -->
            <VCol cols="12">
              <AppTextField
                v-model="email"
                :rules="[requiredValidator, emailValidator]"
                label="Email"
                type="email"
                placeholder="admin@yaadha.com"
              />
            </VCol>

            <!-- Password -->
            <VCol cols="12">
              <AppTextField
                v-model="password"
                :type="showPassword ? 'password' : 'text'"
                :rules="[requiredValidator]"
                label="Password"
                placeholder="yaadhapassword"
              >
                <template #append-inner>
                  <IconBtn @click="showPassword = !showPassword">
                    <VIcon :icon="showPassword ? 'tabler-eye-off' : 'tabler-eye'" />
                  </IconBtn>
                </template>
              </AppTextField>
            </VCol>

            <!-- Country -->
            <VCol cols="12">
              <VAutocomplete
                v-model="country"
                label="Select Country"
                placeholder="Search for a country..."
                :rules="[requiredValidator]"
                :items="filteredCountries"
                item-title="title"
                item-value="value"
                clearable
                no-data-text="No countries found"
              >
                <template #item="{ props, item }">
                  <VListItem v-bind="props">
                    <template #prepend>
                      <span class="text-lg me-2">{{ item.raw.flag }}</span>
                    </template>
                  </VListItem>
                </template>
                <template #selection="{ item }">
                  <div class="d-flex align-center">
                    <span class="text-lg me-2">{{ countries.find(c => c.value === item.raw.value)?.flag }}</span>
                    <span>{{ item.raw.title }}</span>
                  </div>
                </template>
              </VAutocomplete>
            </VCol>

            <!-- Contact -->
            <VCol cols="12">
              <AppTextField
                v-model="contact"
                type="number"
                :rules="[requiredValidator]"
                label="Contact"
                placeholder="+1-541-754-3010"
              />
            </VCol>

            <!-- Submit Button -->
            <VCol cols="12">
              <VBtn
                type="submit"
                block
                :loading="firebaseLoading"
                :disabled="firebaseLoading"
              >
                {{ firebaseLoading ? 'Creating Account...' : 'Create Admin Account' }}
              </VBtn>
            </VCol>

            <!-- Error Display -->
            <VCol
              v-if="firebaseError"
              cols="12"
            >
              <VAlert
                type="error"
                variant="tonal"
                closable
              >
                {{ firebaseError }}
              </VAlert>
            </VCol>
          </VRow>
        </VForm>
      </VCardText>

      <VDivider />

      <VCardActions class="justify-center">
        <VBtn
          variant="text"
          :to="{ name: 'auth-login' }"
        >
          Back to Login
        </VBtn>
      </VCardActions>
    </VCard>

    <!-- Notification Snackbar -->
    <VSnackbar
      v-model="snackbar"
      :color="snackbarColor"
      :timeout="3000"
      location="top"
    >
      {{ snackbarText }}
    </VSnackbar>
  </div>
</template>

<style lang="scss">
.auth-wrapper {
  min-block-size: 100vh;
}
</style>
