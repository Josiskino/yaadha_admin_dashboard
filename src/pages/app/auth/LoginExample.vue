<script setup>
import { useAuth } from '@/composables/useAuth'
import { useRouter } from 'vue-router'

const { signIn, loading, error } = useAuth()
const router = useRouter()

const email = ref('')
const password = ref('')

const handleLogin = async () => {
  try {
    await signIn(email.value, password.value)
    router.push('/')
  } catch (err) {
    console.error('Login error:', err)
  }
}
</script>

<template>
  <div
    class="d-flex align-center justify-center"
    style="min-block-size: 100vh;"
  >
    <VCard
      class="mx-auto"
      max-width="448"
      style="inline-size: 100%;"
    >
      <VCardItem class="text-center">
        <VCardTitle class="mb-2">
          Connexion
        </VCardTitle>
      </VCardItem>

      <VCardText>
        <VAlert
          v-if="error"
          type="error"
          class="mb-4"
        >
          {{ error }}
        </VAlert>

        <VForm @submit.prevent="handleLogin">
          <VRow>
            <VCol cols="12">
              <VTextField
                v-model="email"
                label="Email"
                type="email"
                placeholder="john@example.com"
                prepend-inner-icon="tabler-mail"
                required
              />
            </VCol>

            <VCol cols="12">
              <VTextField
                v-model="password"
                label="Mot de passe"
                type="password"
                placeholder="················"
                prepend-inner-icon="tabler-lock"
                required
              />
            </VCol>

            <VCol cols="12">
              <VBtn
                type="submit"
                block
                :loading="loading"
                :disabled="loading"
              >
                Connexion
              </VBtn>
            </VCol>
          </VRow>
        </VForm>
      </VCardText>
    </VCard>
  </div>
</template>
