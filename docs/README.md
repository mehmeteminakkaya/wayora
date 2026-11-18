# Wayora Dokümanları

Belgeler konuya göre klasörlenmiştir. Yeni belge eklerken aşağıdaki tabloya da ekle.

| Klasör | Ne var? | Başlangıç noktası |
| :--- | :--- | :--- |
| [`product/`](product/) | Kapsam, yol haritası, backlog, ekip, şehir kataloğu, fotoğraf lisansları | [`PROJECT_OVERVIEW.md`](product/PROJECT_OVERVIEW.md) |
| [`engineering/`](engineering/) | Mimari, API, frontend, kurulum/deploy, test, güvenlik, tasarım sistemi | [`ARCHITECTURE.md`](engineering/ARCHITECTURE.md) |
| [`agentic/`](agentic/) | Bağlam yönetimi, orkestrasyon, AI review, software factory, AI-native ekip, oturum handoff | [`PROGRESS.md`](agentic/PROGRESS.md) |
| [`specs/`](specs/) | Spec-driven development: constitution, spec, plan, tasks | [`001-mvp/spec.md`](specs/001-mvp/spec.md) |
| [`course/`](course/) | Ders kavramı izlenebilirliği ve teslim listesi | [`COURSE_TRACEABILITY.md`](course/COURSE_TRACEABILITY.md) |
| [`audit/`](audit/) | Denetim raporu, düzeltme kaydı, `reports/` (JSON/HTML), `screenshots/` | [`AUDIT_REPORT.md`](audit/AUDIT_REPORT.md) |
| [`deliverables/`](deliverables/) | Hoca teslimi (`professor/`), raporlar (`reports/`), sunumlar (`slides/`) | [`../course/TESLIMLER.md`](course/TESLIMLER.md) |
| [`assets/`](assets/) | README ve belgelerde kullanılan görseller | — |

## Belge listesi

**product/** · [`PROJECT_OVERVIEW`](product/PROJECT_OVERVIEW.md) · [`ROADMAP`](product/ROADMAP.md) ·
[`BACKLOG`](product/BACKLOG.md) · [`TEAM`](product/TEAM.md) · [`CITY_CATALOG`](product/CITY_CATALOG.md) ·
[`PHOTO_CREDITS`](product/PHOTO_CREDITS.md)

**engineering/** · [`ARCHITECTURE`](engineering/ARCHITECTURE.md) · [`API`](engineering/API.md) ·
[`FRONTEND`](engineering/FRONTEND.md) · [`SETUP`](engineering/SETUP.md) · [`TESTING`](engineering/TESTING.md) ·
[`SECURITY`](engineering/SECURITY.md) · [`DESIGN_SYSTEM`](engineering/DESIGN_SYSTEM.md) ·
[`DESIGN_V2`](engineering/DESIGN_V2.md)

**agentic/** · [`CONTEXT`](agentic/CONTEXT.md) · [`ORCHESTRATION`](agentic/ORCHESTRATION.md) ·
[`AI_REVIEW`](agentic/AI_REVIEW.md) · [`SOFTWARE_FACTORY`](agentic/SOFTWARE_FACTORY.md) ·
[`AI_NATIVE_TEAM`](agentic/AI_NATIVE_TEAM.md) · [`MASTER_AUDIT_PROMPT`](agentic/MASTER_AUDIT_PROMPT.md) ·
[`PROGRESS`](agentic/PROGRESS.md)

**specs/** · [`001-mvp`](specs/001-mvp/) · [`002-live-discovery`](specs/002-live-discovery/) ·
[`003-hitchhiker-match`](specs/003-hitchhiker-match/)

## Kurallar

- Markdown belgeler kaynak gerçektir; `deliverables/` altındaki docx/pdf/pptx dosyaları
  `scripts/docs/` üreticileriyle bunlardan türetilir ve teslim tarihindeki durumu yansıtır.
- Ekran görüntüleri `audit/screenshots/`, makine çıktısı raporlar `audit/reports/` altına yazılır.
- Agent'ların her oturumda okuduğu kurallar burada değil, kök ve alan `AGENTS.md` dosyalarındadır.
