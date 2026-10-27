# Agent Artefaktları

Bu klasör, Wayora'da çalışan coding agent'ların **tekrar kullanılabilir iş akışlarını** içerir.
Amaç: her oturumda aynı talimatları yeniden yazmak yerine, kanıtlanmış bir prosedürü çağırmak.

```
.agents/
├── skills/
│   ├── wayora-feature/     # plan → test → uygula → doğrula
│   ├── wayora-review/      # bağımsız critic; ACCEPT / REVISE
│   └── wayora-security/    # SAST, secret, prompt injection kontrolü
└── README.md
```

## Araç eşlemesi

| Araç | Bu artefaktı nasıl bulur? |
| :--- | :--- |
| OpenCode / Claude Code / Codex | Kök `AGENTS.md` + `skills/*/SKILL.md` (Agent Skills standardı) |
| Antigravity | Agent Manager'da skill/command olarak içe aktar; `AGENTS.md` otomatik bağlam |
| Gemini CLI | `GEMINI.md` yerine `AGENTS.md`'yi işaret et; skill'i manuel prompt olarak çağır |
| Cursor / Copilot | `.github/copilot-instructions.md` veya proje kurallarına `AGENTS.md`'yi bağla |

## Kullanım

- Yeni özellik: **wayora-feature**
- PR öncesi bağımsız kontrol: **wayora-review**
- Güvenlik/LLM değişikliği: **wayora-security**

Skill'ler kısa tutulur; ayrıntılı ürün kuralları `AGENTS.md` ve `docs/specs/` içindedir.
