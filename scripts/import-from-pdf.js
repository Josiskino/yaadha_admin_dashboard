/**
 * Script d'import automatique depuis un PDF
 * 
 * Usage:
 *   node scripts/import-from-pdf.js path/to/your/file.pdf
 * 
 * Structure attendue du PDF (exemple):
 * 
 * CATÉGORIE: Coiffure
 *   SOUS-CATÉGORIE: Coiffure Femme
 *     - Coupe femme (court/mi-long/long)
 *     - Brushing
 *     - Extensions microring
 *   SOUS-CATÉGORIE: Coiffure Homme
 *     - Coupe homme
 *     - Barbe
 * 
 * CATÉGORIE: Onglerie
 *   SOUS-CATÉGORIE: Manucure
 *     - Manucure classique
 *     - French manucure
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { createRequire } from 'module'
import { initializeApp } from 'firebase/app'
import { getFirestore, collection, addDoc, serverTimestamp, getDocs, query, where } from 'firebase/firestore'
import { config } from 'dotenv'

// Charger les variables d'environnement
config({ path: '.env.local' })

// Utiliser require pour pdf-parse (CommonJS)
const require = createRequire(import.meta.url)
const pdfParse = require('pdf-parse')

// Configuration Firebase
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || "AIzaSyAPRngdNmWfKS8WLuMLd1qe0Es2ba7GXf0",
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || "yaadha-dev.firebaseapp.com",
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || "yaadha-dev",
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || "yaadha-dev.firebasestorage.app",
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "340949472267",
  appId: process.env.VITE_FIREBASE_APP_ID || "1:340949472267:web:0bd2cba200f3e72150a30e",
}

// Initialiser Firebase
const app = initializeApp(firebaseConfig)
// Utiliser la même base de données que l'app (yaadha-db-dev)
const db = getFirestore(app, 'yaadha-db-dev')

/**
 * Parse le texte du PDF pour extraire les données structurées
 * Structure attendue basée sur "Coupe.pdf"
 */
