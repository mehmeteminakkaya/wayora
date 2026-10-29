# Wayora

**Şehri hisset, gününü şekillendir.**

Wayora, ilgi alanlarına, bütçene ve tempona göre **gün gün, saat saat seyahat planı**
üreten mobil öncelikli bir şehir rehberi ve planlama uygulamasıdır. Kullanıcı yalnızca bir
şehir seçmez; deneyimleri keşfeder, rotasına ekler, tarih ve bütçesini belirler ve oluşan
planı gün gün düzenler.

İstinye Üniversitesi **JOB-191** ders projesi (GrepThink ekibi).

> **Durum:** V2 çalışıyor. 10 şehir ve 100 deneyimlik katalog, keşif, deneyim seçimi,
> kimlik doğrulama, onboarding, rota oluşturma, gün planlama, bütçe özeti ve profil
> akışları uçtan uca hazır. Uygulama **API anahtarı olmadan** çalışır.

![Wayora V2 keşfet ekranı](docs/audit/v2-explore-desktop.png)

## İçindekiler

- [Ne yapar?](#ne-yapar)
- [Öne çıkanlar](#öne-çıkanlar)
- [Ekranlar](#ekranlar)
- [Hızlı başlangıç](#hızlı-başlangıç)
- [Demo akışı](#demo-akışı)
- [Mimari](#mimari)
- [Frontend](#frontend)
- [API](#api)
- [Veri modeli](#veri-modeli)
- [Şehir kataloğu](#şehir-kataloğu)
- [AI plan üretimi](#ai-plan-üretimi)
- [Tasarım sistemi](#tasarım-sistemi)
- [Test ve doğrulama](#test-ve-doğrulama)
- [Güvenlik](#güvenlik)
- [Bilinen sınırlar](#bilinen-sınırlar)
- [Yol haritası](#yol-haritası)
- [Dokümanlar](#dokümanlar)
- [Ekip](#ekip)
- [Katkı](#katkı)

## Ne yapar?

Wayora üç temel duygu üzerine kurulur:

- **Keşfederken merak:** Fotoğraflı şehir kartları, kategoriler ve kısa karar bilgileri.
- **Planlarken kontrol:** Seçilen durakların anlık özeti, tarih/bütçe adımları ve gün gün plan.
- **Tamamladığında rahatlık:** Sabit eylem çubuğu, kısa onay metinleri ve düzenlenebilir rota.

Mevcut sürümde kullanıcı:

1. **Keşfet** ekranında şehir veya deneyim arar; kategori ve sıralama filtrelerini kullanır.
2. Şehir rehberinde deneyimleri süre, tahmini fiyat ve katalog puanıyla karşılaştırır.
3. Beğendiği deneyimleri seçer; sabit özetten seçimlerini görür ve kaldırır.
4. Seçimlerini yeni rota akışına taşır; gerekirse giriş yapar ve kaldığı yerden devam eder.
5. Tarih, toplam bütçe ve tempo bilgisini belirler.
6. Oluşan rotayı gün şeridinde gezer; durak ekler, siler ve sıralamayı değiştirir.
7. Rota detayında Ticketmaster etkinliklerini ve Duffel test uçuşlarını görür.
8. Tercihlerini profilden günceller; rotalarını yaklaşan, taslak ve geçmiş olarak görür.

## Öne çıkanlar

### Ürün akışı

- 10 şehir ve 100 lisanslı deneyimden oluşan sürümlenmiş katalog.
- Şehir/deneyim arama, kategori filtresi, sıralama ve boş sonuç durumu.
- Deneyim detayında süre, tahmini kişi başı maliyet, katalog puanı, pratik bilgiler ve
  OpenStreetMap bağlantısı.
- Seçim özeti URL'de taşınır; giriş veya yeni kayıt sonrası seçimler kaybolmaz.
- 3 adımlı yeni rota sihirbazı: şehir → tarih → bütçe/tempo.
- Rota detayında gün sekmeleri, gün panosu, dikey rota çizgisi, liste/harita görünümü,
  durak ekleme/silme ve sürükleme, klavye ve butonlarla sıralama.
- Şehir sayfasında ve rota detayında Ticketmaster ile canlı etkinlik keşfi; rota detayında
  Duffel test token'ı varsa uçuş fikri.
- Rotalarım ekranında yaklaşan, taslak ve geçmiş rotalar; silme onayı.
- Profilde kayıtlı tercihleri görüntüleme ve düzenleme.
- **Canlı keşif:** Ticketmaster Discovery ile şehir sayfasında ve rota detayında
  şehir etkinlikleri; Duffel test token'ı varsa uçuş fikri. Anahtar yoksa bölüm uydurma
  veri üretmez, yapılandırma notu gösterir. Otel/rezervasyon satışı bu sürümde yoktur.

### Dayanıklılık

- LLM anahtarı yoksa deterministik **offline** plan üreticisi devreye girer.
- LLM yanıtı `zod` ile doğrulanır; katalogda olmayan yer kimlikleri atılır.
- API hata biçimi her yerde aynıdır: `{ "error": { "code": "...", "message": "..." } }`.
- Yükleme, boş, hata, tekrar dene, işlem sürüyor ve başarı durumları ayrı ayrı tasarlanmıştır.
- Optimistik seçim ve sıralama işlemlerinde tekrar dokunuşlar kuyruk oluşturmaz.
- Keşfet'te arama, filtre, sıralama ve scroll konumu geri dönüşte korunur.
- `prefers-reduced-motion` tercihinde tüm işlevler animasyonsuz kullanılabilir.

### Tasarım

- V2 kimliği: krem zemin, beyaz yüzey, güçlü Overpass tipografisi ve kontrollü sarı vurgu.
- Mobilde 4 sekmeli alt navigasyon: **Keşfet, Rotalarım, Planla, Profil**.
- 320, 375, 390 ve 430 px genişliklerde yatay taşma ve kesilen ana eylem kontrolü.
- 44 px dokunma hedefleri, görünür klavye odağı, dialog semantiği ve etiketli formlar.
- Gerçek lisanslı fotoğraflar; kategori/şehir görseli olduğu açıkça belirtilir.

## Ekranlar

Ekran görüntüleri yerel geliştirme ortamından alınmıştır. Tam boy görseller
[`docs/audit/`](docs/audit/) altındadır.

| Landing | Keşfet | Şehir |
| :---: | :---: | :---: |
| <img src="docs/audit/polish-landing-375.png" width="240" alt="Wayora landing mobil"> | <img src="docs/audit/v2-explore-mobile.png" width="240" alt="Wayora keşfet mobil"> | <img src="docs/audit/v2-city-mobile.png" width="240" alt="Wayora şehir rehberi mobil"> |

| Deneyim | Seçim özeti | Yeni rota |
| :---: | :---: | :---: |
| <img src="docs/audit/v2-experience-mobile.png" width="240" alt="Wayora deneyim detayı mobil"> | <img src="docs/audit/polish-city-sheet-320.png" width="240" alt="Wayora seçim özeti bottom sheet"> | <img src="docs/audit/v2-new-trip-prefilled-mobile.png" width="240" alt="Wayora yeni rota adımı"> |

| Rota detayı | Rotalarım | Profil |
| :---: | :---: | :---: |
| <img src="docs/audit/v2-trip-detail-mobile.png" width="240" alt="Wayora rota detayı mobil"> | <img src="docs/audit/v2-trips-mobile.png" width="240" alt="Wayora rotalarım mobil"> | <img src="docs/audit/v2-profile-mobile.png" width="240" alt="Wayora profil mobil"> |

| Onboarding | Giriş |
| :---: | :---: |
| <img src="docs/audit/v2-onboarding-mobile.png" width="240" alt="Wayora onboarding mobil"> | <img src="docs/audit/v2-login-mobile.png" width="240" alt="Wayora giriş mobil"> |

> Not: Ekran görüntüleri gerçek API ve yerel PostgreSQL üzerinde çalışan uygulamadan alınmıştır.
> Fiziksel cihaz testi yapılmamıştır.

## Hızlı başlangıç

### Gerekenler

- **Node.js 22.22.2+ veya 24.15+** (önerilen 24; bkz. `.nvmrc`)
- npm
- Docker veya harici PostgreSQL hesabı **gerekmez**: Prisma'nın yerel PostgreSQL sunucusu
  `prisma dev` ile bilgisayarında çalışır.

> **Node sürümün eskiyse:** `npm install` / `npm run setup` en başta `EBADENGINE` ile durur
> (`.npmrc` içinde `engine-strict=true`). Alt sınırı web testlerini çalıştıran `jsdom` belirliyor;
> `jsdom@30`, `^22.22.2 || ^24.15.0 || >=26` istiyor. Node'u güncelle; sürüm yöneticisi
> kullanıyorsan proje klasöründe `nvm use` ya da `fnm use` `.nvmrc`'deki 24'ü seçer.

### Kurulum

```bash
git clone https://github.com/mehmeteminakkaya/wayora.git
cd wayora

npm run setup
# bağımlılıklar + api/.env + yerel PostgreSQL + migration'lar

npm run dev
# veritabanı + API :4000 + web :5180
# API açılışta 10 şehir / 100 deneyim kataloğunu idempotent seed eder
```

Tarayıcıda [http://localhost:5180](http://localhost:5180) açılır.

Sağlık kontrolü:

```bash
curl http://localhost:4000/api/health
# {"status":"ok","db":"ok"}
```

### Ortam değişkenleri

`npm run setup`, `api/.env.example` dosyasını `api/.env` olarak kopyalar. `.env` commit'lenmez.
Yerel geliştirme için varsayılanlar yeterlidir:

```dotenv
DATABASE_URL="postgres://postgres:postgres@localhost:51214/template1?sslmode=disable"
API_PORT=4000
CORS_ORIGIN="http://localhost:5180"

JWT_SECRET="wayora-dev-only-secret-change-me-32-chars"
JWT_EXPIRES_IN=7d
COOKIE_NAME=wayora_session

LLM_PROVIDER=offline
# DEEPSEEK_API_KEY=...
DEEPSEEK_MODEL=deepseek-chat
LLM_MODEL_FAST=gemini-2.0-flash
LLM_MODEL_SMART=gemini-2.5-pro
LLM_TIMEOUT_MS=20000
AI_DAILY_LIMIT=10

# Opsiyonel ücretsiz keşif sağlayıcıları
# TICKETMASTER_API_KEY=       # Discovery, günde 5.000 çağrı
# DUFFEL_ACCESS_TOKEN=        # duffel_test_... ile test modu
DISCOVERY_TIMEOUT_MS=10000
```

Canlı keşif sağlayıcıları opsiyoneldir; anahtar yoksa uygulamanın ana yolculuğu çalışmaya
devam eder. Ticketmaster anahtarı yalnızca etkinlik keşfi içindir; bilet satın alma Partner
API'si gerektirir. Duffel test token'ı sahte fiyat üretir, gerçek rezervasyon yapmaz.

Production'da en az `JWT_SECRET` değiştirilmeli ve HTTPS için `COOKIE_SECURE=true`
kullanılmalıdır. Gemini/OpenAI/DeepSeek kullanmak için `LLM_PROVIDER` ve ilgili API anahtarı
ayarlanır. Anahtar yoksa uygulama offline modda çalışmaya devam eder.

DeepSeek örneği:

```dotenv
LLM_PROVIDER=deepseek
DEEPSEEK_API_KEY=...
DEEPSEEK_MODEL=deepseek-chat
```

### Ücretsiz canlı keşif (opsiyonel)

Rota detayındaki ve şehir sayfasındaki “Canlı keşif” bölümü iki sağlayıcıyı destekler:

- **Ticketmaster Discovery:** ücretsiz developer anahtarı; varsayılan kota günde 5.000 çağrı.
  Etkinlik keşfi ve bilet sayfası bağlantısı sağlar, bilet satın almaz.
- **Duffel test modu:** ücretsiz `duffel_test_...` token'ı; sahte uçuş fiyatları üretir.
  Gerçek rezervasyon veya canlı fiyat değildir.

```dotenv
# api/.env
TICKETMASTER_API_KEY=...
DUFFEL_ACCESS_TOKEN=duffel_test_...
DISCOVERY_TIMEOUT_MS=10000
```

Anahtarlar yoksa bölüm sahte veri üretmez; yapılandırma notu gösterir. Ticketmaster anahtarı:
https://developer.ticketmaster.com · Duffel test hesabı: https://app.duffel.com/join

Otel arama, canlı bilet satın alma ve ödeme bu sürümde yoktur. Bu özellikler partner
sözleşmesi, ödeme ve iade süreçleri gerektirir; ayrı bir faz olarak planlanmıştır.

## Canlı ortam

- **Web + API:** https://wayora-ten.vercel.app
- **Vercel projesi:** `bsyilmazs-projects/wayora`
- **Veritabanı:** Neon Serverless PostgreSQL (Vercel Marketplace)
- **Mimari:** Vercel Services; `web/` Vite servisi, `api/` Express servisi
- **API sağlık:** https://wayora-ten.vercel.app/api/health

Canlı ortamda Prisma migration'ları uygulanmış ve 10 şehir / 100 deneyim kataloğu
seed edilmiştir. API anahtarları ve veritabanı URL'si Vercel Environment Variables
üzerinden yönetilir; repoda tutulmaz.

Yeniden deploy:

```bash
vercel deploy --prod
```

> Marketplace veritabanını değiştirirken migration'ları unutma:
> `npm run db:deploy -w api` ve katalog seed'i.

## Demo akışı

1. **Keşfet** ekranına git; arama alanına `İstanbul` yaz.
2. Şehir kartını aç; iki deneyim seç.
3. Alt özetten seçimleri kontrol et; **Rotanı oluştur**.
4. Giriş yap veya yeni hesap aç. Giriş sonrası seçimler ve dönüş adresi korunur.
5. Tarih aralığını ve toplam bütçeyi belirle; rotayı oluştur.
6. Rota detayında gün şeridini değiştir; durak ekle, sil veya sırala.
7. **Rotalarım** ekranında rotayı yeniden aç; **Profil** ekranında tercihleri güncelle.

Yerel veritabanını sıfırlamadan tekrar denemek için yeni bir e-posta ile kayıt olabilirsin.

## Mimari

```text
┌────────────────────────────┐        REST/JSON        ┌─────────────────────────────┐
│ web/                       │ ──────────────────────▶ │ api/                        │
│ React 19 · TypeScript      │ ◀────────────────────── │ Express 5 · TypeScript      │
│ Vite · React Router        │      HttpOnly cookie    │ zod · helmet · rate limit   │
│ saf CSS · Lucide           │                         └───────────┬─────────────────┘
└─────────────┬──────────────┘                                     │
              │ OpenStreetMap embed                                │ Prisma 7
              ▼                                                    ▼
       Harita / dış bağlantı                              PostgreSQL
                                                          (yerel prisma dev)
                                                                   │
                                                                   ▼
                                                     ┌──────────────────────────────────┐
                                                     │ itinerary service                │
                                                     │ offline · Gemini · OpenAI        │
                                                     │ DeepSeek · doğrulama + fallback │
                                                     └──────────────────────────────────┘
```

### Kararlar

- **Monorepo:** npm workspaces (`web/`, `api/`); ek araç gerekmez.
- **Frontend:** React 19 + Vite + React Router; global state kütüphanesi yok.
- **Backend:** Express 5 + zod; tüm hata yanıtları ortak biçimde.
- **Veritabanı:** Prisma 7 + `@prisma/adapter-pg`; yerelde `prisma dev`.
- **Auth:** JWT, HttpOnly cookie; token tarayıcıda localStorage'a yazılmaz.
- **Harita:** anahtarsız OpenStreetMap embed; embed yüklenmezse dış bağlantı gösterilir.
- **Canlı keşif:** Ticketmaster Discovery ve Duffel test token'ı opsiyonel; anahtar yoksa
  uygulama offline çalışır ve sahte veri üretmez.
- **Tasarım:** saf CSS + merkezi tokenlar; Tailwind/UI kit yok.
- **AI:** offline varsayılan; Gemini/OpenAI/DeepSeek adaptörleri opsiyonel.

## Frontend

### Sayfa yapısı

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
| `/profil` | Profil ve tercihler | Korumalı |
| `*` | 404 | Herkese açık |

### Yapı

```text
web/src/
  App.tsx                 route tablosu
  api.ts                  tek HTTP istemcisi + tipler + ApiError
  auth/AuthContext.tsx    oturum bağlamı
  components/
    Layout.tsx            header, 4 sekmeli mobil nav, footer, scroll davranışı
    BottomSheet.tsx       odak tuzağı ve scroll kilidi olan dialog
    Photo.tsx             lisanslı fotoğraf + etiketli fallback
    Skeletons.tsx         içerik yerleşimine yakın yükleme durumları
    ProtectedRoute.tsx    giriş sonrası dönüş adresi
    ErrorBoundary.tsx     beklenmeyen render hataları
  pages/                  Landing, Explore, City, Experience, Login, Register,
                          Onboarding, Trips, NewTrip, TripDetail, Profile, NotFound
  lib/format.ts           tarih, para, süre ve kategori biçimleyicileri
  lib/photos.ts           şehir/kategori fotoğraf eşlemeleri
  index.css               V2 tasarım tokenları ve tüm responsive stiller
```

### Üç imza etkileşim

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

### Durum yönetimi

- Sunucu verisi için yerel state + `useEffect`; global veri katmanı yok.
- Arama/filtre/sıralama URL'de; geri dönüşte geri yüklenir.
- Explore scroll konumu `sessionStorage` ile geri getirilir.
- Giriş sonrası dönüş adresi `ProtectedRoute` state'inde taşınır.
- Seçimler ve şehir filtresi URL'de; yenileme ve geri navigasyon dayanıklıdır.
- API isteklerinde eski yanıtın yeni sonucu ezmesini engelleyen aktiflik kontrolü vardır.

## API

### Teknoloji

- Express 5
- TypeScript
- Prisma 7 + PostgreSQL
- zod doğrulama
- JWT + bcryptjs
- helmet, CORS, rate limit

### Endpoint'ler

| Metot | Yol | Açıklama |
| :--- | :--- | :--- |
| `GET` | `/api/health` | API ve veritabanı sağlığı |
| `POST` | `/api/auth/register` | Kayıt |
| `POST` | `/api/auth/login` | Giriş |
| `POST` | `/api/auth/logout` | Çıkış |
| `GET` | `/api/auth/me` | Oturumdaki kullanıcı |
| `GET` / `PUT` | `/api/me/preferences` | Tercihleri getir / kaydet |
| `GET` / `POST` | `/api/trips` | Rotaları listele / oluştur |
| `GET` / `PATCH` / `DELETE` | `/api/trips/:id` | Rota detayı / güncelle / sil |
| `POST` | `/api/trips/:id/generate` | Offline/LLM plan üret |
| `POST` | `/api/trips/:id/experiences` | Seçilen katalog deneyimlerini rotaya aktar |
| `POST` | `/api/trips/:tripId/days/:dayId/activities` | Güne aktivite ekle |
| `PATCH` / `DELETE` | `/api/activities/:id` | Aktiviteyi güncelle / sil |
| `GET` | `/api/cities` | 10 şehir özeti |
| `GET` | `/api/cities/search?q=...` | Şehir/deneyim arama |
| `GET` | `/api/cities/:slug` | Şehir ve deneyimleri |
| `GET` | `/api/cities/:slug/experiences?category=...` | Kategoriye göre deneyimler |
| `GET` | `/api/cities/_meta/count` | Katalog sayıları |
| `GET` | `/api/places/search?q=&destination=` | Yer arama (opsiyonel Google Places proxy) |
| `GET` | `/api/places/:googlePlaceId` | Yer detayı |
| `GET` | `/api/discovery/status` | Ticketmaster/Duffel yapılandırma durumu |
| `GET` | `/api/discovery/events?city=&startDate=&endDate=` | Ticketmaster etkinlik keşfi |
| `GET` | `/api/discovery/flights?origin=&destination=&departureDate=&returnDate=` | Duffel uçuş araması (oturum gerekli) |

`/api/discovery/events` herkese açıktır; `/api/discovery/flights` oturum ister ve
`DUFFEL_ACCESS_TOKEN` yoksa 503 `DUFFEL_NOT_CONFIGURED` döner. Anahtarlar hiçbir zaman
frontend'e gönderilmez. Ticketmaster yanıtları 5 dakika, Duffel yanıtları 5 dakika
bellekte cache'lenir; keşif endpoint'leri IP başına saatte 120 istekle sınırlıdır.

Şehir endpoint'leri herkese açıktır. Kullanıcı verisi döndüren tüm endpoint'ler
`requireAuth` ile korunur; başka kullanıcının kaynağı **404** döner.

### Hata biçimi

```json
{
  "error": {
    "code": "TRIP_NOT_FOUND",
    "message": "Rota bulunamadı."
  }
}
```

### Rate limit

- Giriş/kayıt: 15 dakikada 30 başarısız deneme.
- AI plan üretimi: kullanıcı başına `AI_DAILY_LIMIT` (varsayılan 10).
- Test ortamında rate limit devre dışıdır.

## Veri modeli

```text
User
 ├── Preference (1:1)
 └── Trip (1:N)
      └── TripDay (1:N)
           └── Activity (1:N)
                └── Place (opsiyonel)

City
 └── CityExperience (1:N)
```

- `User`: e-posta, hash'lenmiş şifre, ad.
- `Preference`: ilgi alanları, bütçe seviyesi, seyahat tarzı, tempo.
- `Trip`: destinasyon, tarih, toplam bütçe, para birimi, durum, ipuçları.
- `TripDay`: gün indeksi, tarih, notlar.
- `Activity`: sıra, başlık, kategori, saat, tahmini maliyet, yer, not.
- `City` / `CityExperience`: keşif kataloğu; seed sırasında idempotent yazılır.
- `Place`: Google Places/offline katalog için önbellek.

Detaylı şema: [`api/prisma/schema.prisma`](api/prisma/schema.prisma).

## Şehir kataloğu

Kapsam: **10 şehir, 100 deneyim**.

| Şehir | Ülke | Deneyim |
| :--- | :--- | ---: |
| İstanbul | Türkiye | 10 |
| Paris | Fransa | 10 |
| Roma | İtalya | 10 |
| Barselona | İspanya | 10 |
| Londra | Birleşik Krallık | 10 |
| Amsterdam | Hollanda | 10 |
| Berlin | Almanya | 10 |
| Prag | Çekya | 10 |
| Viyana | Avusturya | 10 |
| Lizbon | Portekiz | 10 |

Her deneyimde ad, kategori, mahalle/adres, süre, tahmini kişi başı fiyat, para birimi,
fiyat notu, açıklama, etiketler, katalog puanı, açılış saati notu ve varsa resmî bağlantı
bulunur.

Katalog kaynağı: [`api/src/data/city-catalog.ts`](api/src/data/city-catalog.ts).
Sunucu açılışında `City` ve `CityExperience` tablolarına idempotent seed edilir; veritabanı
boşsa `/api/cities` statik katalogdan da cevap üretebilir.

> Fiyatlar 2026 sonbaharı için yaklaşık değerlerdir. Canlı açık/kapalı durumu, kesin bilet
> fiyatı, rezervasyon uygunluğu veya kullanıcı yorumu değildir; kullanıcı resmî bağlantıya
> yönlendirilir. Katalog canlı scrape edilmez.

Fotoğraf lisansları: [`docs/PHOTO_CREDITS.md`](docs/PHOTO_CREDITS.md) ·
[`web/public/photo-credits.html`](web/public/photo-credits.html).

## AI plan üretimi

```text
Kullanıcı girdisi
   │
   ▼
Aday deneyimler (şehir kataloğu)
   │
   ├── LLM_PROVIDER=offline  → deterministik offline üretici
   ├── LLM_PROVIDER=gemini   → Gemini
   ├── LLM_PROVIDER=openai   → OpenAI
   └── LLM_PROVIDER=deepseek → DeepSeek
   │
   ▼
zod doğrulaması + aday kimlik filtresi
   │
   ├── başarılı → TripDay / Activity kaydı
   └── hata     → offline fallback (meta.fallback = true)
```

- `offline` varsayılan ve ücretsizdir; demo/test için deterministiktir.
- LLM'e yalnızca aday deneyimler verilir; olmayan yer kimlikleri atılır.
- Toplam maliyet backend'de hesaplanır; bütçe aşımı UI'da uyarı olarak gösterilir.
- Üretim uzun sürebileceği için arayüzde sahte yüzde yerine gerçek aşama metni gösterilir.
- Sağlayıcı hatasında kullanıcı girdileri korunur; rota kaydı oluştuysa mevcut kayda dönüş sunulur.

## Tasarım sistemi

V2 yönü: **fotoğrafla merak, güçlü tipografi, sakin yüzey, ölçülü hareket**.

| Rol | Değer |
| :--- | :--- |
| Zemin | `#F3F3F1` |
| Yüzey | `#FFFFFF` |
| Ana metin | `#121212` |
| İkincil metin | `#55575C` |
| Ayraç | `#DEDED9` |
| Vurgu | `#FFC400` |
| Başlık/gövde | Overpass |
| Veri | Overpass Mono |
| Kontrol radius | `4px` |
| Yüzey radius | `8px` |
| Sheet radius | `12px` |

- Koyu tema, gradient, vinyet, gölge yığını, el yazısı ve damga yok.
- Gölge yalnızca yükselen bottom sheet ve sürüklenen satırda.
- Mobil alt navigasyon 64 px + safe area; sabit eylem çubuğu 72 px + safe area.
- Hareket süreleri: 120 / 180 / 260 ms; `prefers-reduced-motion` desteklenir.
- Seçili durumlar yalnızca renkle değil, alt çizgi/kalınlık ve `aria-pressed` ile belirtilir.
- Fotoğraf üzerine metin bindirilmez; kategori görseli olduğu açıkça yazılır.

Ayrıntı: [`docs/DESIGN_SYSTEM.md`](docs/DESIGN_SYSTEM.md) ·
[`docs/DESIGN_V2.md`](docs/DESIGN_V2.md).

## Test ve doğrulama

### Otomatik testler

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Son doğrulanan sonuçlar:

| Kontrol | Sonuç |
| :--- | ---: |
| API testleri | 59 / 59 |
| Web testleri | 4 / 4 |
| Toplam Vitest | 63 / 63 |
| Lint | geçti |
| Typecheck | geçti |
| Production build | geçti |
| `npm audit` | temiz |

### Tarayıcı E2E

Dev sunucusu ve Chrome DevTools (`9224`) açıkken:

```bash
node scripts/e2e_api.mjs
node scripts/e2e_v2.mjs
node scripts/e2e_navigation.mjs
node scripts/e2e_register_flow.mjs
node scripts/audit_polish_mobile.mjs
```

Kapsanan akışlar:

- API: kayıt, giriş, tercihler, katalog, rota oluşturma, offline plan, aktivite ekleme/silme,
  sahiplik kontrolü, çıkış, silme.
- Keşif: Ticketmaster etkinlik normalizasyonu, Duffel uçuş normalizasyonu, anahtarsız
  sağlayıcı durumu ve uçuş aramasında oturum koruması.
- V2: arama, deneyim seçimi, seçim özeti, giriş sonrası dönüş, rota oluşturma, gün değiştirme,
  rotalarım, profil, çıkış, konsol hataları.
- Navigasyon: keşif arama/filtre/sıralama ve scroll geri dönüşü, şehir filtresi ve deneyim
  detayından geri dönüş.
- Kayıt: yeni hesap → onboarding → seçimlerle yeni rota akışına dönüş.
- Mobil audit: 320/430 px taşma, bottom sheet, sabit eylem çubuğu.

Kanıtlar: [`docs/audit/`](docs/audit/).

> Fiziksel cihaz testi yapılmamıştır. Mobil doğrulama Chrome DevTools viewport emülasyonuyla
> 320, 375, 390 ve 430 px genişliklerde yapılmıştır.

## Güvenlik

- JWT HttpOnly cookie; token localStorage'a yazılmaz.
- Şifreler bcryptjs ile hash'lenir.
- Production'da güçlü `JWT_SECRET` ve `COOKIE_SECURE=true` zorunludur.
- Helmet, CORS allowlist, JSON gövde limiti ve rate limit.
- Tüm kullanıcı kaynakları `userId` ile filtrelenir; başkasının kaynağı 404 döner.
- LLM çıktısı zod ile doğrulanır; prompt injection ve halüsinasyon filtreleri.
- Gitleaks, CodeQL, Semgrep, Dependabot ve CodeRabbit yapılandırması repoda.
- `.env` gitignore'dadır; yalnızca `.env.example` güncellenir.

Ayrıntı: [`docs/SECURITY.md`](docs/SECURITY.md).

## Bilinen sınırlar

Bu sürümde bilinçli olarak kapsam dışında bırakılanlar:

- Google OAuth ve gerçek şifre sıfırlama sağlayıcısı.
- Canlı rezervasyon, bilet satın alma ve ödeme.
- Canlı açık/kapalı durumu, kesin fiyat veya transfer süresi.
- Ticketmaster bilet satın alma; yalnızca Discovery keşfi bağlı, Partner/Commerce erişimi yok.
- Duffel canlı uçuş/otel satışı; yalnızca test token'ı ile uçuş fikri gösterilir.
- Otel arama; Booking.com Demand API partner başvurusu gerektirir.
- Kullanıcı yorumu/puanı; katalog puanı editoryal veridir.
- MapLibre/Mapbox marker senkronizasyonu; mevcut OSM embed şehir merkezini gösterir.
- PWA/offline harita ve bulut deploy.
- Fiziksel iOS/Android cihaz testi.
- Her deneyim için tekil lisanslı fotoğraf; bazı küçük görseller kategori temsilidir.

Bu maddeler tamamlanmış gibi gösterilmez; arayüz gerekli yerlerde fallback ve açıklama sunar.

## Yol haritası

- [ ] Google OAuth ve e-posta doğrulamalı şifre sıfırlama.
- [ ] Deneyim başına tekil lisanslı görsel seti.
- [ ] MapLibre/Mapbox ile gerçek marker ve rota geometrisi.
- [ ] Canlı fiyat/rezervasyon sağlayıcısı adaptörü.
- [ ] PWA ve çevrimdışı rota görüntüleme.
- [ ] Bulut deploy ve üretim veritabanı.
- [ ] Fiziksel cihaz ve gerçek kullanıcı testi.

## Dokümanlar

| Konu | Dosya |
| :--- | :--- |
| Ürün kapsamı | [`docs/PROJECT_OVERVIEW.md`](docs/PROJECT_OVERVIEW.md), [`docs/specs/001-mvp/spec.md`](docs/specs/001-mvp/spec.md) |
| Canlı keşif kapsamı | [`docs/specs/002-live-discovery/spec.md`](docs/specs/002-live-discovery/spec.md) |
| Mimari | [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) |
| Şehir kataloğu | [`docs/CITY_CATALOG.md`](docs/CITY_CATALOG.md) |
| Tasarım | [`docs/DESIGN_SYSTEM.md`](docs/DESIGN_SYSTEM.md), [`docs/DESIGN_V2.md`](docs/DESIGN_V2.md) |
| Fotoğraf lisansları | [`docs/PHOTO_CREDITS.md`](docs/PHOTO_CREDITS.md) |
| Güvenlik | [`docs/SECURITY.md`](docs/SECURITY.md) |
| Agent iş akışı | [`AGENTS.md`](AGENTS.md), [`docs/ORCHESTRATION.md`](docs/ORCHESTRATION.md) |
| MCP | [`docs/CONTEXT.md`](docs/CONTEXT.md), [`mcp/wayora-context/`](mcp/wayora-context/) |
| Audit | [`docs/audit/AUDIT_REPORT.md`](docs/audit/AUDIT_REPORT.md), [`docs/audit/v2-e2e.json`](docs/audit/v2-e2e.json) |
| Sprint/backlog | [`docs/ROADMAP.md`](docs/ROADMAP.md), [`docs/BACKLOG.md`](docs/BACKLOG.md) |

## Komutlar

### Kök dizin

| Komut | Ne yapar |
| :--- | :--- |
| `npm run setup` | Bağımlılıklar, `api/.env`, yerel PostgreSQL, migration ve seed |
| `npm run dev` | Veritabanı + API + web |
| `npm run lint` | oxlint (tüm workspace) |
| `npm run typecheck` | TypeScript kontrolü |
| `npm test` | Vitest (API + web) |
| `npm run build` | Üretim derlemesi |
| `npm run hooks:install` | pre-commit hook (lint + typecheck) |

### API

| Komut | Ne yapar |
| :--- | :--- |
| `npm run db:start -w api` | Yerel PostgreSQL'i başlatır |
| `npm run db:stop -w api` | Yerel PostgreSQL'i durdurur (veriler kalır) |
| `npm run db:migrate -w api` | Migration üretir/uygular |
| `npm run db:deploy -w api` | Bekleyen migration'ları uygular |
| `npm run db:studio -w api` | Prisma Studio |
| `npm run db:generate -w api` | Prisma client üretir |

### Web

| Komut | Ne yapar |
| :--- | :--- |
| `npm run dev -w web` | Vite dev sunucusu (`:5180`) |
| `npm run build -w web` | Web production build |
| `npm test -w web` | Web testleri |

## Ekip

| Kişi | Rol |
| :--- | :--- |
| Bayram Selim Yılmaz | Product Owner · Frontend Lead |
| Mehmet Emin Akkaya | Scrum Master · Backend + AI Lead |
| Ezgi Turan | Designer |
| Aykut Kayra Akkuş | Database |
| Berfin Aksoy | Frontend + Test |

## Katkı

1. `feat/W-xx-kisa-ad` biçiminde dal aç.
2. İlgili spec/task ve `AGENTS.md` dosyalarını oku.
3. Davranış değişikliği için önce test yaz.
4. `npm run lint && npm run typecheck && npm test && npm run build` çalıştır.
5. PR aç; 1 onay + yeşil CI ile `main`e al.

Agent'larla çalışırken [`AGENTS.md`](AGENTS.md), [`docs/ORCHESTRATION.md`](docs/ORCHESTRATION.md)
ve [`.agents/skills/`](.agents/skills/) izlenir.

## Lisans

Bu repo bir ders projesidir. Üçüncü taraf fotoğrafların lisansları
[`docs/PHOTO_CREDITS.md`](docs/PHOTO_CREDITS.md) içinde belirtilmiştir; kod için ayrı bir
açık kaynak lisansı tanımlanmamıştır.

---

> Bu repo, ders materyali reposundan (`scottyUX/AI-Augmented-Software-Engineering`)
> bağımsızdır. O repoya PR/commit gönderilmez.
