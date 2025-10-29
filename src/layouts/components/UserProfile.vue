<script setup>
import { useFirebase } from '@/composables/useFirebase'

const router = useRouter()
const ability = useAbility()

// Firebase composable
const { currentUser, signOut } = useFirebase()

// Get user data from Firebase Auth
const userData = computed(() => {
  console.log('Current user:', currentUser.value) // Debug log
  if (currentUser.value) {
    return {
      fullName: currentUser.value.displayName || currentUser.value.email?.split('@')[0] || 'Admin',
      email: currentUser.value.email,
      avatar: currentUser.value.photoURL,
      role: 'Administrator', // You can fetch this from Firestore if needed
    }
  }
  
  return null
})

const logout = async () => {
  try {
    // Sign out from Firebase Auth
    await signOut()

    // Remove "accessToken" from cookie
    useCookie('accessToken').value = null

    // Remove "userData" from cookie
    useCookie('userData').value = null

    // Remove "userAbilities" from cookie
    useCookie('userAbilityRules').value = null

    // Reset ability to initial ability
    ability.update([])

    // Redirect to login page
    await router.push('/login')
  } catch (error) {
    console.error('Error during logout:', error)

    // Still redirect to login even if there's an error
    await router.push('/login')
  }
}

const userProfileList = [
  { type: 'divider' },
]
</script>

<template>
  <!-- Debug info -->
  <div
    v-if="!currentUser"
    class="text-caption text-error"
  >
    No user logged in
  </div>
  
  <VBadge
    v-if="currentUser"
    dot
    bordered
    location="bottom right"
    offset-x="1"
    offset-y="2"
    color="success"
  >
    <VAvatar
      size="38"
      class="cursor-pointer"
      :color="!(userData && userData.avatar) ? 'primary' : undefined"
      :variant="!(userData && userData.avatar) ? 'tonal' : undefined"
    >
      <VImg
        v-if="userData && userData.avatar"
        :src="userData.avatar"
      />
      <VIcon
        v-else
        icon="tabler-user"
      />

      <!-- SECTION Menu -->
      <VMenu
        activator="parent"
        width="240"
        location="bottom end"
        offset="12px"
      >
        <VList>
          <VListItem>
            <div class="d-flex gap-2 align-center">
              <VListItemAction>
                <VBadge
                  dot
                  location="bottom right"
                  offset-x="3"
                  offset-y="3"
                  color="success"
                  bordered
                >
                  <VAvatar
                    :color="!(userData && userData.avatar) ? 'primary' : undefined"
                    :variant="!(userData && userData.avatar) ? 'tonal' : undefined"
                  >
                    <VImg
                      v-if="userData && userData.avatar"
                      :src="userData.avatar"
                    />
                    <VIcon
                      v-else
                      icon="tabler-user"
                    />
                  </VAvatar>
                </VBadge>
              </VListItemAction>

              <div>
                <h6 class="text-h6 font-weight-medium">
                  {{ userData.fullName || userData.email }}
                </h6>
                <VListItemSubtitle class="text-capitalize text-disabled">
                  {{ userData.email }}
                </VListItemSubtitle>
              </div>
            </div>
          </VListItem>

          <template
            v-for="item in userProfileList"
            :key="item.title"
          >
            <VListItem
              v-if="item.type === 'navItem'"
              :to="item.to"
            >
              <template #prepend>
                <VIcon
                  :icon="item.icon"
                  size="22"
                />
              </template>

              <VListItemTitle>{{ item.title }}</VListItemTitle>

              <template
                v-if="item.badgeProps"
                #append
              >
                <VBadge
                  rounded="sm"
                  class="me-3"
                  v-bind="item.badgeProps"
                />
              </template>
            </VListItem>

            <VDivider
              v-else
              class="my-2"
            />
          </template>

          <div class="px-4 py-2">
            <VBtn
              block
              size="small"
              color="error"
              append-icon="tabler-logout"
              @click="logout"
            >
              Logout
            </VBtn>
          </div>
        </VList>
      </VMenu>
      <!-- !SECTION -->
    </VAvatar>
  </VBadge>
</template>
