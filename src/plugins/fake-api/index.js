import { setupWorker } from 'msw/browser'

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

const worker = setupWorker(
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
  // Désactiver MSW complètement puisqu'on utilise Firebase
  // Désenregistrer le service worker MSW s'il existe
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(registrations => {
      const mswWorkers = []
      
      registrations.forEach(registration => {
        const scriptURL = registration.active?.scriptURL || 
                         registration.waiting?.scriptURL || 
                         registration.installing?.scriptURL || ''
        
        // Identifier tous les service workers MSW
        if (scriptURL.includes('mockServiceWorker') || 
            registration.scope.includes('mockServiceWorker')) {
          mswWorkers.push(registration)
        }
      })
      
      // Désenregistrer tous les workers MSW en une fois
      if (mswWorkers.length > 0) {
        Promise.all(mswWorkers.map(reg => reg.unregister())).then(() => {
          console.log(`✅ MSW: ${mswWorkers.length} service worker(s) désenregistré(s), rechargement de la page...`)
          setTimeout(() => {
            window.location.reload()
          }, 500)
        }).catch(error => {
          console.warn('⚠️ MSW: Erreur lors du désenregistrement des service workers:', error)
        })
      } else {
        console.log('MSW: Aucun service worker MSW trouvé, MSW est désactivé')
      }
    }).catch(error => {
      console.warn('⚠️ MSW: Erreur lors de la récupération des service workers:', error)
    })
  }
  
  // Ne pas démarrer MSW du tout
  console.log('MSW: Désactivé (mode Firebase)')
  return
}
