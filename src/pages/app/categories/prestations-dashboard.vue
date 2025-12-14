<script setup>
import { ref, onMounted, computed } from 'vue'
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore'
import AddPrestationDrawer from './add-prestation.vue'

definePage({
  meta: {
    action: 'read',
    subject: 'Auth',
  },
})

// Composable pour gérer les prestations avec Firebase
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
const prestationToDelete = ref(null)

const showDeleteConfirmation = prestationId => {
  prestationToDelete.value = prestationId
  isDeleteModalVisible.value = true
}

const confirmDelete = async () => {
  if (!prestationToDelete.value) return
  
  try {
    await deleteDoc(doc(db, 'prestations', prestationToDelete.value))
    
    await fetchPrestations()
    
    showNotification('Prestation deleted successfully!', 'success')
  } catch (error) {
    console.error('Error deleting prestation:', error)
    showNotification('Error deleting prestation', 'error')
  } finally {
    isDeleteModalVisible.value = false
    prestationToDelete.value = null
  }
}

// 👉 Store
const searchQuery = ref('')
const selectedCategory = ref()
const selectedSubCategory = ref()

// Data table options
const itemsPerPage = ref(10)
const page = ref(1)
const sortBy = ref()
const orderBy = ref()

const updateOptions = options => {
  sortBy.value = options.sortBy[0]?.key
  orderBy.value = options.sortBy[0]?.order
}

// Headers
const headers = [
  { title: 'Image', key: 'imageUrl', sortable: false },
  { title: 'Prestation', key: 'name' },
  { title: 'Category', key: 'categoryName' },
  { title: 'Sub-Category', key: 'subCategoryName' },
  { title: 'Description', key: 'description' },
  { title: 'Actions', key: 'actions', sortable: false },
]

// Data
const prestations = ref([])
const categories = ref([])
const subCategories = ref([])
const totalPrestations = ref(0)

// Fetch categories
const fetchCategories = async () => {
  try {
    const categoriesSnapshot = await getDocs(collection(db, 'categories'))
    
    return categoriesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }))
  } catch (error) {
    console.error('Error fetching categories:', error)
    
    return []
  }
}

// Fetch sub-categories
const fetchSubCategories = async () => {
  try {
    const subCategoriesSnapshot = await getDocs(collection(db, 'subcategories'))
    
    return subCategoriesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }))
  } catch (error) {
    console.error('Error fetching sub-categories:', error)
    
    return []
  }
}

// Fetch prestations
const fetchPrestations = async () => {
  try {
    const prestationsSnapshot = await getDocs(collection(db, 'prestations'))
    const fetchedCategories = await fetchCategories()
    const fetchedSubCategories = await fetchSubCategories()
    
    categories.value = fetchedCategories
    subCategories.value = fetchedSubCategories
    
    const data = prestationsSnapshot.docs.map(doc => {
      const prestation = doc.data()
      const category = fetchedCategories.find(c => c.id === prestation.categoryId)
      const subCategory = fetchedSubCategories.find(sc => sc.id === prestation.subCategoryId)
      
      return {
        id: doc.id,
        ...prestation,
        categoryName: category?.name || 'N/A',
        subCategoryName: subCategory?.name || 'N/A',
      }
    })
    
    prestations.value = data
    totalPrestations.value = data.length
  } catch (error) {
    console.error('Error fetching prestations:', error)
    showNotification('Error loading prestations', 'error')
  }
}

// Load data on mount
onMounted(async () => {
  try {
    await fetchPrestations()
  } catch (error) {
    console.error('Error loading prestations:', error)
    showNotification('Error loading data. Please refresh the page.', 'error')
  }
})

// Add/Edit Drawer
const isAddNewPrestationDrawerVisible = ref(false)
const selectedPrestation = ref(null)

