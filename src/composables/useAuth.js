import { computed } from 'vue'
import { useFirebase } from './useFirebase'

/**
 * Vue composable for authentication
 * @returns {Object} Auth utilities and state
 */
export function useAuth() {
  const { currentUser, loading, error, signIn, signUp, signOut, resetPassword, updateUserProfile } = useFirebase()

  const isAuthenticated = computed(() => !!currentUser.value)
  const userEmail = computed(() => currentUser.value?.email)
  const userDisplayName = computed(() => currentUser.value?.displayName)
  const userPhotoURL = computed(() => currentUser.value?.photoURL)
  const uid = computed(() => currentUser.value?.uid)

  const user = computed(() => ({
    email: userEmail.value,
    displayName: userDisplayName.value,
    photoURL: userPhotoURL.value,
    uid: uid.value,
    emailVerified: currentUser.value?.emailVerified,
  }))

  return {
    // State
    user,
    currentUser,
    isAuthenticated,
    loading,
    error,

    // User info
    userEmail,
    userDisplayName,
    userPhotoURL,
    uid,

    // Methods
    signIn,
    signUp,
    signOut,
    resetPassword,
    updateUserProfile,
  }
}
