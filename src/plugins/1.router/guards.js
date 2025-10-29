import { auth } from '@/config/firebase'
import { canNavigate } from '@layouts/plugins/casl'
import { onAuthStateChanged } from 'firebase/auth'

// Helper function to wait for Firebase Auth to initialize
const waitForAuth = () => {
  return new Promise(resolve => {
    if (auth.currentUser) {
      resolve(auth.currentUser)
      
      return
    }
    
    // Wait for auth state to be determined (max 2 seconds)
    const unsubscribe = onAuthStateChanged(auth, user => {
      unsubscribe()
      resolve(user)
    })
    
    // Timeout after 2 seconds to avoid infinite wait
    setTimeout(() => {
      unsubscribe()
      resolve(auth.currentUser)
    }, 2000)
  })
}

export const setupGuards = router => {
  // 👉 router.beforeEach
  // Docs: https://router.vuejs.org/guide/advanced/navigation-guards.html#global-before-guards
  router.beforeEach(async to => {
    /**
         * Check if user is logged in by checking Firebase Auth state
         * Wait for Firebase Auth to initialize first
         */
    // Wait for Firebase Auth to be ready
    const currentUser = await waitForAuth()
    const isLoggedIn = !!currentUser

    // If user is logged in and tries to access login page, redirect to dashboard
    if (isLoggedIn && (to.name === 'auth-login' || to.path === '/auth/login')) {
      try {
        const { getDoc, doc } = await import('firebase/firestore')
        const { db } = await import('@/config/firebase')
        
        // Get user role from Firestore
        const userDoc = await getDoc(doc(db, 'admin', currentUser.uid))
        
        if (userDoc.exists()) {
          const userData = userDoc.data()
          
          if (userData && userData.role && (userData.role === 'administrator' || userData.role === 'manager')) {
            return { name: 'dashboard-dashboard' }
          }
          
          // No role assigned yet, redirect to roles page
          return { name: 'roles' }
        }
        
        // User not found in admin collection, redirect to dashboard anyway
        return { name: 'dashboard-dashboard' }
      } catch (error) {
        console.error('Error fetching user data during login redirect:', error)
        
        // On error, redirect to dashboard
        return { name: 'dashboard-dashboard' }
      }
    }

    /*
         * If it's a public route, continue navigation. This kind of pages are allowed to visited by login & non-login users. Basically, without any restrictions.
         * Examples of public routes are, 404, under maintenance, etc.
         */
    if (to.meta.public)
      return

    /*
          If user is logged in and is trying to access login like page, redirect to home
          else allow visiting the page
          (WARN: Don't allow executing further by return statement because next code will check for permissions)
         */
    if (to.meta.unauthenticatedOnly) {
      if (isLoggedIn) {
        // If user is logged in and tries to access unauthenticated-only page, redirect to admin dashboard
        try {
          const { getDoc, doc } = await import('firebase/firestore')
          const { db } = await import('@/config/firebase')
          
          const userDoc = await getDoc(doc(db, 'admin', currentUser.uid))
          
          if (userDoc.exists()) {
            const userData = userDoc.data()
            
            if (userData && userData.role && (userData.role === 'administrator' || userData.role === 'manager')) {
              return { name: 'dashboard-dashboard' }
            }
          }
        } catch (error) {
          console.error('Error in unauthenticatedOnly redirect:', error)
        }
        
        return { name: 'dashboard-dashboard' }
      } else {
        return undefined
      }
    }
    
    // Check if user is trying to access admin routes
    const isAdminRoute = to.path?.startsWith('/admin') || to.name?.includes('admin')
    
    // If accessing admin routes and logged in, check if user has admin role
    if (isLoggedIn && isAdminRoute && !canNavigate(to)) {
      try {
        const { getDoc, doc } = await import('firebase/firestore')
        const { db } = await import('@/config/firebase')
        
        const userDoc = await getDoc(doc(db, 'admin', currentUser.uid))
        
        if (userDoc.exists()) {
          const userData = userDoc.data()
          
          // Allow access if user has admin or manager role
          if (userData && (userData.role === 'administrator' || userData.role === 'manager')) {
            return undefined // Allow navigation
          }
        }
        
        // No admin role, redirect to not authorized
        return { name: 'template-not-authorized' }
      } catch (error) {
        console.error('Error checking admin access:', error)
        
        // On error, allow access (fail open for admin routes)
        return undefined
      }
    }
    
    if (!canNavigate(to) && to.matched.length) {
      /* eslint-disable indent */
            return isLoggedIn
                ? { name: 'template-not-authorized' }
                : {
                    name: 'auth-login',
                    query: {
                        ...to.query,
                        to: to.fullPath !== '/' ? to.path : undefined,
                    },
                }
            /* eslint-enable indent */
    }
  })
}
