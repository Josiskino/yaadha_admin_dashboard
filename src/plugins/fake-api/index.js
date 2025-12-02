import { setupWorker } from 'msw/browser'
import { http, passthrough } from 'msw'

// Handlers
import { handlerAppBarSearch } from '@db/app-bar-search/index'
import { handlerAppsAcademy } from '@db/apps/academy/index'
import { handlerAppsCalendar } from '@db/apps/calendar/index'
import { handlerAppsChat } from '@db/apps/chat/index'
import { handlerAppsEcommerce } from '@db/apps/ecommerce/index'
import { handlerAppsEmail } from '@db/apps/email/index'
import { handlerAppsInvoice } from '@db/apps/invoice/index'
import { handlerAppsKanban } from '@db/apps/kanban/index'
import { handlerAppLogistics } from '@db/apps/logistics/index'
import { handlerAppsPermission } from '@db/apps/permission/index'
import { handlerAppsUsers } from '@db/apps/users/index'
import { handlerAuth } from '@db/auth/index'
import { handlerDashboard } from '@db/dashboard/index'
import { handlerPagesDatatable } from '@db/pages/datatable/index'
import { handlerPagesFaq } from '@db/pages/faq/index'
import { handlerPagesHelpCenter } from '@db/pages/help-center/index'
import { handlerPagesProfile } from '@db/pages/profile/index'

// Handler catch-all pour ignorer les requêtes non-API AVANT qu'elles ne soient parsées
// Ce handler doit être placé en premier pour être évalué avant les autres
const catchAllHandler = [
  http.all('*', ({ request }) => {
    const url = new URL(request.url)
    
    // Ignore les requêtes vers des domaines externes
    if (url.origin !== window.location.origin) {
      return passthrough()
    }
    
    // Ignore les fichiers .vue
    if (url.pathname.endsWith('.vue')) {
      return passthrough()
    }
    
    // Ignore les fichiers statiques
    if (url.pathname.includes('favicon.ico') || 
        (url.pathname.includes('/src/') && !url.pathname.includes('/api/'))) {
      return passthrough()
    }
    
    // Ignore les extensions de fichiers statiques
    const staticExtensions = ['.ico', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.css', '.js', '.woff', '.woff2', '.ttf', '.eot', '.map']
    if (staticExtensions.some(ext => url.pathname.endsWith(ext))) {
      return passthrough()
    }
    
    // Si ce n'est pas une requête API, on la laisse passer
    if (!url.pathname.startsWith('/api/')) {
      return passthrough()
    }
    
    // Pour les requêtes API, on retourne undefined pour laisser MSW chercher d'autres handlers
    return
  }),
]

const worker = setupWorker(
  ...catchAllHandler,
  ...handlerAppsEcommerce,
  ...handlerAppsAcademy,
  ...handlerAppsInvoice,
  ...handlerAppsUsers,
  ...handlerAppsEmail,
  ...handlerAppsCalendar,
  ...handlerAppsChat,
  ...handlerAppsPermission,
  ...handlerPagesHelpCenter,
  ...handlerPagesProfile,
  ...handlerPagesFaq,
  ...handlerPagesDatatable,
  ...handlerAppBarSearch,
  ...handlerAppLogistics,
  ...handlerAuth,
  ...handlerAppsKanban,
  ...handlerDashboard
)
export default function (app) {
  const workerUrl = `${import.meta.env.BASE_URL ?? '/'}mockServiceWorker.js`

  worker.start({
    serviceWorker: {
      url: workerUrl,
      options: {
        // Force la mise à jour du service worker à chaque démarrage
        updateViaCache: 'none',
      },
    },
    onUnhandledRequest: 'bypass',
    // Force la réinitialisation du service worker si nécessaire
    quiet: false,
  }).catch((error) => {
    // Si le service worker ne peut pas démarrer, on affiche un message
    console.warn('MSW: Service worker could not start. If errors persist, try unregistering the service worker in Chrome DevTools.', error)
  })
}
