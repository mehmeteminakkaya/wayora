# Wayora Audit Raporu

Tarih: 29 Ekim 2026
Kapsam: ürün, frontend, API, veri, AI, güvenlik, erişilebilirlik, responsive, doküman ve teslim  
Yöntem: 1000 kişilik uzman paneli çerçevesi + otomatik testler + 320/360/375/390/768/1024/1440 px UI taraması

Master prompt: [docs/MASTER_AUDIT_PROMPT.md](../MASTER_AUDIT_PROMPT.md)

## 1. Yönetici özeti

- **P0 bulgu: 0.**
- **P1 bulgu: 8, tamamı düzeltildi.**
- **P2 bulgu: 4, tamamı düzeltildi veya belgelendi.**
- **P3 bulgu: 4, kabul edildi ve sonraki tura bırakıldı.**
- **Mobil uçtan uca akış: 375 px'te kayıt, tercih, rota, plan, aktivite ekleme/silme geçti.**
- **Keşif kataloğu: 10 şehir, 100 deneyim ve yaklaşık maliyetler veritabanında hazır.**

Otomatik kontroller:

- `npm run lint`: geçti
- `npm run typecheck`: geçti
- `npm test`: **38 API + 4 web testi geçti**
- `npm run build`: geçti
- `npm audit --omit=dev --audit-level=high`: **0 vulnerability**
- UI audit: 7 viewport (320, 360, 375, 390, 768, 1024, 1440), **0 yatay taşma**, 0 kırık görsel, 0 etiketsiz input/buton
- Auth audit: 4 korumalı sayfa x 4 viewport (320, 360, 375, 1440), **0 hata**
- API E2E: kayıt, tercih, 10 şehir kataloğu, Berlin planı, rota, AI plan, aktivite ekleme/silme, sahiplik, çıkış, tekrar giriş ve silme, **31/31 kontrol geçti**
- Mobil UI E2E: kayıt → tercih → rota → plan → aktivite ekleme/silme → çıkış → tekrar giriş, **0 konsol hatası**
- Keşif UI E2E: 10 şehir, Berlin rehberi, müze filtresi, misafir CTA → giriş → Berlin ön dolu rota, 320/360/768/1440 px, **0 yatay taşma**

## 2. Bulgular ve düzeltmeler

### P1-01: Auth rate limit oturum kontrollerini de sayıyordu

**Kanıt:** `api/src/app.ts` içinde `app.use('/api/auth', authLimiter, ...)` tüm auth yollarına uygulanıyordu. Her sayfa yüklemesinde `/api/auth/me` çağrıldığı için normal gezinme 30 istekten sonra 429 üretebiliyordu.

**Düzeltme:** Limit yalnızca `/api/auth/login` ve `/api/auth/register` yollarına taşındı. `skipSuccessfulRequests: true` eklendi; başarılı giriş limiti tüketmiyor, başarısız denemeler korunuyor.

**Doğrulama:** Login 200, ardından `/api/auth/me` 200. Korumalı sayfalar (`/trips`, `/trips/new`, `/onboarding`) oturumla açılıyor.

### P1-02: Mobil auth sayfalarında alt tab bar formu örtüyordu

**Kanıt:** 375 px login ekranında sabit `.mobile-nav`, şifre alanı ile giriş butonu arasına geliyordu.

**Düzeltme:** `Layout.tsx` içinde `/login` ve `/register` rotalarında mobil nav gizlendi. App ve landing ekranlarında nav korunuyor.

**Doğrulama:** Auth sayfaları artık formu kesmiyor; landing ve uygulama içi sayfalarda bottom nav görünür.

### P1-03: Seçili çip/onay işareti bozuk görünüyordu

**Kanıt:** `web/src/index.css` içinde `content: '✓';` satırları encoding dönüşümü sonrası `âœ“` olarak bozulmuştu. Onboarding’de seçili çiplerde anlamsız karakter oluşuyordu.

**Düzeltme:** İki `content` değeri UTF-8 `✓` olarak geri yazıldı. Seçili bütçe kartının başlık ve açıklaması için açık `color: var(--on-terracotta)` kuralı eklendi.

**Doğrulama:** `/onboarding` 375 ve 1440 px’te seçili çiplerde doğru onay işareti ve yeterli kontrast.

### P1-04: Auth posterindeki köprü çizgisi başlığı çiziyordu

