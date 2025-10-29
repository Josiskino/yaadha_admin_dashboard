export default [
  {
    title: 'Dashboard',
    icon: { icon: 'tabler-smart-home' },
    to: 'dashboard-dashboard',
  },
  { heading: 'Providers' },
  {
    title: 'Providers',
    icon: { icon: 'tabler-files' },
    children: [
      {
        title: 'Requests',
        to: 'provider-provider-request-dashboard',
        badgeContent: '10',
        badgeClass: 'bg-error',
      },
      {
        title: 'Details',
        to: 'provider-provider-request-details',
      },
    ],
  },
  { heading: 'Categories' },
  {
    title: 'Categories',
    icon: { icon: 'tabler-files' },
    to: 'categories-categories-dashboard',
  },
  { heading: 'Roles & Permissions' },
  {
    title: 'Admin Management',
    icon: { icon: 'tabler-files' },
    children: [
      {
        title: 'Accounts List',

        to: 'admin-admin-dashboard',
      },
      {
        title: 'Roles List',

        to: 'roles',
      },
      {
        title: 'Permissions List',

        to: 'permissions',
      }, 
    ],
  },

]
