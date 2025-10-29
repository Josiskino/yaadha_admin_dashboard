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

// 👉 View Admin Details Modal
const isViewModalVisible = ref(false)
const selectedAdmin = ref(null)

const showAdminDetails = admin => {
  selectedAdmin.value = admin
  isViewModalVisible.value = true
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
    showNotification('Admin deleted successfully!', 'success')
  } catch (error) {
    console.error('Error deleting admin:', error)
    showNotification('Error deleting admin', 'error')
  } finally {
    // Close modal
    isDeleteModalVisible.value = false
    userToDelete.value = null
  }
}

// 👉 Store
const searchQuery = ref('')
const selectedRole = ref()
const selectedPlan = ref()
const selectedStatus = ref()

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
    title: 'Name & First Name',
    key: 'fullName',
  },
  {
    title: 'Email',
    key: 'email',
  },
  {
    title: 'Phone',
    key: 'phone',
    width: '180px',
  },
  {
    title: 'Created Date',
    key: 'createdAt',
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

const users = computed(() => usersData.value.users)
const totalUsers = computed(() => usersData.value.totalUsers)

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
    showNotification('Admin created successfully!', 'success')
  } catch (error) {
    console.error('Error creating admin:', error)
    showNotification('Error creating admin', 'error')
  }
}

const deleteUser = async id => {
  showDeleteConfirmation(id)
}
</script>

