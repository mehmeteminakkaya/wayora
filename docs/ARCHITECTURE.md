# Mimari

Wayora; React + TypeScript ön yüzü, Express + Prisma arka yüzü ve PostgreSQL veritabanından
oluşan bir npm workspaces monoreposudur. Harita Mapbox GL, yapay zekâ üretimi DeepSeek (anahtar
yoksa offline üretici) üzerinden çalışır. Bu dosya katmanların **nasıl** bir araya geldiğini ve
verilmiş kararların gerekçesini tutar.

## Genel görünüm

```
┌──────────────────────────┐   REST/JSON   ┌──────────────────────────────┐
│  web/ (React 19 + Vite)  │ ────────────▶ │  api/ (Express 5 + Prisma 7) │
│  React Router · saf CSS  │               │  auth · trips · cities ·     │
│  Mapbox GL · Three.js    │               │  social · agent · discovery  │
└──────────────────────────┘               └─────────┬───────────┬────────┘
                                                     │           │
                                                     ▼           ▼
                                           ┌──────────────┐  ┌────────────────────────┐
                                           │ PostgreSQL   │  │ Opsiyonel sağlayıcılar │
                                           │ (Prisma ORM) │  │ · DeepSeek / Gemini    │
                                           └──────────────┘  │ · Ticketmaster, Duffel │
                                                             │ · Google Places        │
                                                             └────────────────────────┘
```

**Kural:** LLM, Duffel, Ticketmaster ve Google Places anahtarları **yalnızca backend'de** durur.
Tarayıcıya açık tek anahtar Mapbox `pk.` token'ıdır; Mapbox panelinde URL kısıtlaması yapılır.
Anahtarlar yoksa uygulama offline katalog, örnek etkinlik/uçuş ve yerleşik plan üreticisiyle
çalışmaya devam eder.

## Repo yapısı

```
wayora/
├── web/            # React + Vite + TS; tasarım sistemi web/src/index.css
├── api/            # Express + TS + Prisma; prisma/schema.prisma
│   └── src/{routes,services,middleware,lib,data}
├── mcp/            # Wayora Context MCP sunucusu (opsiyonel geliştirici aracı)
├── scripts/        # E2E, audit, görsel üretim ve veritabanı yardımcıları
├── docs/           # ürün, mimari, sprint ve agent belgeleri
└── .github/workflows/  # CI, CodeQL, Semgrep, gitleaks
```

**npm workspaces** kullanılıyor; kökten `npm install` iki çalışma alanını da kurar. Node sürümü
`.nvmrc` (24) ve `package.json` `engines` alanıyla sabitlenir; uyumsuz sürümde kurulum
`EBADENGINE` ile durur.

## Kullanılan kütüphaneler

| Katman | Seçim | Neden |
| :--- | :--- | :--- |
| Frontend | React 19, React Router 7, Vite 8, saf CSS + tokenlar | Küçük bundle, tasarım üzerinde tam kontrol |
| İkon / hareket | `lucide-react`, CSS transition | Tek çizgi dili; dekoratif animasyon yok |
| Harita | `mapbox-gl` (token varsa), WebGL yoksa OSM bağlantılı yedek | Vektör harita, 3B bina ve stil seçenekleri |
| Marka | `three` (yalnızca görünürken dinamik import) | 3B logo; ana paketi şişirmez |
| Backend | Express 5, `zod`, `helmet`, `cors`, `express-rate-limit` | Basit, tipli doğrulama ve savunma katmanları |
| ORM | Prisma 7 (`@prisma/adapter-pg`) | Şema + migration + TS tipleri tek yerde |
| Auth | JWT (httpOnly cookie) + `bcryptjs` | XSS'e karşı token koruması; native derleme yok |
| Test | Vitest + Supertest (api), Vitest + Testing Library (web) | Hızlı, aynı komutla iki workspace |
| Kalite | oxlint, EditorConfig, GitHub Actions (CI + CodeQL + Semgrep + gitleaks) | Her PR'da lint, typecheck, test, build ve tarama |

## Veri modeli