function parsePDFContent(text) {
  const data = {
    categories: [],
  }

  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0)
  
  // Liste des catégories principales connues
  const mainCategories = [
    'Coiffure',
    'Onglerie',
    'Regard',
    'Visage',
    'Maquillage',
    'Épilation',
    'Cheveux & perruques',
    'Options premium'
  ]
  
  let currentCategory = null
  let currentSubCategory = null
  let skipUntilDetails = false // Pour ignorer la section "Catégorie – Inclus"
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    
    // Ignorer les lignes de titre et séparateurs
    if (line.match(/^(Coupe|Catégorie|Catégorie – Inclus|Catégorie – Sous-catégorie – Prestations)$/i)) {
      if (line.includes('Sous-catégorie')) {
        skipUntilDetails = false // On arrive à la section détaillée
      } else if (line.includes('Inclus')) {
        skipUntilDetails = true // Ignorer la section résumée
      }
      continue
    }
    
    // Si on est dans la section résumée, ignorer
    if (skipUntilDetails) {
      continue
    }
    
    // Détecter une catégorie principale
    // Les catégories sont souvent seules sur une ligne ou suivies de "–"
    const isMainCategory = mainCategories.some(cat => {
      // Correspondance exacte ou ligne qui commence par le nom de la catégorie
      return line === cat || 
             line.startsWith(cat + ' ') ||
             line.startsWith(cat + '–') ||
             line.startsWith(cat + ' –')
    })
    
    if (isMainCategory) {
      // Extraire le nom de la catégorie
      let categoryName = line.split(/[–\-]/)[0].trim()
      
      // Nettoyer le nom
      if (categoryName.includes('Onglerie')) {
        categoryName = 'Onglerie'
      } else if (categoryName.includes('Regard')) {
        categoryName = 'Regard'
      } else if (categoryName.includes('Visage')) {
        categoryName = 'Visage'
      } else if (categoryName.includes('Cheveux & perruques')) {
        categoryName = 'Cheveux & perruques'
      } else if (categoryName.includes('Options premium')) {
        categoryName = 'Options premium'
      }
      
      // Vérifier si la catégorie existe déjà
      let existingCategory = data.categories.find(c => c.name === categoryName)
      
      if (!existingCategory) {
        currentCategory = {
          name: categoryName,
          description: '',
          order: data.categories.length + 1,
          subcategories: [],
        }
        data.categories.push(currentCategory)
      } else {
        currentCategory = existingCategory
      }
      
      currentSubCategory = null
      continue
    }
    
    // Détecter une sous-catégorie
    // Pattern: "Catégorie + mot" (ex: "Coiffure femme", "Manucure", "Pédicure")
    if (currentCategory) {
      // Sous-catégories connues pour chaque catégorie
      const subCategoryPatterns = {
        'Coiffure': /^(Coiffure\s+(femme|homme|enfant|Afro)|Coiffure\s+homme|Coiffure\s+femme|Coiffure\s+enfant|Coiffure\s+Afro)$/i,
        'Onglerie': /^(Manucure|Pédicure)$/i,
        'Regard': /^(Extension de cils|Remplissage cils|Brow lift|Restructuration sourcils|Teinture sourcils)$/i,
        'Visage': /^(Nettoyage de peau|Soin|Masque|Massage visage|Routine beauté)$/i,
        'Maquillage': /^(Make-up|Maquillage|Soft glam|Smokey eye|Cours)/i,
        'Épilation': /^(Épilation|Zones)/i,
        'Cheveux & perruques': /^(Installation wig|Customisation lace|Soin perruques)$/i,
        'Options premium': /^(Prestation express|Forfait|Abonnement|Personal beauty)/i,
      }
      
      // Détecter si c'est une sous-catégorie
      let isSubCategory = false
      let subCategoryName = ''
      
      // Pattern général: "Catégorie + mot" ou nom de sous-catégorie seul
      if (line.match(/^(Coiffure\s+(femme|homme|enfant|Afro)|Manucure|Pédicure|Extension de cils|Remplissage cils|Brow lift|Restructuration sourcils|Teinture sourcils|Nettoyage de peau|Soin|Masque|Massage visage|Routine beauté|Make-up|Maquillage|Épilation|Zones|Installation wig|Customisation lace|Soin perruques|Prestation express|Forfait|Abonnement|Personal beauty)/i)) {
        isSubCategory = true
        subCategoryName = line
      }
      // Pattern spécifique pour "Coiffure femme", "Coiffure homme", etc.
      else if (currentCategory.name === 'Coiffure' && line.match(/^Coiffure\s+(femme|homme|enfant|Afro)/i)) {
        isSubCategory = true
        subCategoryName = line
      }
      // Pattern pour sous-catégories simples (Manucure, Pédicure, etc.)
      else if ((currentCategory.name === 'Onglerie' && (line === 'Manucure' || line === 'Pédicure')) ||
               (currentCategory.name === 'Regard' && line.match(/^(Extension de cils|Remplissage cils|Brow lift|Restructuration sourcils|Teinture sourcils)/i)) ||
               (currentCategory.name === 'Visage' && line.match(/^(Nettoyage de peau|Soin|Masque|Massage visage|Routine beauté)/i)) ||
               (currentCategory.name === 'Maquillage' && line.match(/^(Make-up|Maquillage|Soft glam|Smokey eye|Cours)/i)) ||
               (currentCategory.name === 'Épilation' && line.match(/^(Épilation|Zones)/i))) {
        isSubCategory = true
        subCategoryName = line
      }
      
      if (isSubCategory && subCategoryName) {
        // Vérifier si la sous-catégorie existe déjà
        let existingSubCategory = currentCategory.subcategories.find(sc => sc.name === subCategoryName)
        
        if (!existingSubCategory) {
          currentSubCategory = {
            name: subCategoryName,
            description: '',
            prestations: [],
          }
          currentCategory.subcategories.push(currentSubCategory)
        } else {
          currentSubCategory = existingSubCategory
        }
        continue
      }
    }
    
    // Détecter une prestation
    // Les prestations sont des lignes qui suivent une sous-catégorie
    // Elles peuvent commencer par un tiret, un numéro, ou être simplement du texte
    if (currentSubCategory || currentCategory) {
      // Ignorer les lignes qui sont clairement des catégories ou sous-catégories
      if (line.length > 100 || line.match(/^(Catégorie|Sous-catégorie|Prestation)/i)) {
        continue
      }
      
      // Nettoyer la ligne (enlever tirets, numéros, etc.)
      let prestationName = line
        .replace(/^[-•\d+\.\)]\s*/, '') // Enlever tirets, puces, numéros
        .replace(/^[a-z]\)\s*/, '') // Enlever lettres minuscules avec parenthèse
        .trim()
      
      // Ignorer les lignes vides ou trop courtes (probablement des séparateurs)
      if (prestationName.length < 3) {
        continue
      }
      
      // Ignorer les lignes qui sont des descriptions de section
      if (prestationName.match(/^(Coupe|Brushing|Lissage|Coiffure|Tresses|Extensions|Soin|Défrisage|Locks|twist|starter|Démêlage|Définition|Cornrows|Box braids|Twists|Faux locs|Lace|Pose|Gainage|Extensions|Baby boomer|Nail art|Réparation|Dépose|Bath foot|Soin talons|Remplissage|Pose cil|Réhaussement|Teinture|Restructuration|Nettoyage|Soin|Masque|Massage|Routine|Make-up|Maquillage|Soft glam|Smokey eye|cut crease|glow|Paillette|Faux cils|Cours|Épilation|Zones|Gommage|Enveloppement|Auto-bronzant|Glitter|Installation|Customisation|Soin|Prestation|Forfait|Abonnement|Personal beauty)/i) && 
          prestationName.length < 50 && 
          !prestationName.includes('(') && 
          !prestationName.includes('/')) {
        // C'est probablement une sous-catégorie qu'on a manquée, pas une prestation
        continue
      }
      
      // Si on n'a pas de sous-catégorie mais qu'on a une catégorie, créer une sous-catégorie par défaut
      if (!currentSubCategory && currentCategory) {
        if (currentCategory.subcategories.length === 0) {
          currentSubCategory = {
            name: currentCategory.name,
            description: '',
            prestations: [],
          }
          currentCategory.subcategories.push(currentSubCategory)
        } else {
          // Utiliser la dernière sous-catégorie
          currentSubCategory = currentCategory.subcategories[currentCategory.subcategories.length - 1]
        }
      }
      
      if (currentSubCategory && prestationName) {
        // Vérifier si la prestation existe déjà
        const exists = currentSubCategory.prestations.some(p => p.name === prestationName)
        if (!exists) {
          currentSubCategory.prestations.push({
            name: prestationName,
            description: '',
          })
        }
      }
    }
  }
  
  return data
}

