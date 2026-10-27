# AI-Native Ekip ve LLM Gateway

Wayora'da model çağrıları "infrastructure" olarak ele alınır: sağlayıcı, model, maliyet ve
gecikme koddan ayrı yapılandırılır. Bu dosya ekibin agent'larla çalışma biçimini ve LLM
yönlendirme politikasını açıklar.

## 1. Ekip ve agent sorumlulukları

| Kişi | İnsan rolü | Agent'larla ilişkisi |
| :--- | :--- | :--- |
| Bayram Selim Yılmaz | PO + Frontend Lead | UI spec'ini netleştirir; frontend PR'larını review eder |
| Mehmet Emin Akkaya | Scrum Master + Backend/AI Lead | LLM gateway, API ve deploy kararları |
| Ezgi Turan | Designer | Tasarım sistemi, erişilebilirlik; UI critic |
| Aykut Kayra Akkuş | Database | Migration, seed, veri modeli review |
| Berfin Aksoy | Frontend + Test | Form/test akışları, demo senaryosu |

Agent'lar insan rolünün yerine geçmez; **üretir, insan doğrular**. Her PR'da en az bir insan
onayı ve test kanıtı vardır.

## 2. Standart geliştirme yığını

- **Editör/agent:** Antigravity, OpenCode, Claude Code veya Codex (tercih serbest).
- **Bağlam:** `AGENTS.md` + `.agents/skills/` + `docs/specs/`.
- **İzolasyon:** `scripts/new-worktree.mjs` ile worktree.
- **Guardrail:** lint, typecheck, test, build, audit, gitleaks, CodeQL, Semgrep.
- **Review:** CodeRabbit/Graphite + insan.
- **Model erişimi:** tek `generateItinerary` choke point'i; sağlayıcı env ile seçilir.

## 3. LLM gateway tasarımı

```
POST /api/trips/:id/generate
        │
        ▼
generateItinerary(input, candidates, config)
        │
        ├── LLM_PROVIDER=offline → generateOfflinePlan (deterministik, $0)
        ├── LLM_PROVIDER=gemini  → routeModel('itinerary') → Gemini API
        └── LLM_PROVIDER=openai  → routeModel('itinerary') → OpenAI API
                    │
                    ├── timeout (LLM_TIMEOUT_MS, varsayılan 20s)
                    ├── HTTP/şema hatası → offline fallback
                    └── meta: { provider, model, fallback, latencyMs }
```

### Model yönlendirme

| Görev | `routeModel` | Varsayılan | Neden |
| :--- | :--- | :--- | :--- |
| `itinerary` (hard) | `LLM_MODEL_SMART` | `gemini-2.5-pro` | Çok günlü plan, saat/maliyet dengesi |
| `quick_tip` (easy) | `LLM_MODEL_FAST` | `gemini-2.0-flash` | Kısa metin, düşük maliyet |

`routeModel` saf fonksiyondur; test edilebilir ve sağlayıcıdan bağımsızdır.

### Fallback

- Sağlayıcı hatası, timeout veya zod şema uyuşmazlığında **offline üretici** devreye girer.
- Kullanıcıya ham hata gösterilmez; `meta.fallback` ile bilgilendirilir.
- Fallback sonsuz döngüye girmez: tek deneme + yerel üretim.

### Maliyet ve gecikme

| Sağlayıcı | Yaklaşık maliyet | Gecikme | Kullanım |
| :--- | :--- | :--- | :--- |
| Offline | $0 | < 1 ms | Demo, test, anahtarsız geliştirme |
| Gemini Flash | Düşük | 1–3 sn | Kısa ipuçları, özet |
| Gemini Pro | Orta | 3–15 sn | Tam plan |
| OpenAI (küçük model) | Düşük | 1–4 sn | Yedek hızlı görev |
| OpenAI (güçlü model) | Yüksek | 4–20 sn | Yedek plan |

Gerçek fiyatlar sağlayıcı sayfasından doğrulanmalıdır; bu tablo demo içindir.

### Ölçüm

Her üretim yanıtı `meta` döner:

```json
{ "provider": "gemini", "model": "gemini-2.5-pro", "fallback": false, "latencyMs": 4210 }
```

- Gecikme: `meta.latencyMs` (sunucu tarafı).
- Maliyet: sağlayıcı faturası + istek sayısı; istek başına token logu henüz yok.
- Hata oranı: `fallback=true` sayısı / toplam istek.
- Günlük limit: `AI_DAILY_LIMIT`.

### Önerilen politika

1. Demo ve testte **offline**; sıfır maliyet, deterministik.
2. Üretimde plan için **güçlü model**, kısa ipuçları için **hızlı model**.
3. Güçlü model hatasında önce hızlı modele, o da olmazsa offline'a düş.
4. Aylık bütçe aşımında `LLM_PROVIDER=offline` ile servis ayakta kalır.

## 4. Sırlar ve yapılandırma

```bash
LLM_PROVIDER=offline          # offline | gemini | openai
GEMINI_API_KEY=...            # yalnızca gemini seçiliyse
OPENAI_API_KEY=...            # yalnızca openai seçiliyse
LLM_MODEL_FAST=gemini-2.0-flash
LLM_MODEL_SMART=gemini-2.5-pro
LLM_TIMEOUT_MS=20000
AI_DAILY_LIMIT=10
```

Anahtarlar repoya girmez; CI'da gitleaks ve CodeQL çalışır.

## 5. Agent'larla çalışma kuralları

- Bir agent'a aynı anda birden fazla story verme; worktree izolasyonu kullan.
- Agent'a **spec + kabul kriteri + test komutu** ver; "iyi bir şey yap" deme.
- Critic'i ayrı oturumda çalıştır; generator kendi işini onaylamasın.
- Agent'ın ürettiği her diff'i insan okur; özellikle auth, migration ve prompt değişiklikleri.
- Kararları `docs/ARCHITECTURE.md` "Karar kaydı" ve `docs/specs/001-mvp/plan.md` içine yaz.
