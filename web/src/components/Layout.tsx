import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, Outlet, useNavigate } from 'react-router'
import { logout } from '../api/auth'
import { useMe } from '../auth'
import { Button } from './ui'

function UserMenu() {
  const { data: user } = useMe()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const signOut = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      // Başka kullanıcının verisi önbellekte kalmasın
      queryClient.clear()
      queryClient.setQueryData(['me'], null)
      navigate('/')
    },
  })

  if (!user) {
    return (
      <>
        <Link to="/giris">Giriş yap</Link>
        <Link to="/kayit" className="btn btn-primary">
          Kayıt ol
        </Link>
      </>
    )
  }
  return (
    <>
      <Link to="/geziler">Gezilerim</Link>
      <Link to="/tercihler">Tercihlerim</Link>
      <span className="muted nav-user">{user.name ?? user.email}</span>
      <Button variant="secondary" onClick={() => signOut.mutate()} disabled={signOut.isPending}>
        Çıkış yap
      </Button>
      {signOut.isError && (
        <span role="alert" className="field-error">
          Çıkış yapılamadı, tekrar dene
        </span>
      )}
    </>
  )
}

export function Layout() {
  return (
    <div className="layout">
      <header className="header">
        <Link to="/" className="logo">
          Wayora
        </Link>
        <nav className="nav" aria-label="Ana menü">
          <UserMenu />
        </nav>
      </header>
      <main className="content">
        <Outlet />
      </main>
      <footer className="footer">Wayora · JOB-191</footer>
    </div>
  )
}
