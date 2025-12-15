/**
 * Script d'import depuis un fichier texte (extrait du PDF)
 * 
 * Usage:
 *   node scripts/import-from-text.js
 * 
 * Ce script utilise le texte fourni directement (pas besoin de PDF)
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'
import { config } from 'dotenv'

// Charger les variables d'environnement
config({ path: '.env.local' })

// Initialiser Firebase Admin SDK
let serviceAccount
try {
  // Option 1: Clé de service account depuis variable d'environnement (JSON string)
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
  }
  // Option 2: Fichier JSON de service account
  else if (fs.existsSync('./firebase-service-account.json')) {
    serviceAccount = JSON.parse(fs.readFileSync('./firebase-service-account.json', 'utf8'))
  }
  // Option 3: Fichier dans le dossier functions
  else if (fs.existsSync('./functions/serviceAccountKey.json')) {
    serviceAccount = JSON.parse(fs.readFileSync('./functions/serviceAccountKey.json', 'utf8'))
  }
  else {
    throw new Error('Aucune clé de service account Firebase trouvée. Veuillez configurer FIREBASE_SERVICE_ACCOUNT_KEY dans .env.local ou créer un fichier firebase-service-account.json')
  }
} catch (error) {
  console.error('❌ Erreur de configuration Firebase Admin:', error.message)
  console.error('\n📝 Pour résoudre ce problème:')
  console.error('   1. Allez dans Firebase Console > Project Settings > Service Accounts')
  console.error('   2. Cliquez sur "Generate new private key"')
  console.error('   3. Téléchargez le fichier JSON')
  console.error('   4. Ajoutez-le à la racine du projet sous le nom "firebase-service-account.json"')
  console.error('      OU ajoutez son contenu dans .env.local comme:')
  console.error('      FIREBASE_SERVICE_ACCOUNT_KEY=\'{"type":"service_account",...}\'')
  process.exit(1)
}

// Initialiser Firebase Admin
const app = initializeApp({
  credential: cert(serviceAccount),
  databaseURL: `https://${process.env.VITE_FIREBASE_PROJECT_ID || 'yaadha-dev'}.firebaseio.com`,
})

// Utiliser la base de données spécifiée (yaadha-db-dev)
const db = getFirestore(app)

/**
 * Parse le texte fourni pour extraire les données structurées
 * Basé sur la structure réelle du PDF "Coupe.pdf"
 */
function parseTextContent(text) {
  const data = {
    categories: [],
  }

  // Structure manuelle basée sur le texte fourni
  const structure = {
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
          'Tissage',
          'Microring',
          'Tape-in',
          'Kératine',
          'Weave',
          'Lissage brésilien / taninoplastie / botox capillaire',
          'Soin capillaire profond (huile chaude, masque, vapeur)',
          'Bain d\'huile + massage crânien'
        ],
        'Coiffure homme': [
          'Coupe homme',
          'Dégradé tondeuse / fade (low, mid, high)',
          'Rasage / contours',
          'Taille de barbe',
          'Rasage traditionnel serviette chaude',
          'Coloration barbe / cheveux',
          'Soin barbe (huile chaude, vapeur)',
          'twist',
          'starter locks'
        ],
        'Coiffure enfant': [
          'Coupe garçon',
          'Coupe fille',
          'Coiffure simple enfant',
          'Tresses enfants',
          'Défrisage',
          'Soin enfant',
          'Brushing enfant'
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
          'Défrisage / soins cheveux crépus'
        ]
      }
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
          'Dépose ongles / semi / gel'
        ],
        'Pédicure': [
          'Pédicure classique',
          'Pédicure calluspeeling (anti-callosités)',
          'Bath foot spa à domicile (option)',
          'Pose vernis / semi-permanent pieds',
          'Soin talons crevasses',
          'Réparation ongles pieds (gel)'
        ]
      }
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
          'Teinture sourcils (henna brows / teinture classique)'
        ]
      }
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
          'Routine beauté personnalisée + application'
        ]
      }
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
          'Cours d\'auto-maquillage à domicile'
        ]
      }
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
          'Dos / torse'
        ]
      }
    },
    'Beauté Corps': {
      subcategories: {
        'Beauté Corps': [
          'Gommage corps à domicile',
          'Enveloppement hydratant / algues',
          'Auto-bronzant à domicile / bronzage spray',
          'Soin mains & pieds SPA (hors massage bien-être)',
          'Glitter body / body glow events'
        ]
      }
    },
    'Cheveux & perruques': {
      subcategories: {
        'Cheveux & perruques': [
          'Installation wig glue-less',
          'Customisation lace (plucking, baby hair, coloration lace)',
          'Soin perruques'
        ]
      }
    },
    'Options premium': {
      subcategories: {
        'Options premium': [
          'Prestation express (15–30 min)',
          'Forfait mariage (maquillage + coiffure + ongles)',
          'Forfait shooting / événement / VIP',
          'Forfaits mensuels beauté à domicile',
          'Personal beauty assistant service',
          'Abonnement retouches ongles / cheveux / cils'
        ]
      }
    }
  }
  
  // Convertir la structure en format de données
  let order = 1
  for (const [categoryName, categoryData] of Object.entries(structure)) {
    const category = {
      name: categoryName,
      description: '',
      order: order++,
      subcategories: [],
    }
    
    for (const [subCategoryName, prestations] of Object.entries(categoryData.subcategories)) {
      const subCategory = {
        name: subCategoryName,
        description: '',
        prestations: prestations.map(name => ({
          name: name,
          description: '',
        })),
      }
      category.subcategories.push(subCategory)
    }
    
    data.categories.push(category)
  }
  
  return data
}

/**
 * Importe les données dans Firestore
 */
