---
title: User Story Kataloğu
subtitle: Kişiler, kabul kriterleri, öncelikler ve test kanıtları
doc_type: ÜRÜN GEREKSİNİMLERİ
version: 2.0
date: 30 Ekim 2026
---

# Nasıl Okunur?

Bu katalog, ürün gereksinimlerini **kullanıcı değeri** ve **kabul kriteri** üzerinden tanımlar.
Her story’nin önceliği MoSCoW ile, durumu ise mevcut sürümle işaretlenmiştir.

| Alan | Anlam |
| :--- | :--- |
| ID | İzlenebilirlik kimliği |
| Öncelik | Must / Should / Could |
| Durum | Tamam / Kısmi / Dış servis |
| Kanıt | İlgili dosya, route veya test |

## Kişiler

- **Gezgin:** 2–7 günlük şehir gezisi planlayan, bütçesine dikkat eden kullanıcı.
- **Sosyal gezgin:** Aynı şehir/tarihte buluşmak isteyen, güvenli sınırlar arayan kullanıcı.
- **Ekip / eğitmen:** Ürünün uçtan uca çalıştığını, test ve güvenlik kanıtlarını görmek isteyen kişi.

# Özet Tablo

| ID | Epik | Story | Öncelik | Durum |
| :--- | :--- | :--- | :--- | :--- |
| US-01 | Altyapı | Sağlık kontrolü ve güvenli temel | Must | Tamam |
| US-02 | Keşif | Landing’de şehir arama ve başlangıç | Must | Tamam |
| US-03 | Hesap | Kayıt olma | Must | Tamam |
| US-04 | Hesap | Giriş ve çıkış | Must | Tamam |
| US-05 | Hesap | Tercihleri kaydetme | Must | Tamam |
| US-06 | Güvenlik | Yalnızca kendi verime erişim | Must | Tamam |
| US-07 | Rota | Yeni rota oluşturma | Must | Tamam |
| US-08 | Rota | Rotaları listeleme ve silme | Must | Tamam |
| US-09 | Rota | Gün gün planı görme | Must | Tamam |
| US-10 | Rota | Durak ekleme, silme, sıralama | Must | Tamam |
| US-11 | AI | AI ile gün gün plan üretme | Must | Tamam |
| US-12 | AI | Halüsinasyon filtresi | Must | Tamam |
| US-13 | AI | Fallback ve model routing | Must | Tamam |
| US-14 | AI | Bütçe ve pratik notlar | Should | Tamam |
| US-15 | Keşif | 14 şehir / 140 deneyim rehberi | Must | Tamam |
| US-16 | UX | Mobil uygulama hissi | Should | Tamam |
| US-17 | UX | Erişilebilirlik ve boş durumlar | Should | Tamam |
| US-18 | Keşif | Canlı etkinlik ve uçuş fikri | Could | Kısmi / opsiyonel |
| US-19 | AI-native | Agent ve SDD artefaktları | Should | Tamam |
| US-20 | Sosyal | Yol Arkadaşı profili ve eşleşme | Must | Tamam |
| US-21 | Sosyal | Bağlantı isteği ve sohbet | Must | Tamam |
| US-22 | Sosyal | Engelleme, bildirim ve güvenlik | Must | Tamam |
| US-23 | Demo | 75 profilli güvenli demo | Should | Tamam |

# Detaylı Story’ler

## US-01 · Sağlık kontrolü ve güvenli temel

**Olarak** ekip, **istiyorum ki** API ve veritabanının ayakta olduğunu tek uçtan görebileyim;
böylece demo öncesi altyapı sorununu kullanıcıya yansıtmadan yakalarım.

**Kabul kriterleri**

- `GET /api/health` API ve DB durumunu döner.
- DB erişilemezse sağlık yanıtı bunu açıkça belirtir.
- Ortak hata biçimi `{ "error": { "code", "message" } }` korunur.

**Kanıt:** `api/src/routes/health.ts`, `api/src/app.test.ts`, CI.

## US-02 · Landing’de şehir arama ve başlangıç

**Olarak** ziyaretçi, **istiyorum ki** bir şehir seçip hızlıca plan akışına başlayabileyim.

**Kabul kriterleri**

- Arama kutusu ve popüler şehir seçenekleri çalışır.
- Seçim yeni rota formuna taşınır.
- Giriş yapmamış kullanıcı korumalı adımda girişe yönlendirilir; seçim kaybolmaz.
- Mobilde yatay taşma olmaz.

**Kanıt:** `web/src/pages/LandingPage.tsx`, `web/src/pages/NewTripPage.tsx`, E2E/audit.

## US-03 · Kayıt olma

