import { useQuery } from '@tanstack/react-query'
import { Navigate, Outlet, useLocation } from 'react-router'
import { getMe } from './api/auth'

// Oturumdaki kullanıcı; giriş/kayıt/çıkış sonrası ['me'] önbelleği güncellenir
export function useMe() {
  return useQuery({ queryKey: ['me'], queryFn: getMe, staleTime: 5 * 60 * 1000 })
}

// Oturum gerektiren sayfaları sarar; giriş yoksa /giris'e gönderir ve dönüş adresini saklar
export function RequireAuth() {
  const { data: user, isPending } = useMe()
  const location = useLocation()
  if (isPending) return <p className="muted">Yükleniyor…</p>
  if (!user) return <Navigate to="/giris" replace state={{ from: location.pathname }} />
  return <Outlet />
}