```
User        id, email (unique), passwordHash, name, createdAt
Preference  id, userId → User, interests[], budgetLevel, travelStyle, pace
Trip        id, userId → User, title, destination, startDate, endDate, budget, currency,
            status (draft|generating|planned|failed), tips[], notes
TripDay     id, tripId → Trip, dayIndex, date, notes
Activity    id, tripDayId → TripDay, order, title, category, startTime, endTime,
            estimatedCost, placeId? → Place, notes
Place       id, googlePlaceId (unique), name, lat, lng, address, rating, types[], cachedAt
City        id, slug (unique), name, country, summary, bestSeason, currency, sortOrder
CityExperience  id, cityId → City, slug, googlePlaceId (unique), name, category,
            neighborhood, durationMinutes, estimatedCost, priceNote, tags[], sortOrder
TravelerProfile id, userId (unique), displayName, bio, languages[], hostingAvailable, visible
TravelConnection id, requesterId/recipientId → User, status, message, tripId?
ConnectionMessage · BlockedUser · SafetyReport   (sosyal akış ve güvenlik)
```

`Place` bir önbellek tablosu: Google Places sonuçlarını saklayıp aynı yeri tekrar sorgulamıyoruz
(kota + maliyet). Fotoğrafları kopyalamayın, Google'ın kurallarına göre referansla gösterin.
`City` / `CityExperience` kataloğu `api/src/data/city-catalog.ts` kaynağından sunucu açılışında
idempotent biçimde seed edilir.

## REST API

| Metot | Yol | Açıklama |
| :--- | :--- | :--- |
| GET | `/api/health` | Süreç ve veritabanı sağlığı |
| POST | `/api/auth/register` · `/login` · `/logout` | Kayıt / giriş / çıkış |
| GET | `/api/auth/me` | Oturumdaki kullanıcı |
| GET / PUT | `/api/me/preferences` | Tercihler |
| GET / POST | `/api/trips` | Gezileri listele / yeni gezi |
| GET / PATCH / DELETE | `/api/trips/:id` | Gezi detayı / güncelle / sil |
| POST | `/api/trips/:id/generate` | **AI ile gezi planı üret** (günlük limit) |
| POST | `/api/trips/:id/experiences` | Katalog deneyimlerini rotaya aktar |
| POST | `/api/trips/:tripId/days/:dayId/activities` | Güne durak ekle |
| PATCH / DELETE | `/api/activities/:id` | Durağı düzenle / sil |
| GET | `/api/cities` · `/search` · `/:slug` · `/:slug/experiences` · `/_meta/count` | Şehir kataloğu |
| GET | `/api/discovery/status` · `/events` | Sağlayıcı durumu ve etkinlikler |
| GET | `/api/discovery/flights` | Uçuş fiyat fikri (Duffel, oturum gerekir) |
| POST | `/api/agent/chat` | Wayora Agent sohbeti (araç çağrılarıyla) |
| GET / PUT | `/api/social/profile` | Yol Arkadaşları profili |
| GET | `/api/social/matches` | Eşleşmeler (offset/limit) |
| GET / POST / PATCH | `/api/social/connections` · `/requests` · `/:id` | İstek ve sohbet durumu |
| GET / POST | `/api/social/connections/:id/messages` | Mesajlar |
| POST | `/api/social/connections/:id/report` · `/block` | Şikâyet / engelleme |
| GET | `/api/places/search` · `/:googlePlaceId` | Yer arama (Places proxy) |

Hata formatı her yerde aynı: `{ "error": { "code": "...", "message": "..." } }`.
Kullanıcıya ait kaynaklar `userId` ile filtrelenir; başkasının kaynağı `404` döner. Kimlik,
AI üretimi, keşif ve agent uçlarında ayrı hız limitleri vardır.

## AI gezi planı akışı

1. Kullanıcı: destinasyon, tarih aralığı, bütçe, ilgi alanları, tempo.
2. Backend aday yerleri toplar: önce şehir kataloğu (`CityExperience`), varsa Google Places
   sonuçları. Adaylar `googlePlaceId` ile tekilleştirilir ve tercihlere göre puanlanır.
3. DeepSeek'e sistem promptu + kullanıcı girdisi + **aday listesi** gönderilir; yanıt sabit bir
   JSON şemasında istenir. `DEEPSEEK_WEB_SEARCH=true` ise güncel web sonuçları referans olarak
   eklenir; bu metinler talimat değil, veri olarak işaretlenir.
   ```json
   { "days": [ { "dayIndex": 1, "activities": [
       { "title": "...", "googlePlaceId": "...", "startTime": "09:00",
         "endTime": "11:00", "estimatedCost": 15, "category": "museum" } ] } ],
     "totalEstimatedCost": 240, "tips": ["..."] }
   ```
