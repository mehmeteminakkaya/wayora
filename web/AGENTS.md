# Web: Scoped Agent Instructions

Bu dosya yalnızca `web/**` altında çalışırken geçerlidir. Kök `AGENTS.md` her zaman önceliklidir.

## Yapı

```
web/src/
  main.tsx            # BrowserRouter + AuthProvider
  App.tsx             # Route tablosu
  api.ts              # Tek HTTP istemcisi + tipler + ApiError
  auth/AuthContext.tsx
  components/         # Layout, ProtectedRoute
  pages/              # Landing, Login, Register, Onboarding, Trips, NewTrip, TripDetail
  lib/format.ts       # tarih/para/kategori biçimleyicileri
  index.css           # tasarım sistemi (değişkenler + bileşenler)
```

## Kurallar

- **Tek API istemcisi:** Bileşenlerden doğrudan `fetch` çağırma; `api.ts` fonksiyonlarını kullan.
  Tüm istekler `credentials: 'include'` ile gider.
- **Auth:** Korumalı sayfalar `ProtectedRoute` altında. `useAuth()` dışında oturum durumu tutma.
- **Durum:** Sunucu verisi için yerel state + `useEffect` yeterli; global state ekleme.
- **Tasarım dili:** `docs/DESIGN_SYSTEM.md` ve `index.css` tokenları tek kaynaktır.
  - Fontlar: Anton (display), Public Sans (gövde), IBM Plex Mono (veri), Caveat (el yazısı not).
  - Renkler: putty, krem, mürekkep, terracotta, damga kırmızısı, zeytin. Gradient yok.
  - Radius yok; 2px çizgi, sert offset gölge, fotoğraf çerçevesi, damga ve el yazısı not.
  - Başlıkta emoji, hazır ikon kütüphanesi (Lucide vb.) ve shadcn varsayılanı yok.
  - Scroll animasyonu, cursor efekti, hover'da kaybolan buton yok.
  - Hover yalnızca renk ve çerçeve değiştirir; buton yerinden oynamaz.
- **Erişilebilirlik:** Her form alanı `<label>` ile bağlı, butonlar `type` belirtir, ikon butonlarda
  `aria-label` bulunur, odak halkası korunur. Renk tek başına anlam taşımaz. Dokunma hedefi 44px.
- **Metin:** Kullanıcıya görünen her metin Türkçe; hata mesajları eyleme dönük. Em dash kullanma;
  `·` veya `–` kullan. "Hayalindeki gezi", "keşfetmeye başla" gibi jenerik pazarlama dili yok.
- **Test:** `MemoryRouter` + `AuthProvider` ile render et; `fetch`'i route'a göre mock'la.

## Komutlar

```bash
npm run dev -w web
npm test -w web
npm run build -w web
```
