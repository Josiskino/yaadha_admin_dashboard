/**
 * Composable pour gérer l'upload d'images vers Cloudinary
 * 
 * Configuration requise :
 * 1. Créer un compte sur https://cloudinary.com
 * 2. Aller dans Settings → Upload → Enable unsigned uploading
 * 3. Créer un "Upload Preset" avec le nom : yaadha_preset
 * 4. Remplacer YOUR_CLOUD_NAME ci-dessous par votre Cloud Name
 */

export const useCloudinary = () => {
  // ⚠️ IMPORTANT : Remplacer par votre Cloud Name depuis Cloudinary Dashboard
  const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'YOUR_CLOUD_NAME'
  
  // ⚠️ IMPORTANT : Remplacer par votre Upload Preset name
  const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'yaadha_preset'
  
  /**
   * Upload une image vers Cloudinary
   * @param {File} file - Le fichier image à uploader
   * @param {string} folder - Le dossier dans Cloudinary (ex: 'categories', 'subcategories', 'prestations')
   * @returns {Promise<{success: boolean, url?: string, error?: string}>}
   */
  const uploadImage = async (file, folder = 'general') => {
    try {
      // Validation de base
      if (!file) {
        return { success: false, error: 'No file provided' }
      }

      // Vérifier la taille (max 10MB pour Cloudinary free tier)
      if (file.size > 10 * 1024 * 1024) {
        return { success: false, error: 'Image too large. Maximum 10MB allowed.' }
      }

      // Vérifier le type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
      if (!validTypes.includes(file.type)) {
        return { success: false, error: 'Invalid file type. Only JPG, PNG, WEBP, GIF allowed.' }
      }

      // Créer FormData pour l'upload
      const formData = new FormData()
      formData.append('file', file)
      formData.append('upload_preset', UPLOAD_PRESET)
      formData.append('folder', `yaadha/${folder}`) // Organiser par dossier
      
      // Upload vers Cloudinary
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Cloudinary upload error:', errorData)
        return { success: false, error: errorData.error?.message || 'Upload failed' }
      }

      const data = await response.json()
      
      console.log('✅ Image uploaded to Cloudinary:', data.secure_url)
      
      return {
        success: true,
        url: data.secure_url, // URL HTTPS de l'image
        publicId: data.public_id, // ID Cloudinary (pour suppression future)
        width: data.width,
        height: data.height,
      }
    } catch (error) {
      console.error('Error uploading to Cloudinary:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Supprimer une image de Cloudinary (nécessite backend pour la sécurité)
   * Pour l'instant, on garde les images (elles ne comptent pas dans le quota si non utilisées)
   */
  const deleteImage = async (publicId) => {
    console.warn('Delete image not implemented yet (requires backend signature)')
    // Pour implémenter : nécessite une Cloud Function Firebase pour signer la requête
    return { success: false, error: 'Delete requires backend implementation' }
  }

  /**
   * Générer une URL optimisée Cloudinary
   * @param {string} url - URL Cloudinary originale
   * @param {object} options - Options de transformation
   */
  const getOptimizedUrl = (url, options = {}) => {
    const { width, height, quality = 'auto', format = 'auto' } = options
    
    if (!url || !url.includes('cloudinary.com')) return url
    
    // Exemple : transformer l'URL pour optimiser
    // https://res.cloudinary.com/demo/image/upload/v1234/sample.jpg
    // → https://res.cloudinary.com/demo/image/upload/w_300,h_300,q_auto,f_auto/v1234/sample.jpg
    
    const transformations = []
    if (width) transformations.push(`w_${width}`)
    if (height) transformations.push(`h_${height}`)
    transformations.push(`q_${quality}`)
    transformations.push(`f_${format}`)
    
    const transformation = transformations.join(',')
    return url.replace('/upload/', `/upload/${transformation}/`)
  }

  return {
    uploadImage,
    deleteImage,
    getOptimizedUrl,
  }
}

