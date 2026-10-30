---
title: Yapılanlar ve Kanıtlar
subtitle: Wayora ürün mühendisliği teslim özeti
doc_type: TESLİM ÖZETİ
version: 2.0
date: 30 Ekim 2026
---

# Yönetici Özeti

Wayora, kullanıcının ilgi alanlarına, bütçesine ve temposuna göre gün gün AI seyahat planı
üreten bir web uygulamasıdır. Bu belge, yapılan işleri **alan alan ve kanıtlarıyla** özetler.
Amaç yalnızca “ne yaptık?” sorusunu değil, “bunu neden yaptık ve çalıştığını nasıl biliyoruz?”
sorusunu da cevaplamaktır.

Canlı ürün: **https://wayora-ten.vercel.app**

## Tek Bakışta

| Başlık | Durum |
| :--- | :--- |
| Ürün | 14 şehir / 140 deneyim; AI plan; rota düzenleme; canlı keşif; Yol Arkadaşları |
| Canlı ortam | Vercel Production + Neon PostgreSQL |
| Test | 70 API + 6 web = **76 otomatik test** |
| Frontend audit | 390px mobil + 1280px masaüstü, **22/22 kontrol temiz** |
| Demo | 75 profil, 20 eşleşme, 3 istek, 2 sohbet |
| Güvenlik | JWT httpOnly cookie, bcrypt, zod, rate limit, CI güvenlik taramaları |
| Dokümantasyon | AGENTS, SDD spec/plan/tasks, skill’ler, MCP, ders izlenebilirliği |

# Ürün Akışı

1. Kullanıcı landing ekranında şehir seçer veya Keşfet’e gider.
2. 14 şehir ve 140 deneyim arasından ilgi alanına göre seçim yapar.
3. Tarih, bütçe ve tempo girerek rota oluşturur.
4. AI; katalog adaylarını, tercihleri ve bütçeyi kullanarak gün gün plan üretir.
5. Kullanıcı planı düzenler; durak ekler, siler veya sıralar.
6. Canlı etkinlikleri ve varsa uçuş fikirlerini görür.
7. Yol Arkadaşları ekranında aynı şehir/tarihteki gezginlerle güvenli biçimde eşleşir.
8. Profilinden tercihlerini yönetir; rotalarını yaklaşan/taslak/geçmiş olarak görür.

# Alan Alan Yapılanlar

| Alan | Ne yaptık? | Neden önemli? | Kanıt |
| :--- | :--- | :--- | :--- |
| Keşif ve katalog | 14 şehir, 140 deneyim; arama, kategori, sıralama, fiyat ve süre bilgisi | Kullanıcı boş bir metin kutusu yerine gerçek seçeneklerle başlıyor | `api/src/data/city-catalog.ts`, `web/src/pages/ExplorePage.tsx`, `docs/CITY_CATALOG.md` |
| AI plan | DeepSeek/Gemini/OpenAI adaptörleri; offline fallback; zod doğrulama; aday yer filtresi | Ana değer önerisi; sağlayıcı çökse bile ürün çalışmalı | `api/src/services/itinerary.ts`, `api/src/services/deepseek-search.ts`, testler |
| Rota yönetimi | Gün sekmeleri, timeline, durak ekleme/silme, sürükle-bırak sıralama, bütçe özeti | Planı “izlenecek” değil “düzenlenebilir” hale getiriyor | `web/src/pages/TripDetailPage.tsx`, `api/src/routes/trips.ts` |
| Canlı keşif | Ticketmaster etkinlikleri; Duffel test uçuş fikri; yapılandırma yoksa dürüst boş durum | Katalog dışındaki gerçek dünya sinyali | `web/src/components/LiveDiscovery.tsx`, `api/src/routes/discovery.ts` |
| Yol Arkadaşları | Profil, rota/tarih eşleşmesi, karşılıklı istek, sohbet, engelleme/bildirim, filtre, sayfalama | Ürünü tek kişilik planlayıcıdan güvenli sosyal keşfe taşıyor | `web/src/pages/HitchhikerPage.tsx`, `api/src/routes/social.ts`, `docs/specs/003-hitchhiker-match/spec.md` |
| Tasarım ve mobil | V2 krem/sarı dil; 390px öncelikli düzen; 44px hedefler; bottom sheet; iskelet/boş/hata durumları | Demo ve gerçek kullanımda ürünün “ucuz form” gibi görünmemesi | `web/src/index.css`, `web/src/social.css`, `docs/DESIGN_V2.md` |
| Erişilebilirlik | Etiketli formlar, klavye/odak, `aria-*`, alt metinler, reduced-motion, 44px hedefler | Ürünün daha geniş kitleye ulaşması | Frontend audit, `web/AGENTS.md`, `docs/DESIGN_SYSTEM.md` |
| Güvenlik | httpOnly cookie, bcrypt cost 12, CORS allowlist, helmet, rate limit, zod, sahiplik filtresi, prompt injection sınırı | Gerçek kullanıcı verisi ve LLM çağrıları için temel güvenlik | `api/src/middleware`, `docs/SECURITY.md`, `.github/workflows` |
| Test ve CI | 76 test; lint, typecheck, build, audit, CodeQL, Semgrep, gitleaks | “Çalışıyor gibi” değil, kanıtlı değişiklik | `.github/workflows`, test dosyaları |
| Deploy | Vercel Services + Neon; production migration; health kontrolü | Hocaya canlı link gösterilebilmesi | `vercel.json`, `api/app.mts`, live health |
| Dokümantasyon | SDD spec/plan/tasks, AGENTS, skill’ler, orchestration, MCP, ders izlenebilirliği | Ekip ve agent’ların aynı bağlamla çalışması | `AGENTS.md`, `docs/specs`, `.agents/skills`, `mcp/wayora-context` |

