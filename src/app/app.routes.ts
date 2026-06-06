import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  {
    path: 'home',
    loadComponent: () => import('./pages/home/home').then((m) => m.Home),
  },

  {
    path: 'auth',
    children: [
      {
        path: 'authentication',
        loadComponent: () =>
          import('./pages/auth/authentication/authentication').then(
            (m) => m.Authentication,
          ),
        data: { hideLayout: true },
      },
      {
        path: 'forgot-password',
        loadComponent: () =>
          import('./pages/auth/forgot-password/forgot-password').then(
            (m) => m.ForgotPassword,
          ),
        data: { hideLayout: true },
      },
      {
        path: 'reset-password',
        loadComponent: () =>
          import('./pages/auth/reset-password/reset-password').then(
            (m) => m.ResetPassword,
          ),
        data: { hideLayout: true },
      },
    ],
  },

  {
    path: 'events',
    children: [
      {
        path: '',
        redirectTo: 'event-list',
        pathMatch: 'full',
      },
      {
        path: 'event-list',
        loadComponent: () =>
          import('./pages/events/event-list/event-list').then(
            (m) => m.EventList,
          ),
      },
      {
        path: 'organizer',
        loadComponent: () =>
          import('./pages/events/organizer/organizer-layout/organizer-layout').then(
            (m) => m.OrganizerLayout,
          ),
        data: { hideLayout: true },
        children: [
          {
            path: '',
            redirectTo: 'dashboard',
            pathMatch: 'full',
          },
          {
            path: 'dashboard',
            loadComponent: () =>
              import('./pages/events/organizer/dashboard/dashboard').then(
                (m) => m.Dashboard,
              ),
            data: { hideLayout: true },
          },
          {
            path: 'manage-events',
            loadComponent: () =>
              import('./pages/events/organizer/manage-events/manage-events').then(
                (m) => m.ManageEvents,
              ),
            data: { hideLayout: true },
          },
          {
            path: 'create-event',
            loadComponent: () =>
              import('./pages/events/organizer/create-event/create-event').then(
                (m) => m.CreateEvent,
              ),
            data: { hideLayout: true },
          },

          {
            path: 'orders',
            loadComponent: () =>
              import('./pages/events/organizer/orders/orders').then(
                (m) => m.Orders,
              ),
            data: { hideLayout: true },
          },
          {
            path: 'finance',
            loadComponent: () =>
              import('./pages/events/organizer/finance/finance').then(
                (m) => m.Finance,
              ),
            data: { hideLayout: true },
          },

          {
            path: 'setting',
            loadComponent: () =>
              import('./pages/events/organizer/setting/setting').then(
                (m) => m.Setting,
              ),
            data: { hideLayout: true },
          },
        ],
      },
    ],
  },

  {
    path: 'listings',
    children: [
      {
        path: 'provider',
        loadComponent: () =>
          import('./pages/listings/provider/providers-layout/providers-layout').then(
            (m) => m.ProvidersLayout,
          ),
        data: { hideLayout: true },

        children: [
          {
            path: '',
            redirectTo: 'provider-layouthidelayout',
            pathMatch: 'full',
          },
          {
            path: 'dashboard',
            loadComponent: () =>
              import('./pages/listings/provider/dashboard/dashboard').then(
                (m) => m.Dashboard,
              ),
            data: { hideLayout: true },
          },

          {
            path: 'list-space',
            loadComponent: () =>
              import('./pages/listings/provider/list-space/list-space').then(
                (m) => m.ListSpace,
              ),
            data: { hideLayout: true },
          },

          {
            path: 'manage-listings',
            loadComponent: () =>
              import('./pages/listings/provider/manage-listings/manage-listings').then(
                (m) => m.ManageListings,
              ),
            data: { hideLayout: true },
          },
        ],
      },
    ],
  },

  {
    path: 'contact',
    loadComponent: () =>
      import('./pages/contact/contact').then((m) => m.Contact),
  },

  {
    path: 'my-booking',
    loadComponent: () =>
      import('./pages/my-booking/my-booking').then((m) => m.MyBooking),
  },
];
