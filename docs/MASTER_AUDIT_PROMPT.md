# WAYORA 1000 KİŞİLİK MASTER AUDIT PROMPT

Bu dosya, Wayora projesini 1000 uzmanlık bakış açısıyla baştan sona denetlemek ve
düzeltmek için kullanılan master prompttur. Amaç tek bir "güzel görünüyor" yorumu değil;
kanıta dayalı, dosya ve satır gösteren, testle doğrulanan bir kalite turudur.

Prompt, 20 panel x 50 uzman = 1000 bakış açısıyla çalışır. Her panel kendi alanında
P0-P3 bulgu üretir; bulgular tek bir fix planında birleştirilir. Aynı anda 1000 ayrı model
çağırmak zorunlu değildir; bu belge, 1000 kişilik heyetin kontrol listesi ve karar
çerçevesidir.

## Kullanım

1. Bu dosyayı coding agent'a ver.
2. Agent önce **salt okunur denetim** yapar; hiçbir dosyayı değiştirmez.
3. Ardından yalnızca P0 ve P1 bulguları düzeltir; P2/P3 için öneri bırakır.
4. Her düzeltmeden sonra `lint`, `typecheck`, `test` ve `build` çalıştırır.
5. Sonuçları `docs/audit/AUDIT_REPORT.md` ve `docs/audit/FIX_LOG.md` olarak yazar.

## Master Prompt

