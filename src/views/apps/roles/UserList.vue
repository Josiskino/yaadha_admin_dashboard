<script setup>
import AddNewUserDrawer from '@/views/apps/user/list/AddNewUserDrawer.vue'

// 👉 Notifications
const snackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref('success')

const showNotification = (message, type = 'success') => {
  snackbarText.value = message
  snackbarColor.value = type
  snackbar.value = true
}

// 👉 Delete Confirmation Modal
const isDeleteModalVisible = ref(false)
const userToDelete = ref(null)

const showDeleteConfirmation = userId => {
  userToDelete.value = userId
  isDeleteModalVisible.value = true
}

// 👉 Assign Role Modal
const isAssignRoleModalVisible = ref(false)
const selectedUser = ref(null)

const showAssignRoleModal = user => {
  selectedUser.value = user
  isAssignRoleModalVisible.value = true
}

const assignRole = async roleValue => {
  if (!selectedUser.value) return
  
  try {
    await $api(`/apps/users/${ selectedUser.value.id }`, {
      method: 'PATCH',
      body: { role: roleValue },
    })

    // Refetch User
    fetchUsers()

    // Show success notification
    showNotification(`Role assigned successfully!`, 'success')
    
    // Close modal
    isAssignRoleModalVisible.value = false
    selectedUser.value = null
  } catch (error) {
    console.error('Error assigning role:', error)
    showNotification('Error assigning role', 'error')
  }
}

const confirmDelete = async () => {
  if (!userToDelete.value) return
  
  try {
    await $api(`/apps/users/${ userToDelete.value }`, { method: 'DELETE' })

    // Delete from selectedRows
    const index = selectedRows.value.findIndex(row => row === userToDelete.value)
    
    if (index !== -1)
      selectedRows.value.splice(index, 1)

    // Refetch User
    fetchUsers()

    // Show success notification
    showNotification('User deleted successfully!', 'success')
  } catch (error) {
    console.error('Error deleting user:', error)
    showNotification('Error deleting user', 'error')
  } finally {
    // Close modal
    isDeleteModalVisible.value = false
    userToDelete.value = null
  }
}

// 👉 Store
const searchQuery = ref('')
const selectedRole = ref()

// Data table options
const itemsPerPage = ref(10)
const page = ref(1)
const sortBy = ref()
const orderBy = ref()
const selectedRows = ref([])

const updateOptions = options => {
  sortBy.value = options.sortBy[0]?.key
  orderBy.value = options.sortBy[0]?.order
}

// Headers
const headers = [
  {
    title: 'User',
    key: 'user',
  },
  {
    title: 'Role',
    key: 'role',
  },
  {
    title: 'Assigned Date',
    key: 'assignedDate',
  },
  {
    title: 'Assigned By',
    key: 'assignedBy',
  },
  {
    title: 'Actions',
    key: 'actions',
    sortable: false,
  },
]

const {
  data: usersData,
  execute: fetchUsers,
} = await useApi(createUrl('/apps/users', {
  query: {
    q: searchQuery,
    role: selectedRole,
    itemsPerPage,
    page,
    sortBy,
    orderBy,
  },
}))

const users = computed(() => usersData.value?.users || [])
const totalUsers = computed(() => usersData.value?.totalUsers || 0)

// 👉 search filters
const roles = [
  {
    title: 'Administrator',
    value: 'administrator',
  },
  {
    title: 'Manager',
    value: 'manager',
  },
]

const resolveUserRoleVariant = role => {
  const roleLowerCase = role.toLowerCase()
  if (roleLowerCase === 'administrator')
    return {
      color: 'error',
      icon: 'tabler-crown',
    }
  if (roleLowerCase === 'manager')
    return {
      color: 'success',
      icon: 'tabler-user-star',
    }
  
  return {
    color: 'primary',
    icon: 'tabler-user',
  }
}


const isAddNewUserDrawerVisible = ref(false)

const addNewUser = async userData => {
  try {
    await $api('/apps/users', {
      method: 'POST',
      body: userData,
    })

    // Refetch User
    fetchUsers()

    // Show success notification
    showNotification('User created successfully!', 'success')
  } catch (error) {
    console.error('Error creating user:', error)
    showNotification('Error creating user', 'error')
  }
}