# Öne Çıkan Teknik Kararlar

- **Offline-first AI:** API anahtarı yoksa deterministik plan üreticisi devreye girer.
- **AI çıktısı güvenilmez:** zod şeması ve aday yer filtresi olmadan plan DB’ye yazılmaz.
- **Model routing:** plan için güçlü model, kısa içerik için hızlı model; timeout ve fallback.
- **Sahiplik:** tüm kullanıcı kaynakları `userId` ile filtrelenir; başkasının kaynağı 404.
- **Sosyal güvenlik:** yalnızca karşılıklı kabul sonrası mesaj; engelleme, bildirim, adres/telefon yasağı.
- **Spec-first:** davranış değişikliği önce spec/plan; sonra test; sonra kod.

# Kalite Kanıtları

| Kontrol | Sonuç |
| :--- | :--- |
| `npm run lint` | Geçti |
| `npm run typecheck` | Geçti |
| `npm test` | 70 API + 6 web |
| `npm run build` | Geçti |
| Frontend audit | 0 runtime, 0 network, 0 overflow, 0 kısa hedef |
| Canlı health | `{"status":"ok","db":"ok"}` |
| Demo eşleşme | 20 ilk sayfa / 48 uygun toplam |

# Demo ve Canlı Ortam

- Canlı URL: **https://wayora-ten.vercel.app**
- Demo hesabı: **demo@wayora.app / demo1234**
- Demo rota: **5–9 Aralık 2026, Berlin**
- Demo Yol Arkadaşları: **20 eşleşme**, 3 gelen istek, 1 giden istek, 2 kabul edilmiş sohbet.
- Local alternatif: `npm run demo:seed -w api`; demo hesabı aynıdır.

# Bilinçli Sınırlar

- Gerçek rezervasyon, ödeme, uçuş/otel satın alma yok.
- E-posta/telefon doğrulaması, 2FA ve moderasyon paneli yok.
- Ev sahipliği yalnızca niyet bilgisidir; adres veya konaklama sözleşmesi değildir.
- Google Places/Duffel gibi sağlayıcılar anahtar yoksa devre dışıdır; sahte veri üretilmez.
- 75 demo profili yalnızca demo amaçlıdır; production temizliği `demo:clear` ile yapılabilir.

# Sonraki Adımlar

1. Bildirim/e-posta ve gerçek zamanlı sohbet.
2. AI üretiminde adım adım ilerleme ve tahmini süre.
3. Gerçek kullanıcı doğrulaması ve moderasyon kuyruğu.
4. Mobil rota detayında kademeli özet.
5. Gerçek 20–30 kişilik kullanılabilirlik testi.

# Revizyon

| Sürüm | Tarih | Not |
| :--- | :--- | :--- |
| 1.0 | 23 Ekim 2026 | İlk MVP teslim özeti |
| 2.0 | 30 Ekim 2026 | Sosyal özellik, 14/140 katalog, canlı deploy, audit ve demo sonuçları eklendi |
