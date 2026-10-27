# Güvenlik

Wayora bir ders projesidir; yine de gerçek kullanıcı verisi, kimlik doğrulama ve LLM çağrıları
içerdiği için güvenlik varsayılan olarak düşünülmüştür. Bu dosya tehdit modelini ve kontrolleri
özetler.

## 1. Varlıklar

- Kullanıcı hesabı: e-posta, bcrypt şifre hash'i, oturum çerezi.
- Kullanıcı içeriği: geziler, notlar, tercihler, aktiviteler.
- Sırlar: `JWT_SECRET`, `GEMINI_API_KEY`, `OPENAI_API_KEY`, `DATABASE_URL`.
- LLM bağlamı: kullanıcı notları + aday yer listesi.

## 2. Tehditler ve kontroller

| Tehdit | Örnek | Kontrol |
| :--- | :--- | :--- |
| Kimlik sahteciliği | Başka kullanıcının trip id'si | `userId` filtresi, 404 |
| Şifre sızıntısı | DB okuma | bcrypt (cost 12), yanıtta hash yok |
| XSS ile token çalınması | Zararlı script | httpOnly cookie, React escape, `helmet` |
| CSRF | Başka siteden POST | `sameSite=lax`, CORS allowlist |
| Brute force | Login denemeleri | 30 istek / 15 dk rate limit |
| AI maliyet patlaması | Sonsuz generate | `AI_DAILY_LIMIT`, timeout |
| Prompt injection | "Önceki talimatları yok say" | Sınırlandırılmış not, şema, çıktı filtresi |
| Halüsinasyon | Olmayan mekân | Aday listesi + ID doğrulama |
| Secret sızıntısı | `.env` commit | gitignore, `.env.example`, gitleaks |
| Bağımlılık açığı | Bilinen CVE | `npm audit`, Dependabot/CodeQL |
| Aşırı yük | 10 MB JSON | 1 MB gövde limiti, rate limit |

## 3. Prompt injection savunması

Uygulama, kullanıcı notlarını sistem talimatından ayırır:

```text
<untrusted_user_notes>
... kullanıcı metni ...
</untrusted_user_notes>
Return JSON only.
```

Savunma katmanları:

1. **Ayırma:** notlar yalnızca veri olarak işaretlenir; sistem promptu bunu açıkça söyler.
2. **Şema:** yanıt zod ile doğrulanır; serbest metin kabul edilmez.
3. **Aday filtresi:** `googlePlaceId` yalnızca sunucunun verdiği listeden olabilir.
4. **Yeniden hesaplama:** toplam maliyet ve gün sayısı sunucuda doğrulanır.
5. **Fallback:** şüpheli/bozuk yanıt plana dönüşmez; offline üretici kullanılır.
6. **Test:** `api/src/services/itinerary.test.ts` prompt sınırını ve halüsinasyon filtresini doğrular.

> Not: LLM çıktısı **asla** güvenilir kod/sql/komut olarak çalıştırılmaz.

## 4. Sır yönetimi

- `api/.env` gitignore'da; yalnızca `api/.env.example` commit'lenir.
- Production'da `JWT_SECRET` en az 32 karakter ve varsayılan değerden farklı olmalı
  (`loadConfig` bunu zorlar).
- `COOKIE_SECURE=true` production'da zorunlu.
- Anahtarlar loglara yazılmaz; LLM hata mesajı kullanıcıya ham gösterilmez.
- Şüpheli sızıntıda anahtarı döndür ve `git filter-repo` ile geçmişten temizle.

## 5. CI güvenlik hattı

- `npm audit --audit-level=high`
- **gitleaks**: commit edilmiş sır taraması
- **CodeQL**: JS/TS statik analiz
- **Semgrep**: SAST kuralları (`p/default`)
- Dependabot önerisi: `.github/dependabot.yml` ile haftalık güncelleme.

## 6. Olay müdahalesi

1. Etkilenen anahtarı iptal et / döndür.
2. Erişim loglarını ve DB kayıtlarını incele.
3. Düzeltmeyi ayrı branch'te yap; geçmişi force-push ile temizleme (ekip kuralı).
4. `docs/SECURITY.md`'ye kısa bir olay notu ekle.
5. Gerekirse kullanıcıları bilgilendir.

## 7. Bilinen sınırlar (ders projesi)

- E-posta doğrulama, şifre sıfırlama ve 2FA yok.
- Gerçek ödeme/rezervasyon yok.
- Google Places anahtarı yoksa harita doğrulaması yapılmaz.
- Rate limit bellek içidir; çok instance'lı dağıtımda Redis gerekir.
