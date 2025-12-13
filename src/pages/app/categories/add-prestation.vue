<script setup>
import { useFirebase } from '@/composables/useFirebase'
import { PerfectScrollbar } from 'vue3-perfect-scrollbar'

const props = defineProps({
  isDrawerOpen: {
    type: Boolean,
    required: true,
  },
  prestation: {
    type: Object,
    default: null,
  },
  categories: {
    type: Array,
    default: () => [],
  },
  subCategories: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits([
  'update:isDrawerOpen',
  'prestationData',
])

const isFormValid = ref(false)
const refForm = ref()
const fileInputRef = ref()
const name = ref('')
const description = ref('')
const categoryId = ref('')
const subCategoryId = ref('')
const status = ref('active')
const order = ref(0)
const imageFile = ref(null)
const imageUrl = ref('')

// Check if editing
const isEditing = computed(() => !!props.prestation)

// Filtered sub-categories based on selected category
const filteredSubCategories = computed(() => {
  if (!categoryId.value) return []
  
  return props.subCategories.filter(sc => sc.categoryId === categoryId.value)
})

// Populate form if editing
watch(() => props.prestation, newPrestation => {
  if (newPrestation) {
    name.value = newPrestation.name || ''
    description.value = newPrestation.description || ''
    categoryId.value = newPrestation.categoryId || ''
    subCategoryId.value = newPrestation.subCategoryId || ''
    status.value = newPrestation.status || 'active'
    order.value = newPrestation.order || 0
    imageUrl.value = newPrestation.imageUrl || ''
  } else {
    resetForm()
  }
}, { immediate: true })

// Reset subCategoryId when categoryId changes
watch(categoryId, () => {
  if (!isEditing.value) {
    subCategoryId.value = ''
  }
})

const closeNavigationDrawer = () => {
  emit('update:isDrawerOpen', false)
  nextTick(() => {
    refForm.value?.reset()
    refForm.value?.resetValidation()
    resetForm()
  })
}

const resetForm = () => {
  name.value = ''
  description.value = ''
  categoryId.value = ''
  subCategoryId.value = ''
  status.value = 'active'
  order.value = 0
  imageFile.value = null
  imageUrl.value = ''
}

const handleFileChange = async event => {
  const file = event.target.files?.[0]
  
  if (file) {
    if (file.size > 2 * 1024 * 1024) {
      alert('Image too large. Please choose an image less than 2MB.')
      
      return
    }

    imageFile.value = file
    
    const reader = new FileReader()
    
    reader.onload = e => {
      imageUrl.value = e.target.result
    }
    reader.readAsDataURL(file)
    
    try {
      const { storage } = useFirebase()
      const { ref, uploadBytes, getDownloadURL } = await import('firebase/storage')
      
      const storageRef = ref(storage, `prestations/${Date.now()}_${file.name}`)

      await uploadBytes(storageRef, file)

      const url = await getDownloadURL(storageRef)
      
      imageUrl.value = url
      imageFile.value = null
    } catch (error) {
      console.error('Error uploading image:', error)
    }
  }
}

const onSubmit = () => {
  refForm.value?.validate().then(({ valid }) => {
    if (valid) {
      let imageToInclude = imageUrl.value
      if (imageToInclude && imageToInclude.startsWith('data:') && imageToInclude.length > 1000000) {
        imageToInclude = null
      }

      const dataToEmit = {
        name: name.value,
        description: description.value,
        categoryId: categoryId.value,
        subCategoryId: subCategoryId.value,
        status: status.value,
        order: order.value,
        imageUrl: imageToInclude,
      }
      
      if (isEditing.value) {
        dataToEmit.id = props.prestation.id
      }
      
      emit('prestationData', dataToEmit)
      emit('update:isDrawerOpen', false)
      
      nextTick(() => {
        refForm.value?.reset()
        refForm.value?.resetValidation()
        resetForm()
      })
    }
  })
}

const handleDrawerModelValueUpdate = val => {
  emit('update:isDrawerOpen', val)
}

const statusOptions = [
  { title: 'Active', value: 'active' },
  { title: 'Inactive', value: 'inactive' },
  { title: 'Pending', value: 'pending' },
]
</script>

<template>
  <VNavigationDrawer
    temporary
    :width="400"
    location="end"
    class="scrollable-content"
    :model-value="props.isDrawerOpen"
    @update:model-value="handleDrawerModelValueUpdate"
  >
    <!-- 👉 Title -->
    <div class="d-flex align-center pa-6">
      <h5 class="text-h5">
        {{ isEditing ? 'Edit Prestation' : 'Add New Prestation' }}
      </h5>
      <VSpacer />
      <IconBtn
        size="small"
        @click="closeNavigationDrawer"
      >
        <VIcon
          icon="tabler-x"
          size="22"
        />
      </IconBtn>
    </div>

    <VDivider />

    <PerfectScrollbar :options="{ wheelPropagation: false }">
      <VCard flat>
        <VCardText>
          <!-- 👉 Form -->
          <VForm
            ref="refForm"
            v-model="isFormValid"
            @submit.prevent="onSubmit"
          >
            <VRow>
              <!-- 👉 Image Upload -->
              <VCol cols="12">
                <div class="d-flex flex-column gap-2">
                  <span class="text-sm mb-2 d-block">Prestation Image</span>
                  
                  <input
                    ref="fileInputRef"
                    type="file"
                    accept="image/png, image/jpeg, image/jpg"
                    class="d-none"
                    @change="handleFileChange"
                  >
                  
                  <VCard
                    v-if="imageUrl"
                    class="image-upload-card cursor-pointer"
                    @click="() => fileInputRef?.click()"
                  >
                    <VCardText class="text-center pa-4">
                      <VImg
                        :src="imageUrl"
                        cover
                        style="border-radius: 6px; max-block-size: 200px; object-fit: cover;"
                      />
                    </VCardText>
                  </VCard>
                  
                  <VCard
                    v-else
                    class="image-upload-card cursor-pointer border-dashed"
                    @click="() => fileInputRef?.click()"
                  >
                    <VCardText class="text-center pa-8">
                      <VIcon
                        icon="tabler-photo"
                        size="48"
                        class="text-disabled mb-4"
                      />
                      <div class="text-base mb-2">
                        Click to upload image
                      </div>
                      <span class="text-xs text-disabled">PNG or JPG. Max 2MB</span>
                    </VCardText>
                  </VCard>
                </div>
              </VCol>

              <!-- 👉 Category Selection -->
              <VCol cols="12">
                <AppSelect
                  v-model="categoryId"
                  :rules="[requiredValidator]"
                  label="Category"
                  placeholder="Select Category"
                  :items="categories"
                  item-title="name"
                  item-value="id"
                />
              </VCol>

              <!-- 👉 Sub-Category Selection -->
              <VCol cols="12">
                <AppSelect
                  v-model="subCategoryId"
                  :rules="[requiredValidator]"
                  label="Sub-Category"
                  placeholder="Select Sub-Category"
                  :items="filteredSubCategories"
                  item-title="name"
                  item-value="id"
                  :disabled="!categoryId"
                />
                <span
                  v-if="!categoryId"
                  class="text-xs text-disabled"
                >
                  Please select a category first
                </span>
              </VCol>

              <!-- 👉 Prestation Name -->
              <VCol cols="12">
                <AppTextField
                  v-model="name"
                  :rules="[requiredValidator]"
                  label="Prestation Name"
                  placeholder="e.g. Women's Haircut, Manicure"
                />
              </VCol>

              <!-- 👉 Description -->
              <VCol cols="12">
                <AppTextarea
                  v-model="description"
                  label="Description"
                  placeholder="Enter prestation description"
                  rows="3"
                />
              </VCol>

              <!-- 👉 Order -->
              <VCol cols="12">
                <AppTextField
                  v-model.number="order"
                  type="number"
                  label="Display Order"
                  placeholder="0"
                />
              </VCol>

              <!-- 👉 Status -->
              <VCol cols="12">
                <AppSelect
                  v-model="status"
                  :items="statusOptions"
                  label="Status"
                  placeholder="Select Status"
                />
              </VCol>

              <!-- 👉 Actions -->
              <VCol cols="12">
                <VBtn
                  type="submit"
                  block
                  class="me-3"
                >
                  {{ isEditing ? 'Update Prestation' : 'Add Prestation' }}
                </VBtn>
                <VBtn
                  variant="outlined"
                  color="secondary"
                  block
                  class="mt-2"
                  @click="closeNavigationDrawer"
                >
                  Cancel
                </VBtn>
              </VCol>
            </VRow>
          </VForm>
        </VCardText>
      </VCard>
    </PerfectScrollbar>
  </VNavigationDrawer>
</template>

<style scoped>
.scrollable-content {
  overflow: hidden !important;
}

.image-upload-card {
  transition: all 0.3s ease;
}

.image-upload-card:hover {
  background-color: rgba(var(--v-theme-primary), 0.04);
}

.border-dashed {
  border: 2px dashed rgba(var(--v-border-color), var(--v-border-opacity));
}

.cursor-pointer {
  cursor: pointer;
}
</style>

