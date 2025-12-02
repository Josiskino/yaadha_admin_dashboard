import { getAnalytics } from 'firebase/analytics'
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAPRngdNmWfKS8WLuMLd1qe0Es2ba7GXf0",
  authDomain: "yaadha-dev.firebaseapp.com",
  projectId: "yaadha-dev",
  storageBucket: "yaadha-dev.firebasestorage.app",
  messagingSenderId: "340949472267",
  appId: "1:340949472267:web:0bd2cba200f3e72150a30e",
  measurementId: "G-XPM1JTTZ9Z",
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize services
export const auth = getAuth(app)
// Use yaadha-db-dev database instead of (default)
export const db = getFirestore(app, 'yaadha-db-dev')
export const storage = getStorage(app)
export const analytics = getAnalytics(app)

export default app
