<template>
  <section>
    <VCard>
      <VCardTitle class="d-flex align-center justify-space-between">
        <span class="text-h5">Import en masse des données</span>
        <VBtn
          icon
          variant="text"
          @click="$router.back()"
        >
          <VIcon icon="tabler-arrow-left" />
        </VBtn>
      </VCardTitle>

      <VDivider />

      <VCardText>
        <VAlert
          type="info"
          variant="tonal"
          class="mb-6"
        >
          <VAlertTitle>Import automatique</VAlertTitle>
          Cette page permet d'importer toutes les catégories, sous-catégories et prestations depuis le PDF en une seule fois.
          <br>
          <strong>Note :</strong> Les doublons seront automatiquement détectés et ignorés.
        </VAlert>

        <!-- Statistiques pré-import -->
        <VCard
          v-if="!isImporting && !importCompleted"
          variant="outlined"
          class="mb-6"
        >
          <VCardText>
            <div class="text-h6 mb-4">
              Données à importer
            </div>
            <VRow>
              <VCol
                cols="12"
                md="4"
              >
                <div class="text-center">
                  <div class="text-h3 text-primary">
                    {{ previewStats.categories }}
                  </div>
                  <div class="text-body-2">
                    Catégories
                  </div>
                </div>
              </VCol>
              <VCol
                cols="12"
                md="4"
              >
                <div class="text-center">
                  <div class="text-h3 text-primary">
                    {{ previewStats.subcategories }}
                  </div>
                  <div class="text-body-2">
                    Sous-catégories
                  </div>
                </div>
              </VCol>
              <VCol
                cols="12"
                md="4"
              >
                <div class="text-center">
                  <div class="text-h3 text-primary">
                    {{ previewStats.prestations }}
                  </div>
                  <div class="text-body-2">
                    Prestations
                  </div>
                </div>
              </VCol>
            </VRow>
          </VCardText>
        </VCard>

        <!-- Progression de l'import -->
        <VCard
          v-if="isImporting"
          variant="outlined"
          class="mb-6"
        >
          <VCardText>
            <div class="text-h6 mb-4">
              Import en cours...
            </div>
            <VProgressLinear
              :model-value="importProgress"
              color="primary"
              height="25"
              rounded
              class="mb-2"
            >
              <template #default="{ value }">
                <strong>{{ Math.ceil(value) }}%</strong>
              </template>
            </VProgressLinear>
            <div class="text-body-2 text-center">
              {{ currentStep }}
            </div>
          </VCardText>
        </VCard>

        <!-- Résultats de l'import -->
        <VCard
          v-if="importCompleted"
          variant="outlined"
          class="mb-6"
        >
          <VCardText>
            <div class="text-h6 mb-4">
              Import terminé !
            </div>
            <VRow>
              <VCol
                cols="12"
                md="4"
              >
                <div class="text-center">
                  <div class="text-h3 text-success">
                    {{ importResults.categoriesCreated }}
                  </div>
                  <div class="text-body-2">
                    Catégories créées
                  </div>
                </div>
              </VCol>
              <VCol
                cols="12"
                md="4"
              >
                <div class="text-center">
                  <div class="text-h3 text-success">
                    {{ importResults.subcategoriesCreated }}
                  </div>
                  <div class="text-body-2">
                    Sous-catégories créées
                  </div>
                </div>
              </VCol>
              <VCol
                cols="12"
                md="4"
              >
                <div class="text-center">
                  <div class="text-h3 text-success">
                    {{ importResults.prestationsCreated }}
                  </div>
                  <div class="text-body-2">
                    Prestations créées
                  </div>
                </div>
              </VCol>
            </VRow>
            <VRow class="mt-4">
              <VCol
                cols="12"
                md="4"
              >
                <div class="text-center">
                  <div class="text-h3 text-warning">
                    {{ importResults.categoriesSkipped }}
                  </div>
                  <div class="text-body-2">
                    Catégories existantes (ignorées)
                  </div>
                </div>
              </VCol>
              <VCol
                cols="12"
                md="4"
              >
                <div class="text-center">
                  <div class="text-h3 text-warning">
                    {{ importResults.subcategoriesSkipped }}
                  </div>
                  <div class="text-body-2">
                    Sous-catégories existantes (ignorées)
                  </div>
                </div>
              </VCol>
              <VCol
                cols="12"
                md="4"
              >
                <div class="text-center">
                  <div class="text-h3 text-warning">
                    {{ importResults.prestationsSkipped }}
                  </div>
                  <div class="text-body-2">
                    Prestations existantes (ignorées)
                  </div>
                </div>
              </VCol>
            </VRow>
          </VCardText>
        </VCard>

        <!-- Erreurs -->
        <VAlert
          v-if="importErrors.length > 0"
          type="error"
          variant="tonal"
          class="mb-6"
        >
          <VAlertTitle>Erreurs lors de l'import</VAlertTitle>
          <ul class="mt-2">
            <li
              v-for="(error, index) in importErrors"
              :key="index"
            >
              {{ error }}
            </li>
          </ul>
        </VAlert>

        <!-- Actions -->
        <div class="d-flex gap-4">
          <VBtn
            :disabled="isImporting"
            :loading="isImporting"
            color="primary"
            size="large"
            prepend-icon="tabler-upload"
            @click="startImport"
          >
            {{ isImporting ? 'Import en cours...' : 'Lancer l\'import' }}
          </VBtn>

          <VBtn
            v-if="importCompleted"
            variant="outlined"
            prepend-icon="tabler-refresh"
            @click="resetImport"
          >
            Réinitialiser
          </VBtn>

          <VBtn
            variant="outlined"
            prepend-icon="tabler-arrow-left"
            @click="$router.push({ name: 'categories-categories-dashboard' })"
          >
            Retour aux catégories
          </VBtn>
        </div>
      </VCardText>
    </VCard>

    <!-- Snackbar pour notifications -->
    <VSnackbar
      v-model="snackbar"
      :color="snackbarColor"
      :timeout="5000"
      location="top"
    >
      {{ snackbarText }}
      <template #actions>
        <VBtn
          icon
          variant="text"
          size="small"
          @click="snackbar = false"
        >
          <VIcon icon="tabler-x" />
        </VBtn>
      </template>
    </VSnackbar>
  </section>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { collection, addDoc, getDocs, query, where, serverTimestamp } from 'firebase/firestore'
