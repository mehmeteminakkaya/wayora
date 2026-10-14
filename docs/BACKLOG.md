# Product Backlog

GrepThink Scrum Board'a girilecek story'ler. Board'a girerken numarayı (`W-xx`) başlığa yazın ki
branch/PR adlarıyla eşleşsin. Puanlar Fibonacci (1, 2, 3, 5, 8). Sahibi Product Owner (Bayram);
öncelik sırası değişebilir.

Etiketler: `FE` frontend · `BE` backend · `DB` veritabanı · `UX` tasarım · `AI` · `OPS` altyapı

## Epic'ler

| Epic | Açıklama |
| :--- | :--- |
| E1 Kurulum | Repo, CI, deploy, iskelet |
| E2 Hesap | Kayıt, giriş, profil, tercihler |
| E3 Gezi | Gezi oluşturma ve yönetme |
| E4 Harita | Google Maps, yer arama |
| E5 AI | Gezi planı üretimi, öneriler |
| E6 Bütçe | Maliyet tahmini ve takibi |
| E7 Kalite | Test, performans, erişilebilirlik, demo |

---

## Sprint 0 — Kurulum

| No | Story | Etiket | Puan |
| :--- | :--- | :--- | :--- |
| W-01 | Geliştirici olarak tek komutla `web/` ve `api/`'yi çalıştırmak istiyorum | OPS | 3 |
| W-02 | Geliştirici olarak her PR'da lint + test otomatik çalışsın istiyorum | OPS | 2 |
| W-03 | Ekip olarak PostgreSQL + Prisma kurulu ve ilk migration'ı yapılmış olsun istiyoruz | DB | 3 |
| W-04 | Ekip olarak web + api + db'nin internette yayında olmasını istiyoruz (`/api/health`) | OPS | 3 |
| W-05 | Ekip olarak 4 ana ekranın wireframe'ini ve kullanıcı akışını görmek istiyoruz | UX | 5 |

**W-04 kabul kriterleri:** deploy linki açılıyor · `/api/health` → `{ "status": "ok", "db": "ok" }` ·
anahtarlar repoda değil, platformun env ayarında.

## Sprint 1 — Temel

| No | Story | Etiket | Puan |
| :--- | :--- | :--- | :--- |
| W-10 | Ziyaretçi olarak e-posta ve şifreyle kayıt olmak istiyorum | BE FE | 5 |
| W-11 | Kullanıcı olarak giriş/çıkış yapmak ve oturumumun açık kalmasını istiyorum | BE FE | 3 |
| W-12 | Kullanıcı olarak ilgi alanlarımı, bütçe seviyemi ve tempomu kaydetmek istiyorum | BE FE DB | 5 |
| W-13 | Kullanıcı olarak destinasyon, tarih ve bütçe girerek gezi oluşturmak istiyorum | BE FE DB | 5 |
| W-14 | Kullanıcı olarak gezilerimi listelemek ve silmek istiyorum | BE FE | 3 |
| W-15 | Kullanıcı olarak gezi detayında günleri görüp elle aktivite eklemek istiyorum | BE FE | 5 |
| W-16 | Ekip olarak ortak renk, yazı tipi ve temel bileşenleri kullanmak istiyoruz | UX FE | 3 |

**W-10 kabul kriterleri:** geçersiz e-posta / kısa şifre için Türkçe hata mesajı · aynı e-posta iki kez
kaydolamaz · şifre bcrypt ile saklanır · başarılı kayıtta tercih ekranına yönlendirilir.

