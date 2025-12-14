import { useFirebase } from '@/composables/useFirebase'
import { ability } from '@/plugins/casl/ability'
import { useRouter } from 'vue-router'

export const useAuth = () => {
  const { currentUser, signIn, signOut, getDocument } = useFirebase()
  const router = useRouter()

  // Check if user is authenticated
  const isAuthenticated = computed(() => !!currentUser.value)

  // Get current user data from Firestore
  const getUserData = async () => {
    if (!currentUser.value) 
      return null
    
    try {
      return await getDocument('admin', currentUser.value.uid)
    } catch (error) {
      console.error('Error fetching user data:', error)
      
      return null
    }
  }

  // Login function
  const login = async (email, password) => {
    try {
      const userCredential = await signIn(email, password)
      const userData = await getDocument('admin', userCredential.user.uid)
      
      // Check if user document exists
      if (!userData) {
        throw new Error('User not found in admin database. Please contact an administrator.')
      }
      
      // Check if user has a role assigned
      if (!userData.role) {
        console.error('User document exists but missing role field:', userData)
        throw new Error('User account is missing role assignment. Please add the "role" field (administrator or manager) to your admin document in Firestore.')
      }
      
      // Set cookies for compatibility with existing code
      useCookie('accessToken').value = userCredential.user.accessToken
      useCookie('userData').value = {
        id: userCredential.user.uid,
        email: userCredential.user.email,
        fullName: userData.fullName,
        role: userData.role,
        avatar: userData.avatar,
      }
      
      // Initialize CASL abilities based on role
      // For admin roles, allow all actions
      const abilityRules = userData.role === 'administrator' || userData.role === 'manager'
        ? [{ action: 'manage', subject: 'all' }]
        : []
      
      useCookie('userAbilityRules').value = abilityRules
      ability.update(abilityRules)
      
      return { success: true, userData }
    } catch (error) {
      console.error('Login error:', error)
      
      return { success: false, error: error.message }
    }
  }

  // Logout function
  const logout = async () => {
    try {
      await signOut()
      
      // Clear cookies
      useCookie('accessToken').value = null
      useCookie('userData').value = null
      useCookie('userAbilityRules').value = null
      
      // Reset CASL abilities
      ability.update([])
      
      // Redirect to login
      await router.push('/auth/login')
      
      return { success: true }
    } catch (error) {
      console.error('Logout error:', error)
      
      return { success: false, error: error.message }
    }
  }

  // Check user role and redirect accordingly
  const redirectBasedOnRole = async () => {
    if (!currentUser.value) {
      await router.push('/auth/login')
      
      return
    }

    try {
      const userData = await getUserData()
      
      if (userData && userData.role) {
        if (userData.role === 'administrator' || userData.role === 'manager') {
          await router.push('/admin/admin-dashboard')
        } else {
          await router.push('/roles')
        }
      } else {
        await router.push('/roles')
      }
    } catch (error) {
      console.error('Error redirecting based on role:', error)
      
      await router.push('/auth/login')
    }
  }

  return {
    currentUser,
    isAuthenticated,
    getUserData,
    login,
    logout,
    redirectBasedOnRole,
  }
}
