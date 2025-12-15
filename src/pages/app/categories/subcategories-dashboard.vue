<script setup>
import { addDoc, collection, deleteDoc, doc, getDocs, serverTimestamp, updateDoc, query, where } from 'firebase/firestore'
import { computed, onMounted, ref } from 'vue'
import AddSubCategoryDrawer from './add-subcategory.vue'

definePage({
  meta: {
    action: 'read',
    subject: 'Auth',
  },
})

// Composable pour gérer les sous-catégories avec Firebase
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
const subCategoryToDelete = ref(null)

const showDeleteConfirmation = subCategoryId => {
  subCategoryToDelete.value = subCategoryId
  isDeleteModalVisible.value = true
}

const confirmDelete = async () => {
  if (!subCategoryToDelete.value) return
  
  try {
    // Vérifier les dépendances avant de supprimer
    const prestationsSnapshot = await getDocs(
      query(collection(db, 'prestations'), where('subCategoryId', '==', subCategoryToDelete.value))
    )
    
    const prestationsCount = prestationsSnapshot.size
    
    // Si la sous-catégorie a des prestations, afficher un message d'erreur
    if (prestationsCount > 0) {
      showNotification(
        `Impossible de supprimer cette sous-catégorie. Veuillez d'abord supprimer les ${prestationsCount} prestation${prestationsCount > 1 ? 's' : ''} qui en dépendent.`,
        'error'
      )
      isDeleteModalVisible.value = false
      subCategoryToDelete.value = null
      return
    }
    
    // Supprimer la sous-catégorie si aucune dépendance
    await deleteDoc(doc(db, 'subcategories', subCategoryToDelete.value))
    
    // Refetch sub-categories
    await fetchSubCategories()
    
    showNotification('Sub-category deleted successfully!', 'success')
  } catch (error) {
    console.error('Error deleting sub-category:', error)
    showNotification('Error deleting sub-category', 'error')
  } finally {
    isDeleteModalVisible.value = false
    subCategoryToDelete.value = null
  }
}

// 👉 Store
const searchQuery = ref('')
const selectedCategory = ref()

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
  { title: 'Image', key: 'imageUrl', sortable: false },
  { title: 'Sub-Category', key: 'name' },
  { title: 'Category', key: 'categoryName' },
  { title: 'Description', key: 'description' },
  { title: 'Actions', key: 'actions', sortable: false },
]

// Data
const subCategories = ref([])
const categories = ref([])
const totalSubCategories = ref(0)

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
    const fetchedCategories = await fetchCategories()
    
    categories.value = fetchedCategories
    
    const data = subCategoriesSnapshot.docs.map(doc => {
      const subCat = doc.data()
      const category = fetchedCategories.find(c => c.id === subCat.categoryId)
      
      return {
        id: doc.id,
        ...subCat,
        categoryName: category?.name || 'N/A',
      }
    })
    
    subCategories.value = data
    totalSubCategories.value = data.length
  } catch (error) {
    console.error('Error fetching sub-categories:', error)
    showNotification('Error loading sub-categories', 'error')
  }
}

// Load data on mount
onMounted(async () => {
  try {
    await fetchSubCategories()
  } catch (error) {
    console.error('Error loading sub-categories:', error)
    showNotification('Error loading data. Please refresh the page.', 'error')
  }
})

// Add/Edit Drawer
const isAddNewSubCategoryDrawerVisible = ref(false)
const selectedSubCategory = ref(null)

