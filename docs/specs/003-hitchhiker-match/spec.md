# 003 · Yol Arkadaşları (Hitchhiker Match)

## Problem

Wayora kullanıcısı tek başına bir rota planlıyor. Aynı şehirde, aynı tarihlerde
bulunan başka gezginlerden haberi olmuyor. Mevcut ürün insanları yalnızca mekânlarla
eşleştiriyor; güvenli ve karşılıklı bir sosyal keşif katmanı yok.

## Hedef kullanıcı

- Solo seyahat eden, aynı şehirde kısa süreliğine buluşmak isteyen gezgin.
- Arkadaş grubuyla giden ama yerel bir gezginle fikir alışverişi yapmak isteyen kişi.
- Ev sahipliği yapmaya veya bir çay içmeye açık, sınırlarını açıkça belirtmek isteyen kişi.

## Kapsam

### 1. Profil

- Görünen ad, kısa tanıtım, diller.
- Görünürlük anahtarı.
- 18+ ve güvenlik kuralları onayı.
- Opsiyonel ev sahipliği niyeti ve kısa not.
- E-posta, telefon, adres, canlı konum ve fotoğraf yok.

### 2. Eşleşme

- Kullanıcının rotalarından biri ile adayın rotası aynı normalize şehirde olmalı.
- Tarih aralıkları en az bir gün kesişmeli.
- Skor açıklanabilir olmalı: kesişen gün, ortak ilgi, tempo, dil, ev sahipliği.
- Kullanıcı kendiyle, engellediği kişilerle veya zaten bağlantı kurduğu kişilerle eşleşmez.
- En fazla 20 sonuç döner.

### 3. Bağlantı

- İstek opsiyonel kısa mesajla gönderilir.
- Alıcı kabul eder, reddeder; gönderen iptal eder.
- Karşılıklı kabul olmadan mesaj gönderilemez.
- Kabul edilen bağlantıda mesaj geçmişi görünür; yeni mesaj polling ile yenilenir.

### 4. Güvenlik

- Kullanıcı engelleyebilir.
- Kullanıcı bağlantıyı gerekçeyle bildirebilir; bildirim sonrası karşı taraf engellenir.
- Adres/telefon/canlık konum paylaşmama uyarısı sohbette görünür.
- Doğrulanmamış kullanıcıya "doğrulanmış" denmez.
- Ev sahipliği bir rezervasyon, ödeme veya konaklama sözleşmesi değildir.

## Kullanıcı akışı

1. `/yol-arkadaslari` sayfasına girer.
2. Profilini oluşturur; görünürlük ve güvenlik onayını verir.
3. Rotasına göre eşleşmeleri görür.
4. Bir karta "Bağlantı iste" der, kısa mesaj yazar.
5. Gelen istekleri kabul eder veya reddeder.
6. Kabul edilen bağlantıda sohbet eder.
7. Gerekirse engeller veya bildirir.

## API sözleşmesi

| Metot | Yol | Amaç |
| :--- | :--- | :--- |
| GET | `/api/social/profile` | Profil ve tercihler |
| PUT | `/api/social/profile` | Profil oluştur/güncelle |
| GET | `/api/social/matches` | Rotaya göre eşleşmeler |
| POST | `/api/social/requests` | Bağlantı isteği |
| GET | `/api/social/connections` | Gelen, giden, kabul edilen |
| PATCH | `/api/social/connections/:id` | accept / decline / cancel |
| GET | `/api/social/connections/:id/messages` | Sohbet geçmişi |
| POST | `/api/social/connections/:id/messages` | Mesaj gönder |
| POST | `/api/social/connections/:id/report` | Bildir ve engelle |
| POST | `/api/social/block` | Kullanıcıyı engelle |

Tüm route'lar `requireAuth` ile korunur. Hata biçimi mevcut sözleşmedir:
`{ "error": { "code": "...", "message": "..." } }`.

## Veri modeli

- `TravelerProfile`: kullanıcı başına tek profil, görünürlük ve güvenlik onayı.
- `TravelConnection`: istek/gönderen/alıcı/durum.
- `ConnectionMessage`: yalnızca kabul edilmiş bağlantıda mesaj.
- `BlockedUser`: iki yönlü eşleşme ve istek filtresi.
- `SafetyReport`: bildirim kaydı; admin kuyruğu sonraki faz.

## Kabul kriterleri

- [x] Profil olmadan eşleşme görünmez.
- [x] Aynı şehir ve tarih kesişimi olmayan aday listelenmez.
- [x] Ortak ilgiler Türkçe/İngilizce yazımla eşleşir ve Türkçe etiketlenir.
- [x] Kendi kendine istek engellenir.
- [x] Aynı kişiye ikinci istek 409 döner.
- [x] Engelleyen veya engellenen kullanıcı eşleşmez ve istek gönderemez.
- [x] Kabul/red/iptal yalnızca yetkili tarafça yapılır.
- [x] Mesaj yalnızca kabul edilmiş bağlantıda ve taraflarca okunur/gönderilir.
- [x] Mesaj 500, profil tanıtımı 240, istek mesajı 300 karakterle sınırlıdır.
- [x] Mobilde 390 px'te yatay taşma yok; alt navigasyon beş sekmeli.
- [x] Dokunma hedefleri sosyal sayfada en az 44 px.
- [x] Boş, yükleniyor, hata ve başarı durumları vardır.
- [x] API testleri, web testi, lint, typecheck ve build geçer.

## Kapsam dışı

- Kimlik doğrulama, telefon/e-posta doğrulaması ve arka plan kontrolü.
- Adres paylaşımı, rezervasyon, ödeme veya gerçek konaklama sözleşmesi.
- Moderasyon paneli ve gerçek zamanlı WebSocket.
- Kullanıcı fotoğrafı, konum takibi.

## Riskler ve sonraki faz

En büyük risk, sosyal özelliklerin güvenlik ve moderasyon yüküdür. Bu sürüm
karşılıklı kabul, engelleme, bildirim ve veri minimizasyonu sağlar; ancak gerçek
yayın öncesinde kimlik doğrulaması, moderasyon kuyruğu, acil durum politikası ve
gerçek kullanıcı testleri gerekir.
