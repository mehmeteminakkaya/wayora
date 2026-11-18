# API referansı

## Teknoloji

- Express 5
- TypeScript
- Prisma 7 + PostgreSQL
- zod doğrulama
- JWT + bcryptjs
- helmet, CORS, rate limit

## Endpoint'ler

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
| `GET` | `/api/cities` | 14 şehir özeti |
| `GET` | `/api/cities/search?q=...` | Şehir/deneyim arama |
| `GET` | `/api/cities/:slug` | Şehir ve deneyimleri |
| `GET` | `/api/cities/:slug/experiences?category=...` | Kategoriye göre deneyimler |
| `GET` | `/api/cities/_meta/count` | Katalog sayıları |
| `GET` | `/api/places/search?q=&destination=` | Yer arama (opsiyonel Google Places proxy) |
| `GET` | `/api/places/:googlePlaceId` | Yer detayı |
| `GET` | `/api/discovery/status` | Ticketmaster/Duffel yapılandırma durumu |
| `GET` | `/api/discovery/events?city=&startDate=&endDate=` | Ticketmaster etkinlik keşfi |
| `GET` | `/api/discovery/flights?origin=&destination=&departureDate=&returnDate=` | Duffel uçuş araması (oturum gerekli) |
| `GET` / `PUT` | `/api/social/profile` | Yol arkadaşı profilini getir / kaydet |
| `GET` | `/api/social/matches` | Aynı şehir ve tarih kesişimine göre eşleşmeler |
| `POST` | `/api/social/requests` | Karşılıklı bağlantı isteği |
| `GET` | `/api/social/connections` | Gelen, giden ve kabul edilen bağlantılar |
| `PATCH` | `/api/social/connections/:id` | İsteği kabul et / reddet / iptal et |
| `GET` / `POST` | `/api/social/connections/:id/messages` | Kabul edilen bağlantıda mesajlar |
| `POST` | `/api/social/connections/:id/report` | Güvenlik bildirimi ve engelleme |
| `POST` | `/api/social/block` | Kullanıcıyı engelle |
| `POST` | `/api/agent/chat` | Wayora Agent sohbeti (oturum gerekli, saatte 60 mesaj) |

`/api/discovery/events` herkese açıktır; `/api/discovery/flights` oturum ister ve
`DUFFEL_ACCESS_TOKEN` yoksa 503 `DUFFEL_NOT_CONFIGURED` döner. Anahtarlar hiçbir zaman
frontend'e gönderilmez. Ticketmaster yanıtları 5 dakika, Duffel yanıtları 5 dakika
bellekte cache'lenir; keşif endpoint'leri IP başına saatte 120 istekle sınırlıdır.

Şehir endpoint'leri herkese açıktır. Kullanıcı verisi döndüren tüm endpoint'ler
`requireAuth` ile korunur; başka kullanıcının kaynağı **404** döner.

## Hata biçimi

```json
{
  "error": {
    "code": "TRIP_NOT_FOUND",
    "message": "Rota bulunamadı."
  }
}
```

## Rate limit

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

Detaylı şema: [`api/prisma/schema.prisma`](../../api/prisma/schema.prisma).

Mimari bağlam ve karar kaydı: [`ARCHITECTURE.md`](ARCHITECTURE.md).
