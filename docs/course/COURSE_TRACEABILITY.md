# Ders Konseptleri · Lecture 1–10 İzlenebilirlik

Kaynak: `scottyUX/Software-engineering-in-the-age-of-ai` (ders repo'su; yalnızca okundu).
Kapsam: Lecture 1–5 için midterm study guide'daki kavramlar; Lecture 6–10 için ders
README'lerindeki konu başlıkları. Numaralar ders reposundaki `lectures/` sırasını izler
(4 = Agentic Codebase Structure, 5 = Advanced Context Management).

> Kısa cevap: **Tüm konseptler %100 işlenmiş değil.** Ürün mühendisliği pratiklerinin
> büyük bölümü repoda karşılık buluyor; bazıları kısmi, bazıları ise ders/reading
> kavramı olduğu için kod artefaktı gerektirmiyor. Aşağıdaki tablo kanıt ve boşlukları ayırır.

## Gösterge

- **✅ Karşılandı:** Repoda somut artefakt ve doğrulama var.
- **◐ Kısmi:** PrensiP uygulanıyor veya dokümante ediliyor; araç/otomasyon eksik.
- **— Kapsam dışı / ders kavramı:** Ürün koduna dönüşmesi zorunlu değil; sınav/reading bilgisi.

## Lecture 1 · AI-Native Software Engineer

| Konsept | Durum | Kanıt / not |
| :--- | :--- | :--- |
| Vibe coding vs engineering; verification farkı | ✅ | `AGENTS.md` test-first kuralı, CI, `docs/agentic/AI_REVIEW.md`, 89 test. |
| Spectrum (vibe → structured → agentic) ve risk | ◐ | Pratikte agentic/structured akış var; spektrum tablosu ayrıca yazılı değil. |
| Implementer → orchestrator rol değişimi | ✅ | `docs/agentic/AI_NATIVE_TEAM.md`, `docs/agentic/ORCHESTRATION.md` rolleri. |
| Human-in-the-loop zorunlu checkpoint | ✅ | `AGENTS.md`, autonomy L0-L4, insan onayı; AI kendi işini onaylamıyor. |
| AI-native mühendisin yaptıkları (spec/context/review) | ✅ | Specs, AGENTS, skills, test ve review akışı. |
| Beş yeni pattern (shift up/left, environment, workforce, values) | ◐ | Bazıları örtük; ayrı bir “pattern” dokümanı yok. |
| Junior/career/reading bulguları | — | Ürün artefaktı değil; sınav/reading kapsamı. |

## Lecture 2 · Spec-Driven Development

| Konsept | Durum | Kanıt / not |
| :--- | :--- | :--- |
| Agentic SDLC döngüsü | ✅ | `docs/specs/001-mvp/{spec,plan,tasks}.md`; 002 ve 003 ayrı spec. |
| Spec-first / spec-anchored | ✅ | Spec'ler repoda; PR ile birlikte güncelleniyor. |
| Spec-as-source | — | Kodu spec'ten üretme modeli bilinçli olarak benimsenmedi. |
| Goal, Constraints, Acceptance, Out of scope | ✅ | 001 ve 003 spec'lerinde dört başlık var. |
| User story vs requirements vs spec | ✅ | 001 user story + acceptance criteria; plan teknik gereksinimleri taşıyor. |
| Plan Mode / plan review | ✅ | `docs/agentic/ORCHESTRATION.md` planner/implementer/critic; Plan Mode aracı zorunlu değil. |
| Dört insan checkpoint'i | ◐ | Spec/plan/code/deploy review rolleri var; branch protection/otomasyon kanıtı sınırlı. |
| Stop-and-ask koşulları | ◐ | `AGENTS.md`'ye belirsizlik, 3 başarısız deneme, çelişki ve geri alınamaz işlem kuralı eklendi. |
| Done check'li küçük task'lar | ◐ | `tasks.md` var; her task için ayrı done check zorunluluğu her yerde değil. |
| SDD framework'leri (Spec Kit/Kiro/OpenSpec/BMAD/Tessl) | — | Hand-rolled spec artefaktları kullanılıyor; framework adaptasyonu yok. |

## Lecture 3 · Anatomy of Coding Agents

| Konsept | Durum | Kanıt / not |
| :--- | :--- | :--- |
| LLM token/attention/RLHF/in-weights vs in-context | — | Ders/reading bilgisi; ürün kodu gerektirmiyor. |
| Model landscape ve model routing | ✅ | `docs/agentic/AI_NATIVE_TEAM.md`, `routeModel`, `LLM_PROVIDER`, fallback. |
| Agent = model + harness; tool access | ◐ | AGENTS/skills/MCP ve agent araçları var; harness'in altı bileşeni ayrı dokümante değil. |
| Agentic loop / ReAct | ◐ | Orchestration generator-critic döngüsü var; ReAct çıktı izi yok. |
| Context reduction (clip/dedupe/summarize) | ◐ | Skill/context disiplini var; otomatik compaction aracı yok. |
| Session memory / transcript / working memory | ◐ | `docs/agentic/CONTEXT.md` oturum yönetimi; `PROGRESS.md` handoff eklendi. |
| Subagent delegation | ✅ | `docs/agentic/ORCHESTRATION.md` pattern'leri + `.agents/subagents/`. |
| Test behaviour, not strings | ✅ | Servis testleri çıktı davranışını/fallback'i doğruluyor; snapshot-string testi yok. |

## Lecture 4 · Agentic Codebase Structure

| Konsept | Durum | Kanıt / not |
| :--- | :--- | :--- |
| Skills | ✅ | `wayora-feature`, `wayora-review`, `wayora-security`. |
| Rules ve AGENTS.md hiyerarşisi | ✅ | Kök + `api/` + `web/` + `api/src/services/` AGENTS. |
| Hook'lar / guardrails | ✅/◐ | Pre-commit, CI, CodeQL, Semgrep, gitleaks var; agent event hook'ları yok. |
| Guide vs enforce ayrımı | ✅ | `docs/agentic/AI_REVIEW.md` + test/CI/hook'lar. |
| Subagent pattern'leri (planner/reviewer/verifier) | ✅ | `docs/agentic/ORCHESTRATION.md` roller + `.agents/subagents/{explorer,planner,critic}.md`. |
| MCP configuration | ✅ | `.mcp.json`, Wayora Context. |
| ACI / SWE-agent interface lessons | ◐ | Tool/route/CLI tasarımı var; ACI ilkeleri ayrı yazılı değil. |
| Cloud agents | — | Deployment GitHub/Vercel; cloud agent runtime yok. |
| Worktree izolasyonu | ✅ | `scripts/dev/new-worktree.mjs`, `docs/agentic/ORCHESTRATION.md`. |
| Critic ayrı oturum / kendi işini onaylamama | ✅ | Review skill + human approval. |
| AGENTS.md / reading evidence | ◐ | Pratik uygulanıyor; required reading özetleri ayrı dokümante değil. |

## Lecture 5 · Advanced Context Management

| Konsept | Durum | Kanıt / not |
| :--- | :--- | :--- |
| Context taxonomy: always-on vs on-demand | ✅ | Kök/alan `AGENTS.md` + `.agents/skills/*/SKILL.md`. |
| Progressive disclosure | ✅ | Skill frontmatter + body + referans/script yapısı. |
| Prompt engineering vs context engineering | ◐ | `docs/agentic/CONTEXT.md` var; terim ayrımı sınırlı. |
| Context budget / context rot / Lost in the Middle | ◐ | Kısa AGENTS ve oturum disiplini; attention bütçesi açıkça ölçülmüyor. |
| Curse of instructions | ◐ | Kısa kurallar var; kural sayısı/uyum ölçümü yok. |
| Context assembly/discovery | ◐ | Bağlam haritası var; semantic search/LSP politikası yok. |
| Session reset ve handoff | ◐ | `docs/agentic/CONTEXT.md` + yeni `docs/agentic/PROGRESS.md`; otomatik handoff yok. |
| MCP host/client/server | ✅ | `mcp/wayora-context/server.mjs`, `.mcp.json`, araç şemaları. |
| MCP transport ve güvenlik | ✅ | stdio; `read_doc` path traversal kontrolü; cookie repo dışında. |
| RAG / MemGPT / RULER | — | Ders/reading kavramları; ürün gereksinimi değil. |

## Lecture 6 · Agentic Code Review and Testing

| Konsept | Durum | Kanıt / not |
| :--- | :--- | :--- |
| Deterministik guardrail'ler | ✅ | `.github/workflows/ci.yml` (lint, typecheck, test, build, `npm audit`), `.githooks/pre-commit`. |
| LLM tabanlı review | ◐ | `.coderabbit.yaml` + `wayora-review` skill + `docs/agentic/AI_REVIEW.md` rubric; PR bazlı review logu (`AI_REVIEW_LOG.md`) tutulmuyor. |
| Güvenli deployment stratejileri | ◐ | Vercel deploy + `/api/health`; canary/rollback prosedürü yazılı değil. |
| Runtime safety | ✅ | Rate limit, zod doğrulama, offline fallback, sabit hata biçimi. |
| Human in the loop | ✅ | CODEOWNERS, PR şablonu, `AGENTS.md` durma kuralları; L4 otomatik merge kullanılmaz. |
| Review araçları | ✅ | CodeRabbit, CodeQL, Semgrep, gitleaks, Dependabot. |
| Monitoring agent'ları | — | Yok; gözlem `meta` alanları ve loglarla sınırlı. |

## Lecture 7 · Agent Orchestration

| Konsept | Durum | Kanıt / not |
| :--- | :--- | :--- |
| Generator–critic döngüsü | ✅ | `docs/agentic/ORCHESTRATION.md` §3, `wayora-review` skill, `.agents/subagents/critic.md`. |
| Birden fazla agent çalıştırma | ✅ | `scripts/dev/new-worktree.mjs`, çakışma kontrol listesi. |
| Subagent pattern'i | ✅ | `.agents/subagents/` (explorer, planner, critic). |
| Goal pattern | — | Ayrı bir artefakt yok; kabul kriterleri spec/task dosyalarında. |
| Ralph loop | — | Kullanılmıyor; döngüler insan onaylı ve tur sınırlı. |

## Lecture 8 · Security in the Age of AI

| Konsept | Durum | Kanıt / not |
| :--- | :--- | :--- |
| SAST | ✅ | `.github/workflows/codeql.yml`, `semgrep.yml`. |
| SCA / bağımlılık | ✅ | `npm audit` (CI), `.github/dependabot.yml` (7 gün cooldown). |
| Secret sızıntısı | ✅ | `.github/workflows/secret-scan.yml`, `.gitleaks.toml`, `.env` gitignore. |
| Prompt injection savunması | ✅ | `api/src/services/itinerary.ts` (`<untrusted_user_notes>`, `<untrusted_web_research>`), zod + aday kimlik filtresi; `docs/engineering/SECURITY.md` §3. |
| Agent saldırı yüzeyi | ◐ | MCP `read_doc` path traversal kontrolü, Wayora Agent araç doğrulaması; ayrı bir agent tehdit modeli yok. |
| Agent destekli triage | ◐ | `wayora-security` skill; kayıtlı bir triage örneği yok. |

## Lecture 9 · Software Factory

| Konsept | Durum | Kanıt / not |
| :--- | :--- | :--- |
| Kendi kendine çalışan hat | ◐ | `docs/agentic/SOFTWARE_FACTORY.md` hat ve otomasyon envanteri; merge her zaman insan onaylı. |
| Self-improving loop | ◐ | Belgede tanımlı; otomatik işleyen bir döngü yok. |
| Deploy sonrası agent güvenliği | ◐ | Wayora Agent: oturum şartı, saatte 60 mesaj, araç çıktısı doğrulaması. |

## Lecture 10 · AI-Native Engineering Teams

| Konsept | Durum | Kanıt / not |
| :--- | :--- | :--- |
| AI-native ekip çalışma biçimi | ✅ | `docs/agentic/AI_NATIVE_TEAM.md` §1, `docs/product/TEAM.md`. |
| Standart ekip yığını | ✅ | `AGENTS.md`, `.agents/`, `.mcp.json`, `.editorconfig`, `.nvmrc`. |
| Model routing | ✅ | `routeModel` (`api/src/services/itinerary.ts`), `LLM_PROVIDER`, `LLM_MODEL_FAST/SMART`. |
| LLM gateway | ◐ | Uygulama içi adaptör + fallback var; ayrı bir gateway servisi yok. |
| Maliyet optimizasyonu | ◐ | Offline varsayılan, günlük limit; istek başına token/maliyet logu yok. |

## Gerçek boşluklar

1. **PR bazlı AI review logu**, canary/rollback prosedürü ve monitoring agent'ı yok (Lecture 6).
2. **Agent event hook'ları** (edit sonrası lint, turn sonrası test) yok; pre-commit/CI var.
3. **Context rot / Lost in the Middle / curse of instructions** prensipleri uygulanıyor
   ama ölçüm ve otomatik bağlam sıkıştırma yok.
4. **Spec-as-source ve SDD framework adaptasyonu** bilinçli kapsam dışı.
5. **Ders reading'lerinin özetleri** (SWE-agent, AGENTS.md evaluation, Guardrails Beat Guidance)
   repoda ayrı bir “reading notes” dosyası değil.
6. **Cloud agent** ve **ACI** dersin ileri konuları; ürün deployment'ı bunları gerektirmiyor.

## Bu turda eklenen kapatma adımları

- `docs/agentic/PROGRESS.md`: Decided / Done / Next handoff artefaktı.
- `AGENTS.md`: belirsizlik, 3 başarısız deneme, çelişki ve geri alınamaz işlem için durma kuralı.
- `docs/agentic/CONTEXT.md`: context budget, context rot ve handoff referansı.
- Spec/katalog sayaçları 14 şehir / 140 deneyim ile hizalandı.
- Kapsam Lecture 6–10'a genişletildi; numaralar ders reposundaki sırayla hizalandı.
- `.agents/subagents/`: explorer, planner ve critic rol tanımları eklendi.

## Dürüst değerlendirme

- **Ürün mühendisliği pratikleri:** güçlü; SDD, human-in-the-loop, test/CI, skills, MCP,
  worktree ve critic akışı gerçekten kullanılıyor.
- **Dersin teorik/reading kavramları:** tamamı kod artefaktına dönüşmedi; bazıları sadece
  sınav/reading bilgisi. Özellikle context rot, ACI, SWE-agent ve AGENTS.md evidence
  konularında ayrı reading notes yok.
- **Sonuç:** “Her şeyi kodladım” demek yanlış olur; “ürün pratiğinde Lecture 1–10'un ana
  mühendislik konseptlerini büyük ölçüde uyguladım, teorik okumaların bir kısmını dokümante
  etmedim” doğru cevap.
