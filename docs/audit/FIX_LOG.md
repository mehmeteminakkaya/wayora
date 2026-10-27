# Fix Log

## 2026-10-27 · Master audit turu

| # | Dosya | Değişiklik | Neden | Doğrulama |
| :--- | :--- | :--- | :--- | :--- |
| 1 | `api/src/app.ts` | Auth rate limit yalnızca login/register yollarına alındı; `skipSuccessfulRequests` eklendi | `/api/auth/me` her sayfa yüklemesinde limite takılıp oturumu kilitliyordu | Login + `/me` + korumalı sayfalar 200 |
| 2 | `web/src/components/Layout.tsx` | `/login` ve `/register` rotalarında mobil nav gizlendi | Sabit nav, 375 px’te form butonunu örtüyordu | Auth ekranı 375 px kontrolü |
| 3 | `web/src/index.css` | Bozuk `✓` karakterleri UTF-8 olarak düzeltildi | Encoding dönüşümü seçili çip/onay ikonunu bozmuştu | `/onboarding` görsel kontrol |
| 4 | `web/src/index.css` | Seçili bütçe kartında başlık/açıklama rengi açıkça ayarlandı | Terracotta üzerinde metin kontrastı belirsizdi | Renk ve kontrast kontrolü |
| 5 | `web/src/index.css` | Auth poster görseli `paris.jpg` yapıldı; overlay ve metin gölgesi güçlendirildi | Köprü fotoğrafındaki yatay çizgi başlığı kesiyordu | Login mobil görsel kontrol |
| 6 | `web/src/index.css` | Mobil nav varken footer’a alt boşluk eklendi | Sabit nav footer’ı örtebiliyordu | CSS kontrolü |
| 7 | `package-lock.json` | `npm audit fix` ile body-parser, fast-uri ve qs güncellendi | Yüksek/orta güvenlik bulguları | `npm audit --omit=dev`: 0 |
| 8 | `docs/MASTER_AUDIT_PROMPT.md` | 1000 kişilik panel ve denetim protokolü eklendi | Tekrarlanabilir kalite turu | Dosya kontrolü |
| 9 | `docs/audit/AUDIT_REPORT.md` | Bulgular, kanıtlar ve düzeltmeler yazıldı | Şeffaf teslim | Dosya kontrolü |
| 10 | `docs/audit/ui-audit.json` | 5 viewport otomatik UI taraması | Responsive/erişilebilirlik kanıtı | 0 taşma, 0 kırık görsel |
| 11 | `docs/audit/auth-audit.json` | 4 korumalı sayfa x 2 viewport | Auth akışı kanıtı | 0 hata |
| 12 | `docs/Wayora-*.docx`, `docs/Wayora-Sunum.pptx` | Rapor, proje yönetimi, user story ve sunum üretildi | Teslim paketi | python-docx/pptx yapı kontrolü |

## Komut çıktısı

```
npm run lint       → geçti
npm run typecheck  → geçti
npm test           → 32 API + 4 web
npm run build      → geçti
npm audit --omit=dev --audit-level=high → 0 vulnerability
```

## Açık kalanlar

- Gerçek Google Places/Maps entegrasyonu
- Sürükle-bırak aktivite sıralama
- Kısmi gün/aktivite AI üretimi
- Bulut deploy
- Paylaşılabilir salt-okunur link
- PDF çıktısı (Word/PPTX hazır)
