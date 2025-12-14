<script setup>
import { useAuth } from '@/composables/useAuth'
import authV1BottomShape from '@images/svg/auth-v1-bottom-shape.svg?raw'
import authV1TopShape from '@images/svg/auth-v1-top-shape.svg?raw'
import { VNodeRenderer } from '@layouts/components/VNodeRenderer'
import { themeConfig } from '@themeConfig'

definePage({
  meta: {
    layout: 'blank',
    public: true,
  },
})

// Auth + Router
const { login } = useAuth()
const router = useRouter()

const form = ref({
  email: '',
  password: '',
})

const isPasswordVisible = ref(false)
const isLoading = ref(false)
const refForm = ref()

// Snackbar for notifications
const snackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref('error')

// Show notification
const showNotification = (message, type = 'error') => {
  snackbarText.value = message
  snackbarColor.value = type
  snackbar.value = true
}

// Login function
const handleLogin = async () => {
  // Valider le formulaire avant de soumettre
  const { valid } = await refForm.value?.validate()
  
  if (!valid) {
    return
  }
  
  isLoading.value = true
  
  const result = await login(form.value.email, form.value.password)
  
  if (result.success) {
    // Show success notification
    showNotification('Connexion réussie ! Redirection...', 'success')
    // Redirect after successful login to categories page
    setTimeout(async () => {
      await router.replace({ name: 'categories-categories-dashboard' })
    }, 1000)
  } else {
    // Show error notification
    showNotification(result.error, 'error')
  }
  
  isLoading.value = false
}
</script>

<template>
  <div class="auth-wrapper d-flex align-center justify-center pa-4">
    <div class="position-relative my-sm-16">
      <!-- 👉 Top shape -->
      <VNodeRenderer
        :nodes="h('div', { innerHTML: authV1TopShape })"
        class="text-primary auth-v1-top-shape d-none d-sm-block"
      />

      <!-- 👉 Bottom shape -->
      <VNodeRenderer
        :nodes="h('div', { innerHTML: authV1BottomShape })"
        class="text-primary auth-v1-bottom-shape d-none d-sm-block"
      />

      <!-- 👉 Auth Card -->
      <VCard
        class="auth-card"
        max-width="460"
        :class="$vuetify.display.smAndUp ? 'pa-6' : 'pa-0'"
      >
        <VCardItem class="justify-center">
          <VCardTitle>
            <RouterLink to="/">
              <div class="app-logo">
                <VNodeRenderer :nodes="themeConfig.app.logo" />
              </div>
            </RouterLink>
          </VCardTitle>
        </VCardItem>

        <VCardText>
          <h4 class="text-h4 mb-1">
            Welcome to <span class="text-capitalize">{{ themeConfig.app.title }}</span>! 👋🏻
          </h4>
          <p class="mb-0">
            Please sign-in to your account and start the adventure
          </p>
        </VCardText>

        <VCardText>
          <VForm 
            ref="refForm"
            validate-on="submit"
            @submit.prevent="handleLogin"
          >
            <VRow>
              <!-- email -->
              <VCol cols="12">
                <AppTextField
                  v-model="form.email"
                  autofocus
                  label="Email"
                  type="email"
                  placeholder="contact@company.com"
                  :rules="[requiredValidator, emailValidator]"
                  validate-on="blur"
                />
              </VCol>

              <!-- password -->
              <VCol cols="12">
                <AppTextField
                  v-model="form.password"
                  label="Password"
                  placeholder="············"
                  :type="isPasswordVisible ? 'text' : 'password'"
                  :append-inner-icon="isPasswordVisible ? 'tabler-eye-off' : 'tabler-eye'"
                  :rules="[requiredValidator]"
                  validate-on="blur"
                  @click:append-inner="isPasswordVisible = !isPasswordVisible"
                />

                <!-- login button -->
                <VBtn
                  block
                  type="submit"
                  class="mt-6"
                  :loading="isLoading"
                  :disabled="isLoading"
                >
                  {{ isLoading ? 'Signing in...' : 'Login' }}
                </VBtn>
              </VCol>
            </VRow>
          </VForm>
        </VCardText>
      </VCard>
    </div>

    <!-- Notification Snackbar -->
    <VSnackbar
      v-model="snackbar"
      :color="snackbarColor"
      :timeout="5000"
      location="top"
      variant="elevated"
    >
      {{ snackbarText }}
      <template #actions>
        <VBtn
          icon
          variant="text"
          size="small"
          @click="snackbar = false"
        >
          <VIcon icon="tabler-x" />
        </VBtn>
      </template>
    </VSnackbar>
  </div>
</template>

<style lang="scss">
@use "@core/scss/template/pages/page-auth";
</style>
