# Ekip, Roller ve Çalışma Düzeni

## Roller

GrepThink'teki resmi roller sabit. Teknik roller 14 Ekim 2026'da Scrum Master tarafından dağıtıldı.

| Kişi | GitHub | Resmi rol | Teknik rol | Sorumlu olduğu |
| :--- | :--- | :--- | :--- | :--- |
| Mehmet Emin Akkaya | `mehmeteminakkaya` | Scrum Master | **Backend + AI Lead** | `api/`, AI gezi planı üretimi, Places entegrasyonu, CI/deploy |
| Bayram Selim Yılmaz | `bsyilmaz` | Product Owner | **Frontend Lead** | `web/` mimarisi, sayfalar, harita arayüzü; backlog önceliği |
| Ezgi Turan | `Ezzgiturann` | Member | Designer (UI/UX) | Figma wireframe/mockup, renk-tipografi, bileşen tasarımı |
| Aykut Kayra Akkuş | `aykuttakkus` | Member | Database | Prisma şeması, migration'lar, seed/demo verisi |
| Berfin Aksoy | `berfinaksoyy` | Member | Frontend + Test | Formlar, Selim'le sayfalar, testler, demo senaryosu |

İkili çalışma (bus factor): AI/Backend → Mehmet + Aykut · Frontend → Selim + Berfin · Tasarım → Ezgi + Selim.
6. üye katılırsa Frontend'e eklenir.

**Bus factor:** Her alanda en az 2 kişi kodu bilsin. PR'ları başka alandan biri de incelesin.

## Scrum düzeni

- **Sprint süresi:** 2 hafta (takvim [ROADMAP.md](ROADMAP.md)'de)
- **Sprint Planning:** sprint başında, ~45 dk. PO öncelik verir, ekip story seçer.
- **Daily / async standup:** WhatsApp/Discord'da her gün 3 satır: *dün / bugün / engel*.
- **Sprint Review:** sprint sonunda çalışan demoyu göster (TA görüşmesine denk getirin).
- **Retro:** 15 dk. 1 iyi giden, 1 kötü giden, 1 aksiyon.
- **Board:** Tek gerçek kaynak **GrepThink Scrum Board**. Story'ler [BACKLOG.md](BACKLOG.md)'den kopyalanır.

### TSR (Team Status Report)

GrepThink TSR'ında: katkı yüzdesi dağılımı (toplam %100), takım geri bildirimi, Scrum Master bölümü.
- Katkı yüzdelerini **gerçek veriye** dayandırın: kapanan story / merge edilen PR / toplantıya katılım.
- Scrum Master her TSR öncesi board'dan sprint özetini çıkarır (tamamlanan, devreden, engeller).

## Git akışı

- `main` her zaman çalışır; **doğrudan push yok.** Repo private ve ücretsiz planda olduğu için GitHub
  bunu zorlayamıyor; kural ekip anlaşmasıyla geçerli. Yanlışlıkla push edilirse revert edip PR açın.
- Branch adı: `feat/<kısa-ad>`, `fix/<kısa-ad>`, `docs/<kısa-ad>`. Mümkünse story numarasıyla: `feat/W-12-trip-form`.
- Her iş **Pull Request** ile gelir; en az **1 onay** + CI (lint + test) yeşil olmalı.
- Commit mesajı: `feat: gezi formu eklendi`, `fix: ...`, `docs: ...` (Conventional Commits).
- PR küçük olsun (< ~400 satır). Büyük işi böl.

## Definition of Done

Bir story şu durumda "Done":
- [ ] Kabul kriterleri sağlanıyor
- [ ] PR incelendi ve `main`'e merge edildi
- [ ] Lint + testler geçiyor; yeni mantık için en az bir test var
- [ ] Staging/deploy ortamında çalışıyor
- [ ] Gerekiyorsa `docs/` güncellendi
- [ ] Gizli anahtar commit'lenmedi

## İletişim

- Teknik kararlar → [ARCHITECTURE.md](ARCHITECTURE.md) "Karar kaydı" tablosuna bir satır.
- Engel 24 saatten uzun sürerse Scrum Master'a yazın.
