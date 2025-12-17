/**
 * Composable pour gérer l'upload d'images vers Firebase Storage
 * 
 * Utilise Firebase Storage pour stocker les images des catégories, sous-catégories et prestations.
 * Les images sont organisées par dossier dans Firebase Storage.
 */

import { ref } from 'vue'
import { storage } from '@/config/firebase'
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'

export function useFirebaseStorage() {
  const loading = ref(false)
  const error = ref(null)

  /**
   * Upload une image vers Firebase Storage
   * @param {File} file - Le fichier image à uploader
   * @param {string} folder - Le dossier dans Firebase Storage (ex: 'categories', 'subcategories', 'prestations')
   * @returns {Promise<{success: boolean, url?: string, error?: string}>}
   */
  const uploadImage = async (file, folder = 'general') => {
    try {
      loading.value = true
      error.value = null

      // Validation de base
      if (!file) {
        return { success: false, error: 'Aucun fichier fourni' }
      }

      // Vérifier la taille (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        return { success: false, error: 'Image trop volumineuse. Maximum 10MB autorisé.' }
      }

      // Vérifier le type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
      if (!validTypes.includes(file.type)) {
        return { success: false, error: 'Type de fichier invalide. Seuls JPG, PNG, WEBP, GIF sont autorisés.' }
      }

      // Générer un nom de fichier unique avec timestamp
      const timestamp = Date.now()
      const fileName = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
      const filePath = `${folder}/${fileName}`

      // Créer une référence dans Firebase Storage
      const imageRef = storageRef(storage, filePath)

      // Uploader le fichier
      const snapshot = await uploadBytes(imageRef, file)
      
      // Obtenir l'URL de téléchargement
      const downloadURL = await getDownloadURL(snapshot.ref)

      console.log('✅ Image uploaded to Firebase Storage:', downloadURL)

      return {
        success: true,
        url: downloadURL,
        path: filePath,
      }
    } catch (err) {
      const errorMessage = err.message || 'Erreur lors de l\'upload de l\'image'
      error.value = errorMessage
      console.error('Error uploading to Firebase Storage:', err)
      return { success: false, error: errorMessage }
    } finally {
      loading.value = false
    }
  }

  /**
   * Supprimer une image de Firebase Storage
   * @param {string} filePath - Le chemin du fichier dans Firebase Storage
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  const deleteImage = async (filePath) => {
    try {
      loading.value = true
      error.value = null

      if (!filePath) {
        return { success: false, error: 'Chemin du fichier manquant' }
      }

      // Importer deleteObject depuis firebase/storage
      const { deleteObject } = await import('firebase/storage')
      
      const imageRef = storageRef(storage, filePath)
      await deleteObject(imageRef)

      console.log('✅ Image deleted from Firebase Storage:', filePath)

      return { success: true }
    } catch (err) {
      const errorMessage = err.message || 'Erreur lors de la suppression de l\'image'
      error.value = errorMessage
      console.error('Error deleting from Firebase Storage:', err)
      return { success: false, error: errorMessage }
    } finally {
      loading.value = false
    }
  }

  return {
    uploadImage,
    deleteImage,
    loading,
    error,
  }
}