**Olarak** yeni kullanıcı, **istiyorum ki** e-posta ve şifreyle hesap açabileyim.

**Kabul kriterleri**

- Geçersiz e-posta ve 8 karakterden kısa şifre Türkçe hata döner.
- Aynı e-posta ikinci kez kaydolamaz; 409 `EMAIL_TAKEN`.
- Şifre bcrypt ile saklanır; yanıtta hash dönmez.
- Kayıt sonrası httpOnly oturum çerezi verilir.

**Kanıt:** `api/src/routes/auth.ts`, `api/src/lib/password.ts`, `auth.test.ts`.

## US-04 · Giriş ve çıkış

**Olarak** kullanıcı, **istiyorum ki** hesabıma giriş yapıp oturumumu güvenli kapatabileyim.

**Kabul kriterleri**

- Doğru bilgilerle giriş yapılır; yanlış şifre 401 döner.
- Çıkış çerezi temizler.
- Oturum yokken korumalı sayfalar `/login`’e gider.

**Kanıt:** `api/src/routes/auth.ts`, `web/src/auth/AuthContext.tsx`, `ProtectedRoute.tsx`.

## US-05 · Tercihleri kaydetme

**Olarak** kullanıcı, **istiyorum ki** ilgi alanlarımı, bütçe seviyemi ve tempomu kaydedeyim.

**Kabul kriterleri**

- İlgi alanları, bütçe ve tempo doğrulanır.
- Tercih yoksa makul varsayılanlar kullanılır.
- Tercihler AI plan üretiminde kategori ve maliyet dengesine yansır.
- Profil ekranından güncellenebilir.

**Kanıt:** `api/src/routes/preferences.ts`, `OnboardingPage.tsx`, `ProfilePage.tsx`.

## US-06 · Yalnızca kendi verime erişim

**Olarak** kullanıcı, **istiyorum ki** başka kullanıcıların rotalarını göremeyeyim.

**Kabul kriterleri**

- Trip/Day/Activity sorguları `userId` ile filtrelenir.
- Başka kullanıcının kaynağı için 404 döner.
- Sosyal bağlantı ve mesajlarda yalnızca taraflar erişebilir.

**Kanıt:** `api/src/middleware/auth.ts`, `api/src/routes/trips.ts`, `social.ts`, testler.

## US-07 · Yeni rota oluşturma

**Olarak** kullanıcı, **istiyorum ki** destinasyon, tarih ve bütçe girerek rota oluşturayım.

**Kabul kriterleri**

- Bitiş tarihi başlangıçtan önce olamaz.
- Rota en fazla 21 gün olabilir.
- Gün sayısı kadar `TripDay` oluşur.
- Bütçe negatif olamaz; para birimi doğrulanır.
- Seçili katalog deneyimleri rotaya aktarılabilir.

**Kanıt:** `api/src/routes/trips.ts`, `NewTripPage.tsx`, `trips.test.ts`.

## US-08 · Rotaları listeleme ve silme

**Olarak** kullanıcı, **istiyorum ki** rotalarımı tek ekranda görüp gerektiğinde sileyim.

**Kabul kriterleri**

- Rotalar tarihe göre listelenir.
- Kartta durum, gün, durak ve bütçe görünür.
- Silme onay ister; alt kayıtlar cascade silinir.
- Boş durumda yönlendirici CTA vardır.

**Kanıt:** `TripsPage.tsx`, `api/src/routes/trips.ts`, `trips.test.ts`.

## US-09 · Gün gün planı görme

**Olarak** kullanıcı, **istiyorum ki** rotamın günlerini ve planını tek yerde göreyim.

**Kabul kriterleri**

- Gün şeridi ve timeline çalışır.
- Liste ve harita görünümü arasında geçiş yapılır.
- Aktif günün durakları ve toplam maliyeti görünür.
- Mobil ve masaüstünde okunabilir.

**Kanıt:** `TripDetailPage.tsx`, frontend audit.

## US-10 · Durak ekleme, silme, sıralama

**Olarak** kullanıcı, **istiyorum ki** planı kendi seyahat tercihime göre düzenleyeyim.

**Kabul kriterleri**

- Aktivite başlığı zorunlu; kategori ve saat doğrulanır.
- Yeni durak günün sonuna eklenir.
- Sürükle-bırak ve butonlarla sıralama çalışır; hata durumunda sıra geri alınır.
- Silme sahiplik kontrolünden geçer.

**Kanıt:** `TripDetailPage.tsx`, `api/src/routes/trips.ts`, `trips.test.ts`.

## US-11 · AI ile gün gün plan üretme

**Olarak** kullanıcı, **istiyorum ki** tek tıkla saatli ve maliyetli bir plan alayım.

