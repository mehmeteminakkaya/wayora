---
title: Ders Konseptleri İzlenebilirliği
subtitle: Week 1–5 kavramları, ürün kanıtları ve dürüst boşluklar
doc_type: DERS DEĞERLENDİRMESİ
version: 1.0
date: 30 Ekim 2026
---

# Kaynak ve Yöntem

Bu belge, `scottyUX/Software-engineering-in-the-age-of-ai` ders reposundaki Week 1–5
lecture README’leri, midterm study guide, cross-cutting themes ve required-reading checklist
ile Wayora reposunu karşılaştırır. Ders reposuna commit/PR gönderilmedi; yalnızca okundu.

**Kısa cevap:** Tüm konseptler %100 işlenmiş değil. Ürün mühendisliği pratiklerinin büyük
bölümü gerçekten uygulanıyor; bazı ders/reading kavramları ise kod artefaktı gerektirmediği
için yalnızca teorik kapsamda kalıyor.

## Gösterge

| İşaret | Anlam |
| :--- | :--- |
| ✅ | Repoda somut artefakt ve doğrulama var |
| ◐ | Kısmi: prensip uygulanıyor, otomasyon/ölçüm eksik |
| — | Kapsam dışı veya ders/reading kavramı |

# Özet Matris

| Hafta | Güçlü kapsam | Kısmi kapsam | Kapsam dışı / boşluk |
| :--- | :--- | :--- | :--- |
| Week 1 · AI-native engineer | Spec-first, test/CI, human-in-the-loop, orchestrator rolü | Beş pattern; career/readings | Junior/career ve reading bulguları |
| Week 2 · SDD | Spec/plan/tasks, kabul kriteri, out-of-scope, checkpoint | Task done-check, framework adaptasyonu | Spec-as-source |
| Week 3 · Coding agents | Model routing, fallback, validation, test behaviour | Harness bileşenleri, ReAct, context reduction | LLM attention/RLHF ayrıntıları |
| Week 4 · Context management | AGENTS, skills, MCP, oturum/handoff | Context rot/attention ölçümü, discovery | RAG/MemGPT/RULER |
| Week 5 · Codebase structure | Skills, rules, CI/hooks, worktree, critic | Subagent config, event hook, ACI | Cloud agents |

# Week 1 · AI-Native Software Engineer

| Konsept | Durum | Wayora kanıtı |
| :--- | :--- | :--- |
| Vibe coding vs engineering; verification farkı | ✅ | `AGENTS.md` test-first kuralı, CI, `docs/AI_REVIEW.md`, 76 test. |
| Spectrum ve risk profili | ◐ | Pratikte structured/agentic akış var; spektrum tablosu ayrı yazılı değil. |
| Implementer → orchestrator | ✅ | `docs/AI_NATIVE_TEAM.md`, `docs/ORCHESTRATION.md`. |
| Human-in-the-loop | ✅ | Autonomy L0–L4, insan onayı; agent kendi işini onaylamıyor. |
| AI-native mühendisin işleri | ✅ | Spec, context, test, review, deploy. |
| Beş yeni pattern | ◐ | Bazıları örtük; ayrı pattern dokümanı yok. |
| Junior/career/readings | — | Ürün artefaktı değil. |

# Week 2 · Spec-Driven Development

| Konsept | Durum | Wayora kanıtı |
| :--- | :--- | :--- |
| Agentic SDLC | ✅ | `docs/specs/001-mvp`, `002-live-discovery`, `003-hitchhiker-match`. |
| Spec-first / spec-anchored | ✅ | Spec’ler repoda; değişiklikle birlikte güncelleniyor. |
| Spec-as-source | — | Bilinçli olarak benimsenmedi. |
| Goal, Constraints, Acceptance, Out of scope | ✅ | 001 ve 003 spec’lerinde mevcut. |
| User story vs requirements vs spec | ✅ | User story kataloğu + teknik plan + kabul kriterleri. |
| Plan Mode / plan review | ✅ | Planner/generator/critic akışı; Plan Mode aracı zorunlu değil. |
| İnsan checkpoint’leri | ◐ | Roller var; branch protection/otomasyon sınırlı. |
| Stop-and-ask | ◐ | `AGENTS.md`’ye belirsizlik, 3 başarısız deneme, çelişki ve geri alınamaz işlem kuralı eklendi. |
| Done-check’li küçük task’lar | ◐ | `tasks.md` var; her task’ta ayrı done-check zorunlu değil. |
| SDD framework’leri | — | Hand-rolled artefaktlar; framework adaptasyonu yok. |

# Week 3 · Anatomy of Coding Agents