<template>
  <section>
    <VCard class="mb-6">
      <VCardItem class="pb-4">
        <VCardTitle>Filters</VCardTitle>
      </VCardItem>

      <VCardText>
        <VRow>
          <!-- 👉 Select Role -->
          <VCol
            cols="12"
            sm="4"
          >
            <AppSelect
              v-model="selectedRole"
              placeholder="Select Role"
              :items="roles"
              clearable
              clear-icon="tabler-x"
            />
          </VCol>
        </VRow>
      </VCardText>

      <VDivider />

      <VCardText class="d-flex flex-wrap gap-4">
        <div class="me-3 d-flex gap-3">
          <AppSelect
            :model-value="itemsPerPage"
            :items="[
              { value: 10, title: '10' },
              { value: 25, title: '25' },
              { value: 50, title: '50' },
              { value: 100, title: '100' },
              { value: -1, title: 'All' },
            ]"
            style="inline-size: 6.25rem;"
            @update:model-value="itemsPerPage = parseInt($event, 10)"
          />
        </div>
        <VSpacer />

        <div class="app-user-search-filter d-flex align-center flex-wrap gap-4">
          <!-- 👉 Search  -->
          <div style="inline-size: 15.625rem;">
            <AppTextField
              v-model="searchQuery"
              placeholder="Search Admin"
            />
          </div>

          <!-- 👉 Export button -->
          <VBtn
            variant="tonal"
            color="secondary"
            prepend-icon="tabler-upload"
          >
            Export
          </VBtn>

          <!-- 👉 Add user button -->
          <VBtn
            prepend-icon="tabler-plus"
            @click="isAddNewUserDrawerVisible = true"
          >
            Add New Admin
          </VBtn>
        </div>
      </VCardText>

      <VDivider />

      <!-- SECTION datatable -->
      <VDataTableServer
        v-model:items-per-page="itemsPerPage"
        v-model:model-value="selectedRows"
        v-model:page="page"
        :items="users"
        item-value="id"
        :items-length="totalUsers"
        :headers="headers"
        class="text-no-wrap"
        show-select
        @update:options="updateOptions"
      >
        <!-- Full Name -->
        <template #item.fullName="{ item }">
          <div class="text-body-1 text-high-emphasis">
            {{ `${item.firstName || ''} ${item.name || item.lastName || ''}`.trim() }}
          </div>
        </template>

        <!-- Email -->
        <template #item.email="{ item }">
          <div class="text-body-1 text-high-emphasis">
            {{ item.email }}
          </div>
        </template>

        <!-- Phone -->
        <template #item.phone="{ item }">
          <div class="text-body-1 text-high-emphasis">
            {{ item.phone }}
          </div>
        </template>

        <!-- Created Date -->
        <template #item.createdAt="{ item }">
          <div class="text-body-1 text-high-emphasis">
            {{ item.createdAt || 'N/A' }}
          </div>
        </template>

        <!-- Actions -->
        <template #item.actions="{ item }">
          <IconBtn @click="deleteUser(item.id)">
            <VIcon icon="tabler-trash" />
          </IconBtn>

          <IconBtn @click="showAdminDetails(item)">
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
                <VListItem @click="showAdminDetails(item)">
                  <template #prepend>
                    <VIcon icon="tabler-eye" />
                  </template>

                  <VListItemTitle>View</VListItemTitle>
                </VListItem>

                <VListItem link>
                  <template #prepend>
                    <VIcon icon="tabler-pencil" />
                  </template>
                  <VListItemTitle>Edit</VListItemTitle>
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

        <!-- pagination -->
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

    <!-- 👉 View Admin Details Modal -->
    <VDialog
      v-model="isViewModalVisible"
      max-width="800"
    >
      <VCard v-if="selectedAdmin">
        <VCardTitle class="d-flex align-center">
          <VIcon
            icon="tabler-user"
            color="primary"
            class="me-3"
          />
          Admin Account Details
        </VCardTitle>

        <VDivider />

        <VCardText>
          <VRow>
            <!-- Personal Information -->
            <VCol
              cols="12"
              md="6"
            >
              <VCard variant="outlined">
                <VCardTitle class="text-h6">
                  <VIcon
                    icon="tabler-user-circle"
                    class="me-2"
                  />
                  Personal Information
                </VCardTitle>
                <VCardText>
                  <div class="mb-3">
                    <div class="text-caption text-medium-emphasis">
                      Full Name
                    </div>
                    <div class="text-body-1">
                      {{ selectedAdmin.fullName || 'N/A' }}
                    </div>
                  </div>
                  <div class="mb-3">
                    <div class="text-caption text-medium-emphasis">
                      Email
                    </div>
                    <div class="text-body-1">
                      {{ selectedAdmin.email || 'N/A' }}
                    </div>
                  </div>
                  <div class="mb-3">
                    <div class="text-caption text-medium-emphasis">
                      Phone
                    </div>
                    <div class="text-body-1">
                      {{ selectedAdmin.phone || 'N/A' }}
                    </div>
                  </div>
                  <div class="mb-3">
                    <div class="text-caption text-medium-emphasis">
                      Country
                    </div>
                    <div class="text-body-1">
                      {{ selectedAdmin.country || 'N/A' }}
                    </div>
                  </div>
                </VCardText>
              </VCard>
            </VCol>

            <!-- Account Information -->
            <VCol
              cols="12"
              md="6"
            >
              <VCard variant="outlined">
                <VCardTitle class="text-h6">
                  <VIcon
                    icon="tabler-settings"
                    class="me-2"
                  />
                  Account Information
                </VCardTitle>
                <VCardText>
                  <div class="mb-3">
                    <div class="text-caption text-medium-emphasis">
                      Username
                    </div>
                    <div class="text-body-1">
                      {{ selectedAdmin.userName || 'N/A' }}
                    </div>
                  </div>
                  <div class="mb-3">
                    <div class="text-caption text-medium-emphasis">
                      Status
                    </div>
                    <VChip
                      :color="selectedAdmin.status === 'active' ? 'success' : selectedAdmin.status === 'pending' ? 'warning' : 'secondary'"
                      size="small"
                      label
                      class="text-capitalize"
                    >
                      {{ selectedAdmin.status || 'N/A' }}
                    </VChip>
                  </div>
                  <div class="mb-3">
                    <div class="text-caption text-medium-emphasis">
                      Created Date
                    </div>
                    <div class="text-body-1">
                      {{ selectedAdmin.createdAt || 'N/A' }}
                    </div>
                  </div>
                  <div class="mb-3">
                    <div class="text-caption text-medium-emphasis">
                      Last Updated
                    </div>
                    <div class="text-body-1">
                      {{ selectedAdmin.updatedAt || 'N/A' }}
                    </div>
                  </div>
                </VCardText>
              </VCard>
            </VCol>

            <!-- Security Information -->
            <VCol cols="12">
              <VCard variant="outlined">
                <VCardTitle class="text-h6">
                  <VIcon
                    icon="tabler-shield"
                    class="me-2"
                  />
                  Security Information
                </VCardTitle>
                <VCardText>
                  <VRow>
                    <VCol
                      cols="12"
                      md="6"
                    >
                      <div class="mb-3">
                        <div class="text-caption text-medium-emphasis">
                          Password
                        </div>
                        <div class="text-body-1 font-mono">
                          ••••••••••••
                        </div>
                        <div class="text-caption text-medium-emphasis mt-1">
                          Default password: yaadhapassword
                        </div>
                      </div>
                    </VCol>
                    <VCol
                      cols="12"
                      md="6"
                    >
                      <div class="mb-3">
                        <div class="text-caption text-medium-emphasis">
                          Account Type
                        </div>
                        <div class="text-body-1 text-capitalize">
                          {{ selectedAdmin.role || 'Admin' }}
                        </div>
                      </div>
                    </VCol>
                  </VRow>
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
            @click="isViewModalVisible = false"
          >
            Close
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
            Are you sure you want to delete this admin account?
          </p>
          <p class="text-sm text-medium-emphasis">
            This action is irreversible and will permanently delete the admin account.
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
