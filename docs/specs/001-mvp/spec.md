# Wayora MVP: Ürün Spec'i

> Durum: **uygulandı (Sprint 3 MVP)** · Son güncelleme: 2026-10-23
> Bu spec, `docs/PROJECT_OVERVIEW.md` ve `docs/ARCHITECTURE.md` ile birlikte okunur.

## Problem

Seyahat planlamak zaman alır: gezginler ilgi alanlarına uygun yerleri bulmak, günleri
dengelemek ve bütçeyi yönetmek için çok sayıda kaynak arasında gezinir. Wayora bu süreci
tek bir akışa indirir: tercihler → gezi → AI planı → düzenleme.

## Hedef kullanıcı

- **Gezgin (birincil):** 2–7 günlük şehir gezisi planlayan, bütçesine dikkat eden kişi.
- **Demo izleyicisi (ikincil):** Ürünün uçtan uca çalıştığını görmek isteyen eğitmen/TA.

## Başarı metrikleri

| Metrik | Hedef |
| :--- | :--- |
| Kayıttan plana ulaşma | ≤ 3 dakika, ≤ 5 ekran |
| Plan üretim süresi (offline) | < 1 sn |
| Plan üretim süresi (LLM) | < 20 sn, timeout'ta fallback |
| Yeni kullanıcıda tamamlanan plan | ≥ %80 (demo senaryosunda) |
| Test kapsamı (kritik akışlar) | auth, gezi CRUD, generate, fallback |

## Kullanıcı hikâyeleri ve kabul kriterleri

### US-1: Kayıt ve oturum

**Olarak** yeni kullanıcı, **istiyorum ki** e-posta ve şifreyle kayıt olup oturumumu açık tutayım.

- [x] Geçersiz e-posta / 8 karakterden kısa şifre Türkçe hata döner.
- [x] Aynı e-posta ikinci kez kaydolamaz (409 `EMAIL_TAKEN`).
- [x] Şifre bcrypt ile saklanır; yanıtta hash dönmez.
- [x] Kayıt sonrası httpOnly oturum çerezi verilir ve `/onboarding`'e yönlendirilir.
- [x] Çıkış çerezi temizler; oturum yokken korumalı sayfalar `/login`'e gider.

### US-2: Tercihler

**Olarak** kullanıcı, **istiyorum ki** ilgi alanlarımı, bütçe seviyemi ve tempomu kaydedeyim.

- [x] İlgi alanları en fazla 12 etiket; bütçe `low|mid|high`; tempo `slow|moderate|fast`.
- [x] Tercih yoksa makul varsayılanlarla oluşturulur.
- [x] Tercihler AI plan üretiminde kullanılır (kategori önceliği + maliyet çarpanı).

### US-3: Gezi oluşturma

**Olarak** kullanıcı, **istiyorum ki** destinasyon, tarih ve bütçe girerek gezi oluşturayım.

- [x] Bitiş tarihi başlangıçtan önce olamaz.
- [x] Gezi en fazla 21 gün olabilir; gün sayısı kadar `TripDay` oluşur.
- [x] Para birimi 3 harf; bütçe negatif olamaz.
- [x] Kullanıcı yalnızca kendi gezilerini listeler/görüntüler; başkasının id'si 404.

### US-4: AI plan üretimi

**Olarak** kullanıcı, **istiyorum ki** tek tıkla gün gün, saatli ve maliyetli bir plan alayım.

- [x] Plan, gezi gün sayısı kadar gün içerir.
- [x] Her aktivitede başlık, kategori, başlangıç/bitiş saati ve tahmini maliyet vardır.
- [x] Tercihlerdeki ilgi alanları plana yansır (offline üreticide kategori önceliği).
- [x] Aday listesinde olmayan `googlePlaceId` kabul edilmez (halüsinasyon filtresi).
- [x] Toplam maliyet sunucuda hesaplanır; bütçe aşılırsa uyarı gösterilir.
- [x] Sağlayıcı hatası/timeout durumunda offline plana düşülür; `meta.fallback = true`.
- [x] Aynı gün içinde aynı yer tekrar etmez.
- [x] Plan `tips` alanıyla birlikte kalıcıdır; sayfa yenilense de görünür.

### US-5: Planı düzenleme

**Olarak** kullanıcı, **istiyorum ki** plana elle aktivite ekleyip sileyim.

- [x] Aktivite başlığı zorunlu; kategori enum; saat `SS:DD`.
- [x] Yeni aktivite günün sonuna eklenir (`order = count`).
- [x] Aktivite silme sahiplik kontrolünden geçer.
- [ ] Sürükle-bırak sıralama (Sprint 4: kapsam dışı).

### US-6: Gezi yönetimi

**Olarak** kullanıcı, **istiyorum ki** gezilerimi listeleyip sileyim.

- [x] Liste tarihe göre sıralı; her kartta durum, gün, aktivite sayısı ve bütçe.
- [x] Silme onay ister; silinen gezi alt kayıtlarıyla birlikte gider (cascade).
- [x] Boş durumda yönlendirici mesaj ve CTA gösterilir.

### US-7: Yer arama (opsiyonel yükseltme)

**Olarak** kullanıcı, **istiyorum ki** şehirdeki yerleri arayıp aktiviteye bağlayayım.

- [x] API `GET /api/places/search` yerleşik katalogdan sonuç döner ve `Place` tablosuna yazar.
- [x] Google Places anahtarı yoksa katalog kullanılır.
- [ ] Gerçek Google Places proxy'si (Sprint 2: anahtar gerektirir).

### US-8: Güvenli AI kullanımı

**Olarak** ekip, **istiyorum ki** LLM'e giden kullanıcı metni prompt injection'a karşı sınırlansın.

- [x] Notlar `<untrusted_user_notes>` içinde ve "veri" olarak işaretli gönderilir.
- [x] Çıktı zod şemasına uymazsa plan kabul edilmez.
- [x] AI endpoint'i günlük limitle korunur; auth endpoint'i dakikalık limitle korunur.

## Fonksiyonel olmayan gereksinimler

- **Performans:** offline üretim < 1 sn; LLM timeout 20 sn (yapılandırılabilir).
- **Güvenlik:** helmet, CORS allowlist, httpOnly cookie, bcrypt, zod, rate limit.
- **Erişilebilirlik:** etiketli formlar, görünür odak, klavye kullanımı, WCAG AA kontrast hedefi.
- **Responsive:** 360px–1440px; 920px ve 640px kırılımları.
- **Gözlemlenebilirlik:** her AI yanıtında `provider`, `model`, `latencyMs`, `fallback`.
- **Taşınabilirlik:** yalnızca Node 22+; yerel Postgres `prisma dev` ile gelir.

## Kapsam dışı

- Gerçek rezervasyon/ödeme, uçuş/otel entegrasyonu.
- Çoklu kullanıcı işbirliği, yorum, sosyal özellikler.
- Mobil native uygulama.
- Gerçek zamanlı harita (Google Maps anahtarı olmadan).

## Açık sorular

- Ürün dili yalnızca Türkçe mi, İngilizce de olacak mı?
- Gerçek LLM sağlayıcısı demo için Gemini mi OpenAI mi? (Varsayılan: offline)
- Google Maps anahtarı Sprint 4'te sağlanacak mı?
