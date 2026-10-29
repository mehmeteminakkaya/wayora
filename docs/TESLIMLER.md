# Wayora Teslim Dosyaları

Bu klasör, JOB-191 dönem projesi için hazırlanan doküman ve sunum paketini içerir.
Tüm dosyalar Türkçedir ve projedeki gerçek kod, test ve sprint durumuyla hizalıdır.

## Teslim paketi

| Dosya | Tür | İçerik |
| :--- | :--- | :--- |
| [Wayora-Proje-Raporu.docx](Wayora-Proje-Raporu.docx) | Word | Detaylı proje raporu: problem, kapsam, ekip, mimari, veri modeli, API, AI, tasarım, güvenlik, test, sonuç |
| [Wayora-Proje-Yonetimi.docx](Wayora-Proje-Yonetimi.docx) | Word | Proje yönetimi planı: hedefler, RACI, WBS, sprint takvimi, kaynak, kalite, risk, iletişim, KPI, kapanış |
| [Wayora-User-Stories.docx](Wayora-User-Stories.docx) | Word | 20 user story, kabul kriterleri, öncelik, puan, sprint, durum ve test kanıtları |
| [Wayora-Sunum.pptx](Wayora-Sunum.pptx) | PowerPoint | 14 slaytlık 16:9 sunum; ürün, mimari, AI, güvenlik, kalite, demo ve yol haritası |
| [Wayora-V2-Full-Frontend-Raporu.pdf](Wayora-V2-Full-Frontend-Raporu.pdf) | PDF | V2 full frontend raporu: tüm ekranlar, tasarım sistemi, routing, state, erişilebilirlik ve testler |
| [preview-rotasyon.png](preview-rotasyon.png) | Görsel | Masaüstü tasarım önizlemesi |
| [preview-rotasyon-se.png](preview-rotasyon-se.png) | Görsel | 375x667 mobil uygulama önizlemesi |
| [preview-rotasyon-mobile.png](preview-rotasyon-mobile.png) | Görsel | Mobil tam sayfa |
| [assets/](assets/) | Klasör | Word ve sunum içinde kullanılan ekran görüntüleri |
| [CITY_CATALOG.md](CITY_CATALOG.md) | Markdown | 10 şehir / 100 deneyim kataloğu, fiyat yaklaşımı, seed ve API |
| [DESIGN_V2.md](DESIGN_V2.md) | Markdown | Wayora V2 mobil tasarım sistemi ve sayfa kuralları |
| [PHOTO_CREDITS.md](PHOTO_CREDITS.md) | Markdown | V2 şehir ve kategori fotoğraflarının lisans/atıf kayıtları |
| [audit/AUDIT_REPORT.md](audit/AUDIT_REPORT.md) | Markdown | 1000 kişilik denetim raporu ve düzeltmeler |
| [audit/FIX_LOG.md](audit/FIX_LOG.md) | Markdown | Uygulanan düzeltmelerin kaydı |
| [MASTER_AUDIT_PROMPT.md](MASTER_AUDIT_PROMPT.md) | Markdown | Tekrarlanabilir 1000 uzmanlı denetim promptu |

## Sunum akışı

1. Kapak ve ekip
2. Problem
3. Çözüm: gün gün plan
4. Landing / ürün
5. Mobil uygulama
6. Kullanıcı yolculuğu
7. Mimari
8. AI plan üretimi
9. Güvenlik
10. AI-augmented mühendislik
11. Proje yönetimi ve sprintler
12. Test ve kalite
13. 5 dakikalık demo
14. Yol haritası ve kapanış

Sunumun her slaytında konuşmacı notu vardır. PowerPoint’te **Görünüm > Not Sayfası** ile
okunabilir. Sunumun tamamı 16:9 (13.333 x 7.5 inç) olarak hazırlanmıştır.

## Kısa demo senaryosu

1. `npm run dev` ile uygulamayı aç.
2. Kayıt ol veya `e2e-1792740709@example.com / parola123` ile gir.
3. Tercihleri seç: Müze + Yemek, orta bütçe, orta tempo.
4. Keşfet ekranında Berlin rehberini aç; kategori ve fiyat filtrelerini göster.
5. "Bu şehirle rota oluştur" ile Berlin ön dolu yeni rota ekranına geç.
6. Paris için 3 günlük, 500 € bütçeli gezi oluştur.
7. “Planı hazırla” ile AI planını üret.
8. Bir güne aktivite ekle, bir aktiviteyi sil.
9. Kalan bütçe, günlük maliyet ve pratik notları göster.
10. `npm test` ve CI/agent artefaktlarını göster.

## Doğrulama durumu

- 51 API testi
- 4 web testi
- lint, typecheck ve build temiz
- `npm audit --omit=dev`: 0 vulnerability
- AI anahtarı olmadan offline demo çalışır

## Bilinen açıklar

Bu paket, mevcut MVP’yi anlatır. Aşağıdaki başlıklar bilinçli olarak sonraki tura bırakılmıştır:

- Gerçek Google Places / Maps entegrasyonu ve harita pinleri
- Canlı scrape ve gerçek rezervasyon fiyatı; katalog şu an sürümlenmiş ve DB'de seed edilmiş veridir
- Yer arama API'sinin web arayüzüne bağlanması (API hazır, ekran yok)
- Aktivite ve gezi başlığı/bütçesi için düzenleme ekranı (PATCH API hazır)
- Sürükle-bırak aktivite sıralama
- Kısmi gün / aktivite yeniden üretimi
- Paylaşılabilir salt-okunur plan linki
- PWA / çevrimdışı kabuk, bildirimler ve e-posta doğrulama
- Bulut deploy ve demo verisi

> Not: Hocanın ders materyali reposuna hiçbir commit veya PR gönderilmedi. Bu paket yalnızca
> Wayora projesine aittir.
