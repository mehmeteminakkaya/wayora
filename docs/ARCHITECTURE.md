# Mimari

Teknoloji listesi GrepThink'te sabitlendi: React + TypeScript, Node + Express, PostgreSQL, Google Maps,
bir LLM API'si. Bu dosya onların **nasıl** bir araya geleceğini anlatıyor. Kararlar öneri; ekip
değiştirirse buraya not düşün (altta "Karar kaydı").

## Genel görünüm

```
┌──────────────────────┐   REST/JSON   ┌───────────────────────────┐
│  web/  (React + TS)  │ ────────────▶ │  api/  (Express + TS)     │
│  Vite, React Router  │               │  auth · trips · places ·  │
│  TanStack Query      │ �-�──────────── │  ai                       │
│  Google Maps JS SDK  │               └─────┬──────────┬──────────┘
└──────────────────────┘                     │          │
                                             ▼          ▼
                                   ┌──────────────┐  ┌─────────────────────┐
                                   │ PostgreSQL   │  │ Harici API'ler       │
                                   │ (Prisma ORM) │  │ · Google Places      │
                                   └──────────────┘  │ · LLM (JSON çıktı)   │
                                                     └─────────────────────┘
```

**Kural:** LLM ve Google Places API anahtarları **sadece backend'de** durur. Frontend yalnızca
tarayıcıya açık olması gereken Maps JS anahtarını kullanır (HTTP referrer kısıtlamalı).

## Repo yapısı (monorepo önerisi)

```
wayora/
├── web/            # React + Vite + TS
├── api/            # Express + TS + Prisma
│   ├── prisma/schema.prisma
│   └── src/{routes,services,middleware,lib}
├── docs/           # bu klasör
└── .github/workflows/ci.yml
```

**npm workspaces** kullanılıyor (ek araç kurmaya gerek yok); kökten `npm install` ikisini de kurar.

## Önerilen kütüphaneler

| Katman | Seçim | Neden |
| :--- | :--- | :--- |
| Frontend | Vite, React Router, TanStack Query, Tailwind (veya MUI) | Hızlı kurulum, sunucu verisi için cache |
| Harita | `@vis.gl/react-google-maps` | Google'ın resmi React sarmalayıcısı |
| Backend | Express, `zod` (doğrulama), `helmet`, `cors` | Basit, ekip biliyor |
| ORM | Prisma 7 (`@prisma/adapter-pg`) | Şema + migration + TS tipleri tek yerde |
| Auth | JWT (httpOnly cookie) + `bcrypt` | Harici servis gerektirmez |
| Test | Vitest + Supertest (api), Vitest + Testing Library (web) | |
| Kalite | oxlint, EditorConfig, GitHub Actions | Her PR'da lint + typecheck + test + build |

## Veri modeli (ilk taslak)

```
User        id, email (unique), passwordHash, name, createdAt
Preference  id, userId → User, interests[] (müze, doğa, yemek…), budgetLevel, travelStyle, pace
Trip        id, userId → User, title, destination, startDate, endDate, budget, currency, status (draft|planned)
TripDay     id, tripId → Trip, dayIndex, date, notes
Activity    id, tripDayId → TripDay, order, title, category, startTime, endTime,
            estimatedCost, placeId? → Place, notes
Place       id, googlePlaceId (unique), name, lat, lng, address, rating, types[], cachedAt
```

`Place` bir önbellek tablosu: Google Places sonuçlarını saklayıp aynı yeri tekrar sorgulamıyoruz
(kota + maliyet). Fotoğrafları kopyalamayın, Google'ın kurallarına göre referansla gösterin.

## REST API (ilk taslak)

| Metot | Yol | Açıklama |
| :--- | :--- | :--- |
| POST | `/api/auth/register` · `/login` · `/logout` | Kayıt / giriş / çıkış |
| GET | `/api/auth/me` | Oturumdaki kullanıcı |
| GET / PUT | `/api/me/preferences` | Tercihler |
| GET / POST | `/api/trips` | Gezileri listele / yeni gezi |
| GET / PATCH / DELETE | `/api/trips/:id` | Gezi detayı / güncelle / sil |
| POST | `/api/trips/:id/generate` | **AI ile gezi planı üret** |
| PATCH | `/api/trips/:id/days/:dayId/activities` | Aktiviteleri yeniden sırala / düzenle |
| GET | `/api/places/search?q=&lat=&lng=` | Yer arama (Places proxy) |
| GET | `/api/places/:googlePlaceId` | Yer detayı |
| GET | `/api/recommendations/destinations` | Tercihe göre destinasyon önerisi |

