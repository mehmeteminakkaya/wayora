---
title: Proje Yönetimi Planı
subtitle: Kapsam, takvim, roller, kalite ve risk yönetimi
doc_type: PROJE YÖNETİMİ
version: 2.0
date: 30 Ekim 2026
---

# Belge Kontrolü

| Alan | Değer |
| :--- | :--- |
| Proje | Wayora · AI destekli seyahat planlama |
| Ders | JOB-191 · AI-Augmented Software Engineering |
| Dönem | Güz 2026 |
| Sürüm | 2.0 |
| Durum | Canlı ürün + demo hazır |
| Canlı URL | https://wayora-ten.vercel.app |
| Son güncelleme | 30 Ekim 2026 |

# 1. Yönetici Özeti

Wayora, kullanıcıların ilgi alanları, bütçesi ve temposuna göre gün gün seyahat planı üreten
bir web uygulamasıdır. Proje; ürün keşfi, yapay zekâ destekli planlama, canlı etkinlik keşfi ve
güvenli yol arkadaşı eşleşmesini tek bir deneyimde birleştirir.

Bu sürümde:

- 14 şehir ve 140 deneyimlik katalog canlıda.
- AI plan üretimi DeepSeek ile çalışıyor; sağlayıcı yoksa offline fallback var.
- Rotalar oluşturuluyor, düzenleniyor ve canlı etkinliklerle zenginleştiriliyor.
- Yol Arkadaşları; profil, eşleşme, karşılıklı istek ve güvenli sohbet sunuyor.
- 70 API + 6 web testi, lint/typecheck/build ve 22/22 frontend audit temiz.
- Ürün Vercel + Neon PostgreSQL üzerinde canlı.

# 2. Kapsam

## 2.1 Kapsam İçi

- Responsive React web uygulaması.
- Express REST API ve PostgreSQL veri modeli.
- AI plan üretimi; zod doğrulama; offline fallback.
- 14 şehir / 140 deneyim keşif kataloğu.
- Rota ve aktivite CRUD; sürükle-bırak sıralama.
- Ticketmaster canlı etkinlikleri; opsiyonel Duffel uçuş fikri.
- Yol Arkadaşları: eşleşme, istek, sohbet, engelleme, bildirim.
- Auth, güvenlik, test, CI ve deploy.
- Agent/SDD/MCP dokümantasyonu ve ders izlenebilirliği.

## 2.2 Kapsam Dışı

- Gerçek ödeme, rezervasyon, uçuş/otel satın alma.
- E-posta/telefon doğrulaması, 2FA, moderasyon paneli.
- Adres paylaşımı ve gerçek konaklama sözleşmesi.
- Mobil native uygulama ve çoklu kullanıcı işbirliği.

# 3. Hedefler ve Başarı Metrikleri

| Hedef | Metrik | Sonuç |
| :--- | :--- | :--- |
| Hızlı plan üretimi | Offline < 1 sn; LLM timeout 20 sn | Sağlandı |
| Güvenilir AI | Fallback + şema doğrulama | 76 test; fallback testleri var |
| Keşfedilebilir katalog | 14 şehir / 140 deneyim | Canlıda doğrulandı |
| Mobil kullanılabilirlik | 390px, taşma yok, 44px hedef | 22/22 audit temiz |
| Güvenli sosyal akış | Karşılıklı kabul, engelleme, bildirim | Tamamlandı |
| Canlı teslim | Health `ok`, web 200 | Sağlandı |
| Kalite kapısı | Lint + typecheck + test + build | Geçti |

# 4. Ekip ve Sorumluluklar

| Kişi | Resmi rol | Teknik rol | Ana sorumluluk |
| :--- | :--- | :--- | :--- |
| Bayram Selim Yılmaz | Product Owner | Frontend Lead | Ürün önceliği, web mimarisi, tasarım kalitesi |
| Mehmet Emin Akkaya | Scrum Master | Backend + AI Lead | API, LLM gateway, CI/deploy |
| Ezgi Turan | Member | Designer | Tasarım sistemi, erişilebilirlik, UI critic |
| Aykut Kayra Akkuş | Member | Database | Prisma şeması, migration, seed |
| Berfin Aksoy | Member | Frontend + Test | Formlar, testler, demo senaryosu |

## RACI

| Alan | Responsible | Accountable | Consulted | Informed |
| :--- | :--- | :--- | :--- | :--- |
| Ürün kapsamı | Selim | Selim | Ekip | Hoca |
| API/AI | Mehmet | Mehmet | Aykut | Ekip |
| Veri modeli | Aykut | Mehmet | Selim | Ekip |
| UI/UX | Ezgi + Berfin | Selim | Ekip | Hoca |
| Test/demo | Berfin | Selim | Mehmet | Ekip |
| Deploy | Mehmet | Mehmet | Selim | Ekip |

**Bus factor:** Her alanda en az iki kişi bilgi sahibi; PR’lar çapraz review edilir.

# 5. Teslim Modeli

## 5.1 Sprint Planı

| Sprint | Tarih | Hedef | Durum |
| :--- | :--- | :--- | :--- |
| S0 | 14–26 Eki | Repo, CI, health, Prisma, ilk deploy | Tamam |
| S1 | 27 Eki–9 Kas | Auth, tercihler, rota CRUD, tasarım sistemi | Tamam |
| S2 | 10–23 Kas | Katalog, keşif, Place cache, AI spike | Tamam |
| S3 | 24 Kas–7 Ara | AI plan üretimi, doğrulama, fallback, UI | Tamam |
| S4 | 8–21 Ara | Aktivite düzenleme, bütçe, canlı keşif | Tamam |
| S5 | 22 Ara–4 Oca | Test, erişilebilirlik, güvenlik, deploy, demo | Tamam |

