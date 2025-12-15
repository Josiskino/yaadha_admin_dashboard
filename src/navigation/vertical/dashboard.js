export default [
  // {
  //   title: 'Dashboard',
  //   icon: { icon: 'tabler-smart-home' },
  //   to: 'dashboard-dashboard',
  // },
  // { heading: 'Providers' },
  // {
  //   title: 'Providers',
  //   icon: { icon: 'tabler-files' },
  //   children: [
  //     {
  //       title: 'Requests',
  //       to: 'provider-provider-request-dashboard',
  //       badgeContent: '10',
  //       badgeClass: 'bg-error',
  //     },
  //     {
  //       title: 'Details',
  //       to: 'provider-provider-request-details',
  //     },
  //   ],
  // },
  {
    title: 'Categories',
    icon: { icon: 'tabler-category' },
    children: [
      {
        title: 'Categories',
        to: 'categories-categories-dashboard',
      },
      {
        title: 'Sub-categories',
        to: 'categories-subcategories-dashboard',
      },
      {
        title: 'Prestations',
        to: 'categories-prestations-dashboard',
      },
      {
        title: 'Import en masse',
        to: 'categories-import-data',
      },
    ],
  },
  {
    title: 'Admin Management',
    icon: { icon: 'tabler-users' },
    to: 'admin-admin-dashboard',
    // children: [
    //   {
    //     title: 'Accounts List',
    //     to: 'admin-admin-dashboard',
    //   },
    //   {
    //     title: 'Roles List',
    //     to: 'roles',
    //   },
    //   {
    //     title: 'Permissions List',
    //     to: 'permissions',
    //   }, 
    // ],
  },

]
