<script setup>
import { ref, onMounted, computed } from 'vue'
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore'
import AddCategoryDrawer from './add-category.vue'

// Composable pour gérer les catégories avec Firebase
const { db } = useFirebase()

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
const categoryToDelete = ref(null)

const showDeleteConfirmation = categoryId => {
  categoryToDelete.value = categoryId
  isDeleteModalVisible.value = true
}

const confirmDelete = async () => {
  if (!categoryToDelete.value) return
  
  try {
    await deleteDoc(doc(db, 'categories', categoryToDelete.value))
    
    // Delete from selectedRows
    const index = selectedRows.value.findIndex(row => row === categoryToDelete.value)
    
    if (index !== -1)
      selectedRows.value.splice(index, 1)
    
    // Refetch categories
    const fetchedCategories = await fetchCategories()
    
    categories.value = fetchedCategories
    
    // Show success notification
    showNotification('Category deleted successfully!', 'success')
    
    console.log('Category deleted successfully')
  } catch (error) {
    console.error('Error deleting category:', error)
    showNotification('Error deleting category', 'error')
  } finally {
    // Close modal
    isDeleteModalVisible.value = false
    categoryToDelete.value = null
  }
}

// 👉 Store
const searchQuery = ref('')
const selectedStatus = ref()
const selectedParent = ref()

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
    title: 'Image',
    key: 'image',
    sortable: false,
  },
  {
    title: 'Category',
    key: 'name',
  },
  {
    title: 'Description',
    key: 'description',
  },
  {
    title: 'Sub Categories',
    key: 'subCategoriesCount',
  },
  {
    title: 'Status',
    key: 'status',
  },
  {
    title: 'Actions',
    key: 'actions',
    sortable: false,
  },
]

// 👉 Fetch categories from Firebase
const fetchCategories = async () => {
  try {
    const categoriesCollection = collection(db, 'categories')
    const snapshot = await getDocs(categoriesCollection)
    const categories = []
    
    snapshot.forEach(doc => {
      categories.push({
        id: doc.id,
        ...doc.data(),
      })
    })
    
    return categories
  } catch (error) {
    console.error('Error fetching categories:', error)
    
    return []
  }
}

const categories = ref([])
const totalCategories = ref(0)

onMounted(async () => {
  try {
    const fetchedCategories = await fetchCategories()
    
    categories.value = fetchedCategories
    totalCategories.value = fetchedCategories.length
  } catch (error) {
    console.error('Error loading categories:', error)
    showNotification('Error loading data. Please refresh the page.', 'error')
  }
})

// 👉 Filtered categories
const filteredCategories = computed(() => {
  let filtered = categories.value

  // Search by name
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    
    filtered = filtered.filter(cat => 
      cat.name.toLowerCase().includes(query) ||
      cat.description?.toLowerCase().includes(query),
    )
  }

  // Filter by status
  if (selectedStatus.value) {
    filtered = filtered.filter(cat => cat.status === selectedStatus.value)
  }

  // Filter by parent category
  if (selectedParent.value) {
    filtered = filtered.filter(cat => cat.parentId === selectedParent.value)
  }

  return filtered
})