async function importToFirestore(parsedData) {
  console.log('🚀 Début de l\'import...\n')
  
  const categoryMap = new Map()
  const subCategoryMap = new Map()
  
  // 1. Créer les catégories
  console.log('📁 Création des catégories...')
  for (const category of parsedData.categories) {
    try {
      const existingCategories = await db.collection('categories')
        .where('name', '==', category.name)
        .limit(1)
        .get()
      
      let categoryId
      if (!existingCategories.empty) {
        categoryId = existingCategories.docs[0].id
        console.log(`  ⚠️  Catégorie "${category.name}" existe déjà (ID: ${categoryId})`)
      } else {
        const docRef = db.collection('categories').doc()
        categoryId = docRef.id
        await docRef.set({
          name: category.name,
          description: category.description || '',
          imageUrl: '',
          order: category.order || 0,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        })
        console.log(`  ✅ Catégorie créée: "${category.name}" (ID: ${categoryId})`)
      }
      
      categoryMap.set(category.name, categoryId)
    } catch (error) {
      console.error(`  ❌ Erreur lors de la création de la catégorie "${category.name}":`, error.message)
    }
  }
  
  // 2. Créer les sous-catégories
  console.log('\n📂 Création des sous-catégories...')
  for (const category of parsedData.categories) {
    const categoryId = categoryMap.get(category.name)
    
    if (!categoryId) {
      console.log(`  ⚠️  Catégorie "${category.name}" non trouvée, sous-catégories ignorées`)
      continue
    }
    
    for (const subCategory of category.subcategories) {
      try {
        const existingSubCategories = await db.collection('subcategories')
          .where('name', '==', subCategory.name)
          .where('categoryId', '==', categoryId)
          .limit(1)
          .get()
        
        let subCategoryId
        if (!existingSubCategories.empty) {
          subCategoryId = existingSubCategories.docs[0].id
          console.log(`  ⚠️  Sous-catégorie "${subCategory.name}" existe déjà (ID: ${subCategoryId})`)
        } else {
          const docRef = db.collection('subcategories').doc()
          subCategoryId = docRef.id
          await docRef.set({
            name: subCategory.name,
            description: subCategory.description || '',
            categoryId: categoryId,
            imageUrl: '',
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
          })
          console.log(`  ✅ Sous-catégorie créée: "${subCategory.name}" (ID: ${subCategoryId})`)
        }
        
        subCategoryMap.set(`${category.name}::${subCategory.name}`, subCategoryId)
      } catch (error) {
        console.error(`  ❌ Erreur lors de la création de la sous-catégorie "${subCategory.name}":`, error.message)
      }
    }
  }
  
  // 3. Créer les prestations
  console.log('\n🎯 Création des prestations...')
  let prestationCount = 0
  
  for (const category of parsedData.categories) {
    const categoryId = categoryMap.get(category.name)
    
    if (!categoryId) continue
    
    for (const subCategory of category.subcategories) {
      const subCategoryId = subCategoryMap.get(`${category.name}::${subCategory.name}`)
      
      if (!subCategoryId) continue
      
      for (const prestation of subCategory.prestations) {
        try {
          const existingPrestations = await db.collection('prestations')
            .where('name', '==', prestation.name)
            .where('categoryId', '==', categoryId)
            .where('subCategoryId', '==', subCategoryId)
            .limit(1)
            .get()
          
          if (!existingPrestations.empty) {
            console.log(`  ⚠️  Prestation "${prestation.name}" existe déjà`)
            continue
          }
          
          await db.collection('prestations').add({
            name: prestation.name,
            description: prestation.description || '',
            categoryId: categoryId,
            subCategoryId: subCategoryId,
            imageUrl: '',
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
          })
          
          prestationCount++
          if (prestationCount % 10 === 0) {
            console.log(`  ✅ ${prestationCount} prestations créées...`)
          }
        } catch (error) {
          console.error(`  ❌ Erreur lors de la création de la prestation "${prestation.name}":`, error.message)
        }
      }
    }
  }
  
  console.log(`\n🎉 Import terminé !`)
  console.log(`   - Catégories: ${parsedData.categories.length}`)
  console.log(`   - Sous-catégories: ${parsedData.categories.reduce((sum, c) => sum + c.subcategories.length, 0)}`)
  console.log(`   - Prestations: ${prestationCount}`)
}

/**
 * Fonction principale
 */
async function main() {
  const __filename = fileURLToPath(import.meta.url)
  const __dirname = path.dirname(__filename)
  
  // Structure directement codée (basée sur le texte fourni)
  // Pas besoin de parser, on utilise la structure directement
  
  try {
    console.log('🔍 Génération des données structurées...\n')
    const parsedData = parseTextContent('')
    
    console.log('📋 Données parsées:')
    console.log(JSON.stringify(parsedData, null, 2))
    console.log('\n')
    
    // Demander confirmation
    const readline = await import('readline')
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    })
    
    const answer = await new Promise(resolve => {
      rl.question('❓ Voulez-vous importer ces données dans Firestore ? (oui/non): ', resolve)
    })
    
    rl.close()
    
    // Nettoyer la réponse (enlever espaces, caractères invisibles)
    const cleanAnswer = answer.trim().toLowerCase()
    
    if (cleanAnswer !== 'oui' && cleanAnswer !== 'o' && cleanAnswer !== 'yes' && cleanAnswer !== 'y') {
      console.log('❌ Import annulé.')
      process.exit(0)
    }
    
    // Importer dans Firestore
    await importToFirestore(parsedData)
    
  } catch (error) {
    console.error('❌ Erreur:', error)
    process.exit(1)
  }
}

// Exécuter le script
main()

