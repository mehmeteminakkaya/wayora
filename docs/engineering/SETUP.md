# Kurulum, ortam ve deploy

Hızlı başlangıç için kök [`README.md`](../../README.md) yeterlidir. Bu belge ortam
değişkenlerini, opsiyonel sağlayıcıları, demo verisini ve canlı ortamı ayrıntılandırır.

## Ortam değişkenleri

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
DEEPSEEK_WEB_SEARCH=true
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

Wayora Agent sohbeti `DEEPSEEK_API_KEY` varsa canlı yanıt verir; anahtar yoksa arayüz
kullanıcıyı Keşfet ve Rotalarım ekranlarına yönlendirir. Harita için `web/.env` (veya Vercel
web servisi) içine Mapbox **public** token'ı eklenir:

```dotenv
VITE_MAPBOX_TOKEN=pk.eyJ1...
```

Token yoksa harita yerine okunur bir yedek ve OpenStreetMap bağlantısı gösterilir; uygulamanın
ana akışı bozulmaz.

DeepSeek örneği:

```dotenv
LLM_PROVIDER=deepseek
DEEPSEEK_API_KEY=...
DEEPSEEK_MODEL=deepseek-chat
DEEPSEEK_WEB_SEARCH=true
```

`DEEPSEEK_WEB_SEARCH=true` olduğunda plan üretiminden önce DeepSeek Search API'den
şehir/tarih/ilgi alanına uygun web sonuçları alınır. Sonuçlar modele **güvenilmeyen
araştırma bağlamı** olarak verilir; katalog dışı yer üretilmesine izin verilmez. Arama
başarısız olursa plan yine katalogla üretilir.

## Ücretsiz canlı keşif (opsiyonel)

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

Canlı ortamda Prisma migration'ları uygulanmış ve 14 şehir / 140 deneyim kataloğu
seed edilmiştir. API anahtarları ve veritabanı URL'si Vercel Environment Variables
üzerinden yönetilir; repoda tutulmaz.

Yeniden deploy:

```bash
vercel deploy --prod
```

> Marketplace veritabanını değiştirirken migration'ları unutma:
> `npm run db:deploy -w api` ve katalog seed'i.

## Yol Arkadaşları demo verisi

Sunumda boş eşleşme ekranı göstermemek için local veritabanına 75 örnek gezgin eklenebilir:

```bash
npm run demo:seed -w api
```

- Demo hesabı: `demo@wayora.app` / `demo1234`
- Demo rota: 5-9 Aralık 2026, Berlin
- İçerik: 75 görünür profil, 20 eşleşme, 3 gelen istek, 1 giden istek, 2 kabul edilmiş sohbet.
- Komut varsayılan olarak yalnızca local `DATABASE_URL` ile çalışır; production demo için açıkça `DEMO_SEED_ALLOW_PRODUCTION=true` gerekir.
- Bu profiller üretim seed'ine dahil değildir; yalnızca sunum/local demo verisidir.
- Temizlik: `npm run demo:clear -w api`. Production temizliği için `DEMO_SEED_ALLOW_PRODUCTION=true` gerekir.

## Çalışma alanı komutları

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