// Paginated categories
const paginatedCategories = computed(() => {
  const start = (page.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  
  return filteredCategories.value.slice(start, end)
})

// Update total categories count
watch(filteredCategories, newCategories => {
  totalCategories.value = newCategories.length
}, { immediate: true })

// 👉 Status options
const status = [
  {
    title: 'Active',
    value: 'active',
  },
  {
    title: 'Inactive',
    value: 'inactive',
  },
  {
    title: 'Pending',
    value: 'pending',
  },
]

// Parent categories (for filtering)
const parentCategories = computed(() => 
  categories.value
    .filter(cat => !cat.parentId)
    .map(cat => ({
      title: cat.name,
      value: cat.id,
    })),
)

const resolveCategoryStatusVariant = stat => {
  const statLowerCase = stat?.toLowerCase()
  
  if (statLowerCase === 'pending')
    return 'warning'
  
  if (statLowerCase === 'active')
    return 'success'
  
  if (statLowerCase === 'inactive')
    return 'secondary'
  
  return 'primary'
}

const isAddNewCategoryDrawerVisible = ref(false)
const isEditCategoryDrawerVisible = ref(false)
const isManageSubCategoriesDrawerVisible = ref(false)
const selectedCategory = ref(null)

const addNewCategory = async categoryData => {
  try {
    console.log('Adding category with data:', categoryData)
    
    const { serverTimestamp } = await import('firebase/firestore')
    
    await addDoc(collection(db, 'categories'), {
      name: categoryData.name,
      description: categoryData.description,
      imageUrl: categoryData.imageUrl || '',
      order: categoryData.order || 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    
    console.log('Category added successfully')

    // Refetch categories
    const fetchedCategories = await fetchCategories()

    categories.value = fetchedCategories

    isAddNewCategoryDrawerVisible.value = false

    // Show success notification
    showNotification('Category created successfully!', 'success')

    console.log('Categories refreshed')
  } catch (error) {
    console.error('Error adding category:', error)
    showNotification('Error creating category', 'error')
  }
}

const editCategory = async (categoryData, categoryId) => {
  try {
    const { serverTimestamp } = await import('firebase/firestore')
    const categoryRef = doc(db, 'categories', categoryId)
    
    await updateDoc(categoryRef, {
      name: categoryData.name,
      description: categoryData.description,
      imageUrl: categoryData.imageUrl || '',
      order: categoryData.order || 0,
      updatedAt: serverTimestamp(),
    })
    
    // Refetch categories
    const fetchedCategories = await fetchCategories()
    
    categories.value = fetchedCategories
    
    isEditCategoryDrawerVisible.value = false
    
    // Show success notification
    showNotification('Category updated successfully!', 'success')
  } catch (error) {
    console.error('Error updating category:', error)
    showNotification('Error updating category', 'error')
  }
}

const deleteCategory = async id => {
  showDeleteConfirmation(id)
}

const openEditCategory = category => {
  selectedCategory.value = category
  isEditCategoryDrawerVisible.value = true
}

const openManageSubCategories = category => {
  selectedCategory.value = category
  isManageSubCategoriesDrawerVisible.value = true
}

// Statistics widgets
const widgetData = ref([
  {
    title: 'Total Categories',
    value: '0',
    change: 0,
    desc: 'All categories',
    icon: 'tabler-category',
    iconColor: 'primary',
  },
  {
    title: 'Active Categories',
    value: '0',
    change: 0,
    desc: 'Currently active',
    icon: 'tabler-shield-check',
    iconColor: 'success',
  },
  {
    title: 'Sub Categories & Services',
    value: '0',
    change: 0,
    desc: 'Total sub-categories and services',
    icon: 'tabler-folders',
    iconColor: 'info',
  },
])

// Update widget data based on categories
watch(categories, newCategories => {
  const activeCount = newCategories.filter(c => c.status === 'active').length
  const subCategoriesAndServicesCount = newCategories.filter(c => c.parentId).length
  
  widgetData.value[0].value = newCategories.length.toString()
  widgetData.value[1].value = activeCount.toString()
  widgetData.value[2].value = subCategoriesAndServicesCount.toString()
}, { immediate: true })
</script>

<template>
  <section>
    <!-- 👉 Widgets -->
    <div class="d-flex mb-6">
      <VRow>
        <template
          v-for="(data, id) in widgetData"
          :key="id"
        >
          <VCol
            cols="12"
            md="4"
            sm="6"
          >
            <VCard>
              <VCardText>
                <div class="d-flex justify-space-between">
                  <div class="d-flex flex-column gap-y-1">
                    <div class="text-body-1 text-high-emphasis">
                      {{ data.title }}
                    </div>
                    <div class="d-flex gap-x-2 align-center">
                      <h4 class="text-h4">
                        {{ data.value }}
                      </h4>
                    </div>
                    <div class="text-sm">
                      {{ data.desc }}
                    </div>
                  </div>
                  <VAvatar
                    :color="data.iconColor"
                    variant="tonal"
                    rounded
                    size="42"
                  >
                    <VIcon
                      :icon="data.icon"
                      size="26"
                    />
                  </VAvatar>
                </div>
              </VCardText>
            </VCard>
          </VCol>
        </template>
      </VRow>
    </div>

    <VCard class="mb-6">
      <VCardItem class="pb-4">
        <VCardTitle>Filters</VCardTitle>
      </VCardItem>

      <VCardText>
        <VRow>
          <!-- 👉 Select Status -->
          <VCol
            cols="12"
            sm="4"
          >
            <AppSelect
              v-model="selectedStatus"
              placeholder="Select Status"
              :items="status"
              clearable
              clear-icon="tabler-x"
            />
          </VCol>
          <!-- 👉 Select Parent -->
          <VCol
            cols="12"
            sm="4"
          >
            <AppSelect
              v-model="selectedParent"
              placeholder="Parent Category"
              :items="parentCategories"
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

        <div class="app-category-search-filter d-flex align-center flex-wrap gap-4">
          <!-- 👉 Search  -->
          <div style="inline-size: 15.625rem;">
            <AppTextField
              v-model="searchQuery"
              placeholder="Search category"
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

          <!-- 👉 Add category button -->
          <VBtn
            prepend-icon="tabler-plus"
            @click="isAddNewCategoryDrawerVisible = true"
          >
            Add Category
          </VBtn>
        </div>
      </VCardText>

      <VDivider />

      <!-- SECTION datatable -->
      <VDataTableServer
        v-model:items-per-page="itemsPerPage"
        v-model:model-value="selectedRows"
        v-model:page="page"
        :items="paginatedCategories"
        item-value="id"
        :items-length="totalCategories"
        :headers="headers"
        class="text-no-wrap"
        show-select
        @update:options="updateOptions"
      >
        <!-- Image -->
        <template #item.image="{ item }">
          <VAvatar
            size="40"
            variant="tonal"
            color="primary"
          >
            <VImg
              v-if="item.image"
              :src="item.image"
            />
            <VIcon
              v-else
              icon="tabler-photo"
            />
          </VAvatar>
        </template>

        <!-- Category Name -->
        <template #item.name="{ item }">
          <div class="d-flex align-center gap-x-3">
            <div class="d-flex flex-column">
              <h6 class="text-base font-weight-medium">
                {{ item.name }}
              </h6>
              <div class="text-sm text-medium-emphasis">
                {{ item.slug || item.id }}
              </div>
            </div>
          </div>
        </template>

        <!-- Description -->
        <template #item.description="{ item }">
          <div class="text-body-2 text-medium-emphasis">
            {{ item.description || 'No description' }}
          </div>
        </template>

        <!-- Sub Categories Count -->
        <template #item.subCategoriesCount="{ item }">
          <VChip
            color="info"
            size="small"
            variant="tonal"
          >
            {{ item.subCategories?.length || 0 }} sub-categories
          </VChip>
        </template>

        <!-- Status -->
        <template #item.status="{ item }">
          <VChip
            :color="resolveCategoryStatusVariant(item.status)"
            size="small"
            label
            class="text-capitalize"
          >
            {{ item.status || 'active' }}
          </VChip>
        </template>

        <!-- Actions -->
        <template #item.actions="{ item }">
          <IconBtn @click="deleteCategory(item.id)">
            <VIcon icon="tabler-trash" />
          </IconBtn>

          <IconBtn @click="openManageSubCategories(item)">
            <VIcon icon="tabler-folders" />
          </IconBtn>

          <IconBtn @click="openEditCategory(item)">
            <VIcon icon="tabler-pencil" />
          </IconBtn>

          <VBtn
            icon
            variant="text"
            color="medium-emphasis"
          >
            <VIcon icon="tabler-dots-vertical" />
            <VMenu activator="parent">
              <VList>
                <VListItem @click="openEditCategory(item)">
                  <template #prepend>
                    <VIcon icon="tabler-pencil" />
                  </template>
                  <VListItemTitle>Edit</VListItemTitle>
                </VListItem>

                <VListItem @click="openManageSubCategories(item)">
                  <template #prepend>
                    <VIcon icon="tabler-folders" />
                  </template>
                  <VListItemTitle>Manage Sub-categories</VListItemTitle>
                </VListItem>

                <VListItem @click="deleteCategory(item.id)">
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
            :total-items="totalCategories"
          />
        </template>
      </VDataTableServer>
      <!-- SECTION -->
    </VCard>

    <!-- 👉 Add/Edit Category Drawer -->
    <AddCategoryDrawer
      v-model:is-drawer-open="isAddNewCategoryDrawerVisible"
      :category="selectedCategory"
      @category-data="addNewCategory"
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
            Are you sure you want to delete this category?
          </p>
          <p class="text-sm text-medium-emphasis">
            This action is irreversible and will permanently delete the category along with all its sub-categories.
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