**Kanıt:** Login mobil ekranında `street.jpg` fotoğrafındaki yatay köprü hattı “KALDIĞIN YERDEN.” başlığının ortasından geçiyordu.

**Düzeltme:** Auth posteri `paris.jpg` olarak değiştirildi; overlay `0.56`ya yükseltildi ve başlığa güçlü metin gölgesi eklendi.

**Doğrulama:** Başlık ve alt metin fotoğraf üzerinde okunaklı; yatay çizgi çakışması yok.

### P2-01: Sabit mobil nav footer’ı örtebiliyordu

**Düzeltme:** `.app-shell:has(.mobile-nav) .site-footer { padding-bottom: 4.2rem; }` eklendi.

### P2-02: Audit sırasında 401 gürültüsü

**Açıklama:** Misafir kullanıcıda `/api/auth/me` 401 döner. Bu, tarayıcı konsolunda ağ hatası olarak görünür; uygulama hatası değildir. Oturum yokken korumalı sayfa login’e yönlenir. Bu davranış bilinçli ve testlerle doğrulanmıştır.

### P2-03: Seçili bütçe kartı kontrastı

**Düzeltme:** Seçili kartta başlık ve açıklama rengi açıkça `--on-terracotta` yapıldı. Renk tek başına anlam taşımıyor; ✓ işareti de var.

### P1-05: Mobil alt menüde iki sekme birden aktif görünüyordu

**Kanıt:** `/trips/new` ekranında `NavLink to="/trips"` prefix eşleşmesi yüzünden hem `Rotasyon` hem `Planlama` aktif görünüyordu.

**Düzeltme:** Rotasyon sekmesi `/trips` ve `/trips/:id` için, Planlama sekmesi yalnızca `/trips/new` için aktif olacak şekilde hesaplandı. `aria-current` de aynı mantıkla veriliyor.

**Doğrulama:** Mobil UI E2E: yeni rota ekranında aktif sekme `Planlama`; plan detayında `Rotasyon`.

### P1-06: Sıfır bütçe API tarafından reddediliyordu

**Kanıt:** Form `min="0"` kabul ediyor, API `.positive()` yüzünden `0` değerini 400 ile reddediyordu.

**Düzeltme:** Gezi oluşturma ve güncelleme şemalarında bütçe `.nonnegative()` yapıldı. Sıfır bütçe artık geçerli; aşım uyarısı normal çalışıyor.

**Doğrulama:** API E2E `zeroBudget: 201`.

### P1-07: Planı yeniden hazırlama elle eklenen aktiviteleri siliyordu

**Kanıt:** `POST /api/trips/:id/generate` mevcut aktiviteleri silip yeniden yazıyor; arayüzde onay yoktu.

**Düzeltme:** Plan doluysa `Planı yeniden hazırla` önce satır içi onay gösteriyor. `Vazgeç` mevcut planı koruyor.

**Doğrulama:** Mobil UI E2E onay metni ve `Vazgeç` akışı geçti.

### P1-08: Çıkışta korumalı sayfa kullanıcıyı login ekranına atıyordu

**Kanıt:** Mobil E2E'de plan detayından `Çıkış` sonrası `navigate('/')` ile oturum temizliği yarışıyor, `ProtectedRoute` kullanıcıyı `/login`'e yönlendiriyordu.

**Düzeltme:** `Layout.handleLogout` önce ana sayfaya geçiyor, sonra oturumu kapatıyor. Çıkış artık landing ekranına dönüyor.

**Doğrulama:** Mobil E2E `logoutState.path: "/"`, giriş linki görünür; ardından tekrar giriş `/trips`'e dönüyor.

### P2-04: Mobil güvenli alan ve dokunma hedefleri

**Düzeltme:** `viewport-fit=cover`, `env(safe-area-inset-top/bottom)`, 44 px header/button/chip hedefleri ve 48 px alt menü satırları eklendi. 320 px'te de yatay taşma yok.

### P3-01: Yerel `main` ile remote `main` ayrı geçmişe sahip

**Açıklama:** Proje, başlangıçta tarball olarak alındığı için yerel git geçmişi remote’tan bağımsız. Çalışma `design/rotasyon` branch’ine, `origin/main` ebeveynli tek commit olarak pushlandı ve PR #11 açıldı. `main`’e force-push yapılmadı.

### P3-02: PDF sürümü yok

**Açıklama:** Word ve PowerPoint dosyaları teslim edildi. PDF gerekirse ayrı bir dönüştürme adımı gerekir; bu turda zorunlu görülmedi.

