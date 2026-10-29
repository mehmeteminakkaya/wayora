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
- **Tasarım dili:** `docs/DESIGN_SYSTEM.md`, `docs/DESIGN_V2.md` ve `index.css` tokenları tek kaynaktır.
  - Fontlar: Overpass (başlık/gövde), Overpass Mono (veri). Türkçe latin-ext doğrulanır.
  - Renkler: krem `#F3F3F1`, beyaz yüzey, mürekkep `#121212`, ikincil `#55575C`,
    ayraç `#DEDED9`, vurgu `#FFC400`. Koyu tema, gradient ve vinyet yok.
  - Radius ailesi: kontrol 4 px, yüzey 8 px, bottom sheet 12 px. Gölge yalnızca
    bottom sheet ve sürüklenen satırda.
  - Lucide ikonları 1,75 çizgiyle kullanılır; emoji ve shadcn varsayılanı yok.
  - Hareket yalnızca durum değişimini açıklar; scroll animasyonu, cursor efekti ve
    dekoratif sürekli animasyon yok. `prefers-reduced-motion` korunur.
  - Hover yalnızca renk/çerçeve değiştirir; dokunmatikte hover'a bağlı işlev yok.
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