| Konsept | Durum | Wayora kanıtı |
| :--- | :--- | :--- |
| LLM token/attention/RLHF | — | Ders/reading bilgisi; ürün kodu gerektirmiyor. |
| Model landscape ve routing | ✅ | `docs/AI_NATIVE_TEAM.md`, `routeModel`, DeepSeek/Gemini/OpenAI. |
| Agent = model + harness | ◐ | AGENTS/skills/MCP/agent araçları var; altı bileşen ayrı dokümante değil. |
| Agentic loop / ReAct | ◐ | Generator–critic döngüsü var; ReAct izi yok. |
| Context reduction | ◐ | Skill/context disiplini; otomatik compaction yok. |
| Session memory | ◐ | `docs/CONTEXT.md` + `docs/PROGRESS.md`; otomatik handoff yok. |
| Subagent delegation | ◐ | Orchestration pattern’leri var; config dosyası yok. |
| Test behaviour, not strings | ✅ | Servis testleri davranış/fallback doğruluyor. |

# Week 4 · Advanced Context Management

| Konsept | Durum | Wayora kanıtı |
| :--- | :--- | :--- |
| Always-on vs on-demand context | ✅ | Kök/alan AGENTS + `.agents/skills`. |
| Progressive disclosure | ✅ | Skill frontmatter + body + resource dosyaları. |
| Context budget / context rot | ◐ | `docs/CONTEXT.md`’ye bütçe/rot bölümü eklendi; ölçüm yok. |
| Lost in the Middle / attention | ◐ | Kısa bağlam ve oturum disiplini; resmi ölçüm yok. |
| Curse of instructions | ◐ | Kısa kurallar; kural uyum metriği yok. |
| Context discovery | ◐ | Bağlam haritası var; semantic search/LSP politikası yok. |
| Session reset / handoff | ◐ | `docs/PROGRESS.md` eklendi; otomasyon yok. |
| MCP host/client/server | ✅ | `mcp/wayora-context`, `.mcp.json`; stdio. |
| MCP security | ✅ | `read_doc` path traversal kontrolü; cookie repo dışında. |
| RAG / MemGPT / RULER | — | Ders/reading kavramları. |

# Week 5 · Agentic Codebase Structure

| Konsept | Durum | Wayora kanıtı |
| :--- | :--- | :--- |
| Skills | ✅ | `wayora-feature`, `wayora-review`, `wayora-security`. |
| Rules / AGENTS hierarchy | ✅ | Kök + api + web + services AGENTS. |
| Hooks / guardrails | ✅/◐ | Pre-commit, CI, CodeQL, Semgrep, gitleaks; agent event hook yok. |
| Guide vs enforce | ✅ | `docs/AI_REVIEW.md`, test/CI. |
| Subagent patterns | ◐ | Planner/reviewer/verifier dokümante; config yok. |
| MCP configuration | ✅ | `.mcp.json` + Wayora Context. |
| ACI / SWE-agent lessons | ◐ | Tool/API tasarımı var; ACI ilkeleri ayrı yazılı değil. |
| Cloud agents | — | GitHub/Vercel deployment var; cloud agent runtime yok. |
| Worktree isolation | ✅ | `scripts/new-worktree.mjs`, `docs/ORCHESTRATION.md`. |
| Critic / human approval | ✅ | Review skill + insan onayı. |
| Reading evidence | ◐ | Pratik var; reading özetleri ayrı değil. |

# Dürüst Boşluklar

1. Subagent config dosyaları (`.agents/subagents/*.md`) yok.
2. Agent event hook’ları yok; yalnızca pre-commit ve CI.
3. Context rot/Lost in the Middle ölçümü ve otomatik compaction yok.
4. Spec-as-source ve SDD framework adaptasyonu bilinçli kapsam dışı.
5. Ders reading’lerinin ayrı özetleri yok.
6. Cloud agent ve ACI ileri konuları ürün kapsamında değil.

# Bu Turda Kapatılanlar

- `docs/COURSE_TRACEABILITY.md` eklendi.
- `docs/PROGRESS.md` handoff artefaktı eklendi.
- `AGENTS.md`’ye stop-and-ask kuralı eklendi.
- `docs/CONTEXT.md`’ye context budget/context rot bölümü eklendi.
- 14 şehir / 140 deneyim sayıları spec ve README’de hizalandı.

# Sonuç

Wayora, **Week 2–5’in ürün mühendisliği pratiklerini** güçlü biçimde uyguluyor:
spec-first, test/CI, human-in-the-loop, skills, MCP, worktree, critic ve güvenlik.
Week 1’in ana fikri olan “verification is the differentiator” da CI/test/audit ile somutlaşıyor.

Ancak **dersin tüm teorik okumalarını kodladık** demek yanlış olur. Özellikle LLM iç işleyişi,
context rot ölçümü, ACI/SWE-agent ve AGENTS.md evidence konuları reading seviyesinde kalıyor.
Bu belge, güçlü kapsamı ve bilinçli boşlukları birlikte gösterir.
