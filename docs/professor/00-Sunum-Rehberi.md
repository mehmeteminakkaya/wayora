---
title: Hocaya Sunum Rehberi
subtitle: Hangi belgeyi, hangi sırayla ve nasıl göstermeli?
doc_type: SUNUM REHBERİ
version: 1.0
date: 30 Ekim 2026
---

# 10 Dakikalık Sunum Akışı

## 0–2 dk · Ürünü göster

1. **https://wayora-ten.vercel.app** adresini aç.
2. `demo@wayora.app / demo1234` ile giriş yap.
3. Keşfet → Berlin → deneyim seç → rota oluştur akışını kısaca göster.
4. Yol Arkadaşları ekranında 20 eşleşmeyi, filtreleri ve “Daha fazla”yı göster.

**Söylenecek cümle:** “Ürün canlı; sadece ekran değil, gerçek API, veritabanı,
AI fallback, sosyal güvenlik ve test kanıtı var.”

## 2–4 dk · Yapılanlar belgesi

`docs/professor/01-Yapilanlar.pdf` dosyasını aç.

- Tek bakışta metrikleri göster: 14/140, 76 test, 22/22 audit, canlı health.
- Alan alan yapılanlar tablosundan üç satır seç: AI, sosyal, mobil.
- “Bilinçli sınırlar” bölümünü göster; gerçek rezervasyon/doğrulama olmadığını açıkça söyle.

## 4–6 dk · User Stories

`docs/professor/02-User-Stories.pdf` dosyasını aç.

- 23 story’nin özet tablosunu göster.
- US-20/21/22’yi aç: sosyal eşleşme, sohbet, güvenlik.
- US-12/13’ü aç: AI halüsinasyon filtresi ve fallback.
- “Definition of Done” bölümünü göster.

## 6–8 dk · Proje Yönetimi

`docs/professor/03-Proje-Yonetimi.pdf` dosyasını aç.

- Sprint tablosu ve RACI.
- AI-native çalışma modeli: spec-first, worktree, generator/critic, insan onayı.
- Risk tablosu ve canlı operasyon.
- Test/CI/deploy kanıtları.

## 8–10 dk · Ders Konseptleri

`docs/professor/04-Ders-Konseptleri.pdf` dosyasını aç.

- Week 1–5 özet matrisini göster.
- Güçlü kapsam: SDD, context, MCP, skills, guardrails.
- Dürüst boşluklar: reading özetleri, subagent config, event hook, context rot ölçümü.
- **“Tüm konseptleri kodladık” demeyin.** “Ana mühendislik pratiklerini uyguladık;
  teorik reading’lerin bir kısmını dokümante ettik, bir kısmı kapsam dışı” deyin.

## Ek · Mimari ve UI/UX

Sorular mimari veya tasarıma gelirse:

- `05-Architecture.pdf`: sistem bağlamı, AI akışı, veri modeli, deploy ve güvenlik.
- `06-UI-UX.pdf`: gerçek mobil ekranlar, V2 tokenları, interaction ve audit.

Bu iki dosya, ana 10 dakikalık akışın yerine değil, **derinleşme** için kullanılmalıdır.

# Dosya Seti

| Dosya | Ne için? |
| :--- | :--- |
| `01-Yapilanlar.pdf` | Genel teslim ve kanıt özeti |
| `02-User-Stories.pdf` | Ürün gereksinimleri ve kabul kriterleri |
| `03-Proje-Yonetimi.pdf` | Sprint, ekip, risk, kalite, deploy |
| `04-Ders-Konseptleri.pdf` | Week 1–5 izlenebilirliği ve dürüst boşluklar |
| `05-Architecture.pdf` | Sistem bağlamı, AI akışı, veri modeli ve deploy |
| `06-UI-UX.pdf` | V2 tasarım dili, gerçek ekranlar ve interaction kararları |

DOCX sürümleri aynı klasördedir; düzenleme gerekirse DOCX’i kullanın.

# Hocaya Gösterilecek Teknik Kanıtlar

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

- `docs/audit/apple-frontend-audit.json` → 22 kontrol, 0 sorun.
- `docs/audit/user-study-1000-2weeks.md` → 1000 persona / 14 gün simülasyonu.
- `docs/specs/001-mvp/spec.md` → SDD spec.
- `docs/specs/003-hitchhiker-match/spec.md` → sosyal özellik spec’i.
- `.agents/skills/` → feature/review/security skill’leri.
- `mcp/wayora-context/` → canlı bağlam MCP sunucusu.

# Demo Hesabı ve Rota

```text
E-posta: demo@wayora.app
Şifre:   demo1234
Rota:    5–9 Aralık 2026, Berlin
```

- 75 demo profili vardır.
- İlk sayfada 20 eşleşme, toplam 48 uygun eşleşme gösterilir.
- 3 gelen istek, 1 giden istek, 2 kabul edilmiş sohbet vardır.

# Olası Sorulara Kısa Cevaplar

**“Kaç test var?”**  
70 API + 6 web = 76 otomatik test; lint/typecheck/build ayrıca geçiyor.

**“AI olmadan çalışıyor mu?”**  
Evet. Offline üretici anahtarsız çalışır; sağlayıcı hatasında fallback devreye girer.

**“Sosyal özellik güvenli mi?”**  
Karşılıklı kabul, engelleme, bildirim ve adres/telefon yasağı var. Gerçek kimlik
doğrulaması ve moderasyon paneli yok; bunu sınır olarak belirtiyoruz.

**“Dersin tüm konseptlerini işlediniz mi?”**  
Hayır, tamamını değil. Ana mühendislik pratikleri uygulandı; bazı reading/teori
konuları ayrı dokümante edilmedi. `04-Ders-Konseptleri` bunu açıkça gösteriyor.

# Sunum Öncesi Kontrol

- [ ] Canlı health: `{"status":"ok","db":"ok"}`
- [ ] Demo girişi çalışıyor.
- [ ] `01` ve `04` PDF’leri açılıyor.
- [ ] Test komutu çıktısı hazır.
- [ ] “Bilinçli sınırlar” bölümü okundu.