const deleteUser = async id => {
  showDeleteConfirmation(id)
}
</script>

<template>
  <section>
    <VCard>
      <VCardText class="d-flex flex-wrap gap-4">
        <div class="d-flex gap-2 align-center">
          <p class="text-body-1 mb-0">
            Show
          </p>
          <AppSelect
            :model-value="itemsPerPage"
            :items="[
              { value: 10, title: '10' },
              { value: 25, title: '25' },
              { value: 50, title: '50' },
              { value: 100, title: '100' },
              { value: -1, title: 'All' },
            ]"
            style="inline-size: 5.5rem;"
            @update:model-value="itemsPerPage = parseInt($event, 10)"
          />
        </div>

        <VSpacer />

        <div class="d-flex align-center flex-wrap gap-4">
          <!-- 👉 Search  -->
          <AppTextField
            v-model="searchQuery"
            placeholder="Search User"
            style="inline-size: 15.625rem;"
          />

          <!-- 👉 Role filter -->
          <AppSelect
            v-model="selectedRole"
            placeholder="Filter by Role"
            :items="roles"
            clearable
            clear-icon="tabler-x"
            style="inline-size: 12rem;"
          />
        </div>
      </VCardText>

      <VDivider />

      <!-- SECTION datatable -->
      <VDataTableServer
        v-model:items-per-page="itemsPerPage"
        v-model:model-value="selectedRows"
        v-model:page="page"
        :items-per-page-options="[
          { value: 10, title: '10' },
          { value: 20, title: '20' },
          { value: 50, title: '50' },
          { value: -1, title: '$vuetify.dataFooter.itemsPerPageAll' },
        ]"
        :items="users"
        :items-length="totalUsers"
        :headers="headers"
        class="text-no-wrap"
        show-select
        @update:options="updateOptions"
      >
        <!-- User -->
        <template #item.user="{ item }">
          <div class="d-flex align-center gap-x-4">
            <VAvatar
              size="34"
              :variant="!item.avatar ? 'tonal' : undefined"
              :color="!item.avatar ? resolveUserRoleVariant(item.role).color : undefined"
            >
              <VImg
                v-if="item.avatar"
                :src="item.avatar"
              />
              <span v-else>{{ avatarText(item.fullName) }}</span>
            </VAvatar>
            <div class="d-flex flex-column">
              <h6 class="text-base">
                <RouterLink
                  :to="{ name: 'template-apps-user-view-id', params: { id: item.id } }"
                  class="font-weight-medium text-link"
                >
                  {{ item.fullName }}
                </RouterLink>
              </h6>
              <div class="text-sm">
                {{ item.email }}
              </div>
            </div>
          </div>
        </template>

        <!-- 👉 Role -->
        <template #item.role="{ item }">
          <div class="d-flex align-center gap-x-2">
            <VIcon
              :size="22"
              :icon="resolveUserRoleVariant(item.role).icon"
              :color="resolveUserRoleVariant(item.role).color"
            />

            <div class="text-capitalize text-high-emphasis text-body-1">
              {{ item.role }}
            </div>
          </div>
        </template>

        <!-- Assigned Date -->
        <template #item.assignedDate="{ item }">
          <div class="text-body-1 text-high-emphasis">
            {{ item.assignedDate || item.createdAt || 'N/A' }}
          </div>
        </template>

        <!-- Assigned By -->
        <template #item.assignedBy="{ item }">
          <div class="text-body-1 text-high-emphasis">
            {{ item.assignedBy || 'N/A' }}
          </div>
        </template>

        <!-- Actions -->
        <template #item.actions="{ item }">
          <IconBtn @click="deleteUser(item.id)">
            <VIcon icon="tabler-trash" />
          </IconBtn>

          <IconBtn>
            <VIcon icon="tabler-eye" />
          </IconBtn>

          <VBtn
            icon
            variant="text"
            color="medium-emphasis"
          >
            <VIcon icon="tabler-dots-vertical" />
            <VMenu activator="parent">
              <VList>
                <VListItem :to="{ name: 'template-apps-user-view-id', params: { id: item.id } }">
                  <template #prepend>
                    <VIcon icon="tabler-eye" />
                  </template>

                  <VListItemTitle>View</VListItemTitle>
                </VListItem>

                <VListItem @click="showAssignRoleModal(item)">
                  <template #prepend>
                    <VIcon icon="tabler-pencil" />
                  </template>
                  <VListItemTitle>Assign Role</VListItemTitle>
                </VListItem>

                <VListItem @click="deleteUser(item.id)">
                  <template #prepend>
                    <VIcon icon="tabler-trash" />
                  </template>
                  <VListItemTitle>Delete</VListItemTitle>
                </VListItem>
              </VList>
            </VMenu>
          </VBtn>
        </template>

        <template #bottom>
          <TablePagination
            v-model:page="page"
            :items-per-page="itemsPerPage"
            :total-items="totalUsers"
          />
        </template>
      </VDataTableServer>
      <!-- SECTION -->
    </VCard>

    <!-- 👉 Add New User -->
    <AddNewUserDrawer
      v-model:isDrawerOpen="isAddNewUserDrawerVisible"
      @user-data="addNewUser"
    />

    <!-- 👉 Notification Snackbar -->
    <VSnackbar
      v-model="snackbar"
      :color="snackbarColor"
      timeout="3000"
      location="top right"
    >
      {{ snackbarText }}
    </VSnackbar>

    <!-- 👉 Assign Role Modal -->
    <VDialog
      v-model="isAssignRoleModalVisible"
      max-width="600"
    >
      <VCard v-if="selectedUser">
        <VCardTitle class="d-flex align-center">
          <VIcon
            icon="tabler-user-plus"
            color="primary"
            class="me-3"
          />
          Assign Role to {{ selectedUser.fullName }}
        </VCardTitle>

        <VDivider />

        <VCardText>
          <div class="mb-4">
            <p class="text-body-1 mb-2">
              Select a role to assign to this user:
            </p>
          </div>

          <VRow>
            <VCol
              v-for="role in roles"
              :key="role.value"
              cols="12"
              md="6"
            >
              <VCard
                variant="outlined"
                class="cursor-pointer role-card"
                :class="{ 'border-primary': selectedUser.role === role.value }"
                @click="assignRole(role.value)"
              >
                <VCardText class="d-flex align-center h-100">
                  <VIcon
                    :icon="resolveUserRoleVariant(role.value).icon"
                    :color="resolveUserRoleVariant(role.value).color"
                    size="24"
                    class="me-3"
                  />
                  <div class="flex-grow-1">
                    <div class="text-h6 mb-1">
                      {{ role.title }}
                    </div>
                    <div class="text-caption text-medium-emphasis text-truncate">
                      {{ role.value === 'administrator' ? 'Full access to all features' : 'Limited access to specific features' }}
                    </div>
                  </div>
                </VCardText>
              </VCard>
            </VCol>
          </VRow>
        </VCardText>

        <VDivider />

        <VCardActions class="justify-end">
          <VBtn
            variant="outlined"
            color="secondary"
            @click="isAssignRoleModalVisible = false"
          >
            Cancel
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- 👉 Delete Confirmation Modal -->
    <VDialog
      v-model="isDeleteModalVisible"
      max-width="500"
    >
      <VCard>
        <VCardTitle class="d-flex align-center">
          <VIcon
            icon="tabler-alert-triangle"
            color="warning"
            class="me-3"
          />
          Confirm Deletion
        </VCardTitle>

        <VCardText>
          <p class="text-base mb-4">
            Are you sure you want to delete this user?
          </p>
          <p class="text-sm text-medium-emphasis">
            This action is irreversible and will permanently delete the user account.
          </p>
        </VCardText>

        <VCardActions class="justify-end">
          <VBtn
            variant="outlined"
            color="secondary"
            @click="isDeleteModalVisible = false"
          >
            Cancel
          </VBtn>
          <VBtn
            color="error"
            variant="flat"
            @click="confirmDelete"
          >
            <VIcon
              icon="tabler-trash"
              class="me-2"
            />
            Delete
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </section>
</template>

<style lang="scss">
.text-capitalize {
  text-transform: capitalize;
}

.user-list-name:not(:hover) {
  color: rgba(var(--v-theme-on-background), var(--v-medium-emphasis-opacity));
}

.cursor-pointer {
  cursor: pointer;
}

.role-card {
  block-size: 100%;
}

.role-card .v-card-text {
  block-size: 100%;
}
</style>