/**
 * Importe les données dans Firestore
 */
async function importToFirestore(parsedData) {
  console.log('🚀 Début de l\'import...\n')
  
  const categoryMap = new Map() // Pour mapper nom → ID Firestore
  const subCategoryMap = new Map() // Pour mapper nom → ID Firestore
  
  // 1. Créer les catégories
  console.log('📁 Création des catégories...')
  for (const category of parsedData.categories) {
    try {
      // Vérifier si la catégorie existe déjà
      const existingCategories = await getDocs(
        query(collection(db, 'categories'), where('name', '==', category.name))
      )
      
      let categoryId
      if (!existingCategories.empty) {
        categoryId = existingCategories.docs[0].id
        console.log(`  ⚠️  Catégorie "${category.name}" existe déjà (ID: ${categoryId})`)
      } else {
        const docRef = await addDoc(collection(db, 'categories'), {
          name: category.name,
          description: category.description || '',
          imageUrl: '',
          order: category.order || 0,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })
        categoryId = docRef.id
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
        // Vérifier si la sous-catégorie existe déjà
        const existingSubCategories = await getDocs(
          query(
            collection(db, 'subcategories'),
            where('name', '==', subCategory.name),
            where('categoryId', '==', categoryId)
          )
        )
        
        let subCategoryId
        if (!existingSubCategories.empty) {
          subCategoryId = existingSubCategories.docs[0].id
          console.log(`  ⚠️  Sous-catégorie "${subCategory.name}" existe déjà (ID: ${subCategoryId})`)
        } else {
          const docRef = await addDoc(collection(db, 'subcategories'), {
            name: subCategory.name,
            description: subCategory.description || '',
            categoryId: categoryId,
            imageUrl: '',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          })
          subCategoryId = docRef.id
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
          // Vérifier si la prestation existe déjà
          const existingPrestations = await getDocs(
            query(
              collection(db, 'prestations'),
              where('name', '==', prestation.name),
              where('categoryId', '==', categoryId),
              where('subCategoryId', '==', subCategoryId)
            )
          )
          
          if (!existingPrestations.empty) {
            console.log(`  ⚠️  Prestation "${prestation.name}" existe déjà`)
            continue
          }
          
          await addDoc(collection(db, 'prestations'), {
            name: prestation.name,
            description: prestation.description || '',
            categoryId: categoryId,
            subCategoryId: subCategoryId,
            imageUrl: '',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          })
          
          prestationCount++
          console.log(`  ✅ Prestation créée: "${prestation.name}"`)
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
  
  // Récupérer le chemin du PDF depuis les arguments
const pdfPath = process.argv[2] || './Coupe.pdf'

const fullPath = path.isAbsolute(pdfPath) ? pdfPath : path.join(__dirname, '..', pdfPath)
  
  if (!fs.existsSync(fullPath)) {
    console.error(`❌ Fichier non trouvé: ${fullPath}`)
    process.exit(1)
  }
  
  try {
    console.log(`📄 Lecture du PDF: ${fullPath}\n`)
    const dataBuffer = fs.readFileSync(fullPath)
    const pdfData = await pdfParse(dataBuffer)
    
    console.log(`📊 Contenu extrait (${pdfData.text.length} caractères)\n`)
    console.log('--- Aperçu du contenu ---')
    console.log(pdfData.text.substring(0, 500))
    console.log('...\n')
    
    // Parser le contenu
    console.log('🔍 Parsing des données...\n')
    const parsedData = parsePDFContent(pdfData.text)
    
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
    
    if (answer.toLowerCase() !== 'oui' && answer.toLowerCase() !== 'o' && answer.toLowerCase() !== 'yes' && answer.toLowerCase() !== 'y') {
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

