# API: Scoped Agent Instructions

Bu dosya yalnızca `api/**` altında çalışırken geçerlidir. Kök `AGENTS.md` her zaman önceliklidir.

## Yapı

```
api/src/
  app.ts              # Express app factory; route'ları burada bağla
  server.ts           # process başlatma, Prisma, graceful shutdown
  config.ts           # zod ile env doğrulama
  domain.ts           # ortak enum/tip sabitleri
  routes/             # auth, preferences, trips, places, health
  services/           # itinerary (LLM + offline), testleri
  middleware/         # auth (JWT cookie), error (HttpError, parseOrThrow)
  lib/                # prisma, jwt, password, serializer
  data/places.ts      # anahtarsız çalışan şehir kataloğu
  generated/prisma/   # ÜRETİLEN KOD: elle düzenleme
```

## Kurallar

- **Factory pattern:** Router'lar `({ db, config })` alır; `createApp` dışında global Prisma kullanma.
  Testler `api/src/test/fake-db.ts` ile DB'siz çalışır.
- **Doğrulama:** Tüm gövde/parametreler `parseOrThrow(zodSchema, input)` ile doğrulanır.
- **Sahiplik:** Trip/Day/Activity sorgularında `userId` filtresi zorunlu. Bulunamazsa 404.
- **Hata:** `HttpError(status, code, message)` fırlat; `errorHandler` biçimi korur.
- **Auth:** JWT httpOnly cookie (`wayora_session`). `requireAuth` olmadan korumalı route açma.
- **AI:** `generateItinerary` dışında LLM çağrısı yapma. Sağlayıcı hatasında offline üreticiye düş.
  Prompt'a kullanıcı metni eklerken `<untrusted_user_notes>` sınırını koru.
- **Para:** `Decimal` alanları JSON'a `toNumber` ile çevir; hesaplamayı sunucuda yap.
- **Migration:** Şema değişince yeni migration klasörü ekle; `prisma migrate dev` çalıştır.
  `generated/` dosyalarını commit'leme (gitignore).
- **Test:** Yeni route için en az bir başarı + bir hata testi. LLM testlerinde `fetch` mock'la.

## Komutlar

```bash
npm run dev -w api
npm test -w api
npm run db:migrate -w api
npm run db:generate -w api
```
