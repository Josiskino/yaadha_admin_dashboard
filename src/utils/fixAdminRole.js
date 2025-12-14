/**
 * Utility script to fix admin accounts missing the 'role' field
 * 
 * Usage:
 * 1. Open browser console while logged in as the admin user
 * 2. Import and run: fixAdminRole('administrator')
 * 
 * Or run directly in console:
 * 
 * import { fixAdminRole } from '@/utils/fixAdminRole'
 * await fixAdminRole('administrator')
 */

import { useFirebase } from '@/composables/useFirebase'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '@/config/firebase'
import { auth } from '@/config/firebase'

export const fixAdminRole = async (role = 'administrator') => {
  try {
    const currentUser = auth.currentUser
    
    if (!currentUser) {
      throw new Error('No user is currently logged in. Please log in first.')
    }
    
    console.log('Fixing admin role for user:', currentUser.uid, currentUser.email)
    
    const adminDocRef = doc(db, 'admin', currentUser.uid)
    
    await updateDoc(adminDocRef, {
      role: role,
      updatedAt: new Date(),
    })
    
    console.log(`✅ Successfully updated admin role to "${role}"`)
    console.log('You can now log out and log back in to verify the fix.')
    
    return { success: true, message: `Role updated to ${role}` }
  } catch (error) {
    console.error('❌ Error fixing admin role:', error)
    throw error
  }
}

/**
 * Alternative: Run this directly in browser console after logging in
 * 
 * Copy and paste this into browser console:
 */
export const fixAdminRoleConsoleScript = `
(async () => {
  try {
    const { doc, updateDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
    const { getAuth } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
    
    // You'll need to import your Firebase config
    // This is a template - adjust based on your Firebase setup
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) {
      console.error('No user logged in');
      return;
    }
    
    // You'll need to get your db instance
    // This is just a template
    console.log('User UID:', user.uid);
    console.log('Please update the document manually in Firestore console:');
    console.log('Collection: admin');
    console.log('Document ID:', user.uid);
    console.log('Add field: role = "administrator"');
  } catch (error) {
    console.error('Error:', error);
  }
})();
`

