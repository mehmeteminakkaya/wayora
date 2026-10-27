# Wayora MVP: Teknik Plan

> Spec: `spec.md` · Anayasa: `constitution.md` · Durum: uygulandı

## Teknik bağlam

| Katman | Seçim | Gerekçe |
| :--- | :--- | :--- |
| Frontend | React 19, Vite 8, TypeScript, React Router | Hızlı geliştirme, dosya tabanlı olmayan basit route yapısı |
| Stil | Saf CSS + değişkenler | Ek bağımlılık yok, koyu tema ve responsive kolay |
| Backend | Express 5, TypeScript | Ekip tarafından bilinen, async hata yakalama yerleşik |
| Doğrulama | zod 4 | Env + istek gövdesi + LLM çıktısı tek araçla |
| DB | PostgreSQL + Prisma 7 | Migration, tip güvenliği, yerel `prisma dev` |
| Auth | JWT (httpOnly cookie) + bcryptjs | Sunucu tarafı oturum, XSS'e karşı cookie koruması |
| AI | Sağlayıcı adaptörü + offline üretici | Anahtarsız demo, fallback, test edilebilirlik |
| Test | Vitest + Supertest + Testing Library | Mevcut Vite zinciriyle uyumlu |

## Mimari

```
Browser (React Router)
   │  fetch /api, credentials: include
   ▼
Express app (helmet, cors, json, cookie, rate limit)
   ├── /api/auth            → JWT cookie, bcrypt
   ├── /api/me/preferences  → tercih upsert
   ├── /api/trips           → CRUD + generate
   ├── /api/activities      → aktivite CRUD
   ├── /api/places          → katalog + Place cache
   └── /api/health
   ▼
Prisma → PostgreSQL
   ▼
services/itinerary
   ├── offline üretici (varsayılan)
   ├── Gemini adaptörü
   ├── OpenAI adaptörü
   └── zod doğrulama + fallback
```

## Veri modeli

- `User` 1-1 `Preference`
- `User` 1-N `Trip` 1-N `TripDay` 1-N `Activity`
- `Activity` N-1 `Place` (opsiyonel)

Önemli kısıtlar:

- `Preference.userId` unique.
- `TripDay(tripId, dayIndex)` unique.
- Tüm alt kayıtlar `onDelete: Cascade`; `Activity.placeId` `SetNull`.
- `Trip.tips String[]` AI ipuçlarını kalıcı tutar.

## API sözleşmesi

| Metot | Yol | Auth | Not |
| :--- | :--- | :--- | :--- |
| POST | `/api/auth/register` | yok | 201 + cookie; 409 çift e-posta |
| POST | `/api/auth/login` | yok | 200 + cookie; 401 genel hata |
| POST | `/api/auth/logout` | yok | 204, cookie siler |
| GET | `/api/auth/me` | ✓ | 401 oturum yoksa |
| GET/PUT | `/api/me/preferences` | ✓ | upsert |
| GET/POST | `/api/trips` | ✓ | liste / oluştur |
| GET/PATCH/DELETE | `/api/trips/:id` | ✓ | sahiplik, 404 |
| POST | `/api/trips/:id/generate` | ✓ + limit | plan üret, `{trip, meta}` |
| POST | `/api/trips/:tripId/days/:dayId/activities` | ✓ | aktivite ekle |
| PATCH/DELETE | `/api/activities/:id` | ✓ | güncelle / sil |
| GET | `/api/places/search?q=&destination=` | ✓ | katalog + cache |
| GET | `/api/places/:googlePlaceId` | ✓ | detay |

Hata biçimi: `{ "error": { "code": "VALIDATION_ERROR", "message": "..." } }`.

## AI akışı

1. Trip + kullanıcı tercihleri okunur.
2. `findCandidates(destination)` ile aday yerler alınır (katalog; anahtar varsa genişletilebilir).
3. `generateItinerary` sağlayıcıyı seçer:
   - `LLM_PROVIDER=offline` → deterministik üretici.
   - `gemini` / `openai` → `routeModel('itinerary')` = güçlü model, 20 sn timeout.
