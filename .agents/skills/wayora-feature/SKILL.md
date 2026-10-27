---
name: wayora-feature
description: Wayora'da yeni bir özellik veya hata düzeltmesi uygularken kullan. Spec okuma, başarısız test, en küçük uygulama, doğrulama ve özet adımlarını izler.
---

# Wayora Feature Workflow

Bu prosedürü **tek bir story** için uygula. Keşif ve uygulamayı aynı adımda yapma.

## 1. Bağlamı oku

- `docs/specs/001-mvp/spec.md` ve ilgili `tasks.md` maddesi.
- Kök `AGENTS.md`, sonra etkilenen alanın `AGENTS.md` dosyası (`api/`, `web/`, `api/src/services/`).
- Varsa `docs/ARCHITECTURE.md` ve mevcut testler.

## 2. Plan (kod yazma)

Şunları kısa biçimde yaz:

- Beklenen davranış (kullanıcı gözüyle).
- Etkilenecek dosyalar.
- Yeni/değişecek API sözleşmesi veya tip.
- Test senaryoları: en az bir başarı, bir hata/kenar durum.
- Riskler ve kapsam dışı bıraktıkların.

Plan spec ile çelişiyorsa **önce spec/planı güncelle**, koda dokunma.

## 3. Başarısız testi yaz

- API: `api/src/**/*.test.ts` (Vitest + Supertest, gerekirse `test/fake-db.ts`).
- Web: `web/src/**/*.test.tsx` (Testing Library, `MemoryRouter` + `fetch` mock).
- Testi çalıştır ve beklenen nedenle kırmızı olduğunu doğrula.

## 4. En küçük uygulama

- Mevcut desenleri kopyala: router factory, `parseOrThrow`, `HttpError`, `api.ts` istemcisi.
- Yeni bağımlılık eklemeden önce standart kütüphane/mevcut paketle çözülebiliyor mu bak.
- Kullanıcıya görünen metinler Türkçe; hata yolları ve boş durumlar dahil.

## 5. Doğrula

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

- Yeni davranışı gerçekten kapsayan test var mı?
- Yetkisiz erişim / başka kullanıcının kaynağı 404 mü?
- Gizli anahtar, `console.log` veya geçici kod kaldı mı?
- Erişilebilirlik: label, klavye, `aria-label`, kontrast.

## 6. Özetle

PR açıklaması için:

- Problem ve yaklaşım.
- Değişen dosyalar.
- Test kanıtı (komut + sonuç).
- Tradeoff / bilinen risk.
- Ekran görüntüsü (UI değişikliyse).