4. Backend çıktıyı `zod` ile doğrular. LLM'in uydurduğu `googlePlaceId`'ler atılır (yalnızca aday
   listesindekiler kabul) → halüsinasyon ve prompt injection kontrolü.
5. Geçerli plan `TripDay` / `Activity` olarak kaydedilir; kullanıcı sonra düzenler. Sağlayıcı
   hatasında deterministik offline üreticiye düşülür ve yanıt `fallback: true` işaretlenir.

Notlar:
- Yer listesini LLM'e vermek, olmayan mekân uydurmasını büyük ölçüde engeller.
- Bütçe kontrolünü LLM'e bırakmayın: toplamı backend hesaplasın, aşarsa uyarı gösterin.
- Üretim 10–30 sn sürebilir → arayüzde aşamalı yükleniyor durumu gösterilir.
- İstek başına maliyet/kota: kullanıcı başına günlük üretim limiti (`AI_DAILY_LIMIT`) uygulanır.
- Kullanıcıya dönük metinler Türkçe; çeviri altyapısı `web/src/i18n.tsx` içindedir.

## Ortamlar ve deploy

| Parça | Yer |
| :--- | :--- |
| `web/` | Vercel (`vercel.json` içinde `web` servisi, SPA rewrite) |
| `api/` | Vercel (`vercel.json` içinde `api` servisi, `app.mts`) veya Render/Railway |
| PostgreSQL | Yerelde `prisma dev`; üretimde Neon / Supabase / Prisma Postgres |
| Gizli anahtarlar | `.env` (gitignore) + `.env.example` şablonu; deploy platformunun env ayarı |

Yerel akış: `npm run setup` → `npm run dev` (db + api :4000 + web :5180). Yayın öncesi
`npm run lint && npm run typecheck && npm test && npm run build` kanıtı aranır.

## Karar kaydı

| Tarih | Karar | Gerekçe |
| :--- | :--- | :--- |
| 2026-10-14 | Teknoloji listesi GrepThink'teki gibi | Ders kapsamında belirlendi |
| 2026-10-14 | npm workspaces monorepo (`web/`, `api/`) | Ek araç gerektirmez |
| 2026-10-14 | Lint: oxlint (Vite şablonunun varsayılanı) | Hızlı, ayarsız; gerekirse ESLint'e geçilebilir |
| 2026-10-14 | Prisma 7.x sabitlendi | npm'deki `latest` 8.0 RC idi; RC kullanmıyoruz |
| 2026-10-14 | Geliştirmede yerel `prisma dev` Postgres'i | Hesap/Docker gerekmez; üretimde yalnızca `DATABASE_URL` değişir |
| 2026-10-23 | LLM: offline varsayılan + Gemini/OpenAI/DeepSeek adaptörleri | Anahtarsız demo, deterministik test, düşük maliyet |
| 2026-10-23 | Arayüz dili: Türkçe | Ekip ve hedef kullanıcı |
| 2026-10-23 | UI: saf CSS + tasarım değişkenleri | Ek bağımlılık yok, responsive ve tutarlı |
| 2026-10-23 | Auth: JWT httpOnly cookie + bcryptjs | XSS'e karşı token koruması; native derleme yok |
| 2026-10-23 | AI: sağlayıcı adaptörü + offline varsayılan | Anahtarsız demo, deterministik test, sıfır maliyet |
| 2026-10-23 | LLM çıktısı zod + aday filtresi | Halüsinasyon ve prompt injection'a karşı |
| 2026-10-23 | React Router + saf CSS | Küçük bundle, tasarım üzerinde tam kontrol |
| 2026-10-23 | `Trip.tips` alanı | AI ipuçları sayfa yenilense de kalsın |
| 2026-10-23 | Gemini/OpenAI model routing + fallback | Maliyet/gecikme dengesi; sağlayıcı hatasında servis ayakta kalır |
| 2026-11-11 | Sayfa gövdeleri rota bazında `lazy` ile bölünür | İlk yüklemede harita/Three.js indirilmez; ana paket ~247 kB |
| 2026-11-11 | Agent tek FAB; odaklı ekranlarda gizli | Ana eylemi örtmeden yardımcı erişim |
| 2026-11-11 | Yüzen alt menü cam efekti yalnızca mobil kabukta | Masaüstünde düz yüzey ve okunabilirlik korunur |
