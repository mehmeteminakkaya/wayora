# Hitchhiker Match · Master Prompt

## Rol

Sen Wayora için çalışan kıdemli bir product designer, interaction designer, güvenlik araştırmacısı ve full-stack engineer'sin. Görev: aynı şehre ve benzer tarihlere giden kullanıcıların birbirini bulabildiği **Yol Arkadaşları** özelliğini mevcut V2 ürününe, gerçek veri ve gerçek etkileşimlerle eklemek.

Bu bir ekran mockup'ı değil. Localde çalışan, API'si olan, hata/boş/yükleme durumları tamamlanmış bir ürün parçası teslim edilir.

## Ürün vaadi

> Aynı şehre, benzer tarihlere giden insanları bul. Ortak noktalarını gör, güvenli biçimde bağlantı kur ve seyahat planını birlikte zenginleştir.

Özellik yalnızca "insan listesi" olmayacak. Kullanıcı:

1. Yol arkadaşı profilini açar.
2. Seyahat rotasına göre eşleşmeleri görür.
3. Eşleşme gerekçesini okur.
4. Karşılıklı istek gönderir.
5. Kabul edilince güvenli mesajlaşır.
6. Gerekirse engeller veya bildirir.

## Kesin sınırlar

- Kullanıcı fotoğrafı yüklenmez; baş harf avatarı kullanılır.
- E-posta, telefon, tam adres ve canlı konum hiçbir zaman gösterilmez.
- "Ev sahipliği" yalnızca bir niyet bilgisidir; adres, rezervasyon veya ödeme yoktur.
- Karşılıklı kabul olmadan mesaj yoktur.
- 18 yaş altı kullanıcılar için hosting seçeneği yoktur; checkbox ile 18+ onayı alınır.
- Kullanıcılar engellenebilir ve bildirilebilir.
- AI, kullanıcı hakkında "güvenilir" veya "doğrulanmış" gibi doğrulanmamış iddia üretmez.
- Eşleşme skoru sihirli bir "uyum" iddiası değildir; açıklanabilir ortak noktalara dayanır.

## Teknik mimari

- Mevcut React 19 + Vite + React Router korunur.
- Mevcut Express 5 + Prisma/PostgreSQL API kullanılır.
- Yeni Prisma modelleri: `TravelerProfile`, `TravelConnection`, `ConnectionMessage`, `BlockedUser`, `SafetyReport`.
- Tüm sosyal route'lar `requireAuth` ile korunur.
- Kullanıcı sahipliği her sorguda `req.userId` ile filtrelenir.
- Route'lar zod ile doğrulanır; hata biçimi mevcut `{ error: { code, message } }`.
- Yeni sosyal route'lar için en az bir başarı ve bir yetkisiz/geçersiz durum testi.
- Uygulama anahtarsız localde çalışmaya devam eder; matching DB kullanır, harici servis gerektirmez.
- Realtime zorunlu değil; mesajlar 5 saniyelik polling veya manuel yenileme ile çalışabilir.

## Veri modeli

### TravelerProfile

- `userId` unique
- `displayName` 2–80
- `bio` 20–240
- `languages` max 6
- `hostingAvailable` boolean
- `hostingNote` max 160
- `visible` boolean
- `safetyAcceptedAt` nullable datetime
- `createdAt`, `updatedAt`

### TravelConnection

- `requesterId`, `recipientId`
- `tripId` opsiyonel (eşleşmeyi doğuran rota)
- `status`: pending | accepted | declined | cancelled
- `message` max 300
- `createdAt`, `updatedAt`
- Aynı iki kullanıcı arasında aktif/tekrar eden istekleri servis katmanında engelle.

### ConnectionMessage

- `connectionId`, `senderId`, `body` 1–500, `createdAt`
- Yalnızca `accepted` bağlantıda gönderilir.

### BlockedUser

- `blockerId`, `blockedId`, unique çift.

### SafetyReport

- `reporterId`, `reportedUserId`, `connectionId?`, `reason` enum (`harassment`, `spam`, `safety`, `other`), `details` max 500.

## Eşleşme algoritması

Aynı normalize edilmiş şehir + tarih aralığı kesişimi olan, `visible=true` profillere bak.

Skor 100 üzerinden:

- Aynı şehir ve tarih kesişimi: 40
- Kesişen gün sayısı: en fazla 20
- Ortak ilgi alanı: her biri 6, en fazla 18
- Aynı/benzer tempo: 10
- Ev sahipliğine açık: 5
- Dil ortaklığı: 7