Hata formatı her yerde aynı: `{ "error": { "code": "...", "message": "..." } }`.

## AI gezi planı akışı

En riskli parça bu; 2. sprintte bir **spike** (deneme) ile başlayın.

1. Kullanıcı: destinasyon, tarih aralığı, bütçe, ilgi alanları, tempo.
2. Backend, Google Places'ten o şehirdeki aday yerleri çeker (kategori başına ~10).
3. LLM'e bir sistem promptu + kullanıcı girdisi + **aday yer listesi** gönderilir; LLM'den
   **sabit bir JSON şemasında** çıktı istenir (structured output / JSON mode):
   ```json
   { "days": [ { "dayIndex": 1, "activities": [
       { "title": "...", "googlePlaceId": "...", "startTime": "09:00",
         "endTime": "11:00", "estimatedCost": 15, "category": "museum" } ] } ],
     "totalEstimatedCost": 240, "tips": ["..."] }
   ```
4. Backend çıktıyı `zod` ile doğrular. LLM'in uydurduğu `googlePlaceId`'ler atılır (sadece aday
   listesindekiler kabul) → halüsinasyon kontrolü.
5. Geçerli plan `TripDay` / `Activity` olarak kaydedilir; kullanıcı sonra düzenler.

Notlar:
- Yer listesini LLM'e vermek, LLM'in olmayan mekân uydurmasını büyük ölçüde engeller.
- Bütçe kontrolünü LLM'e bırakmayın: toplamı backend hesaplasın, aşarsa uyarı gösterin.
- Üretim 10–30 sn sürebilir → frontend'de yükleniyor durumu; istenirse sonra SSE ile akış.
- İstek başına maliyet/kota: kullanıcı başına günlük üretim limiti koyun.
- Kullanıcıya dönük metin ve prompt'lar Türkçe/İngilizce: ürün dili kararı → Karar kaydı.

## Ortamlar ve deploy (öneri)

| Parça | Yer |
| :--- | :--- |
| `web/` | Vercel (veya Netlify) |
| `api/` | Render / Railway (veya Vercel'de Express) |
| PostgreSQL | Neon veya Supabase (ücretsiz katman) |
| Gizli anahtarlar | `.env` (gitignore) + `.env.example` şablonu; deploy platformunun env ayarı |

## Karar kaydı

| Tarih | Karar | Gerekçe |
| :--- | :--- | :--- |
| 2026-10-14 | Teknoloji listesi GrepThink'teki gibi | Ders kapsamında belirlendi |
| 2026-10-14 | npm workspaces monorepo (`web/`, `api/`) | Ek araç gerektirmez |
| 2026-10-14 | Lint: oxlint (Vite şablonunun varsayılanı) | Hızlı, ayarsız; gerekirse ESLint'e geçilebilir |
| 2026-10-14 | Prisma 7.x sabitlendi | npm'deki `latest` 8.0 RC idi; RC kullanmıyoruz |
| 2026-10-14 | Geliştirmede yerel `prisma dev` Postgres'i | Hesap/Docker gerekmez, herkes aynı komutla kurar; yayına alırken Neon/Supabase'e sadece `DATABASE_URL` değişir |
| 2026-10-23 | LLM: offline varsayılan + Gemini/OpenAI adaptörleri | Anahtarsız demo, deterministik test, düşük maliyet |
| 2026-10-23 | Arayüz dili: Türkçe | Ekip ve hedef kullanıcı |
| 2026-10-23 | UI: saf CSS + tasarım değişkenleri | Ek bağımlılık yok, koyu tema ve responsive kolay |
| 2026-10-23 | Auth: JWT httpOnly cookie + bcryptjs | XSS'e karşı token koruması; Windows'ta native derleme yok |
| 2026-10-23 | AI: sağlayıcı adaptörü + offline varsayılan | Anahtarsız demo, deterministik test, sıfır maliyet |
| 2026-10-23 | LLM çıktısı zod + aday filtresi | Halüsinasyon ve prompt injection'a karşı |
| 2026-10-23 | React Router + saf CSS | Küçük bundle, tasarım üzerinde tam kontrol |
| 2026-10-23 | `Trip.tips` alanı | AI ipuçları sayfa yenilense de kalsın |
| 2026-10-23 | Gemini/OpenAI model routing + fallback | Maliyet/gecikme dengesi; sağlayıcı hatasında servis ayakta kalır |