**Kabul kriterleri**

- Plan, rota gün sayısı kadar gün içerir.
- Her aktivitede başlık, kategori, saat ve tahmini maliyet vardır.
- Tercihler plana yansır.
- Toplam maliyet sunucuda hesaplanır.
- Plan kalıcıdır; sayfa yenilenince görünür.

**Kanıt:** `api/src/services/itinerary.ts`, `generateTrip`, `itinerary.test.ts`.

## US-12 · Halüsinasyon filtresi

**Olarak** ekip, **istiyorum ki** LLM’in olmayan mekânları uydurmasını engelleyeyim.

**Kabul kriterleri**

- LLM yanıtı zod ile doğrulanır.
- Aday listede olmayan `googlePlaceId` kabul edilmez.
- Toplam maliyet LLM’den alınmaz.
- Şüpheli yanıt plana dönüşmez; offline fallback kullanılır.

**Kanıt:** `services/itinerary.ts`, `normalizeLlmPlan`, testler.

## US-13 · Fallback ve model routing

**Olarak** ekip, **istiyorum ki** sağlayıcı hatasında ürün ayakta kalsın.

**Kabul kriterleri**

- `LLM_PROVIDER=offline` anahtarsız çalışır.
- Timeout/HTTP/şema hatasında offline üretici devreye girer.
- `meta.fallback=true` döner; kullanıcıya ham hata gösterilmez.
- Günlük AI limiti uygulanır.

**Kanıt:** `docs/AI_NATIVE_TEAM.md`, `itinerary.test.ts`, env config.

## US-14 · Bütçe ve pratik notlar

**Olarak** kullanıcı, **istiyorum ki** planın bütçemi aşıp aşmadığını ve pratik ipuçlarını göreyim.

**Kabul kriterleri**

- Toplam tahmini maliyet ve bütçe farkı görünür.
- Bütçe aşılırsa uyarı gösterilir.
- `tips` alanı planla birlikte kalıcıdır.
- Para birimi Türkçe biçimde gösterilir.

**Kanıt:** `TripDetailPage.tsx`, `trip-serializer.ts`, `itinerary.test.ts`.

## US-15 · 14 şehir / 140 deneyim rehberi

**Olarak** gezgin, **istiyorum ki** şehirlerde yapılacakları maliyet ve süreleriyle görebileyim.

**Kabul kriterleri**

- 14 şehir ve 140 deneyim veritabanında tutulur.
- Arama, kategori, ücretsiz ve sıralama filtreleri çalışır.
- Şehir sayfası deneyimleri listeler; seçim rotaya taşınır.
- Katalog sayıları landing, keşif ve API’de tutarlıdır.

**Kanıt:** `city-catalog.ts`, `ExplorePage.tsx`, `CityPage.tsx`, `docs/CITY_CATALOG.md`.

## US-16 · Mobil uygulama hissi

**Olarak** gezgin, **istiyorum ki** siteyi telefonda uygulama gibi kullanabileyim.

**Kabul kriterleri**

- 390px’te yatay taşma yok.
- Alt navigasyon beş sekmeli ve aktif durumu görünür.
- Dokunma hedefleri en az 44px.
- Bottom sheet, odak tuzağı ve klavye davranışı çalışır.

**Kanıt:** `Layout.tsx`, `social.css`, audit JSON.

## US-17 · Erişilebilirlik ve boş durumlar

**Olarak** kullanıcı, **istiyorum ki** klavyeyle gezinebileyim ve boş/hata durumunda ne yapacağımı bileyim.

**Kabul kriterleri**

- Form alanları etiketli; ikon butonlarda `aria-label` var.
- Boş, yükleniyor, hata ve başarı durumları ayrı tasarlanmış.
- `prefers-reduced-motion` desteklenir.
- Renk tek başına anlam taşımaz.

**Kanıt:** `web/AGENTS.md`, audit, `App.test.tsx`.

## US-18 · Canlı etkinlik ve uçuş fikri

**Olarak** gezgin, **istiyorum ki** tarihlerimdeki gerçek etkinlikleri ve uçuş fikirlerini görebileyim.

**Kabul kriterleri**

- Ticketmaster etkinlikleri şehir ve rota detayında görünür.
- Etkinlik aktif güne eklenebilir.
- Duffel token’ı yoksa sahte uçuş üretilmez; yapılandırma notu gösterilir.
- API anahtarları frontend’e sızmaz.

**Kanıt:** `LiveDiscovery.tsx`, `discovery.ts`, `duffel.ts`, `ticketmaster.ts`.
**Durum:** Canlı etkinlik kullanılabilir; uçuş opsiyonel/dış servis.

