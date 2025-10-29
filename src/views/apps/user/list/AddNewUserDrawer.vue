<script setup>
import { useFirebase } from '@/composables/useFirebase'
import { db } from '@/config/firebase'
import { doc, serverTimestamp, setDoc } from 'firebase/firestore'
import { PerfectScrollbar } from 'vue3-perfect-scrollbar'

const props = defineProps({
  isDrawerOpen: {
    type: Boolean,
    required: true,
  },
})

const emit = defineEmits([
  'update:isDrawerOpen',
  'userData',
])

// Firebase composable
const { signUp, loading: firebaseLoading, error: firebaseError } = useFirebase()

const isFormValid = ref(false)
const refForm = ref()
const fullName = ref('')
const userName = ref('')
const email = ref('')
const password = ref('yaadhapassword')
const showPassword = ref(true)
const country = ref()
const contact = ref('')
const status = ref('pending')
const countrySearch = ref('')

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

// 👉 drawer close
const closeNavigationDrawer = () => {
  emit('update:isDrawerOpen', false)
  nextTick(() => {
    password.value = 'yaadhapassword'
    showPassword.value = true
    status.value = 'pending'
    countrySearch.value = ''
    refForm.value?.reset()
    refForm.value?.resetValidation()
  })
}

const onSubmit = async () => {
  const isValid = await refForm.value?.validate()
  
  if (isValid?.valid) {
    try {
      // 1. Create Firebase Auth account
      const userCredential = await signUp(email.value, password.value)
      
      // 2. Create admin document in Firestore
      const adminData = {
        email: email.value,
        fullName: fullName.value,
        country: country.value,
        contact: contact.value,
        status: status.value,
        createdAt: serverTimestamp(), // Use Firestore server timestamp
        updatedAt: serverTimestamp(),

        // No role assigned initially
      }
      
      // Use Firebase UID as document ID with setDoc directly
      const docRef = doc(db, 'admin', userCredential.user.uid)

      await setDoc(docRef, adminData)
      
      // 3. Emit success event with Firebase data
      emit('userData', {
        id: userCredential.user.uid,
        uid: userCredential.user.uid,
        fullName: fullName.value,
        country: country.value,
        contact: contact.value,
        email: email.value,
        status: status.value,
        avatar: '',
        billing: 'Auto Debit',
      })
      
      // 4. Close drawer and reset form
      emit('update:isDrawerOpen', false)
      nextTick(() => {
        password.value = 'yaadhapassword'
        showPassword.value = true
        status.value = 'pending'
        countrySearch.value = ''
        refForm.value?.reset()
        refForm.value?.resetValidation()
      })
      
    } catch (error) {
      console.error('Error creating admin account:', error)

      // Handle error - could emit error event or show notification
      emit('userData', {
        error: error.message,
      })
    }
  }
}

const handleDrawerModelValueUpdate = val => {
  emit('update:isDrawerOpen', val)
}
</script>

<template>
  <VNavigationDrawer
    temporary
    :width="400"
    location="end"
    class="scrollable-content"
    :model-value="props.isDrawerOpen"
    @update:model-value="handleDrawerModelValueUpdate"
  >
    <!-- 👉 Title -->
    <AppDrawerHeaderSection
      title="Add New User"
      @cancel="closeNavigationDrawer"
    />

    <VDivider />

    <PerfectScrollbar :options="{ wheelPropagation: false }">
      <VCard flat>
        <VCardText>
          <!-- 👉 Form -->
          <VForm
            ref="refForm"
            v-model="isFormValid"
            @submit.prevent="onSubmit"
          >
            <VRow>
              <!-- 👉 Full name -->
              <VCol cols="12">
                <AppTextField
                  v-model="fullName"
                  :rules="[requiredValidator]"
                  label="Full Name"
                  placeholder="John Doe"
                />
              </VCol>

              <!-- 👉 Username -->
              <VCol cols="12">
                <AppTextField
                  v-model="userName"
                  :rules="[requiredValidator]"
                  label="Username"
                  placeholder="Johndoe"
                />
              </VCol>

              <!-- 👉 Email -->
              <VCol cols="12">
                <AppTextField
                  v-model="email"
                  :rules="[requiredValidator, emailValidator]"
                  label="Email"
                  placeholder="johndoe@email.com"
                />
              </VCol>

              <!-- 👉 Password -->
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

              <!-- 👉 Country -->
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

              <!-- 👉 Contact -->
              <VCol cols="12">
                <AppTextField
                  v-model="contact"
                  type="number"
                  :rules="[requiredValidator]"
                  label="Contact"
                  placeholder="+1-541-754-3010"
                />
              </VCol>

              <!-- 👉 Status -->
              <VCol cols="12">
                <AppSelect
                  v-model="status"
                  label="Select Status"
                  placeholder="Select Status"
                  :rules="[requiredValidator]"
                  :items="[{ title: 'Active', value: 'active' }, { title: 'Inactive', value: 'inactive' }, { title: 'Pending', value: 'pending' }]"
                />
              </VCol>

              <!-- 👉 Submit and Cancel -->
              <VCol cols="12">
                <VBtn
                  type="submit"
                  class="me-3"
                  :loading="firebaseLoading"
                  :disabled="firebaseLoading"
                >
                  {{ firebaseLoading ? 'Creating Account...' : 'Submit' }}
                </VBtn>
                <VBtn
                  type="reset"
                  variant="tonal"
                  color="error"
                  :disabled="firebaseLoading"
                  @click="closeNavigationDrawer"
                >
                  Cancel
                </VBtn>
              </VCol>

              <!-- 👉 Error Display -->
              <VCol
                v-if="firebaseError"
                cols="12"
              >
                <VAlert
                  type="error"
                  variant="tonal"
                  closable
                  @click:close="firebaseError = null"
                >
                  {{ firebaseError }}
                </VAlert>
              </VCol>
            </VRow>
          </VForm>
        </VCardText>
      </VCard>
    </PerfectScrollbar>
  </VNavigationDrawer>
</template>