import { useFirebase } from '@/composables/useFirebase'

definePage({
  meta: {
    action: 'read',
    subject: 'Auth',
  },
})

const { db, showNotification } = useFirebase()

// Notifications
const snackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref('success')

const showSnackbar = (message, type = 'success') => {
  snackbarText.value = message
  snackbarColor.value = type
  snackbar.value = true
}

// État de l'import
const isImporting = ref(false)
const importCompleted = ref(false)
const importProgress = ref(0)
const currentStep = ref('')
const importErrors = ref([])

// Statistiques
const previewStats = ref({
  categories: 0,
  subcategories: 0,
  prestations: 0,
})

const importResults = ref({
  categoriesCreated: 0,
  categoriesSkipped: 0,
  subcategoriesCreated: 0,
  subcategoriesSkipped: 0,
  prestationsCreated: 0,
  prestationsSkipped: 0,
})

// Structure des données (identique au script import-from-text.js)
const dataStructure = {
  'Coiffure': {
    subcategories: {
      'Coiffure femme': [
        'Coupe femme (court / mi-long / long)',
        'Brushing',
        'Lissage / brushing wavy',
        'Coiffure de soirée / événement',
        'Coiffure mariage (essai + jour J)',
        'Tresses africaines / vanilles / braids',
        'Chignons / attaches / waves',
        'Pose de perruque lace frontal / 360°',
        'Dépose / installation de lace wig',
        'Défrisage / soins cheveux crépus',
        'Mise en plis',
        'Extensions cheveux (pose / dépose / entretien) :',
        'Tissage',
        'Microring',
        'Tape-in',
        'Kératine',
        'Weave',
        'Lissage brésilien / taninoplastie / botox capillaire',
        'Soin capillaire profond (huile chaude, masque, vapeur)',
        'Bain d\'huile + massage crânien',
      ],
      'Coiffure homme': [
        'Coupe homme',
        'Dégradé tondeuse / fade (low, mid, high)',
        'Rasage / contours',
        'Taille de barbe',
        'Rasage traditionnel serviette chaude',
        'Coloration barbe / cheveux',
        'Soin barbe (huile chaude, vapeur)',
        'Locks homme',
        'twist',
        'starter locks',
      ],
      'Coiffure enfant': [
        'Coupe garçon',
        'Coupe fille',
        'Coiffure simple enfant',
        'Tresses enfants',
        'Défrisage',
        'Soin enfant',
        'Brushing enfant',
      ],
      'Coiffure Afro': [
        'Démêlage cheveux crépus',
        'Définition boucles',
        'twist out',
        'braid out',
        'Soin réparateur fibres capillaires',
        'Soin cuir',
        'Cornrows',
        'Box braids',
        'Twists',
        'Faux locs',
        'Locks',
        'Lissage brésilien / taninoplastie / botox capillaire',
        'Soin capillaire profond (huile chaude, masque, vapeur)',
        'Bain d\'huile + massage crânien',
        'Défrisage / soins cheveux crépus',
      ],
    },
  },
  'Onglerie': {
    subcategories: {
      'Manucure': [
        'Manucure classique',
        'Manucure russe',
        'Beauté des mains',
        'Pose vernis classique',
        'Pose vernis semi-permanent',
        'Gainage sur ongles naturels',
        'Pose gel / acrygel / résine',
        'Extensions ongles tips / chablon',
        'Baby boomer / french / french colorée',
        'Nail art (paillettes, strass, dessins, foils)',
        'Réparation ongle cassé',
        'Dépose ongles / semi / gel',
      ],
      'Pédicure': [
        'Pédicure classique',
        'Pédicure calluspeeling (anti-callosités)',
        'Bath foot spa à domicile (option)',
        'Pose vernis / semi-permanent pieds',
        'Soin talons crevasses',
        'Réparation ongles pieds (gel)',
      ],
    },
  },
  'Regard': {
    subcategories: {
      'Regard': [
        'Extension de cils (cil à cil / volume / méga volume)',
        'Remplissage cils',
        'Pose cil magnétique / bande',
        'Réhaussement de cils',
        'Teinture cils',
        'Brow lift / brow lamination',
        'Restructuration sourcils (cire / pince / fil)',
        'Teinture sourcils (henna brows / teinture classique)',
      ],
    },
  },
  'Visage': {
    subcategories: {
      'Visage': [
        'Nettoyage de peau',
        'Soin hydratant / nourrissant',
        'Soin anti-âge',
        'Soin purifiant / anti-acné',
        'Soin éclat / brighten skin',
        'Soin peeling doux',
        'Masque tissu / alginate',
        'Massage visage sculptant (non bien-être, version beauté)',
        'Routine beauté personnalisée + application',
      ],
    },
  },
  'Maquillage': {
    subcategories: {
      'Maquillage': [
        'Make-up jour / soirée',
        'Maquillage mariée (essai + jour J)',
        'Soft glam / full glam',
        'Smokey eye',
        'cut crease',
        'glow',
        'Maquillage artistique',
        'shooting',
        'Paillette strass visage',
        'Faux cils bande',
        'Cours d\'auto-maquillage à domicile',
      ],
    },
  },
  'Épilation': {
    subcategories: {
      'Épilation': [
        'Épilation cire chaude / tiède',
        'Épilation au fil (visage)',
        'Épilation orientale / sucre (sugaring)',
        'Sourcils',
        'Lèvre / menton',
        'Aisselles',
        'Maillot simple / échancré / intégral',
        'Jambes (½, ¾, complètes)',
        'Bras / avant-bras',
        'Dos / torse',
      ],
    },
  },
  'Beauté Corps': {
    subcategories: {
      'Beauté Corps': [
        'Gommage corps à domicile',
        'Enveloppement hydratant / algues',
        'Auto-bronzant à domicile / bronzage spray',
        'Soin mains & pieds SPA (hors massage bien-être)',
        'Glitter body / body glow events',
      ],
    },
  },
  'Cheveux & perruques': {
    subcategories: {
      'Cheveux & perruques': [
        'Installation wig glue-less',
        'Customisation lace (plucking, baby hair, coloration lace)',
        'Soin perruques',
      ],
    },
  },
  'Options premium': {
    subcategories: {
      'Options premium': [
        'Prestation express (15–30 min)',
        'Forfait mariage (maquillage + coiffure + ongles)',
        'Forfait shooting / événement / VIP',
        'Forfaits mensuels beauté à domicile',
        'Personal beauty assistant service',
        'Abonnement retouches ongles / cheveux / cils',
      ],
    },
  },
}

