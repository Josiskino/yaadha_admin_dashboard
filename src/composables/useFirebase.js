import { analytics, auth, db, storage } from '@/config/firebase'
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore'
import { ref } from 'vue'

/**
 * Vue composable for Firebase services
 * @returns {Object} Firebase utilities and user state
 */
export function useFirebase() {
  const currentUser = ref(null)
  const loading = ref(false)
  const error = ref(null)

  // Listen to auth state changes
  onAuthStateChanged(auth, user => {
    currentUser.value = user
  })

  /**
   * Sign up with email and password
   * @param {string} email
   * @param {string} password
   * @returns {Promise<UserCredential>}
   */
  const signUp = async (email, password) => {
    try {
      loading.value = true
      error.value = null

      return await createUserWithEmailAndPassword(auth, email, password)
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Sign in with email and password
   * @param {string} email
   * @param {string} password
   * @returns {Promise<UserCredential>}
   */
  const signIn = async (email, password) => {
    try {
      loading.value = true
      error.value = null

      return await signInWithEmailAndPassword(auth, email, password)
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Sign out current user
   */
  const signOutUser = async () => {
    try {
      loading.value = true
      error.value = null
      await signOut(auth)
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Send password reset email
   * @param {string} email
   */
  const resetPassword = async email => {
    try {
      loading.value = true
      error.value = null
      await sendPasswordResetEmail(auth, email)
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Update user profile
   * @param {Object} profile - { displayName, photoURL }
   */
  const updateUserProfile = async profile => {
    try {
      loading.value = true
      error.value = null
      await updateProfile(auth.currentUser, profile)
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  // Firestore operations
  /**
   * Get a document by ID
   * @param {string} collectionName
   * @param {string} docId
   * @returns {Promise<Object>}
   */
  const getDocument = async (collectionName, docId) => {
    try {
      loading.value = true

      const docRef = doc(db, collectionName, docId)
      const docSnap = await getDoc(docRef)
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() }
      }
      
      return null
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Get all documents from a collection
   * @param {string} collectionName
   * @returns {Promise<Array>}
   */
  const getDocuments = async collectionName => {
    try {
      loading.value = true

      const querySnapshot = await getDocs(collection(db, collectionName))
      
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Create or update a document
   * @param {string} collectionName
   * @param {string} docId
   * @param {Object} data
   * @returns {Promise<void>}
   */
  const setDocument = async (collectionName, docId, data) => {
    try {
      loading.value = true

      const docRef = doc(db, collectionName, docId)

      await setDoc(docRef, { ...data, updatedAt: serverTimestamp() })
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Add a new document
   * @param {string} collectionName
   * @param {Object} data
   * @returns {Promise<string>} Document ID
   */
  const addDocument = async (collectionName, data) => {
    try {
      loading.value = true

      const docRef = await addDoc(collection(db, collectionName), {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })

      
      return docRef.id
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Update a document
   * @param {string} collectionName
   * @param {string} docId
   * @param {Object} data
   */
  const updateDocument = async (collectionName, docId, data) => {
    try {
      loading.value = true

      const docRef = doc(db, collectionName, docId)

      await updateDoc(docRef, { ...data, updatedAt: serverTimestamp() })
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Delete a document
   * @param {string} collectionName
   * @param {string} docId
   */
  const deleteDocument = async (collectionName, docId) => {
    try {
      loading.value = true

      const docRef = doc(db, collectionName, docId)

      await deleteDoc(docRef)
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    // Auth
    currentUser,
    loading,
    error,
    signUp,
    signIn,
    signOut: signOutUser,
    resetPassword,
    updateUserProfile,

    // Firestore
    getDocument,
    getDocuments,
    setDocument,
    addDocument,
    updateDocument,
    deleteDocument,

    // Direct access to Firebase services
    auth,
    db,
    storage,
    analytics,
  }
}
