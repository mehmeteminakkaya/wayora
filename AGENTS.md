# Wayora: Agent Guide

Bu dosya, repoda çalışan her coding agent için **her zaman yüklü** bağlamdır.
Kısa tutun: ayrıntılı kurallar `api/AGENTS.md`, `web/AGENTS.md` ve
`api/src/services/AGENTS.md` dosyalarındadır.

## Ürün

Wayora, kullanıcının tercihlerine (ilgi alanları, bütçe, tempo) göre **gün gün AI seyahat
planı** üreten bir web uygulamasıdır. İstinye Üniversitesi JOB-191 grup projesi.

## Stack ve yapı

- `web/`: React 19 + TypeScript + Vite + React Router. Tasarım `web/src/index.css`.
- `api/`: Express 5 + TypeScript + Prisma 7 + PostgreSQL. LLM servisi `api/src/services/itinerary.ts`.
- `docs/`: ürün, mimari, sprint ve agent belgeleri. `docs/specs/001-mvp/` MVP spec'idir.
- `mcp/`: Wayora Context MCP sunucusu (opsiyonel geliştirici aracı).

## Komutlar (kök)

```bash
npm run setup          # bağımlılıklar + api/.env + yerel Postgres + migration
npm run dev            # db + api :4000 + web :5180
npm run lint           # oxlint (tüm workspace)
npm run typecheck      # tsc
npm test               # Vitest (api + web)
npm run build          # üretim derlemesi
```

## Değişmez kurallar

1. **Önce spec, sonra kod.** Davranış değişikliği `docs/specs/001-mvp/spec.md` ile çelişmesin;
   yeni kapsam gerekiyorsa önce spec/plan güncelle.
2. **Test olmadan davranış değiştirme.** Yeni route, servis veya kullanıcı akışı için test yaz.
3. **API hata biçimi sabit:** `{ "error": { "code": "...", "message": "..." } }`.
4. **Gizli anahtar commit'leme.** `.env` gitignore'da; yalnızca `.env.example` güncellenir.
5. **Kullanıcı verisi sahipliği:** Her sorgu `userId` ile filtrelenir; başkasının kaynağı 404 döner.
6. **AI çıktısı güvenilmezdir.** LLM yanıtı zod ile doğrulanır, aday olmayan yer kimlikleri atılır.
7. **Küçük ve odaklı değişiklik.** Bir PR tek bir story'yi çözsün; ilgisiz refactor yapma.
8. **Türkçe ürün metni.** Kullanıcıya görünen metinler Türkçe ve erişilebilir olmalı.

## Değişiklik akışı

1. İlgili spec/task ve `AGENTS.md` dosyalarını oku.
2. Etkilenen kodu ve testleri incele; davranışı ve dosyaları kısaca yaz.
3. Önce başarısız test, sonra en küçük uygulama.
4. `npm run lint && npm run typecheck && npm test && npm run build` çalıştır.
5. Diff'i review et: güvenlik, hata yolları, erişilebilirlik, test boşlukları.
6. PR açıklamasında problem, yaklaşım, test kanıtı ve riskleri yaz.

## Sınırlar

- Kapsam dışı: ödeme, rezervasyon, gerçek uçuş/otel, çoklu kullanıcı işbirliği.
- Google Maps/Places ve gerçek LLM anahtarları opsiyoneldir; uygulama anahtarsız çalışmalıdır.
- `api/src/generated/**` elle düzenlenmez; `npm run db:generate -w api` ile üretilir.
- Ders materyali reposuna (`scottyUX/AI-Augmented-Software-Engineering`) commit/PR gönderme.

## Nereye bakmalı

| Konu | Dosya |
| :--- | :--- |
| Ürün kapsamı | `docs/PROJECT_OVERVIEW.md`, `docs/specs/001-mvp/spec.md` |
| Mimari ve API | `docs/ARCHITECTURE.md`, `docs/specs/001-mvp/plan.md` |
| Sprint/backlog | `docs/ROADMAP.md`, `docs/BACKLOG.md` |
| Agent iş akışı | `.agents/skills/`, `docs/ORCHESTRATION.md` |
| Güvenlik | `docs/SECURITY.md` |
| AI review | `docs/AI_REVIEW.md`, `.coderabbit.yaml` |
| MCP | `docs/CONTEXT.md`, `mcp/wayora-context/` |
| Tasarım dili | `docs/DESIGN_SYSTEM.md`, `web/src/index.css` |
