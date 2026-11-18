# Frontend

## Sayfa yapısı

| Rota | Ekran | Erişim |
| :--- | :--- | :--- |
| `/` | Landing | Herkese açık |
| `/kesfet` | Şehir keşfi, arama ve filtreler | Herkese açık |
| `/kesfet/:slug` | Şehir rehberi ve deneyim seçimi | Herkese açık |
| `/kesfet/:slug/:experienceSlug` | Deneyim detayı | Herkese açık |
| `/login` | Giriş | Herkese açık |
| `/register` | Kayıt | Herkese açık |
| `/onboarding` | 3 adımlı tercih akışı | Korumalı |
| `/trips` | Rotalarım | Korumalı |
| `/trips/new` | Yeni rota sihirbazı | Korumalı |
| `/trips/:id` | Rota detayı ve gün düzenleme | Korumalı |
| `/yol-arkadaslari` | Yol Arkadaşları eşleşme ve sohbet | Korumalı |
| `/profil` | Profil ve tercihler | Korumalı |
| `*` | 404 | Herkese açık |

## Yapı

```text
web/src/
  App.tsx                 route tablosu
  api.ts                  tek HTTP istemcisi + tipler + ApiError
  auth/AuthContext.tsx    oturum bağlamı
  components/
    Layout.tsx            header, 5 sekmeli mobil nav, footer, scroll davranışı
    BottomSheet.tsx       odak tuzağı ve scroll kilidi olan dialog
    Photo.tsx             lisanslı fotoğraf + etiketli fallback
    Skeletons.tsx         içerik yerleşimine yakın yükleme durumları
    ProtectedRoute.tsx    giriş sonrası dönüş adresi
    ErrorBoundary.tsx     beklenmeyen render hataları
    AgentChat.tsx         Wayora Agent sohbet paneli
    InteractiveMap.tsx    Mapbox GL haritası + OSM yedeği
    CityEvents.tsx / EventFeed.tsx / LiveDiscovery.tsx   canlı keşif bölümleri
  pages/                  Landing, Explore, City, Experience, Login, Register,
                          Onboarding, Trips, NewTrip, TripDetail, Hitchhiker, Profile, NotFound
  lib/format.ts           tarih, para, süre ve kategori biçimleyicileri
  lib/photos.ts           şehir/kategori fotoğraf eşlemeleri
  i18n.tsx                arayüz metinleri
  index.css               V2 tasarım tokenları ve tüm responsive stiller
  app-feel.css / social.css / ui-polish.css   katmanlı ek stiller
```

## Üç imza etkileşim

1. **Rota çizgisi**
   Timeline durak satırları dikey çizgi ve noktalarla birleşir. Gün değiştiğinde içerik
   `day-in` animasyonuyla yerleşir. Sıra değişikliği anında görünür; API'ye kaydedilir ve
   kaydetme durumu kullanıcıya bildirilir.

2. **Seçimden plana**
   Şehir sayfasındaki seçimler URL'de `selected` parametresiyle tutulur. Sabit özet, seçilen
   durak sayısını ve tahmini kişi başı toplamı gösterir. Özet bottom sheet'te açılır; seçim
   kaldırılabilir. Hızlı tekrarlı dokunuşlar fonksiyonel state ile doğru sayılır. CTA
   seçimleri `/trips/new` adresine taşır.

3. **Gün şeridi**
   Gün numarası, tarih ve durak sayısı birlikte gösterilir. Aktif gün sarı vurgu ve
   `aria-pressed` ile belirtilir. Çok günlü rotalarda yatay kaydırma çalışır; seçili gün
   otomatik olarak görünür tutulur. Liste/harita görünümü seçili günü korur.

## Durum yönetimi

- Sunucu verisi için yerel state + `useEffect`; global veri katmanı yok.
- Arama/filtre/sıralama URL'de; geri dönüşte geri yüklenir.
- Explore scroll konumu `sessionStorage` ile geri getirilir.
- Giriş sonrası dönüş adresi `ProtectedRoute` state'inde taşınır.
- Seçimler ve şehir filtresi URL'de; yenileme ve geri navigasyon dayanıklıdır.
- API isteklerinde eski yanıtın yeni sonucu ezmesini engelleyen aktiflik kontrolü vardır.

Tasarım dili: [`DESIGN_SYSTEM.md`](DESIGN_SYSTEM.md) · [`DESIGN_V2.md`](DESIGN_V2.md).
