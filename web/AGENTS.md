# Web: Scoped Agent Instructions

Bu dosya yalnızca `web/**` altında çalışırken geçerlidir. Kök `AGENTS.md` her zaman önceliklidir.

## Yapı

```
web/src/
  main.tsx            # CSS katman sırası + BrowserRouter + AuthProvider
  App.tsx             # Route tablosu; sayfa gövdeleri lazy() ile kod bölünür
  api.ts              # Tek HTTP istemcisi + tipler + ApiError
  auth/AuthContext.tsx
  i18n.tsx            # TR/EN sözlüğü + LanguageProvider
  components/         # Layout, AgentChat, InteractiveMap, Photo, BottomSheet, EventFeed…
  pages/              # Landing, Explore, City, Experience, Trips, NewTrip, TripDetail,
                      # Hitchhiker, Profile, Onboarding, Login, Register, NotFound
  lib/format.ts       # tarih/para/kategori biçimleyicileri
  lib/photos.ts       # şehir/kategori görsel eşlemesi
  index.css           # temel tasarım sistemi (değişkenler + bileşenler)
  social.css          # sosyal akış katmanı
  ui-polish.css       # ince ayar katmanı
  app-feel.css        # yalnızca mobil kabuk (cam alt menü, safe area)
```

## Kurallar

- **Tek API istemcisi:** Bileşenlerden doğrudan `fetch` çağırma; `api.ts` fonksiyonlarını kullan.
  Tüm istekler `credentials: 'include'` ile gider.
- **Auth:** Korumalı sayfalar `ProtectedRoute` altında. `useAuth()` dışında oturum durumu tutma.
- **Durum:** Sunucu verisi için yerel state + `useEffect` yeterli; global state ekleme.
- **Kod bölme:** Yeni bir sayfa `App.tsx` içinde `lazy()` ile yüklenir; harita/Three.js gibi ağır
  bağımlılıklar yalnızca kullanan sayfada import edilir. `Layout` içindeki `Suspense` fallback'i korunur.
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
