# Wayora MVP: Görevler

> Spec: `spec.md` · Plan: `plan.md` · İşaretler: `[x]` tamam, `[ ]` açık

## Aşama 0: İskelet

- [x] npm workspaces (`web/`, `api/`), Node 24 sürüm dosyası
- [x] Express app factory + `/api/health` + DB kontrolü
- [x] Prisma 7 + yerel `prisma dev` + ilk `User` migration
- [x] GitHub Actions: lint + typecheck + test + build
- [x] Ortak hata biçimi ve 404 handler
- [x] Vite proxy (:5180 → :4000), CORS allowlist

## Aşama 1: Auth ve temel CRUD

- [x] `Preference`, `Trip`, `TripDay`, `Activity`, `Place` şeması + migration
- [x] bcrypt şifre hash'i, JWT oturum, httpOnly cookie
- [x] `POST /api/auth/register|login|logout`, `GET /api/auth/me`
- [x] `requireAuth` middleware, `req.userId`
- [x] Tercih `GET/PUT` (upsert)
- [x] Gezi `GET/POST/PATCH/DELETE` + gün üretimi + sahiplik filtresi
- [x] Aktivite ekleme/silme/güncelleme
- [x] Zod doğrulama ve Türkçe hata mesajları
- [x] `helmet`, CORS, 1 MB gövde limiti, rate limit

## Aşama 2: Yerler

- [x] Yerleşik şehir kataloğu (İstanbul, Paris, Roma, Barselona, Londra, Amsterdam)
- [x] `GET /api/places/search` + katalog araması
- [x] `Place` upsert (kota/maliyet önbelleği temeli)
- [x] Bilinmeyen destinasyon için jenerik plan fallback'i
- [ ] Gerçek Google Places proxy'si (anahtar bekliyor)

## Aşama 3: AI plan

- [x] `generateOfflinePlan` (pace, bütçe, ilgi alanı, gün içi tekrar yok)
- [x] Gemini ve OpenAI adaptörleri (`fetch`, timeout, JSON modu)
- [x] `routeModel` (itinerary → smart, quick_tip → fast)
- [x] Zod şeması + `parseLlmPlan`
- [x] Halüsinasyon filtresi (`normalizeLlmPlan`)
- [x] Sağlayıcı hatasında offline fallback + `meta.fallback`
- [x] `POST /api/trips/:id/generate` transaction
- [x] `Trip.tips` ve `status` kalıcılığı
- [x] Günlük AI limiti

## Aşama 4: Web deneyimi

- [x] React Router + `AuthProvider` + `ProtectedRoute`
- [x] Landing, giriş, kayıt, onboarding
- [x] Gezi listesi, yeni gezi, gezi detayı
- [x] Gün gün timeline, saat/maliyet/kategori gösterimi
- [x] AI üretim durumu, fallback bildirimi, bütçe özeti
- [x] Elle aktivite ekleme/silme
- [x] Responsive tasarım + koyu tema + odak durumları
- [ ] Sürükle-bırak sıralama (Sprint 4)

## Aşama 5: Kalite ve ders artefaktları

- [x] API testleri (auth, tercih, health, hata yolları)
- [x] Servis testleri (offline, halüsinasyon, prompt sınırı, fallback, Gemini)
- [x] Web testleri (landing, login, korumalı rota, boş liste)
- [x] `AGENTS.md` (kök + alan bazlı + servis)
- [x] Agent skill'leri (feature, review, security)
- [x] Spec-driven artifacts (`constitution`, `spec`, `plan`, `tasks`)
- [x] AI review rehberi + CodeRabbit yapılandırması
- [x] Güvenlik rehberi + gitleaks/CodeQL/Semgrep CI
- [x] Orchestration rehberi + worktree script'i
- [x] Wayora Context MCP sunucusu
- [x] README ve sprint dokümanlarının güncellenmesi

## Demo senaryosu (5 dk)

1. `npm run setup && npm run dev`
2. Kayıt ol → tercihleri seç (Müze, Yemek / orta bütçe).
3. "Paris" için 3 günlük, 500 EUR bütçeli gezi oluştur.
4. "AI ile plan oluştur" → gün gün planı, maliyet özetini ve ipuçlarını göster.
5. Bir güne elle aktivite ekle, bir aktiviteyi sil.
6. `npm test` çıktısını ve CI/agent artefaktlarını göster.

## Sonraki sprint (kapsam dışı)

- [ ] Sürükle-bırak sıralama
- [ ] "Bu günü yeniden üret" (kısmi AI)
- [ ] Destinasyon önerisi
- [ ] Google Maps pinleri
- [ ] Paylaşılabilir salt-okunur link
- [ ] PDF / `.ics` dışa aktarma
