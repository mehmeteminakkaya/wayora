# Yol Haritası

> **Güncel durum (27 Kasım 2026):** Plan, dönemi 14 Ekim – 4 Ocak arası altı sprinte bölüyordu.
> Ürün planın önünde ilerledi: MVP (Sprint 3 hedefi) 23 Ekim'de uçtan uca çalıştı, Sprint 4–5
> kapsamının çoğu 30 Ekim'e kadar merge edildi. Yol Arkadaşları, V2 tasarım ve Wayora Agent da
> 30 Ekim'de eklendi; Kasım'da agent ve mobil cilalandı. Şu an takvimde **Sprint 3 (24 Kas – 7 Ara)** içindeyiz; bu sprintten
> itibaren her üye sprint başına iki görevi `docs/tasks/sprint-N/` altında spec-first yazar
> ([görev süreci](#sprint-görev-süreci-repo-metrics)).

## Gerçekleşen

| Sprint | Takvim | Gerçekte yapılan | Kanıt |
| :--- | :--- | :--- | :--- |
| Sprint 0 | 14 – 26 Eki | Roller, monorepo, CI (lint, test, Semgrep, gitleaks), yerel PostgreSQL | #1–#3, #18 |
| Sprint 1 | 27 Eki – 9 Kas | MVP uçtan uca (kayıt/giriş, tercihler, gezi CRUD, AI plan, bütçe) + Rotasyon tasarımı; Mapbox harita, 14 şehir / 140 deneyim kataloğu, sürükle-bırak sıralama, TR/EN temeli, Yol Arkadaşları, Wayora Agent (DeepSeek), Ticketmaster/Duffel keşif, frontend tutarlılık turu (Sprint 2–5 kapsamının çoğu bu sprintte öne çekildi) | #11, #25–#52, 30 Eki commit'leri |
| Sprint 2 | 10 – 23 Kas | Agent deneyimi cilası, mobil çakışmalar, kod bölme, agent guardrail'leri, harita fallback'i, yeni sohbet aksiyonu | #55, 15 Kas commit'leri |
| **Sprint 3** | **24 Kas – 7 Ara** | **Devam ediyor:** biten gezilerin Yol Arkadaşları eşleşmesinden çıkarılması (W-35), rotayı takvime (.ics) aktarma (W-36) | `docs/tasks/sprint-3/` |
| Sprint 4 | 8 – 21 Ara | Planlanan: bildirim/e-posta, AI üretiminde ilerleme ve tahmini süre, kullanılabilirlik testi | |
| Sprint 5 | 22 Ara – 4 Oca | Planlanan: kod dondurma, demo verisi, final raporu ve sunum | |

## Sprint görev süreci (Repo Metrics)

JOB-191 sprint notu [Repo Metrics](https://job191.yeterly.ai/) üzerinden verilir. Her üye her sprintte
**kendi iki görevini** teslim eder:

1. Görev dosyası `docs/tasks/sprint-N/<görev id>.md` (front matter + Description, Specs,
   Requirements, Acceptance criteria). Görev ID'si repoda bir kez kullanılır: `W-<story>-T-<n>`.
2. `task/<id>` branch'inde görev dosyası **tek başına ve ilk** commit; `git tag <id>-base` + push.
3. Uygulama ve her kabul kriteri için en az bir test (test adı görev ID'siyle başlar).
4. PR başlığı `<id>: <başlık>`; `docs/tasks/` altında yalnızca bu görevin dosyası değişir.
5. Merge commit'ine `git tag <id>-done` + push; PR linki Repo Metrics'te **Assignment N**'e eklenir.
6. Kart GrepThink Scrum Board'a eklenir. Canvas'a yalnızca Repo Metrics yazısı (bir paragraf) gider.

Ayrıntı: ders reposundaki `resources/cse115a-sprint-task-specifications.md`.

## İlk plan (14 Ekim)

| Faz | Sprint | Tarih | Çıktı |
| :--- | :--- | :--- | :--- |
| 0. Kurulum | Sprint 0 | 14 – 26 Eki | Roller, repo, tasarım taslağı, iskelet uygulama deploy |
| 1. Temel | Sprint 1 | 27 Eki – 9 Kas | Kayıt/giriş, tercihler, manuel gezi oluşturma |
| 2. Harita | Sprint 2 | 10 – 23 Kas | Mapbox GL, yer arama, aktiviteye yer ekleme + **AI spike** |
| 3. AI (MVP) | Sprint 3 | 24 Kas – 7 Ara | AI gezi planı üretimi uçtan uca → **MVP** |
| 4. Zenginleştirme | Sprint 4 | 8 – 21 Ara | Plan düzenleme, bütçe takibi, destinasyon önerisi |
| 5. Cilalama | Sprint 5 | 22 Ara – 4 Oca | Test, performans, erişilebilirlik, demo, rapor |

```
Eki        Kas              Ara              Oca
|S0 ───|S1 ─────|S2 ─────|S3 ─────|S4 ─────|S5 ─────|
 kurulum  temel    harita   AI=MVP   ekstra   final
                    +spike    ▲
                              └ MVP demo (7 Ara)
```

## Bu hafta (hemen)

> Sprint 0 kapanışı tamamlandı. Aşağıdaki maddelerden repo/CI/kurulum ile ilgili olanlar
> gerçekleşti; TSR ve GrepThink board girişleri ekip sürecinde takip edilir.

- [x] **TSR 1'i gönder** (katkı dağılımı + takım geri bildirimi): ekip süreci
- [x] Teknik roller dağıtıldı → [TEAM.md](TEAM.md)
- [x] GitHub reposu açıldı, `docs/` ve iskelet kod içinde
- [x] Ekip üyelerinin hepsi repoya davet edildi
- [x] Herkes `npm run setup` ile projeyi kendi bilgisayarında çalıştırabiliyor
- [x] GrepThink'te **Sprint 0** oluşturuldu, S0 story'leri girildi
- [x] LLM sağlayıcısı seçildi: **offline varsayılan**, Gemini/OpenAI opsiyonel
- [ ] Google Cloud projesi aç: Maps JavaScript API + Places API anahtarları: Sprint 4'e taşındı

---

## Sprint 0: Kurulum (14 – 26 Eki)

**Hedef:** Herkes bilgisayarında projeyi çalıştırabiliyor, "Hello Wayora" internette yayında.

- Roller, iletişim kanalı, toplantı saatleri
- Monorepo iskeleti: `web/` (Vite + React + TS), `api/` (Express + TS), ESLint/Prettier
- PostgreSQL (Neon/Supabase) + Prisma + ilk migration (`User`)
- GitHub Actions: lint + test
- İlk deploy: web + api + db, `/api/health` çalışıyor
- Designer: kullanıcı akışları + Figma'da 4 ana ekranın wireframe'i
  (Landing, Giriş/Kayıt, Gezi oluşturma formu, Gezi detayı/plan görünümü)

**Bitti sayılır:** Deploy linki açılıyor, README'deki adımlarla yeni biri 15 dk'da projeyi çalıştırıyor.

## Sprint 1: Temel (27 Eki – 9 Kas)

**Hedef:** Kullanıcı kayıt olup kendi gezisini elle oluşturabiliyor.

- Kayıt / giriş / çıkış (JWT, httpOnly cookie), korumalı sayfalar
- Tercih (onboarding) ekranı: ilgi alanları, bütçe seviyesi, tempo
- Gezi CRUD: oluştur (destinasyon, tarih, bütçe), listele, sil
- Gezi detay sayfası: günler + elle aktivite ekleme
- Tasarım sistemi: renkler, tipografi, temel bileşenler

## Sprint 2: Harita ve Yerler (10 – 23 Kas)

**Hedef:** Gezi planı harita üzerinde görünüyor, yerler aranabiliyor.

- Mapbox GL entegrasyonu; aktiviteler haritada pin olarak (token opsiyonel, yoksa OSM yedeği)
- Places proxy endpoint'i + `Place` önbellek tablosu
- Yer arama ve aktiviteye yer bağlama
- **AI spike (zaman kutusu: 3 gün):** prompt + JSON şeması + doğrulama ile tek bir şehir için
  plan üreten küçük bir script. Çıktı: çalışıyor mu, kaç saniye, istek başı maliyet ne?

## Sprint 3: AI Gezi Planı = MVP (24 Kas – 7 Ara)

> **Durum (23 Eki 2026): tamamlandı.** Offline üretici + Gemini/OpenAI adaptörleri, doğrulama,
> fallback ve UI uçtan uca çalışıyor. Demo: `npm run dev` → kayıt → Paris 3 gün → plan üret.

**Hedef:** Kullanıcı formu doldurup "Plan oluştur"a basınca gün gün plan alıyor. → **MVP**

- `POST /api/trips/:id/generate` (akış: [ARCHITECTURE.md](ARCHITECTURE.md#ai-gezi-planı-akışı))
- Halüsinasyon kontrolü (sadece aday yerler), zod doğrulama, tekrar deneme
- Yükleniyor / hata durumları, kullanıcı başına günlük limit
- Üretilen planın kaydedilmesi ve haritada gösterimi
- **MVP demo** (Sprint Review / TA görüşmesi)

## Sprint 4: Zenginleştirme (8 – 21 Ara)

**Hedef:** Plan gerçekten kullanılabilir ve kişisel.

- Aktiviteleri sürükle-bırak ile yeniden sırala, düzenle, sil
- "Bu günü yeniden üret" / "bu aktiviteyi değiştir" (kısmi AI üretimi)
- Bütçe takibi: tahmini toplam vs. bütçe, kategori dağılımı
- Tercihe göre destinasyon önerisi ("nereye gideyim?")
- (İsteğe bağlı) planı paylaşılabilir salt-okunur link olarak açmak

## Sprint 5: Cilalama ve Final (22 Ara – 4 Oca)

**Hedef:** Sunuma hazır, sağlam bir ürün.

- Test kapsamını artır (kritik akışlar: auth, gezi CRUD, generate)
- Mobil uyum, erişilebilirlik (kontrast, klavye), Lighthouse kontrolü
- Hata izleme ve günlük; boş durum / hata ekranları
- Demo verisi ve demo senaryosu, sunum slaytları, final raporu
- Kod dondurma: final teslimden **3 gün önce** yeni özellik yok

---

## MVP kapsamı (pazarlık dışı)

1. Kayıt / giriş
2. Tercihleri kaydetme
3. Gezi oluşturma (destinasyon, tarih, bütçe)
4. **AI ile gün gün plan üretme**
5. Planı harita üzerinde görme
6. Planı kaydetme ve tekrar açma

Gerisi (sürükle-bırak, bütçe grafikleri, paylaşma, destinasyon önerisi) MVP sonrası. Zaman daralırsa
önce bunlar kesilir.

## Riskler

| Risk | Etki | Önlem |
| :--- | :--- | :--- |
| LLM olmayan mekân uyduruyor | Yüksek | Aday yer listesi ver, ID'yi doğrula (Sprint 2 spike) |
| Google Maps/Places faturası | Orta | Bütçe uyarısı, `Place` önbelleği, anahtar kısıtlama |
| LLM yavaş / kota | Orta | Yükleniyor ekranı, günlük limit, ucuz model |
| Bir alan tek kişiye bağımlı | Orta | Eşli çalışma, çapraz PR incelemesi |
| Sınav haftaları | Orta | Sprint 4–5'i hafif planla, MVP'yi 7 Ara'da bitir |
| Kapsam kayması | Orta | MVP listesine sadık kal, yeni fikirleri backlog'a yaz |
