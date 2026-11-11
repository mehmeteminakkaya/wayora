import { lazy } from 'react'
import { Route, Routes, useParams } from 'react-router-dom'
import { Layout } from './components/Layout'
import { ProtectedRoute } from './components/ProtectedRoute'
import { LandingPage } from './pages/LandingPage'
import { NotFoundPage } from './pages/NotFoundPage'

// Sayfa gövdeleri rota bazında bölünür: ilk açılışta yalnızca landing ve kabuk
// yüklenir; harita/Three.js gibi ağır bağımlılıklar ilgili sayfaya girildiğinde gelir.
const CityPage = lazy(() =>
  import('./pages/CityPage').then((module) => ({ default: module.CityPage })),
)
const ExperiencePage = lazy(() =>
  import('./pages/ExperiencePage').then((module) => ({ default: module.ExperiencePage })),
)
const ExplorePage = lazy(() =>
  import('./pages/ExplorePage').then((module) => ({ default: module.ExplorePage })),
)
const HitchhikerPage = lazy(() =>
  import('./pages/HitchhikerPage').then((module) => ({ default: module.HitchhikerPage })),
)
const LoginPage = lazy(() =>
  import('./pages/LoginPage').then((module) => ({ default: module.LoginPage })),
)
const NewTripPage = lazy(() =>
  import('./pages/NewTripPage').then((module) => ({ default: module.NewTripPage })),
)
const OnboardingPage = lazy(() =>
  import('./pages/OnboardingPage').then((module) => ({ default: module.OnboardingPage })),
)
const ProfilePage = lazy(() =>
  import('./pages/ProfilePage').then((module) => ({ default: module.ProfilePage })),
)
const RegisterPage = lazy(() =>
  import('./pages/RegisterPage').then((module) => ({ default: module.RegisterPage })),
)
const TripDetailPage = lazy(() =>
  import('./pages/TripDetailPage').then((module) => ({ default: module.TripDetailPage })),
)
const TripsPage = lazy(() =>
  import('./pages/TripsPage').then((module) => ({ default: module.TripsPage })),
)

function CityPageRoute() {
  const { slug } = useParams<{ slug: string }>()
  return <CityPage key={slug ?? 'unknown'} />
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<LandingPage />} />
        <Route path="kesfet" element={<ExplorePage />} />
        <Route path="kesfet/:slug" element={<CityPageRoute />} />
        <Route path="kesfet/:slug/:experienceSlug" element={<ExperiencePage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="onboarding" element={<OnboardingPage />} />
          <Route path="trips" element={<TripsPage />} />
          <Route path="yol-arkadaslari" element={<HitchhikerPage />} />
          <Route path="trips/new" element={<NewTripPage />} />
          <Route path="trips/:id" element={<TripDetailPage />} />
          <Route path="profil" element={<ProfilePage />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
