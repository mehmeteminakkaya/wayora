# Software Factory

"Software factory", tek tek kod yazmak yerine **tekrarlanabilir bir üretim hattı** kurmaktır:
istenen iş → spec → plan → uygulama → doğrulama → review → merge → gözlem. Wayora'da bu hattın
her adımı bir artefakt veya otomasyonla temsil edilir.

## 1. Hat

```
Issue / story
   │  (spec)
   ▼
docs/specs/001-mvp/spec.md  ── kabul kriterleri
   │  (plan)
   ▼
docs/specs/001-mvp/plan.md  ── mimari, riskler
   │  (tasks)
   ▼
docs/specs/001-mvp/tasks.md ── küçük, sıralı işler
   │  (agent)
   ▼
.agents/skills/wayora-feature ── test-first uygulama
   │  (guardrail)
   ▼
CI: lint + typecheck + test + build + audit + gitleaks + CodeQL + Semgrep
   │  (review)
   ▼
.agents/skills/wayora-review + CodeRabbit + insan onayı
   │  (merge)
   ▼
main ── demo / deploy
   │  (observe)
   ▼
meta.latencyMs, fallback oranı, hata logları, retro
   └──────────────► spec/plan güncellemesi
```

## 2. Otomasyon envanteri

| Adım | Araç | Durum |
| :--- | :--- | :--- |
| Bağlam | `AGENTS.md`, alan bazlı talimatlar, skills | ✅ |
| Spec/plan | `docs/specs/001-mvp/` | ✅ |
| Uygulama | `wayora-feature` skill, worktree script | ✅ |
| Deterministik kontrol | GitHub Actions (lint/typecheck/test/build) | ✅ |
| Güvenlik | audit, gitleaks, CodeQL, Semgrep | ✅ |
| Review | CodeRabbit config + review skill + insan | ✅ |
| Bağlam genişletme | MCP sunucusu | ✅ |
| Gözlem | `meta` alanları, hata logları | ✅ (temel) |
| Deploy | Vercel/Render/Neon (plan) | ⏳ |

## 3. Self-improving loop

Wayora kendi kendini iyileştirmez; **ekip** geri bildirimle hattı iyileştirir. Döngü:

1. **Ölç:** test kapsamı, fallback oranı, review bulgu sayısı, demo süresi.
2. **Retro:** hangi adım yavaş/hatalı? Hangi agent talimatı eksikti?
3. **Güncelle:** `AGENTS.md`, skill, CI veya spec'e tek bir iyileştirme ekle.
4. **Doğrula:** bir sonraki sprintte metriğin değiştiğini göster.

Örnek iyileştirmeler:

- "Agent her seferinde hata biçimini yanlış yaptı" → `api/AGENTS.md`'ye tek satır eklendi.
- "Review'da aynı test boşluğu 3 kez çıktı" → `wayora-feature` skill'ine hata senaryosu maddesi.
- "LLM fallback sık" → timeout ve model politikası `docs/AI_NATIVE_TEAM.md`'de güncellendi.

## 4. Başarısızlık modları

| Mod | Belirti | Önlem |
| :--- | :--- | :--- |
| Spec kayması | Kod spec'te olmayan özellik | PR'da spec bağlantısı zorunlu |
| Test tiyatrosu | Test var ama davranışı kanıtlamıyor | Başarı + hata senaryosu kuralı |
| AI'a aşırı güven | Review'süz merge | İnsan onayı + critic ayrımı |
| Bağlam şişmesi | Agent yavaş, alakasız değişiklik | Bağlam haritası ve bütçe |
| Sır sızıntısı | `.env` commit | gitleaks + `.gitignore` |
| Maliyet patlaması | Kontrolsüz LLM çağrısı | günlük limit + offline varsayılan |
| Kırılgan demo | Anahtar yoksa çalışmıyor | offline mod ve yerleşik katalog |

## 5. Metrikler

| Metrik | Kaynak | Hedef |
| :--- | :--- | :--- |
| Test sayısı / kritik akış | `npm test` | Her akış için ≥ 1 başarı + 1 hata |
| CI süresi | GitHub Actions | < 5 dk |
| Offline plan gecikmesi | `meta.latencyMs` | < 100 ms |
| LLM fallback oranı | `meta.fallback` | < %10 (anahtar varsa) |
| Reviewer bulgu tekrarı | PR notları | Aynı bulgu ≤ 1 kez |
| Demo süresi | manuel | < 5 dk |

## 6. Gelecek

- Deploy hattı: `main` → Vercel (web) + Render (api) + Neon (db), `/api/health` smoke test.
- Gece CI: tüm testler + `npm audit` + Semgrep; sabah raporu.
- Agent telemetrisi: hangi skill/komut kaç kez kullanıldı, başarı oranı.
- İnsan onaylı otomatik PR: yalnızca dokümantasyon/test değişikliklerinde.
