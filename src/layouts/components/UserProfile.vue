<script setup>
import { useAuth } from '@/composables/useAuth'

const router = useRouter()
const ability = useAbility()

// Auth composable
const { currentUser, logout } = useAuth()

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

const handleLogout = async () => {
  await logout()
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
              @click="handleLogout"
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