4. LLM yanıtı `parseLlmPlan` (zod) ile doğrulanır.
5. `normalizeLlmPlan`:
   - gün sayısını tamamlar (eksik gün → offline),
   - aday dışı yer kimliklerini `null` yapar,
   - toplam maliyeti yeniden hesaplar.
6. Transaction: eski aktiviteler silinir, günler upsert edilir, aktiviteler `createMany` ile yazılır,
   `Place` kayıtları upsert edilir, `Trip.status='planned'`, `tips` kaydedilir.
7. Hata → `status='failed'`, 502 `AI_FAILED`; sağlayıcı hatası → offline fallback (200).

## Güvenlik kararları

- JWT `httpOnly`, `sameSite=lax`, production'da `secure`.
- Auth 30 istek / 15 dk; AI üretimi `AI_DAILY_LIMIT` (varsayılan 10) / 24 saat.
- `helmet`, CORS allowlist, 1 MB gövde limiti.
- Prompt injection: sınırlandırılmış kullanıcı notu + şema doğrulama + aday filtresi.
- Gizli anahtarlar yalnızca env; `.env.example` örnek değerler içerir.

## Test stratejisi

| Katman | Araç | Kapsam |
| :--- | :--- | :--- |
| API route | Supertest + fake DB | auth, tercih, health, 404, bozuk JSON |
| Servis | Vitest + fetch stub | offline plan, halüsinasyon filtresi, prompt sınırı, fallback, Gemini |
| Web | Testing Library + MemoryRouter | landing, login, korumalı yönlendirme, boş liste |

Komut: `npm test`. CI'da lint + typecheck + test + build + audit + secret scan.

## Aşamalar

| Aşama | Çıktı | Durum |
| :--- | :--- | :--- |
| 0 | Monorepo, CI, health, Prisma | ✅ |
| 1 | Auth, tercihler, gezi CRUD, tasarım sistemi | ✅ |
| 2 | Yer kataloğu, Place cache, AI spike | ✅ (offline) |
| 3 | AI plan üretimi, doğrulama, fallback, UI | ✅ |
| 4 | Aktivite düzenleme, bütçe özeti | ✅ (sürükle-bırak hariç) |
| 5 | Test, erişilebilirlik, demo, agent artefaktları | ✅ |

## Kararlar

| Tarih | Karar | Gerekçe |
| :--- | :--- | :--- |
| 2026-10-23 | JWT httpOnly cookie | XSS ile token çalınmasını zorlaştırır; CSRF için `sameSite=lax` |
| 2026-10-23 | bcryptjs | Windows'ta native derleme gerektirmez |
| 2026-10-23 | Offline AI varsayılan | Anahtarsız demo, deterministik test, maliyet sıfır |
| 2026-10-23 | `Trip.tips` kalıcı | Plan ipuçları sayfa yenilenince kaybolmasın |
| 2026-10-23 | React Router + saf CSS | Küçük bundle, tasarım üzerinde tam kontrol |
| 2026-10-23 | LLM çıktısı asla doğrudan yazılmaz | Halüsinasyon ve prompt injection'a karşı savunma |

## Riskler

| Risk | Etki | Önlem |
| :--- | :--- | :--- |
| LLM uydurma mekân | Yüksek | Aday listesi + ID filtresi + offline fallback |
| LLM maliyeti/kotası | Orta | Günlük limit, timeout, model routing, offline varsayılan |
| Prompt injection | Yüksek | Sınırlandırılmış notlar, şema, çıktıyı veri olarak işleme |
| DB migration hatası | Orta | `prisma migrate deploy`, CI'da typecheck |
| Kapsam kayması | Orta | Spec'teki kapsam dışı listesi, küçük PR kuralı |
