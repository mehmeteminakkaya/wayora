# Yol Haritası

> **Varsayım:** Dönem ~12 hafta sürüyor ve final teslimi Ocak 2027'nin ilk haftaları.
> GrepThink'te şu an tek tarih var: **TSR 1, 14 Ekim 2026, 23:59**. Final Review ve diğer TSR
> tarihleri açıklanınca aşağıdaki takvimi kaydırın.

## Özet

| Faz | Sprint | Tarih | Çıktı |
| :--- | :--- | :--- | :--- |
| 0. Kurulum | Sprint 0 | 14 – 26 Eki | Roller, repo, tasarım taslağı, iskelet uygulama deploy |
| 1. Temel | Sprint 1 | 27 Eki – 9 Kas | Kayıt/giriş, tercihler, manuel gezi oluşturma |
| 2. Harita | Sprint 2 | 10 – 23 Kas | Google Maps, yer arama, aktiviteye yer ekleme + **AI spike** |
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

- [ ] **TSR 1'i bugün 23:59'a kadar gönder** (katkı dağılımı + takım geri bildirimi)
- [x] Teknik roller dağıtıldı → [TEAM.md](TEAM.md)
- [x] GitHub reposu açıldı, `docs/` ve iskelet kod içinde
- [x] Ekip üyelerinin hepsi repoya davet edildi
- [ ] Herkes daveti kabul etsin, `npm run setup` ile projeyi kendi bilgisayarında çalıştırsın
- [ ] GrepThink'te **Sprint 0**'ı oluştur, [BACKLOG.md](BACKLOG.md)'deki S0 story'lerini gir
- [ ] LLM sağlayıcısını seç (ücretsiz kota + JSON çıktı desteği) — Mehmet, Sprint 2 spike'ından önce
- [ ] Google Cloud projesi aç: Maps JavaScript API + Places API anahtarları (bütçe uyarısı kur!) — Sprint 2'den önce

---

## Sprint 0 — Kurulum (14 – 26 Eki)

**Hedef:** Herkes bilgisayarında projeyi çalıştırabiliyor, "Hello Wayora" internette yayında.

- Roller, iletişim kanalı, toplantı saatleri
- Monorepo iskeleti: `web/` (Vite + React + TS), `api/` (Express + TS), ESLint/Prettier
- PostgreSQL (Neon/Supabase) + Prisma + ilk migration (`User`)
- GitHub Actions: lint + test
- İlk deploy: web + api + db, `/api/health` çalışıyor
- Designer: kullanıcı akışları + Figma'da 4 ana ekranın wireframe'i
  (Landing, Giriş/Kayıt, Gezi oluşturma formu, Gezi detayı/plan görünümü)

**Bitti sayılır:** Deploy linki açılıyor, README'deki adımlarla yeni biri 15 dk'da projeyi çalıştırıyor.

## Sprint 1 — Temel (27 Eki – 9 Kas)

**Hedef:** Kullanıcı kayıt olup kendi gezisini elle oluşturabiliyor.

- Kayıt / giriş / çıkış (JWT, httpOnly cookie), korumalı sayfalar
- Tercih (onboarding) ekranı: ilgi alanları, bütçe seviyesi, tempo
- Gezi CRUD: oluştur (destinasyon, tarih, bütçe), listele, sil
- Gezi detay sayfası: günler + elle aktivite ekleme
- Tasarım sistemi: renkler, tipografi, temel bileşenler

## Sprint 2 — Harita ve Yerler (10 – 23 Kas)

**Hedef:** Gezi planı harita üzerinde görünüyor, yerler aranabiliyor.

- Google Maps entegrasyonu; aktiviteler haritada pin olarak
- Places proxy endpoint'i + `Place` önbellek tablosu
- Yer arama ve aktiviteye yer bağlama
- **AI spike (zaman kutusu: 3 gün):** prompt + JSON şeması + doğrulama ile tek bir şehir için
  plan üreten küçük bir script. Çıktı: çalışıyor mu, kaç saniye, istek başı maliyet ne?

## Sprint 3 — AI Gezi Planı = MVP (24 Kas – 7 Ara)

**Hedef:** Kullanıcı formu doldurup "Plan oluştur"a basınca gün gün plan alıyor. → **MVP**

- `POST /api/trips/:id/generate` (akış: [ARCHITECTURE.md](ARCHITECTURE.md#ai-gezi-planı-akışı))
- Halüsinasyon kontrolü (sadece aday yerler), zod doğrulama, tekrar deneme
- Yükleniyor / hata durumları, kullanıcı başına günlük limit
- Üretilen planın kaydedilmesi ve haritada gösterimi
- **MVP demo** (Sprint Review / TA görüşmesi)

## Sprint 4 — Zenginleştirme (8 – 21 Ara)

**Hedef:** Plan gerçekten kullanılabilir ve kişisel.

- Aktiviteleri sürükle-bırak ile yeniden sırala, düzenle, sil
- "Bu günü yeniden üret" / "bu aktiviteyi değiştir" (kısmi AI üretimi)
- Bütçe takibi: tahmini toplam vs. bütçe, kategori dağılımı
- Tercihe göre destinasyon önerisi ("nereye gideyim?")
- (İsteğe bağlı) planı paylaşılabilir salt-okunur link olarak açmak

## Sprint 5 — Cilalama ve Final (22 Ara – 4 Oca)

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
