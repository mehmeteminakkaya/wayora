# Test ve doğrulama

## Otomatik kontroller

```bash
npm run lint        # oxlint
npm run typecheck   # tsc
npm test            # Vitest (api + web)
npm run build       # üretim derlemesi
```

Son doğrulama (18 Kasım 2026):

| Kontrol | Sonuç |
| :--- | ---: |
| API testleri | 79 / 79 (14 dosya) |
| Web testleri | 10 / 10 (2 dosya) |
| Toplam Vitest | 89 / 89 |
| Lint | geçti |
| Web production build | geçti |

Aynı komutlar `.github/workflows/ci.yml` içinde her PR'da çalışır; güvenlik taramaları
(CodeQL, Semgrep, gitleaks) ayrı iş akışlarındadır. Guide/enforce ayrımı için
[`../agentic/AI_REVIEW.md`](../agentic/AI_REVIEW.md).

## Tarayıcı E2E

Dev sunucusu ve Chrome DevTools (`9224`) açıkken:

```bash
node scripts/e2e/e2e_api.mjs
node scripts/e2e/e2e_v2.mjs
node scripts/e2e/e2e_navigation.mjs
node scripts/e2e/e2e_register_flow.mjs
node scripts/audit/audit_polish_mobile.mjs
```

Kapsanan akışlar:

- API: kayıt, giriş, tercihler, katalog, rota oluşturma, offline plan, aktivite ekleme/silme,
  sahiplik kontrolü, çıkış, silme.
- Keşif: Ticketmaster etkinlik normalizasyonu, Duffel uçuş normalizasyonu, anahtarsız
  sağlayıcı durumu ve uçuş aramasında oturum koruması.
- V2: arama, deneyim seçimi, seçim özeti, giriş sonrası dönüş, rota oluşturma, gün değiştirme,
  rotalarım, profil, çıkış, konsol hataları.
- Navigasyon: keşif arama/filtre/sıralama ve scroll geri dönüşü, şehir filtresi ve deneyim
  detayından geri dönüş.
- Kayıt: yeni hesap → onboarding → seçimlerle yeni rota akışına dönüş.
- Mobil audit: 320/430 px taşma, bottom sheet, sabit eylem çubuğu.

Kanıtlar: [`docs/audit/`](../audit/).

> Fiziksel cihaz testi yapılmamıştır. Mobil doğrulama Chrome DevTools viewport emülasyonuyla
> 320, 375, 390 ve 430 px genişliklerde yapılmıştır.

## Script klasörleri

| Klasör | İçerik |
| :--- | :--- |
| `scripts/e2e/` | Tarayıcı ve API uçtan uca akışları |
| `scripts/audit/` | UI/erişilebilirlik denetimleri ve ürün laboratuvarı simülasyonları |
| `scripts/capture/` | Ekran görüntüsü üretimi |
| `scripts/docs/` | Rapor, sunum ve görsel üreticileri (Python) |
| `scripts/dev/` | Yerel geliştirme yardımcıları (db watchdog, worktree) |

Script'ler repo kökünden çalıştırılır; raporlar `docs/audit/reports/`, görseller
`docs/audit/screenshots/` altına yazılır.