**W-13 kabul kriterleri:** bitiş tarihi başlangıçtan önce olamaz · gün sayısı kadar `TripDay` oluşur ·
kullanıcı sadece kendi gezilerini görür (başkasının id'si → 404).

## Sprint 2 — Harita ve Yerler

| No | Story | Etiket | Puan |
| :--- | :--- | :--- | :--- |
| W-20 | Kullanıcı olarak gezimin aktivitelerini haritada pin olarak görmek istiyorum | FE | 5 |
| W-21 | Kullanıcı olarak bir şehirde yer (müze, restoran…) aramak istiyorum | BE FE | 5 |
| W-22 | Kullanıcı olarak aradığım yeri bir aktiviteye bağlamak istiyorum | BE FE | 3 |
| W-23 | Sistem olarak Places sonuçlarını önbelleğe almak istiyorum (kota/maliyet) | BE DB | 3 |
| W-24 | **Spike:** LLM ile tek şehir için JSON plan üretimini dene, süre ve maliyeti ölç | AI | 3 |

**W-24 çıktısı:** kısa bir not (`docs/spikes/ai-itinerary.md`): kullanılan model, prompt, örnek çıktı,
ortalama süre, istek başı maliyet, uydurma mekân oranı.

## Sprint 3 — AI Gezi Planı (MVP)

| No | Story | Etiket | Puan |
| :--- | :--- | :--- | :--- |
| W-30 | Kullanıcı olarak "Plan oluştur"a basınca gün gün gezi planı almak istiyorum | AI BE | 8 |
| W-31 | Sistem olarak LLM çıktısını doğrulayıp uydurma mekânları elemek istiyorum | AI BE | 5 |
| W-32 | Kullanıcı olarak plan üretilirken ilerleme ve hata durumunu görmek istiyorum | FE | 3 |
| W-33 | Kullanıcı olarak üretilen planı kaydedip sonra açmak istiyorum | BE FE | 3 |
| W-34 | Sistem olarak kullanıcı başına günlük üretim limitini uygulamak istiyorum | BE | 2 |

**W-30 kabul kriterleri:** plan, gezi gün sayısı kadar gün içerir · her aktivitenin saati ve tahmini
maliyeti var · tercihlerdeki ilgi alanları plana yansıyor · 60 sn içinde sonuç ya da anlaşılır hata.

## Sprint 4 — Zenginleştirme

| No | Story | Etiket | Puan |
| :--- | :--- | :--- | :--- |
| W-40 | Kullanıcı olarak aktiviteleri sürükle-bırak ile yeniden sıralamak istiyorum | FE BE | 5 |
| W-41 | Kullanıcı olarak tek bir günü ya da aktiviteyi AI ile yeniden ürettirmek istiyorum | AI BE FE | 5 |
| W-42 | Kullanıcı olarak tahmini toplam maliyeti bütçemle karşılaştırmak istiyorum | BE FE | 3 |
| W-43 | Kullanıcı olarak tercihlerime göre destinasyon önerisi almak istiyorum | AI BE FE | 5 |
| W-44 | (İsteğe bağlı) Kullanıcı olarak planımı salt-okunur bir linkle paylaşmak istiyorum | BE FE | 3 |

## Sprint 5 — Kalite ve Final

| No | Story | Etiket | Puan |
| :--- | :--- | :--- | :--- |
| W-50 | Ekip olarak auth, gezi ve generate akışları için otomatik testler istiyoruz | BE FE | 5 |
| W-51 | Kullanıcı olarak siteyi telefonda rahatça kullanmak istiyorum | FE UX | 3 |
| W-52 | Kullanıcı olarak boş durum ve hata ekranlarında ne yapacağımı bilmek istiyorum | FE UX | 2 |
| W-53 | Ekip olarak Lighthouse performans/erişilebilirlik skorlarını iyileştirmek istiyoruz | FE | 3 |
| W-54 | Ekip olarak demo verisi, demo senaryosu, sunum ve final raporu hazırlamak istiyoruz | ALL | 5 |

---

## Buzdolabı (sonraya / belki)

- Google ile giriş
- Çoklu kişiyle ortak gezi planlama
- Hava durumu entegrasyonu
- Uçuş / otel önerisi
- PDF / takvim (.ics) dışa aktarma
- Sohbet tarzı AI asistan ("2. günü daha sakin yap")