Eşleşme gerekçeleri kullanıcıya açıkça gösterilir:

- "3 gün aynı şehirde"
- "Müze ve yemek ilginiz ortak"
- "Benzer tempo"
- "Ev sahipliğine açık"

Kullanıcıya skorun kesin uyum garantisi olmadığı söylenir. Kendi kendine eşleşme, engellenenler ve zaten bağlantı kurulmuş kişiler filtrelenir.

## API taslağı

- `GET /api/social/profile`
- `PUT /api/social/profile`
- `GET /api/social/matches`
- `POST /api/social/requests`
- `GET /api/social/connections`
- `PATCH /api/social/connections/:id`
- `GET /api/social/connections/:id/messages`
- `POST /api/social/connections/:id/messages`
- `POST /api/social/connections/:id/report`
- `POST /api/social/block`

## UI akışı

Route: `/yol-arkadaslari`

### Profil yoksa

- Başlık: "Yol arkadaşını bul"
- Kısa açıklama ve güvenlik notu
- Profil formu:
  - Görünen ad
  - Kısa tanıtım
  - Diller
  - 18+ onayı
  - Görünürlük
  - Ev sahipliği (opsiyonel) ve notu
- Kaydet ve görünür ol.

### Profil varsa

- Üstte profil özeti ve görünürlük anahtarı
- Kendi rotalarından türetilen eşleşmeler
- Her kart:
  - Baş harf avatar
  - Ad, şehir, tarih kesişimi
  - Ortak ilgi etiketleri
  - Eşleşme gerekçeleri
  - Uyum göstergesi
  - "Bağlantı iste" butonu
- İstek panelinde gelen/giden/aktif sekmeleri
- Kabul edilen bağlantıda mesajlar
- Mesaj gönderme, yenileme, engelleme ve bildirme
- Boş durumlar:
  - Profil kapalı
  - Rota yok
  - Eşleşme yok
  - Yeni istek yok

## Güvenlik ve erişilebilirlik

- Tüm butonlar en az 44 px.
- Form etiketleri görünür.
- Seçili/görünür durumlar `aria-pressed` veya checkbox semantiğiyle.
- Dialog/bottom sheet odak tuzağı, Escape ve scroll kilidi.
- Mesaj gönderirken çift gönderim engeli.
- Hata durumunda form değerleri korunur.
- Kullanıcıya "doğrulanmış" denmez; yalnızca "profili tamamlandı" denir.
- Engelleme ve bildirme işlemleri onay ister.
- `prefers-reduced-motion` desteklenir.

## Tasarım

V2:
- Krem zemin, beyaz yüzey, 1 px çizgi.
- Sarı yalnızca aktif/uyum/vurgu.
- Profil kartlarında gölge yok; baş harf avatarı siyah zemin.
- Uyum göstergesi ince bir çubuk; gradyan yok.
- Kart ile sohbet arasında rota çizgisi/eşleşme bağı hissi.
- Mobilde tek kolon; masaüstünde eşleşmeler ve bağlantılar iki kolon.
- Sabit alt navigasyon 5. sekme: "Yol".

## Test ve ürün laboratuvarı

- Unit: skor, tarih kesişimi, kendi kendine eşleşme filtresi, engel filtresi.
- API: profil güncelleme, eşleşme, istek, yetkisiz erişim, kabul, mesaj, engel.
- UI: boş profil, eşleşme listesi, istek gönderme, gelen istek kabulü, mesaj gönderme.
- Simülasyon: 50 developer personas + 100 user personas üzerinden 3 iterasyonlu ürün değerlendirmesi; çıktı `docs/audit/hitchhiker-product-lab.json`.
- Gerçek 150 canlı kullanıcı/ajan yerine deterministic persona simülasyonu kullanılır; bulgular gerçek kullanıcı testi gibi sunulmaz.

## Definition of Done

- Localde iki ayrı kullanıcı hesabıyla eşleşme, istek, kabul ve mesaj akışı çalışır.
- Profil olmadan eşleşme görünmez.
- Engel/report çalışır.
- Boş, hata, yükleniyor durumları vardır.
- Mobil ve masaüstünde taşma yok.
- `npm run lint && npm run typecheck && npm test && npm run build` geçer.
- Değişiklikler `feat/hitchhiker-match` dalında tutulur; main'e kullanıcı onayı olmadan merge edilmez.
