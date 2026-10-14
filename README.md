# Wayora — AI Destekli Seyahat Planlama

Tercihlerine, bütçene ve süreye göre gün gün gezi planı üreten web uygulaması.
İstinye Üniversitesi **JOB-191** ders projesi (GrepThink).

> Durum: **Sprint 0 — kurulum.** İskelet uygulama (web + api + veritabanı bağlantısı) hazır; özellikler Sprint 1'de başlıyor.

## Belgeler

| Dosya | İçerik |
| :--- | :--- |
| [docs/PROJECT_OVERVIEW.md](docs/PROJECT_OVERVIEW.md) | Problem, hedefler, kapsam, ekip (GrepThink'ten) |
| [docs/ROADMAP.md](docs/ROADMAP.md) | Sprint takvimi, MVP, riskler, bu haftanın işleri |
| [docs/BACKLOG.md](docs/BACKLOG.md) | Scrum Board'a girilecek user story'ler |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Teknik mimari, veri modeli, API, AI akışı |
| [docs/TEAM.md](docs/TEAM.md) | Roller, Scrum düzeni, Git akışı, Definition of Done |

## Teknoloji

React + TypeScript · Node.js + Express · PostgreSQL · Google Maps API · LLM API

## Ekip

Bayram Selim Yılmaz (PO) · Mehmet Emin Akkaya (Scrum Master) · Ezgi Turan · Aykut Kayra Akkuş · Berfin Aksoy

## Kurulum

Gerekenler: **Node.js 22+** (önerilen 24, bkz. `.nvmrc`) ve bir **PostgreSQL** veritabanı.
En kolayı [Neon](https://neon.tech) veya [Supabase](https://supabase.com) üzerinde ücretsiz bir veritabanı açmak.

```bash
git clone https://github.com/mehmeteminakkaya/wayora.git
cd wayora
npm install                       # web + api bağımlılıkları, Prisma istemcisi
cp api/.env.example api/.env      # sonra DATABASE_URL'i kendi veritabanınla değiştir
npm run db:migrate -w api         # tabloları oluşturur
npm run dev                       # api → :4000, web → :5173
```

Tarayıcıda http://localhost:5173 açılınca "API çalışıyor · Veritabanı: bağlı" görmelisin.

## Komutlar (kök dizinden)

| Komut | Ne yapar |
| :--- | :--- |
| `npm run dev` | API ve web'i birlikte başlatır |
| `npm run lint` | oxlint |
| `npm run typecheck` | TypeScript kontrolü |
| `npm test` | Vitest (api: Supertest, web: Testing Library) |
| `npm run build` | Üretim derlemesi |
| `npm run db:migrate -w api` | Şema değişikliğinden migration üretir ve uygular |

Her PR'da GitHub Actions aynı kontrolleri çalıştırır.

## Klasörler

```
web/   React + Vite + TypeScript
api/   Express + TypeScript + Prisma (PostgreSQL)
docs/  Planlama belgeleri
```

## Katkı

Akış: `feat/W-xx-kisa-ad` dalı → PR → 1 onay + yeşil CI → `main`. Ayrıntı: [docs/TEAM.md](docs/TEAM.md).