> Not: Takvim, dönem planındaki sprint tarihlerini temsil eder. Ürün bu teslimde
> planlanan MVP kapsamını ve ek sosyal özelliği çalışır halde sunar.

## 5.2 AI-Native Çalışma Modeli

1. **Spec-first:** davranış önce `spec.md` + kabul kriteri.
2. **İzolasyon:** her paralel iş kendi worktree/branch’inde.
3. **Generator:** test-first küçük uygulama.
4. **Critic:** ayrı oturumda diff + spec incelemesi; `ACCEPT` / `REVISE`.
5. **İnsan checkpoint:** spec, plan, kod ve deploy onayı.
6. **Guardrail:** lint, typecheck, test, build, audit, CodeQL, Semgrep, gitleaks.
7. **Handoff:** oturum sonunda `docs/PROGRESS.md` içinde Decided / Done / Next.

# 6. Kalite Yönetimi

| Katman | Araç | Kapsam |
| :--- | :--- | :--- |
| API | Vitest + Supertest | Auth, tercih, rota, sahiplik, hata |
| Servis | Vitest + fetch stub | AI, fallback, filtre, sosyal skor |
| Web | Testing Library | Landing, login, korumalı rota, eşleşme |
| Statik | oxlint, tsc | Kod ve tip |
| Build | Vite, tsc | Üretim derlemesi |
| Güvenlik | npm audit, gitleaks, CodeQL, Semgrep | Bağımlılık ve sır taraması |
| UI audit | CDP + responsive | 390/1280, runtime/network/overflow/44px |
| Deploy | Health + smoke | DB, web, API |

**Sonuç:** 70 API + 6 web testi; 22/22 frontend kontrolü temiz.

# 7. Risk Yönetimi

| Risk | Olasılık | Etki | Önlem | Sahip |
| :--- | :--- | :--- | :--- | :--- |
| LLM halüsinasyonu | Orta | Yüksek | Aday listesi, zod, offline fallback | Mehmet |
| AI maliyeti/kotası | Orta | Orta | Günlük limit, timeout, model routing | Mehmet |
| Prompt injection | Orta | Yüksek | `<untrusted_user_notes>`, şema, çıktıyı veri sayma | Mehmet |
| Katalog verisi eksik | Orta | Orta | Idempotent seed, meta count kontrolü | Aykut |
| Sosyal güvenlik/moderation | Yüksek | Yüksek | Karşılıklı kabul, engelleme, bildirim; gerçek doğrulama sonraki faz | Selim |
| Mobilde taşma | Orta | Orta | 390px audit, 44px hedef | Berfin |
| Deploy ortamı farkı | Orta | Yüksek | Vercel build + Neon migration + health | Mehmet |
| Kapsam kayması | Orta | Orta | Spec out-of-scope, küçük PR | Selim |
| Bus factor | Orta | Orta | Eşli çalışma, çapraz review | Tüm ekip |

# 8. Değişiklik ve Karar Yönetimi

- Her davranış değişikliği önce spec/plan; yeni kapsam ayrı spec.
- Küçük PR (< ~400 satır), Conventional Commits.
- Mimari kararlar `docs/ARCHITECTURE.md` ve spec planına yazılır.
- Kritik kararlar: httpOnly cookie, offline-first AI, DeepSeek routing, Vercel Services, güvenli sosyal akış.
- `main` her zaman çalışır; merge öncesi test/build kanıtı zorunlu.

# 9. İletişim ve Ritüeller

- Günlük async standup: dün / bugün / engel.
- Sprint planning, review ve retro.
- PR açıklaması: problem, yaklaşım, test kanıtı, risk.
- Demo öncesi health + kritik akış smoke testi.
- Hocaya sunum için `00-Sunum-Rehberi` dosyası.

# 10. Canlı Operasyon

| Bileşen | Durum |
| :--- | :--- |
| Vercel web service | READY |
| Vercel API service | READY |
| Neon PostgreSQL | Bağlı, migration uygulanmış |
| `/api/health` | `{"status":"ok","db":"ok"}` |
| Katalog | 14 şehir / 140 deneyim |
| Demo | 75 profil / 20 ilk sayfa eşleşme |

Deploy notu: `.vercelignore` ile local `dist` ve `.env` dosyaları yüklenmez; API entrypoint
`api/app.mts`, build komutu `npm run db:generate`.

# 11. Bilinen Sınırlar

- Gerçek rezervasyon/ödeme yok.
- E-posta doğrulama, şifre sıfırlama ve 2FA yok.
- Moderasyon paneli ve rapor SLA’sı yok.
- Rate limit bellek içi; çok instance’lı dağıtımda Redis gerekir.
- Demo profilleri production’da açık onayla seed edilir; sunum sonrası temizlenebilir.

# 12. Sonraki Faz

1. Bildirim/e-posta ve gerçek zamanlı sohbet.
2. AI üretiminde adım adım ilerleme.
3. Kimlik doğrulama + moderasyon kuyruğu.
4. Mobil rota detayında kademeli özet.
5. Gerçek kullanılabilirlik testi (20–30 kişi).

# Ek: Komutlar

```bash
npm run setup
npm run dev
npm run lint
npm run typecheck
npm test
npm run build
npm run demo:seed -w api
npm run demo:clear -w api
```

# Revizyon

| Sürüm | Tarih | Not |
| :--- | :--- | :--- |
| 1.0 | 23 Ekim 2026 | İlk proje yönetimi planı |
| 2.0 | 30 Ekim 2026 | Canlı deploy, sosyal özellik, 14/140 katalog, audit ve risk güncellemesi |
