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
import pdfParse from 'pdf-parse'
import { initializeApp } from 'firebase/app'
import { getFirestore, collection, addDoc, serverTimestamp, getDocs, query, where } from 'firebase/firestore'
import { config } from 'dotenv'

// Charger les variables d'environnement
config({ path: '.env.local' })

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
 * 
 * ADAPTEZ CETTE FONCTION selon la structure réelle de votre PDF
 */
function parsePDFContent(text) {
  const data = {
    categories: [],
  }

  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0)
  
  let currentCategory = null
  let currentSubCategory = null
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    
    // Détecter une catégorie (ajustez le pattern selon votre PDF)
    // Exemples de patterns possibles:
    // - "CATÉGORIE: Coiffure"
    // - "1. Coiffure"
    // - "COIFFURE" (en majuscules)
    if (line.match(/^(CATÉGORIE|CATEGORY|CATÉGORIES|CATEGORIES)[\s:]+(.+)$/i) ||
        line.match(/^\d+\.\s*(.+)$/) && line.length < 50) {
      const categoryName = line.replace(/^(CATÉGORIE|CATEGORY|CATÉGORIES|CATEGORIES)[\s:]+/i, '')
                                .replace(/^\d+\.\s*/, '')
                                .trim()
      
      if (categoryName) {
        currentCategory = {
          name: categoryName,
          description: '',
          order: data.categories.length + 1,
          subcategories: [],
        }
        data.categories.push(currentCategory)
        currentSubCategory = null
      }
    }
    // Détecter une sous-catégorie
    else if (line.match(/^(SOUS-CATÉGORIE|SOUS-CATEGORY|SUB-CATEGORY|SUB-CATÉGORIE)[\s:]+(.+)$/i) ||
             line.match(/^[a-z]\)\s*(.+)$/i) ||
             (line.match(/^[A-Z][a-z]+/) && currentCategory && line.length < 50)) {
      const subCategoryName = line.replace(/^(SOUS-CATÉGORIE|SOUS-CATEGORY|SUB-CATEGORY|SUB-CATÉGORIE)[\s:]+/i, '')
                                   .replace(/^[a-z]\)\s*/i, '')
                                   .trim()
      
      if (subCategoryName && currentCategory) {
        currentSubCategory = {
          name: subCategoryName,
          description: '',
          prestations: [],
        }
        currentCategory.subcategories.push(currentSubCategory)
      }
    }
    // Détecter une prestation (commence par "-", "•", ou numéro)
    else if (line.match(/^[-•\d+\.]\s*(.+)$/) && (currentSubCategory || currentCategory)) {
      const prestationName = line.replace(/^[-•\d+\.]\s*/, '').trim()
      
      if (prestationName) {
        const prestation = {
          name: prestationName,
          description: '',
        }
        
        if (currentSubCategory) {
          currentSubCategory.prestations.push(prestation)
        } else if (currentCategory) {
          // Si pas de sous-catégorie, créer une prestation directement sous la catégorie
          if (!currentCategory.subcategories.length) {
            currentCategory.subcategories.push({
              name: currentCategory.name,
              description: '',
              prestations: [],
            })
            currentSubCategory = currentCategory.subcategories[0]
          }
          currentSubCategory.prestations.push(prestation)
        }
      }
    }
    // Description (ligne suivante après un nom)
    else if (line.length > 20 && !line.match(/^(CATÉGORIE|SOUS-CATÉGORIE|CATEGORY)/i)) {
      // Peut être une description, on l'ignore pour l'instant ou on l'ajoute
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
  const pdfPath = process.argv[2]
  
  if (!pdfPath) {
    console.error('❌ Usage: node scripts/import-from-pdf.js <chemin-vers-le-pdf>')
    console.error('   Exemple: node scripts/import-from-pdf.js ./data/categories.pdf')
    process.exit(1)
  }
  
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

