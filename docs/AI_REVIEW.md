# AI Code Review Rehberi

Wayora'da review iki katmanlıdır: **deterministik guardrail'ler** (lint, typecheck, test, audit,
secret scan) ve **LLM tabanlı review**. İkisi birbirinin yerini tutmaz.

## 1. Deterministik katman

CI her PR'da şunları çalıştırır:

| Kontrol | Ne yakalar |
| :--- | :--- |
| `npm run lint` | kullanılmayan değişken, yanlış import, stil |
| `npm run typecheck` | tip uyuşmazlığı, eksik alan |
| `npm test` | davranış regresyonu, hata yolu |
| `npm run build` | üretim derleme kırığı |
| `npm audit --audit-level=high` | bilinen yüksek önem dereceli bağımlılık açığı |
| gitleaks | commit'e sızmış anahtar/token |
| CodeQL | yaygın güvenlik desenleri (injection, XSS, path) |
| Semgrep | SAST kuralları (JS/TS) |

Bu katman yeşil olmadan AI review anlamlı değildir.

## 2. LLM review katmanı

### Seçenekler

- **CodeRabbit (varsayılan):** `.coderabbit.yaml` ile path bazlı talimatlar. GitHub app'i kur,
  PR açıldığında otomatik yorum yapar.
- **Graphite Diamond:** PR üzerinde "Review" başlat; özellikle diff özeti iyi.
- **GitHub Copilot code review:** PR'da "Request review" → Copilot.

### Reviewer'a verilecek bağlam

- `AGENTS.md` + `docs/specs/001-mvp/spec.md` (kapsam ve kabul kriterleri)
- PR açıklaması (problem, yaklaşım, test kanıtı)
- Diff; özellikle `api/src/services/**` ve `api/src/routes/**`

### Bizim rubric'imiz

`.agents/skills/wayora-review/SKILL.md` ile aynı:

1. **Doğruluk:** spec'e uyuyor mu, kenar durumlar doğru mu?
2. **Test:** başarı + hata senaryosu var mı?
3. **Güvenlik:** sahiplik, girdi doğrulama, secret, prompt injection, rate limit?
4. **Sadelik:** gereksiz soyutlama/bağımlılık?
5. **UX:** Türkçe metin, boş/hata durumu, erişilebilirlik?

## 3. İnsan vs AI: güven sınırı

| AI review iyi olduğu yer | İnsan review şart olan yer |
| :--- | :--- |
| Tekrarlayan desen, isimlendirme, eksik test | Ürün kararı ve kapsam |
| Belirgin hata yolları, null/undefined | Güvenlik tehdit modeli ve yetki |
| Diff özeti, büyük PR'ı parçalama | Veri modeli/migration geri dönüşü |
| Dokümantasyon tutarlılığı | Prompt/LLM davranışının ürün etkisi |

**Kural:** AI yorumu kanıt değil, sinyaldir. Her bulguyu kendin doğrula; "AI haklı" diye
körü körüne değişiklik yapma. AI'ın kaçırdığı en az bir şeyi PR'da not et.

## 4. PR akışı

1. Branch: `feat/W-xx-kisa-ad`.
2. Küçük PR (< ~400 satır), açıklama şablonu dolu.
3. CI yeşil → AI reviewer çalıştır.
4. AI bulgularını triage et: `SEVERE/MAJOR/MINOR`.
5. Kendi review'unda AI'ın bulduğu/kaçırdığı şeyleri işaretle.
6. En az 1 insan onayı + yeşil CI → squash merge.

## 5. Örnek triage

```text
AI: "generate route'unda transaction yok; kısmi plan kalabilir."
→ Doğrulandı. MAJOR. `$transaction` zaten var mı kontrol et; yoksa ekle, test yaz.

AI: "değişken adı `data` çok genel."
→ MINOR. Kabul etme; mevcut desenle tutarlıysa geç.

AI: "prompt injection riski."
→ Kanıt iste: kullanıcı notu sınırlandırılmış mı, çıktı doğrulanıyor mu?
  Test `services/itinerary.test.ts` içinde. Yoksa MAJOR.
```

## 6. Ölçüm

Her PR sonunda kısa not:

- AI kaç bulgu verdi, kaçı geçerliydi?
- İnsan kaç bulgu verdi, AI bunları yakaladı mı?
- Hangi kural gürültü üretti? `.coderabbit.yaml`'a path filtresi ekle.

Bu notlar `docs/AI_REVIEW_LOG.md` içinde tutulabilir (demo için 2–3 PR yeterli).
