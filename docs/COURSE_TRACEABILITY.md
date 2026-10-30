# Ders Konseptleri · Week 1-5 İzlenebilirlik

Kaynak: `scottyUX/Software-engineering-in-the-age-of-ai` (ders repo'su; yalnızca okundu).
Kapsam: Week 1-5 dersleri ve midterm study guide'daki kavramlar.

> Kısa cevap: **Tüm konseptler %100 işlenmiş değil.** Ürün mühendisliği pratiklerinin
> büyük bölümü repoda karşılık buluyor; bazıları kısmi, bazıları ise ders/reading
> kavramı olduğu için kod artefaktı gerektirmiyor. Aşağıdaki tablo kanıt ve boşlukları ayırır.

## Gösterge

- **✅ Karşılandı:** Repoda somut artefakt ve doğrulama var.
- **◐ Kısmi:** PrensiP uygulanıyor veya dokümante ediliyor; araç/otomasyon eksik.
- **— Kapsam dışı / ders kavramı:** Ürün koduna dönüşmesi zorunlu değil; sınav/reading bilgisi.

## Week 1 · AI-Native Software Engineer

| Konsept | Durum | Kanıt / not |
| :--- | :--- | :--- |
| Vibe coding vs engineering; verification farkı | ✅ | `AGENTS.md` test-first kuralı, CI, `docs/AI_REVIEW.md`, 76 test. |
| Spectrum (vibe → structured → agentic) ve risk | ◐ | Pratikte agentic/structured akış var; spektrum tablosu ayrıca yazılı değil. |
| Implementer → orchestrator rol değişimi | ✅ | `docs/AI_NATIVE_TEAM.md`, `docs/ORCHESTRATION.md` rolleri. |
| Human-in-the-loop zorunlu checkpoint | ✅ | `AGENTS.md`, autonomy L0-L4, insan onayı; AI kendi işini onaylamıyor. |
| AI-native mühendisin yaptıkları (spec/context/review) | ✅ | Specs, AGENTS, skills, test ve review akışı. |
| Beş yeni pattern (shift up/left, environment, workforce, values) | ◐ | Bazıları örtük; ayrı bir “pattern” dokümanı yok. |
| Junior/career/reading bulguları | — | Ürün artefaktı değil; sınav/reading kapsamı. |

## Week 2 · Spec-Driven Development

| Konsept | Durum | Kanıt / not |
| :--- | :--- | :--- |
| Agentic SDLC döngüsü | ✅ | `docs/specs/001-mvp/{spec,plan,tasks}.md`; 002 ve 003 ayrı spec. |
| Spec-first / spec-anchored | ✅ | Spec'ler repoda; PR ile birlikte güncelleniyor. |
| Spec-as-source | — | Kodu spec'ten üretme modeli bilinçli olarak benimsenmedi. |
| Goal, Constraints, Acceptance, Out of scope | ✅ | 001 ve 003 spec'lerinde dört başlık var. |
| User story vs requirements vs spec | ✅ | 001 user story + acceptance criteria; plan teknik gereksinimleri taşıyor. |
| Plan Mode / plan review | ✅ | `docs/ORCHESTRATION.md` planner/implementer/critic; Plan Mode aracı zorunlu değil. |
| Dört insan checkpoint'i | ◐ | Spec/plan/code/deploy review rolleri var; branch protection/otomasyon kanıtı sınırlı. |
| Stop-and-ask koşulları | ◐ | `AGENTS.md`'ye belirsizlik, 3 başarısız deneme, çelişki ve geri alınamaz işlem kuralı eklendi. |
| Done check'li küçük task'lar | ◐ | `tasks.md` var; her task için ayrı done check zorunluluğu her yerde değil. |
| SDD framework'leri (Spec Kit/Kiro/OpenSpec/BMAD/Tessl) | — | Hand-rolled spec artefaktları kullanılıyor; framework adaptasyonu yok. |

## Week 3 · Anatomy of Coding Agents

| Konsept | Durum | Kanıt / not |
| :--- | :--- | :--- |
| LLM token/attention/RLHF/in-weights vs in-context | — | Ders/reading bilgisi; ürün kodu gerektirmiyor. |
| Model landscape ve model routing | ✅ | `docs/AI_NATIVE_TEAM.md`, `routeModel`, `LLM_PROVIDER`, fallback. |
| Agent = model + harness; tool access | ◐ | AGENTS/skills/MCP ve agent araçları var; harness'in altı bileşeni ayrı dokümante değil. |
| Agentic loop / ReAct | ◐ | Orchestration generator-critic döngüsü var; ReAct çıktı izi yok. |
| Context reduction (clip/dedupe/summarize) | ◐ | Skill/context disiplini var; otomatik compaction aracı yok. |
| Session memory / transcript / working memory | ◐ | `docs/CONTEXT.md` oturum yönetimi; `PROGRESS.md` handoff eklendi. |
| Subagent delegation | ◐ | `ORCHESTRATION.md` pattern'leri var; somut subagent config dosyası yok. |
| Test behaviour, not strings | ✅ | Servis testleri çıktı davranışını/fallback'i doğruluyor; snapshot-string testi yok. |

## Week 4 · Advanced Context Management

| Konsept | Durum | Kanıt / not |
| :--- | :--- | :--- |
| Context taxonomy: always-on vs on-demand | ✅ | Kök/alan `AGENTS.md` + `.agents/skills/*/SKILL.md`. |
| Progressive disclosure | ✅ | Skill frontmatter + body + referans/script yapısı. |
| Prompt engineering vs context engineering | ◐ | `docs/CONTEXT.md` var; terim ayrımı sınırlı. |
| Context budget / context rot / Lost in the Middle | ◐ | Kısa AGENTS ve oturum disiplini; attention bütçesi açıkça ölçülmüyor. |
| Curse of instructions | ◐ | Kısa kurallar var; kural sayısı/uyum ölçümü yok. |
| Context assembly/discovery | ◐ | Bağlam haritası var; semantic search/LSP politikası yok. |
| Session reset ve handoff | ◐ | `docs/CONTEXT.md` + yeni `docs/PROGRESS.md`; otomatik handoff yok. |
| MCP host/client/server | ✅ | `mcp/wayora-context/server.mjs`, `.mcp.json`, araç şemaları. |
| MCP transport ve güvenlik | ✅ | stdio; `read_doc` path traversal kontrolü; cookie repo dışında. |
| RAG / MemGPT / RULER | — | Ders/reading kavramları; ürün gereksinimi değil. |

## Week 5 · Agentic Codebase Structure

| Konsept | Durum | Kanıt / not |
| :--- | :--- | :--- |
| Skills | ✅ | `wayora-feature`, `wayora-review`, `wayora-security`. |
| Rules ve AGENTS.md hiyerarşisi | ✅ | Kök + `api/` + `web/` + `api/src/services/` AGENTS. |
| Hook'lar / guardrails | ✅/◐ | Pre-commit, CI, CodeQL, Semgrep, gitleaks var; agent event hook'ları yok. |
| Guide vs enforce ayrımı | ✅ | `docs/AI_REVIEW.md` + test/CI/hook'lar. |
| Subagent pattern'leri (planner/reviewer/verifier) | ◐ | `ORCHESTRATION.md` roller; somut agent config dosyaları yok. |
| MCP configuration | ✅ | `.mcp.json`, Wayora Context. |
| ACI / SWE-agent interface lessons | ◐ | Tool/route/CLI tasarımı var; ACI ilkeleri ayrı yazılı değil. |
| Cloud agents | — | Deployment GitHub/Vercel; cloud agent runtime yok. |
| Worktree izolasyonu | ✅ | `scripts/new-worktree.mjs`, `docs/ORCHESTRATION.md`. |
| Critic ayrı oturum / kendi işini onaylamama | ✅ | Review skill + human approval. |
| AGENTS.md / reading evidence | ◐ | Pratik uygulanıyor; required reading özetleri ayrı dokümante değil. |

## Gerçek boşluklar

1. **Subagent config'leri** dokümante edildi ama `.agents/subagents/*.md` gibi somut dosyalar yok.
2. **Agent event hook'ları** (edit sonrası lint, turn sonrası test) yok; pre-commit/CI var.
3. **Context rot / Lost in the Middle / curse of instructions** prensipleri uygulanıyor
   ama ölçüm ve otomatik bağlam sıkıştırma yok.
4. **Spec-as-source ve SDD framework adaptasyonu** bilinçli kapsam dışı.
5. **Ders reading'lerinin özetleri** (SWE-agent, AGENTS.md evaluation, Guardrails Beat Guidance)
   repoda ayrı bir “reading notes” dosyası değil.
6. **Cloud agent** ve **ACI** dersin ileri konuları; ürün deployment'ı bunları gerektirmiyor.

## Bu turda eklenen kapatma adımları

- `docs/PROGRESS.md`: Decided / Done / Next handoff artefaktı.
- `AGENTS.md`: belirsizlik, 3 başarısız deneme, çelişki ve geri alınamaz işlem için durma kuralı.
- `docs/CONTEXT.md`: context budget, context rot ve handoff referansı.
- Spec/katalog sayaçları 14 şehir / 140 deneyim ile hizalandı.

## Dürüst değerlendirme

- **Ürün mühendisliği pratikleri:** güçlü; SDD, human-in-the-loop, test/CI, skills, MCP,
  worktree ve critic akışı gerçekten kullanılıyor.
- **Dersin teorik/reading kavramları:** tamamı kod artefaktına dönüşmedi; bazıları sadece
  sınav/reading bilgisi. Özellikle context rot, ACI, SWE-agent ve AGENTS.md evidence
  konularında ayrı reading notes yok.
- **Sonuç:** “Her şeyi kodladım” demek yanlış olur; “ürün pratiğinde Week 1-5'in ana
  mühendislik konseptlerini büyük ölçüde uyguladım, teorik okumaların bir kısmını dokümante
  etmedim” doğru cevap.
