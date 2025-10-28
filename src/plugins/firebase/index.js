import { analytics, auth, db, storage } from '@/config/firebase'

export default {
  install(app) {
    // Make Firebase services available globally
    app.config.globalProperties.$auth = auth
    app.config.globalProperties.$db = db
    app.config.globalProperties.$storage = storage
    app.config.globalProperties.$analytics = analytics

    // Provide Firebase services to all components via dependency injection
    app.provide('$auth', auth)
    app.provide('$db', db)
    app.provide('$storage', storage)
    app.provide('$analytics', analytics)
  },
}
