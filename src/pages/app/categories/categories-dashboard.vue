<script setup>
import { ref, onMounted, computed } from 'vue'
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, serverTimestamp, query, where } from 'firebase/firestore'
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
const categoryDependencies = ref({ subCategories: 0, prestations: 0 })

const showDeleteConfirmation = async categoryId => {
  categoryToDelete.value = categoryId
  
  // Vérifier les dépendances avant d'afficher le modal
  try {
    const [subCategoriesSnapshot, prestationsSnapshot] = await Promise.all([
      getDocs(query(collection(db, 'subcategories'), where('categoryId', '==', categoryId))),
      getDocs(query(collection(db, 'prestations'), where('categoryId', '==', categoryId))),
    ])
    
    categoryDependencies.value = {
      subCategories: subCategoriesSnapshot.size,
      prestations: prestationsSnapshot.size,
    }
  } catch (error) {
    console.error('Error checking dependencies:', error)
    categoryDependencies.value = { subCategories: 0, prestations: 0 }
  }
  
  isDeleteModalVisible.value = true
}

const confirmDelete = async () => {
  if (!categoryToDelete.value) return
  
  try {
    // Vérifier les dépendances avant de supprimer
    const [subCategoriesSnapshot, prestationsSnapshot] = await Promise.all([
      getDocs(query(collection(db, 'subcategories'), where('categoryId', '==', categoryToDelete.value))),
      getDocs(query(collection(db, 'prestations'), where('categoryId', '==', categoryToDelete.value))),
    ])
    
    const subCategoriesCount = subCategoriesSnapshot.size
    const prestationsCount = prestationsSnapshot.size
    
    // Si la catégorie a des dépendances, afficher un message d'erreur
    if (subCategoriesCount > 0 || prestationsCount > 0) {
      const messages = []
      if (subCategoriesCount > 0) {
        messages.push(`${subCategoriesCount} sous-catégorie${subCategoriesCount > 1 ? 's' : ''}`)
      }
      if (prestationsCount > 0) {
        messages.push(`${prestationsCount} prestation${prestationsCount > 1 ? 's' : ''}`)
      }
      
      showNotification(
        `Impossible de supprimer cette catégorie. Veuillez d'abord supprimer ${messages.join(' et ')} qui en dépendent.`,
        'error'
      )
      isDeleteModalVisible.value = false
      categoryToDelete.value = null
      return
    }
    
    // Supprimer la catégorie si aucune dépendance
    await deleteDoc(doc(db, 'categories', categoryToDelete.value))
    
    // Delete from selectedRows
    const index = selectedRows.value.findIndex(row => row === categoryToDelete.value)
    
    if (index !== -1)
      selectedRows.value.splice(index, 1)
    
    // Refetch categories and subcategories
    const [fetchedCategories, fetchedSubCategories] = await Promise.all([
      fetchCategories(),
      fetchSubCategories(),
    ])
    
    // Compter les sous-catégories pour chaque catégorie
    const categoriesWithCount = fetchedCategories.map(category => {
      const subCategoriesCount = fetchedSubCategories.filter(
        subCat => subCat.categoryId === category.id
      ).length
      
      return {
        ...category,
        subCategoriesCount,
      }
    })
    
    categories.value = categoriesWithCount
    subCategories.value = fetchedSubCategories
    
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

// 👉 Fetch subcategories from Firebase
const fetchSubCategories = async () => {
  try {
    const subCategoriesCollection = collection(db, 'subcategories')
    const snapshot = await getDocs(subCategoriesCollection)
    const subCategories = []
    
    snapshot.forEach(doc => {
      subCategories.push({
        id: doc.id,
        ...doc.data(),
      })
    })
    
    return subCategories
  } catch (error) {
    console.error('Error fetching subcategories:', error)
    return []
  }
}

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
const subCategories = ref([])
const totalCategories = ref(0)

onMounted(async () => {
  try {
    // Charger les catégories et sous-catégories en parallèle
    const [fetchedCategories, fetchedSubCategories] = await Promise.all([
      fetchCategories(),
      fetchSubCategories(),
    ])
    
    // Compter les sous-catégories pour chaque catégorie
    const categoriesWithCount = fetchedCategories.map(category => {
      const subCategoriesCount = fetchedSubCategories.filter(
        subCat => subCat.categoryId === category.id
      ).length
      
      return {
        ...category,
        subCategoriesCount,
      }
    })
    
    categories.value = categoriesWithCount
    subCategories.value = fetchedSubCategories
    totalCategories.value = categoriesWithCount.length
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
const isManageSubCategoriesModalVisible = ref(false)
const selectedCategory = ref(null)
const categorySubCategories = ref([])
const selectedCategoryForSubCategories = ref(null)

const addNewCategory = async categoryData => {
  try {
    if (selectedCategory.value) {
      // Update existing category
      await updateDoc(doc(db, 'categories', selectedCategory.value.id), {
        ...categoryData,
        updatedAt: serverTimestamp(),
      })
      showNotification('Category updated successfully!', 'success')
    } else {
      // Add new category
      await addDoc(collection(db, 'categories'), {
        ...categoryData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
      showNotification('Category created successfully!', 'success')
    }
    
    // Refetch categories
    const fetchedCategories = await fetchCategories()
    categories.value = fetchedCategories
    
    isAddNewCategoryDrawerVisible.value = false
    selectedCategory.value = null
  } catch (error) {
    console.error('Error saving category:', error)
    showNotification('Error saving category', 'error')
  }
}

const deleteCategory = async id => {
  showDeleteConfirmation(id)
}

const openEditCategory = category => {
  selectedCategory.value = category
  isAddNewCategoryDrawerVisible.value = true
}

const openManageSubCategories = async category => {
  selectedCategoryForSubCategories.value = category
  
  // Charger les sous-catégories de cette catégorie
  try {
    const subCategoriesSnapshot = await getDocs(
      query(collection(db, 'subcategories'), where('categoryId', '==', category.id))
    )
    
    categorySubCategories.value = subCategoriesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }))
    
    isManageSubCategoriesModalVisible.value = true
  } catch (error) {
    console.error('Error fetching sub-categories:', error)
    showNotification('Erreur lors du chargement des sous-catégories', 'error')
  }
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

          <!-- 👉 Import en masse button -->
          <VBtn
            variant="tonal"
            color="info"
            prepend-icon="tabler-file-import"
            @click="$router.push({ name: 'categories-import-data' })"
          >
            Import en masse
          </VBtn>

          <!-- 👉 Add category button -->
          <VBtn
            prepend-icon="tabler-plus"
            @click="isAddNewCategoryDrawerVisible = true; selectedCategory = null"
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
            {{ item.subCategoriesCount || 0 }} sous-catégories
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
          <VTooltip text="Supprimer la catégorie">
            <template #activator="{ props }">
              <IconBtn
                v-bind="props"
                @click="deleteCategory(item.id)"
              >
                <VIcon icon="tabler-trash" />
              </IconBtn>
            </template>
          </VTooltip>

          <VTooltip text="Gérer les sous-catégories">
            <template #activator="{ props }">
              <IconBtn
                v-bind="props"
                @click="openManageSubCategories(item)"
              >
                <VIcon icon="tabler-folders" />
              </IconBtn>
            </template>
          </VTooltip>

          <VTooltip text="Modifier la catégorie">
            <template #activator="{ props }">
              <IconBtn
                v-bind="props"
                @click="openEditCategory(item)"
              >
                <VIcon icon="tabler-pencil" />
              </IconBtn>
            </template>
          </VTooltip>

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
            Êtes-vous sûr de vouloir supprimer cette catégorie ?
          </p>
          
          <!-- Afficher les dépendances si elles existent -->
          <VAlert
            v-if="categoryDependencies.subCategories > 0 || categoryDependencies.prestations > 0"
            type="error"
            variant="tonal"
            class="mb-4"
          >
            <VAlertTitle>Impossible de supprimer</VAlertTitle>
            <div class="mt-2">
              Cette catégorie ne peut pas être supprimée car elle contient :
              <ul class="mt-2 mb-0">
                <li v-if="categoryDependencies.subCategories > 0">
                  <strong>{{ categoryDependencies.subCategories }}</strong> sous-catégorie{{ categoryDependencies.subCategories > 1 ? 's' : '' }}
                </li>
                <li v-if="categoryDependencies.prestations > 0">
                  <strong>{{ categoryDependencies.prestations }}</strong> prestation{{ categoryDependencies.prestations > 1 ? 's' : '' }}
                </li>
              </ul>
              <p class="mt-2 mb-0">
                Veuillez d'abord supprimer toutes les sous-catégories et prestations qui en dépendent.
              </p>
            </div>
          </VAlert>
          
          <p
            v-else
            class="text-sm text-medium-emphasis"
          >
            Cette action est irréversible et supprimera définitivement la catégorie.
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
            :disabled="categoryDependencies.subCategories > 0 || categoryDependencies.prestations > 0"
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

    <!-- 👉 Modal pour afficher les sous-catégories -->
    <VDialog
      v-model="isManageSubCategoriesModalVisible"
      max-width="800"
      scrollable
    >
      <VCard>
        <VCardTitle class="d-flex align-center justify-space-between pa-6">
          <div class="d-flex align-center">
            <VIcon
              icon="tabler-folders"
              color="primary"
              class="me-3"
              size="28"
            />
            <div>
              <div class="text-h5">
                Sous-catégories
              </div>
              <div
                v-if="selectedCategoryForSubCategories"
                class="text-body-2 text-medium-emphasis"
              >
                Catégorie : {{ selectedCategoryForSubCategories.name }}
              </div>
            </div>
          </div>
          <VBtn
            icon
            variant="text"
            size="small"
            @click="isManageSubCategoriesModalVisible = false"
          >
            <VIcon icon="tabler-x" />
          </VBtn>
        </VCardTitle>

        <VDivider />

        <VCardText class="pa-6">
          <div v-if="categorySubCategories.length === 0">
            <VAlert
              type="info"
              variant="tonal"
              class="mb-0"
            >
              <VAlertTitle>Aucune sous-catégorie</VAlertTitle>
              Cette catégorie n'a pas encore de sous-catégories.
            </VAlert>
          </div>

          <div
            v-else
            class="d-flex flex-column gap-4"
          >
            <VCard
              v-for="subCategory in categorySubCategories"
              :key="subCategory.id"
              variant="outlined"
              class="subcategory-card"
            >
              <VCardText class="d-flex align-center justify-space-between pa-4">
                <div class="d-flex align-center flex-grow-1">
                  <VAvatar
                    v-if="subCategory.imageUrl"
                    size="48"
                    rounded
                    class="me-4"
                  >
                    <VImg :src="subCategory.imageUrl" />
                  </VAvatar>
                  <VAvatar
                    v-else
                    size="48"
                    rounded
                    color="primary"
                    variant="tonal"
                    class="me-4"
                  >
                    <VIcon
                      icon="tabler-folder"
                      size="24"
                    />
                  </VAvatar>
                  
                  <div class="flex-grow-1">
                    <div class="text-h6 mb-1">
                      {{ subCategory.name }}
                    </div>
                    <div
                      v-if="subCategory.description"
                      class="text-body-2 text-medium-emphasis"
                    >
                      {{ subCategory.description }}
                    </div>
                    <div
                      v-else
                      class="text-body-2 text-disabled"
                    >
                      Aucune description
                    </div>
                  </div>
                </div>

                <div class="d-flex align-center gap-2">
                  <VBtn
                    icon
                    variant="text"
                    size="small"
                    color="primary"
                    @click="$router.push({ name: 'categories-subcategories-dashboard', query: { category: selectedCategoryForSubCategories?.id } })"
                  >
                    <VIcon icon="tabler-external-link" />
                    <VTooltip activator="parent">
                      Voir les détails
                    </VTooltip>
                  </VBtn>
                </div>
              </VCardText>
            </VCard>
          </div>
        </VCardText>

        <VDivider />

        <VCardActions class="pa-6">
          <VSpacer />
          <VBtn
            variant="outlined"
            color="secondary"
            @click="isManageSubCategoriesModalVisible = false"
          >
            Fermer
          </VBtn>
          <VBtn
            color="primary"
            prepend-icon="tabler-plus"
            @click="$router.push({ name: 'categories-subcategories-dashboard' }); isManageSubCategoriesModalVisible = false"
          >
            Ajouter une sous-catégorie
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </section>
</template>

<style scoped>
.subcategory-card {
  transition: all 0.2s ease;
}

.subcategory-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}
</style>
