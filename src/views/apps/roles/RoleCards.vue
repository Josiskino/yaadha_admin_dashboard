<script setup>
import { useFirebase } from '@/composables/useFirebase'
import avatar1 from '@images/avatars/avatar-1.png'
import avatar2 from '@images/avatars/avatar-2.png'
import avatar3 from '@images/avatars/avatar-3.png'
import avatar4 from '@images/avatars/avatar-4.png'
import avatar5 from '@images/avatars/avatar-5.png'
import avatar6 from '@images/avatars/avatar-6.png'
import avatar7 from '@images/avatars/avatar-7.png'
import girlUsingMobile from '@images/pages/girl-using-mobile.png'

// Firebase composable
const { getDocuments } = useFirebase()

// Reactive data
const adminUsers = ref([])
const managerUsers = ref([])

// Fetch users from Firestore
const fetchUsers = async () => {
  try {
    const adminDocs = await getDocuments('admin')
    
    // Filter users by role
    adminUsers.value = adminDocs.filter(doc => doc.role === 'administrator')
    managerUsers.value = adminDocs.filter(doc => doc.role === 'manager')
  } catch (error) {
    console.error('Error fetching users:', error)
  }
}

// Expose fetchUsers for parent component to refresh data
defineExpose({
  refreshData: fetchUsers,
})

// Initialize data
await fetchUsers()

const roles = computed(() => [
  {
    role: 'Administrator',
    users: [
      avatar1,
      avatar2,
      avatar3,
      avatar4,
    ],
    count: adminUsers.value.length,
    details: {
      name: 'Administrator',
      permissions: [
        {
          name: 'User Management',
          read: true,
          write: true,
          create: true,
        },
        {
          name: 'Disputes Management',
          read: true,
          write: true,
          create: true,
        },
        {
          name: 'API Control',
          read: true,
          write: true,
          create: true,
        },
      ],
    },
  },
  {
    role: 'Manager',
    users: [
      avatar1,
      avatar2,
      avatar3,
      avatar4,
      avatar5,
      avatar6,
      avatar7,
    ],
    count: managerUsers.value.length,
    details: {
      name: 'Manager',
      permissions: [
        {
          name: 'Reporting',
          read: true,
          write: true,
          create: false,
        },
        {
          name: 'Payroll',
          read: true,
          write: true,
          create: true,
        },
        {
          name: 'User Management',
          read: true,
          write: true,
          create: true,
        },
      ],
    },
  },
])

const isRoleDialogVisible = ref(false)
const roleDetail = ref()
const isAddRoleDialogVisible = ref(false)

const editPermission = value => {
  isRoleDialogVisible.value = true
  roleDetail.value = value
}
</script>

<template>
  <VRow>
    <!-- 👉 Roles -->
    <VCol
      v-for="item in roles"
      :key="item.role"
      cols="12"
      sm="6"
      lg="4"
    >
      <VCard>
        <VCardText class="d-flex align-center pb-4">
          <div class="text-body-1">
            Total {{ item.count }} users
          </div>

          <VSpacer />

          <div class="v-avatar-group">
            <template
              v-for="(user, index) in item.users.slice(0, Math.min(4, item.count))"
              :key="user"
            >
              <VAvatar
                v-if="item.count > 4 && index < 3"
                size="40"
                :image="user"
              />

              <VAvatar
                v-if="item.count <= 4"
                size="40"
                :image="user"
              />
            </template>
            <VAvatar
              v-if="item.count > 4"
              :color="$vuetify.theme.current.dark ? '#373B50' : '#EEEDF0'"
            >
              <span>
                +{{ item.count - 3 }}
              </span>
            </VAvatar>
          </div>
        </VCardText>

        <VCardText>
          <div class="d-flex justify-space-between align-center">
            <div>
              <h5 class="text-h5">
                {{ item.role }}
              </h5>
              <div class="d-flex align-center">
                <a
                  href="javascript:void(0)"
                  @click="editPermission(item.details)"
                >
                  Edit Role
                </a>
              </div>
            </div>
            <IconBtn>
              <VIcon
                icon="tabler-copy"
                class="text-high-emphasis"
              />
            </IconBtn>
          </div>
        </VCardText>
      </VCard>
    </VCol>

    <!-- 👉 Add New Role -->
    <VCol
      cols="12"
      sm="6"
      lg="4"
    >
      <VCard
        class="h-100"
        :ripple="false"
      >
        <VRow
          no-gutters
          class="h-100"
        >
          <VCol
            cols="5"
            class="d-flex flex-column justify-end align-center mt-2"
          >
            <img
              width="60"
              :src="girlUsingMobile"
            >
          </VCol>

          <VCol cols="7">
            <VCardText class="d-flex flex-column align-end justify-end gap-2">
              <VBtn
                size="small"
                @click="isAddRoleDialogVisible = true"
              >
                Add New Role
              </VBtn>
              <div class="text-end text-caption">
                Add new role,<br> if it doesn't exist.
              </div>
            </VCardText>
          </VCol>
        </VRow>
      </VCard>
      <AddEditRoleDialog v-model:is-dialog-visible="isAddRoleDialogVisible" />
    </VCol>
  </VRow>

  <AddEditRoleDialog
    v-model:is-dialog-visible="isRoleDialogVisible"
    v-model:role-permissions="roleDetail"
  />
</template>
