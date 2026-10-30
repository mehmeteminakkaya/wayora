import { Route, Routes, useParams } from 'react-router-dom'
import { Layout } from './components/Layout'
import { ProtectedRoute } from './components/ProtectedRoute'
import { CityPage } from './pages/CityPage'
import { ExperiencePage } from './pages/ExperiencePage'
import { ExplorePage } from './pages/ExplorePage'
import { HitchhikerPage } from './pages/HitchhikerPage'
import { LandingPage } from './pages/LandingPage'
import { LoginPage } from './pages/LoginPage'
import { NewTripPage } from './pages/NewTripPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { OnboardingPage } from './pages/OnboardingPage'
import { ProfilePage } from './pages/ProfilePage'
import { RegisterPage } from './pages/RegisterPage'
import { TripDetailPage } from './pages/TripDetailPage'
import { TripsPage } from './pages/TripsPage'

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