## US-19 · Agent ve SDD artefaktları

**Olarak** ekip, **istiyorum ki** agent’lar spec, bağlam ve test kanıtıyla çalışsın.

**Kabul kriterleri**

- Kök ve alan bazlı `AGENTS.md` dosyaları var.
- Spec/plan/tasks ve kabul kriterleri repoda.
- Feature, review ve security skill’leri var.
- MCP ile canlı repo/API bağlamı sağlanır.
- İnsan onayı olmadan `main`’e merge edilmez.

**Kanıt:** `AGENTS.md`, `.agents/skills`, `docs/ORCHESTRATION.md`, `mcp/wayora-context`.

## US-20 · Yol Arkadaşı profili ve eşleşme

**Olarak** solo gezgin, **istiyorum ki** aynı şehir/tarihte giden gezginleri görebileyim.

**Kabul kriterleri**

- Profil görünür değilse eşleşme görünmez.
- Aynı normalize şehir ve kesişen tarih gerekir.
- Ortak ilgi, tempo, dil ve ev sahipliği açıklanabilir skora yansır.
- Kendiyle, engellenenle ve zaten bağlantı kurulanla eşleşmez.
- En fazla 20’lik sayfalar; toplam sayı gösterilir.

**Kanıt:** `HitchhikerPage.tsx`, `services/social.ts`, `routes/social.ts`, `social.test.ts`.

## US-21 · Bağlantı isteği ve sohbet

**Olarak** gezgin, **istiyorum ki** karşılıklı kabulden sonra güvenli mesajlaşayım.

**Kabul kriterleri**

- İstek opsiyonel kısa mesaj taşır.
- Alıcı kabul/red eder; gönderen iptal eder.
- Karşılıklı kabul olmadan mesaj yoktur.
- Mesajlar yalnızca taraflarca okunur; 5 saniyelik polling.
- Mesaj 500 karakterle sınırlıdır.

**Kanıt:** `routes/social.ts`, `HitchhikerPage.tsx`, E2E.

## US-22 · Engelleme, bildirim ve güvenlik

**Olarak** gezgin, **istiyorum ki** rahatsız edildiğimde kullanıcıyı engelleyip bildirebileyim.

**Kabul kriterleri**

- Engelleme iki yönlü eşleşme/istek filtresi oluşturur.
- Bildirim sonrası kullanıcı engellenir ve bağlantı kapanır.
- Sohbette adres/telefon/canlı konum uyarısı vardır.
- Ev sahipliği bir rezervasyon/ödeme değildir.
- Doğrulanmamış kullanıcıya “doğrulanmış” denmez.

**Kanıt:** `routes/social.ts`, `HitchhikerPage.tsx`, `docs/specs/003-hitchhiker-match/spec.md`.

## US-23 · 75 profilli güvenli demo

**Olarak** ekip, **istiyorum ki** hocaya boş ekran yerine dolu bir ürün gösterebileyim.

**Kabul kriterleri**

- Demo hesabı ve 75 profil oluşturulur.
- Demo rota tarihleri nettir; eşleşmeler dolu görünür.
- Production’da demo seed açık onay ister.
- `demo:clear` ile temizlenebilir.
- Demo şifresi repoda açıkça demo olarak işaretlenir.

**Kanıt:** `api/scripts/seed-demo.ts`, `docs/specs/003-hitchhiker-match/DEMO.md`.

# Definition of Done

Bir story “Done” sayılmak için:

- [x] Kabul kriterleri karşılanmış.
- [x] En az bir başarı ve bir hata/kenar testi var.
- [x] Lint, typecheck, test ve build geçmiş.
- [x] Sahiplik/güvenlik kontrolü yapılmış.
- [x] Boş, yükleniyor ve hata durumları tasarlanmış.
- [x] Kullanıcı metni Türkçe ve erişilebilir.
- [x] Gerekli doküman güncellenmiş.
- [x] İnsan review’i ve CI kanıtı var.

# Kapsam Dışı

- Gerçek rezervasyon/ödeme, uçuş/otel satın alma.
- E-posta/telefon doğrulaması, 2FA, moderasyon paneli.
- Adres paylaşımı ve gerçek konaklama sözleşmesi.
- Çoklu kullanıcı işbirliği ve genel sosyal akış.
- Mobil native uygulama.

# Revizyon

| Sürüm | Tarih | Not |
| :--- | :--- | :--- |
| 1.0 | 23 Ekim 2026 | İlk 20 story |
| 2.0 | 30 Ekim 2026 | Sosyal, katalog, demo, canlı keşif ve güncel kanıtlar eklendi |
