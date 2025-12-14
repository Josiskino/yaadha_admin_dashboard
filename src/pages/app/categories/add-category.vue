<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { useFirebase } from '@/composables/useFirebase'
import { PerfectScrollbar } from 'vue3-perfect-scrollbar'

const props = defineProps({
  isDrawerOpen: {
    type: Boolean,
    required: true,
  },
  category: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits([
  'update:isDrawerOpen',
  'categoryData',
])

const isFormValid = ref(false)
const refForm = ref()
const fileInputRef = ref()
const categoryName = ref('')
const description = ref('')
const order = ref(0)
const imageFile = ref(null)
const imageUrl = ref('')

// Check if editing
const isEditing = computed(() => !!props.category)

// Populate form if editing
watch(() => props.category, newCategory => {
  if (newCategory) {
    categoryName.value = newCategory.name || ''
    description.value = newCategory.description || ''
    order.value = newCategory.order || 0
    imageUrl.value = newCategory.imageUrl || newCategory.image || ''
  }
}, { immediate: true })

// 👉 drawer close
const closeNavigationDrawer = () => {
  emit('update:isDrawerOpen', false)
  nextTick(() => {
    refForm.value?.reset()
    refForm.value?.resetValidation()
    resetForm()
  })
}

const resetForm = () => {
  categoryName.value = ''
  description.value = ''
  order.value = 0
  imageFile.value = null
  imageUrl.value = ''
}

const handleFileChange = async event => {
  const file = event.target.files?.[0]
  
  if (file) {
    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('L\'image est trop volumineuse. Veuillez choisir une image de moins de 2MB.')
      
      return
    }

    imageFile.value = file
    
    // Preview image (temporary for display)
    const reader = new FileReader()
    
    reader.onload = e => {
      imageUrl.value = e.target.result
    }
    reader.readAsDataURL(file)
    
    // Upload to Firebase Storage
    try {
      const { storage } = useFirebase()
      const { ref, uploadBytes, getDownloadURL } = await import('firebase/storage')
      
      const storageRef = ref(storage, `categories/${Date.now()}_${file.name}`)

      await uploadBytes(storageRef, file)

      const url = await getDownloadURL(storageRef)
      
      imageUrl.value = url // Store URL instead of base64
      imageFile.value = null // Clear file since we have URL
      console.log('Image uploaded to Storage:', url)
    } catch (error) {
      console.error('Error uploading image:', error)

      // Keep base64 for now if Storage upload fails
      console.log('Keeping base64 image due to Storage error')
    }
  }
}

const onSubmit = () => {
  refForm.value?.validate().then(({ valid }) => {
    if (valid) {
      // If image is base64 and too large, don't include it
      let imageToInclude = imageUrl.value
      if (imageToInclude && imageToInclude.startsWith('data:') && imageToInclude.length > 1000000) {
        console.warn('Image too large for Firestore, skipping image')
        imageToInclude = null
      }

      const dataToEmit = {
        name: categoryName.value,
        description: description.value,
        order: Number(order.value) || 0,
        imageUrl: imageToInclude,
      }
      
      emit('categoryData', dataToEmit)
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
        {{ isEditing ? 'Edit Category' : 'Add New Category' }}
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
                  <span class="text-sm mb-2 d-block">Category Image</span>
                  
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

              <!-- 👉 Category Name -->
              <VCol cols="12">
                <AppTextField
                  v-model="categoryName"
                  :rules="[requiredValidator]"
                  label="Category Name"
                  placeholder="e.g. Plumbing, Electrical"
                />
              </VCol>

              <!-- 👉 Description -->
              <VCol cols="12">
                <AppTextarea
                  v-model="description"
                  label="Description"
                  placeholder="Enter category description"
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
                  hint="Lower numbers appear first"
                />
              </VCol>

              <!-- 👉 Actions -->
              <VCol cols="12">
                <VBtn
                  type="submit"
                  block
                  class="me-3"
                >
                  {{ isEditing ? 'Update Category' : 'Add Category' }}
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

