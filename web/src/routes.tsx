import type { RouteObject } from 'react-router'
import { Layout } from './components/Layout'
import { HomePage } from './pages/HomePage'
import { NotFoundPage } from './pages/NotFoundPage'
import { PreferencesPage } from './pages/PreferencesPage'
import { RegisterPage } from './pages/RegisterPage'

// Uygulamanın tüm sayfaları. Testler aynı listeyi createMemoryRouter ile kullanır.
export const routes: RouteObject[] = [
  {
    element: <Layout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'kayit', element: <RegisterPage /> },
      { path: 'tercihler', element: <PreferencesPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]