### P3-03: Açık ürün kapsamı

- Google Places/Maps ve harita pinleri
- Sürükle-bırak aktivite sıralama
- Kısmi gün/aktivite AI üretimi
- Paylaşılabilir salt-okunur link
- Bulut deploy ve demo verisi

## 3. Responsive audit

Dosya: `docs/audit/ui-audit.json`

| Viewport | Yatay taşma | Bottom nav | Kırık görsel | Etiketsiz kontrol | Konsol hatası |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 320x568 | Yok | Görünür | 0 | 0 | 0 |
| 360x640 | Yok | Görünür | 0 | 0 | 0 |
| 375x667 | Yok | Görünür | 0 | 0 | 0 |
| 390x844 | Yok | Görünür | 0 | 0 | 0 |
| 768x1024 | Yok | Gizli | 0 | 0 | 0 |
| 1024x768 | Yok | Gizli | 0 | 0 | 0 |
| 1440x900 | Yok | Gizli | 0 | 0 | 0 |

Korumalı sayfalar 320, 360, 375 ve 1440 px'te tarandı: `/trips`, `/trips/:id`, `/trips/new`, `/onboarding`.
Dosya: `docs/audit/auth-audit.json`.

Mobil uçtan uca test `scripts/e2e_mobile.mjs` ile Chrome 375x667 emülasyonunda çalıştırıldı:
kayıt, onboarding, yeni rota, offline plan üretimi, aktivite ekleme, onaylı silme ve yeniden hazırlama onayı.
Dosya: `docs/audit/mobile-e2e.json`.

### Keşif kataloğu

`/kesfet` ve `/kesfet/:slug` için 10 şehir ve 100 deneyim eklendi. Veri kaynağı
`api/src/data/city-catalog.ts`; sunucu açılışında `City` ve `CityExperience` tablolarına idempotent
seed ediliyor. Şehir başına 10 deneyim; kategori, mahalle, adres, süre, yaklaşık EUR maliyeti,
puan, etiket, saat notu ve resmî bağlantı içeriyor.

Kanıt:

- `GET /api/cities` → 10 şehir
- `GET /api/cities/berlin` → 10 deneyim
- `/api/cities/_meta/count` → 10 şehir / 100 deneyim
- Berlin için üretilen 2 günlük plan katalog adlarını kullandı.
- Keşif UI E2E: 375 px'te liste, Berlin detayı, müze filtresi ve misafir CTA → giriş → ön dolu
  `/trips/new?destination=Berlin`.
- 320, 360, 768 ve 1440 px'te keşif listesi ve detayında yatay taşma yok.

Dosyalar: `docs/audit/explore-audit.json`, `docs/audit/explore-mobile.png`,
`docs/audit/explore-berlin-mobile.png`, `docs/CITY_CATALOG.md`.

## 4. Erişilebilirlik kontrolü

- Tüm görsellerde `alt` var veya dekoratif olduğu için boş `alt` kullanılıyor.
- Butonlarda görünür metin veya `aria-label` var.
- Form alanları `label` ile bağlı.
- Klavye odağı görünür; `:focus-visible` 3px terracotta.
- `prefers-reduced-motion` destekleniyor.
- Renk tek başına anlam taşımıyor; durum metni ve ✓ işareti var.
- 44 px dokunma hedefleri uygulanıyor.

## 5. Test ve güvenlik kanıtı

```
npm run lint       → geçti
npm run typecheck  → geçti
npm test           → 38 API + 4 web
npm run build      → geçti
npm audit --omit=dev --audit-level=high → 0 vulnerability
```

`body-parser`, `fast-uri` ve `qs` için audit bulguları `npm audit fix` ile kapatıldı.

## 6. Sonuç

Bu turda ürünü kıran P0 hata bulunmadı. Bulunan sekiz P1 hata; oturum limiti, mobil auth navigasyonu, bozuk onay karakteri, auth posteri okunabilirliği, mobil çift aktif sekme, sıfır bütçe reddi, yeniden hazırlamada veri kaybı riski ve çıkışta yanlış yönlendirme idi. Hepsi düzeltildi ve test/audit ile doğrulandı.

Kalan işler ürün kapsamına ait: harita/Places, sürükle-bırak, kısmi AI üretimi, deploy ve paylaşım. Bunlar gizlenmiyor; yol haritasında açıkça duruyor.