const addNewSubCategory = async subCategoryData => {
  try {
    if (selectedSubCategory.value) {
      // Update existing
      await updateDoc(doc(db, 'subcategories', selectedSubCategory.value.id), {
        ...subCategoryData,
        updatedAt: serverTimestamp(),
      })
      showNotification('Sub-category updated successfully!', 'success')
    } else {
      // Add new
      await addDoc(collection(db, 'subcategories'), {
        ...subCategoryData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
      showNotification('Sub-category created successfully!', 'success')
    }
    
    await fetchSubCategories()
    isAddNewSubCategoryDrawerVisible.value = false
    selectedSubCategory.value = null
  } catch (error) {
    console.error('Error saving sub-category:', error)
    showNotification('Error saving sub-category', 'error')
  }
}

const editSubCategory = subCategory => {
  selectedSubCategory.value = subCategory
  isAddNewSubCategoryDrawerVisible.value = true
}

// Computed for filtered sub-categories
const filteredSubCategories = computed(() => {
  let filtered = subCategories.value

  if (searchQuery.value) {
    filtered = filtered.filter(sc => 
      sc.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      sc.categoryName.toLowerCase().includes(searchQuery.value.toLowerCase()),
    )
  }

  if (selectedCategory.value) {
    filtered = filtered.filter(sc => sc.categoryId === selectedCategory.value)
  }

  return filtered
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
            placeholder="Search Sub-category"
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

        <VSpacer />

        <!-- 👉 Add sub-category button -->
        <VBtn
          prepend-icon="tabler-plus"
          @click="isAddNewSubCategoryDrawerVisible = true; selectedSubCategory = null"
        >
          Add Sub-Category
        </VBtn>
      </VCardText>

      <VDivider />

      <!-- 👉 Data table -->
      <VDataTable
        v-model:page="page"
        :headers="headers"
        :items="filteredSubCategories"
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
                icon="tabler-folder"
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

        <!-- Actions -->
        <template #item.actions="{ item }">
          <VTooltip text="Modifier la sous-catégorie">
            <template #activator="{ props }">
              <IconBtn
                v-bind="props"
                @click="editSubCategory(item)"
              >
                <VIcon icon="tabler-edit" />
              </IconBtn>
            </template>
          </VTooltip>

          <VTooltip text="Supprimer la sous-catégorie">
            <template #activator="{ props }">
              <IconBtn
                v-bind="props"
                @click="showDeleteConfirmation(item.id)"
              >
                <VIcon icon="tabler-trash" />
              </IconBtn>
            </template>
          </VTooltip>
        </template>

        <!-- Pagination -->
        <template #bottom>
          <VDivider />
          <div class="d-flex align-center justify-space-between flex-wrap gap-3 pa-5 pt-3">
            <p class="text-sm text-disabled mb-0">
              {{ paginationMeta({ page, itemsPerPage }, filteredSubCategories.length) }}
            </p>

            <VPagination
              v-model="page"
              :length="Math.ceil(filteredSubCategories.length / itemsPerPage)"
              :total-visible="$vuetify.display.xs ? 1 : Math.min(Math.ceil(filteredSubCategories.length / itemsPerPage), 5)"
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

    <!-- 👉 Add/Edit Sub-Category Drawer -->
    <AddSubCategoryDrawer
      :isDrawerOpen="isAddNewSubCategoryDrawerVisible"
      :subCategory="selectedSubCategory"
      :categories="categories"
      @update:isDrawerOpen="isAddNewSubCategoryDrawerVisible = $event"
      @subCategoryData="addNewSubCategory"
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
            Êtes-vous sûr de vouloir supprimer cette sous-catégorie ?
          </p>
          
          <!-- Afficher les dépendances si elles existent -->
          <VAlert
            v-if="subCategoryDependencies.prestations > 0"
            type="error"
            variant="tonal"
            class="mb-4"
          >
            <VAlertTitle>Impossible de supprimer</VAlertTitle>
            <div class="mt-2">
              Cette sous-catégorie ne peut pas être supprimée car elle contient :
              <ul class="mt-2 mb-0">
                <li>
                  <strong>{{ subCategoryDependencies.prestations }}</strong> prestation{{ subCategoryDependencies.prestations > 1 ? 's' : '' }}
                </li>
              </ul>
              <p class="mt-2 mb-0">
                Veuillez d'abord supprimer toutes les prestations qui en dépendent.
              </p>
            </div>
          </VAlert>
          
          <p
            v-else
            class="text-sm text-medium-emphasis"
          >
            Cette action est irréversible et supprimera définitivement la sous-catégorie.
          </p>
        </VCardText>

        <VCardActions class="justify-end">
          <VBtn
            variant="outlined"
            color="secondary"
            @click="isDeleteModalVisible = false"
          >
            Annuler
          </VBtn>
          <VBtn
            color="error"
            variant="flat"
            :disabled="subCategoryDependencies.prestations > 0"
            @click="confirmDelete"
          >
            <VIcon
              icon="tabler-trash"
              class="me-2"
            />
            Supprimer
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </section>
</template>