const addNewPrestation = async prestationData => {
  try {
    if (selectedPrestation.value) {
      // Update existing
      await updateDoc(doc(db, 'prestations', selectedPrestation.value.id), {
        ...prestationData,
        updatedAt: serverTimestamp(),
      })
      showNotification('Prestation updated successfully!', 'success')
    } else {
      // Add new
      await addDoc(collection(db, 'prestations'), {
        ...prestationData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
      showNotification('Prestation created successfully!', 'success')
    }
    
    await fetchPrestations()
    isAddNewPrestationDrawerVisible.value = false
    selectedPrestation.value = null
  } catch (error) {
    console.error('Error saving prestation:', error)
    showNotification('Error saving prestation', 'error')
  }
}

const editPrestation = prestation => {
  selectedPrestation.value = prestation
  isAddNewPrestationDrawerVisible.value = true
}

// Computed for filtered prestations
const filteredPrestations = computed(() => {
  let filtered = prestations.value

  if (searchQuery.value) {
    filtered = filtered.filter(p => 
      p.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      p.categoryName.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      p.subCategoryName.toLowerCase().includes(searchQuery.value.toLowerCase()),
    )
  }

  if (selectedCategory.value) {
    filtered = filtered.filter(p => p.categoryId === selectedCategory.value)
  }

  if (selectedSubCategory.value) {
    filtered = filtered.filter(p => p.subCategoryId === selectedSubCategory.value)
  }

  return filtered
})

// Filtered sub-categories based on selected category
const filteredSubCategories = computed(() => {
  if (!selectedCategory.value) return subCategories.value
  
  return subCategories.value.filter(sc => sc.categoryId === selectedCategory.value)
})
</script>

<template>
  <section>
    <VCard>
      <VCardText class="d-flex flex-wrap gap-4">
        <!-- 👉 Search -->
        <div class="me-3" style="inline-size: 250px;">
          <AppTextField
            v-model="searchQuery"
            placeholder="Search Prestation"
            density="compact"
          />
        </div>

        <!-- 👉 Filter by Category -->
        <div class="me-3" style="inline-size: 200px;">
          <AppSelect
            v-model="selectedCategory"
            placeholder="Select Category"
            :items="categories"
            item-title="name"
            item-value="id"
            clearable
            density="compact"
          />
        </div>

        <!-- 👉 Filter by Sub-Category -->
        <div class="me-3" style="inline-size: 200px;">
          <AppSelect
            v-model="selectedSubCategory"
            placeholder="Select Sub-Category"
            :items="filteredSubCategories"
            item-title="name"
            item-value="id"
            clearable
            density="compact"
          />
        </div>

        <VSpacer />

        <!-- 👉 Add prestation button -->
        <VBtn
          prepend-icon="tabler-plus"
          @click="isAddNewPrestationDrawerVisible = true; selectedPrestation = null"
        >
          Add Prestation
        </VBtn>
      </VCardText>

      <VDivider />

      <!-- 👉 Data table -->
      <VDataTable
        v-model:page="page"
        :headers="headers"
        :items="filteredPrestations"
        :items-per-page="itemsPerPage"
        class="text-no-wrap"
        @update:options="updateOptions"
      >
        <!-- Image -->
        <template #item.imageUrl="{ item }">
          <div class="d-flex align-center gap-2">
            <VAvatar
              size="38"
              :image="item.imageUrl"
              :color="!item.imageUrl ? 'primary' : undefined"
            >
              <VIcon
                v-if="!item.imageUrl"
                icon="tabler-briefcase"
              />
            </VAvatar>
          </div>
        </template>

        <!-- Name -->
        <template #item.name="{ item }">
          <div class="d-flex flex-column">
            <span class="font-weight-medium">{{ item.name }}</span>
          </div>
        </template>

        <!-- Description -->
        <template #item.description="{ item }">
          <div style="max-width: 300px;">
            <span class="text-sm">{{ item.description || 'N/A' }}</span>
          </div>
        </template>

        <!-- Actions -->
        <template #item.actions="{ item }">
          <IconBtn @click="editPrestation(item)">
            <VIcon icon="tabler-edit" />
          </IconBtn>

          <IconBtn @click="showDeleteConfirmation(item.id)">
            <VIcon icon="tabler-trash" />
          </IconBtn>
        </template>

        <!-- Pagination -->
        <template #bottom>
          <VDivider />
          <div class="d-flex align-center justify-space-between flex-wrap gap-3 pa-5 pt-3">
            <p class="text-sm text-disabled mb-0">
              {{ paginationMeta({ page, itemsPerPage }, filteredPrestations.length) }}
            </p>

            <VPagination
              v-model="page"
              :length="Math.ceil(filteredPrestations.length / itemsPerPage)"
              :total-visible="$vuetify.display.xs ? 1 : Math.min(Math.ceil(filteredPrestations.length / itemsPerPage), 5)"
            >
              <template #prev="slotProps">
                <VBtn
                  variant="tonal"
                  color="default"
                  v-bind="slotProps"
                  :icon="false"
                >
                  Previous
                </VBtn>
              </template>

              <template #next="slotProps">
                <VBtn
                  variant="tonal"
                  color="default"
                  v-bind="slotProps"
                  :icon="false"
                >
                  Next
                </VBtn>
              </template>
            </VPagination>
          </div>
        </template>
      </VDataTable>
    </VCard>

    <!-- 👉 Add/Edit Prestation Drawer -->
    <AddPrestationDrawer
      v-model:is-drawer-open="isAddNewPrestationDrawerVisible"
      :prestation="selectedPrestation"
      :categories="categories"
      :sub-categories="subCategories"
      @prestation-data="addNewPrestation"
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
            Are you sure you want to delete this prestation?
          </p>
          <p class="text-sm text-medium-emphasis">
            This action is irreversible.
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