// Calculer les statistiques pré-import
function calculatePreviewStats() {
  let categoriesCount = 0
  let subcategoriesCount = 0
  let prestationsCount = 0

  for (const [categoryName, categoryData] of Object.entries(dataStructure)) {
    categoriesCount++
    for (const [subCategoryName, prestations] of Object.entries(categoryData.subcategories)) {
      subcategoriesCount++
      prestationsCount += prestations.length
    }
  }

  previewStats.value = {
    categories: categoriesCount,
    subcategories: subcategoriesCount,
    prestations: prestationsCount,
  }
}

// Fonction principale d'import
async function startImport() {
  if (isImporting.value) return

  // Confirmation
  if (!confirm(`Voulez-vous vraiment importer ${previewStats.value.categories} catégories, ${previewStats.value.subcategories} sous-catégories et ${previewStats.value.prestations} prestations ?`)) {
    return
  }

  isImporting.value = true
  importCompleted.value = false
  importProgress.value = 0
  importErrors.value = []
  importResults.value = {
    categoriesCreated: 0,
    categoriesSkipped: 0,
    subcategoriesCreated: 0,
    subcategoriesSkipped: 0,
    prestationsCreated: 0,
    prestationsSkipped: 0,
  }

  const categoryMap = new Map()
  const subCategoryMap = new Map()

  try {
    const totalSteps = previewStats.value.categories + previewStats.value.subcategories + previewStats.value.prestations
    let currentStepCount = 0

    // 1. Créer les catégories
    currentStep.value = 'Création des catégories...'
    for (const [categoryName, categoryData] of Object.entries(dataStructure)) {
      try {
        const existingCategories = await getDocs(
          query(collection(db, 'categories'), where('name', '==', categoryName))
        )

        if (!existingCategories.empty) {
          categoryMap.set(categoryName, existingCategories.docs[0].id)
          importResults.value.categoriesSkipped++
        } else {
          const order = Object.keys(dataStructure).indexOf(categoryName) + 1
          const docRef = await addDoc(collection(db, 'categories'), {
            name: categoryName,
            description: '',
            imageUrl: '',
            order: order,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          })
          categoryMap.set(categoryName, docRef.id)
          importResults.value.categoriesCreated++
        }
      } catch (error) {
        importErrors.value.push(`Erreur catégorie "${categoryName}": ${error.message}`)
      }

      currentStepCount++
      importProgress.value = (currentStepCount / totalSteps) * 100
    }

    // 2. Créer les sous-catégories
    currentStep.value = 'Création des sous-catégories...'
    for (const [categoryName, categoryData] of Object.entries(dataStructure)) {
      const categoryId = categoryMap.get(categoryName)
      if (!categoryId) continue

      for (const [subCategoryName, prestations] of Object.entries(categoryData.subcategories)) {
        try {
          const existingSubCategories = await getDocs(
            query(
              collection(db, 'subcategories'),
              where('name', '==', subCategoryName),
              where('categoryId', '==', categoryId)
            )
          )

          if (!existingSubCategories.empty) {
            subCategoryMap.set(`${categoryName}::${subCategoryName}`, existingSubCategories.docs[0].id)
            importResults.value.subcategoriesSkipped++
          } else {
            const docRef = await addDoc(collection(db, 'subcategories'), {
              name: subCategoryName,
              description: '',
              categoryId: categoryId,
              imageUrl: '',
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            })
            subCategoryMap.set(`${categoryName}::${subCategoryName}`, docRef.id)
            importResults.value.subcategoriesCreated++
          }
        } catch (error) {
          importErrors.value.push(`Erreur sous-catégorie "${subCategoryName}": ${error.message}`)
        }

        currentStepCount++
        importProgress.value = (currentStepCount / totalSteps) * 100
      }
    }

    // 3. Créer les prestations
    currentStep.value = 'Création des prestations...'
    for (const [categoryName, categoryData] of Object.entries(dataStructure)) {
      const categoryId = categoryMap.get(categoryName)
      if (!categoryId) continue

      for (const [subCategoryName, prestations] of Object.entries(categoryData.subcategories)) {
        const subCategoryId = subCategoryMap.get(`${categoryName}::${subCategoryName}`)
        if (!subCategoryId) continue

        for (const prestationName of prestations) {
          try {
            const existingPrestations = await getDocs(
              query(
                collection(db, 'prestations'),
                where('name', '==', prestationName),
                where('categoryId', '==', categoryId),
                where('subCategoryId', '==', subCategoryId)
              )
            )

            if (!existingPrestations.empty) {
              importResults.value.prestationsSkipped++
            } else {
              await addDoc(collection(db, 'prestations'), {
                name: prestationName,
                description: '',
                categoryId: categoryId,
                subCategoryId: subCategoryId,
                imageUrl: '',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
              })
              importResults.value.prestationsCreated++
            }
          } catch (error) {
            importErrors.value.push(`Erreur prestation "${prestationName}": ${error.message}`)
          }

          currentStepCount++
          importProgress.value = (currentStepCount / totalSteps) * 100
        }
      }
    }

    importProgress.value = 100
    currentStep.value = 'Import terminé !'
    importCompleted.value = true

    showSnackbar(
      `Import réussi ! ${importResults.value.categoriesCreated} catégories, ${importResults.value.subcategoriesCreated} sous-catégories et ${importResults.value.prestationsCreated} prestations créées.`,
      'success'
    )
  } catch (error) {
    console.error('Erreur lors de l\'import:', error)
    importErrors.value.push(`Erreur générale: ${error.message}`)
    showSnackbar('Erreur lors de l\'import. Voir les détails ci-dessous.', 'error')
  } finally {
    isImporting.value = false
  }
}

function resetImport() {
  importCompleted.value = false
  importProgress.value = 0
  currentStep.value = ''
  importErrors.value = []
  importResults.value = {
    categoriesCreated: 0,
    categoriesSkipped: 0,
    subcategoriesCreated: 0,
    subcategoriesSkipped: 0,
    prestationsCreated: 0,
    prestationsSkipped: 0,
  }
}

onMounted(() => {
  calculatePreviewStats()
})
</script>

