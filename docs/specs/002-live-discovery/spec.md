# 002 · Ücretsiz Canlı Keşif

## Problem

Wayora kullanıcısı rota detayında şehrin güncel etkinliklerini ve bir uçuş fikrini görmek
istiyor. Ücretli rezervasyon/otel API'leri MVP kapsamına alınmadan, izin verilen ücretsiz
sağlayıcılarla sınırlı bir keşif katmanı eklenir.

## Kapsam

- Ticketmaster Discovery API ile etkinlik arama.
- Duffel test token'ı ile uçuş teklifi arama.
- Sağlayıcı anahtarları yalnızca backend'de.
- Anahtar yoksa özellik kapalı; uydurma etkinlik/uçuş fiyatı üretilmez.
- Şehir sayfasında ve rota detayında “Canlı keşif” bölümü.

## Kapsam dışı

- Bilet satın alma veya rezervasyon oluşturma.
- Otel arama ve Booking.com partner entegrasyonu.
- Canlı fiyat garantisi, ödeme, iade ve müşteri desteği.
- Ticketmaster Partner/Commerce API erişimi.
- Duffel canlı token'ı ve canlı sipariş.

## API

### `GET /api/discovery/status`

Herkese açık. Yalnızca `configured | missing` durumunu döner; anahtar sızdırmaz.

### `GET /api/discovery/events?city=&startDate=&endDate=`

- Herkese açık.
- En fazla 90 günlük aralık.
- Ticketmaster Discovery sonuçlarını normalize eder.
- Fiyat/venue eksikse `null` döner; canlı müsaitlik iddiası yoktur.

### `GET /api/discovery/flights?origin=&destination=&departureDate=&returnDate=`

- Oturum gerektirir.
- Şehir adı veya IATA kodu kabul eder.
- Test token'ında `mode: "test"` döner ve arayüzde “gerçek bilet değildir” etiketi gösterilir.
- `returnDate` opsiyoneldir; verilirse dönüş slice'ı eklenir.

## Güvenlik ve sınırlar

- API anahtarları `api/.env` içinde tutulur; frontend'e gönderilmez.
- Dış servis çağrıları 10 saniye timeout ve 5 dakika cache kullanır.
- Ticketmaster 5.000 çağrı/gün ücretsiz kotaya sahiptir; Duffel test modu ücretsizdir, canlı
  kullanım sipariş/komisyon ücreti gerektirir. Üretim kullanımı ayrı sözleşme ve maliyet
  gerektirir.
- Dış servis hataları ortak `{ error: { code, message } }` biçiminde döner.
- Kullanıcıya sahte “canlı fiyat” veya rezervasyon başarısı gösterilmez.

## Kabul kriterleri

- [x] Anahtarlar yokken rota detayında açıklayıcı yapılandırma notu görünür.
- [x] Ticketmaster anahtarı varken etkinlikler yüklenir; boş/hata durumu ayrıdır.
- [x] Duffel test token'ı varken uçuş araması yapılır; test etiketi görünür.
- [x] Uçuş endpoint'i oturumsuz çağrıda 401 döner.
- [x] Dış servis yanıtları normalize edilir; eksik fiyat uydurulmaz.
- [x] API testleri ve web build geçer.
