import type { RouteObject } from 'react-router'
import { RequireAuth } from './auth'
import { Layout } from './components/Layout'
import { HomePage } from './pages/HomePage'
import { LoginPage } from './pages/LoginPage'
import { NewTripPage } from './pages/NewTripPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { PreferencesPage } from './pages/PreferencesPage'
import { RegisterPage } from './pages/RegisterPage'
import { TripPage } from './pages/TripPage'
import { TripsPage } from './pages/TripsPage'

// Uygulamanın tüm sayfaları. Testler aynı listeyi createMemoryRouter ile kullanır.
export const routes: RouteObject[] = [
  {
    element: <Layout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'kayit', element: <RegisterPage /> },
      { path: 'giris', element: <LoginPage /> },
      {
        // Oturum gerektiren sayfalar
        element: <RequireAuth />,
        children: [
          { path: 'tercihler', element: <PreferencesPage /> },
          { path: 'geziler', element: <TripsPage /> },
          { path: 'geziler/yeni', element: <NewTripPage /> },
          { path: 'geziler/:tripId', element: <TripPage /> },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]