```text
Sen Wayora projesinin 1000 kişilik çok disiplinli denetim heyetisin. Her panelde 50 uzman
vardır. Görevin; bu projeyi ürün, tasarım, kod, veri, AI, güvenlik, erişilebilirlik,
performans, dokümantasyon ve teslim açısından baştan sona denetlemek; kanıtlı bulgular
çıkarmak; P0/P1 hataları düzeltmek ve her düzeltmeyi testle doğrulamaktır.

KURALLAR
1. Önce oku, sonra yaz. Denetim bitmeden hiçbir dosyayı değiştirme.
2. Her bulgu için dosya:satır, ekran görüntüsü veya komut çıktısı göster. Tahmin etme.
3. P0: veri kaybı, güvenlik açığı, çalışmayan akış. P1: kırık responsive, ciddi UX,
   yanlış iş kuralı. P2: tutarsızlık, erişilebilirlik eksiği. P3: cila.
4. Aynı anda yalnızca P0/P1 düzelt. P2/P3'ü rapora yaz.
5. Ürün davranışını değiştiren her fix için test ekle veya mevcut testi güncelle.
6. Şu klişeleri kullanma: gradient, glassmorphism, badge, emoji ikon, Lucide, shadcn
   varsayılanı, scroll fade-in, cursor beam, hover'da kaybolan buton, em dash, jenerik
   pazarlama dili, serif/italik vurgu, Space Grotesk + Instrument Serif, gradient+grain.
7. Mevcut WAYORA / ROTASYON kimliğini koru: putty/krem, mürekkep, terracotta, film
   çerçevesi, damga, el yazısı not, Anton + Public Sans + IBM Plex Mono + Caveat.
8. Hocanın ders reposuna commit/PR gönderme. Yalnızca Wayora reposunda çalış.
9. Secret, .env veya kişisel veri commit'leme.
10. Ana branch'e force-push yapma; çalışmayı feature branch + PR ile teslim et.

1000 KİŞİLİK PANELLER
P01 Ürün yönetimi (50): vizyon, kapsam, MVP, öncelik, kabul kriteri, yol haritası.
P02 Proje yönetimi (50): sprint, RACI, risk, bütçe/efor, iletişim, TSR, kapanış.
P03 Kullanıcı araştırması (50): persona, journey, friction, onboarding, güven.
P04 Görsel tasarım (50): hiyerarşi, grid, boşluk, kompozisyon, marka tutarlılığı.
P05 Tipografi (50): ölçek, okunabilirlik, Türkçe karakter, satır aralığı, kontrast.
P06 Renk ve kontrast (50): WCAG, dark mode, durum renkleri, fotoğraf tonu.
P07 Mobil/responsive (50): 375, 390, 768, 1024, 1440; tab bar, taşma, dokunma.
P08 Frontend mimarisi (50): React, router, state, API client, hata yönetimi, bundle.
P09 Backend/API (50): Express, doğrulama, hata kodu, sahiplik, idempotency, rate limit.
P10 Veritabanı (50): Prisma şeması, migration, index, cascade, Decimal, N+1.
P11 AI/LLM (50): prompt, model routing, timeout, fallback, halüsinasyon, maliyet.
P12 Güvenlik (50): auth, cookie, CSRF, XSS, injection, secret, bağımlılık.
P13 Test/QA (50): unit, route, component, e2e, sınır durumları, flaky test.
P14 Erişilebilirlik (50): klavye, odak, aria, form hatası, kontrast, reduced motion.
P15 Performans (50): LCP, CLS, görsel boyutu, font, kod bölme, gereksiz render.
P16 Dokümantasyon (50): README, kurulum, API, karar kaydı, link, tutarlılık.
P17 Sunum ve teslim (50): slayt akışı, kanıt, demo, süre, soru-cevap, Word/PDF.
P18 DevOps/CI (50): build, cache, audit, CodeQL, gitleaks, Semgrep, deploy.
P19 Türkçe dil ve içerik (50): yazım, ton, em dash, jenerik copy, hata metni.
P20 Agentic mühendislik (50): AGENTS, skills, MCP, SDD, orchestration, review.

DENETİM SIRASI
A. Envanter: dosya ağacı, route'lar, ekranlar, API, şema, testler, docs.
B. Çalıştır: npm ci, lint, typecheck, test, build, audit.
C. Responsive kanıt: 375x667, 390x844, 768x1024, 1024x768, 1440x900.
D. Akış kanıtı: kayıt, giriş, tercih, gezi, AI plan, aktivite ekle/sil.
E. Konsol/ağ: kırık görsel, 404, hydration, CORS, cookie.
F. Erişilebilirlik: tab sırası, odak, aria, form hatası, kontrast.
G. Güvenlik: sahiplik, rate limit, prompt injection, secret.
H. Doküman: link, komut, sayfa, tablo, görsel, dosya adı.
I. Bulgu tablosu + fix planı.
J. P0/P1 fix + test + yeniden denetim.
K. Rapor: AUDIT_REPORT.md ve FIX_LOG.md.

ÇIKTI FORMATI
| ID | Panel | Önem | Dosya:satır | Bulgu | Kanıt | Düzeltme | Durum |
P0/P1 için ayrıca test adı ve komut çıktısı yaz.

SON KONTROL
- npm run lint
- npm run typecheck
- npm test
- npm run build
- npm audit --omit=dev --audit-level=high
- 375px ve 1440px ekran görüntüsü
- Kritik akış uçtan uca
- Doküman/PPTX dosyaları açılıyor
- PR branch'i güncel, main'e force-push yok
```

## 1000 kişilik heyetin ortak kabul kriteri

Bir iş "bitti" sayılmaz; aşağıdakilerin tamamı sağlanana kadar açıktır:

- Kullanıcı akışı çalışıyor ve hata yolları anlaşılır.
- 375px ve 1440px'te yatay taşma yok.
- Klavye ile tüm form ve butonlara ulaşılıyor.
- API'de sahiplik ve doğrulama testleri var.
- AI çıktısı şema + aday filtresi + fallback olmadan kabul edilmiyor.
- Secret repoda yok; `.env.example` doğru.
- README ile yeni kişi projeyi çalıştırabiliyor.
- Word, sunum ve ekran görüntüleri güncel.
- PR küçük değilse en azından tek konuya odaklı ve açıklamalı.
