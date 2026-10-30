# PROGRESS

> Oturumlar arası handoff. Yeni bir agent oturumu başlarken önce bunu, sonra ilgili
> `AGENTS.md` ve spec dosyasını okur. Ayrıntılı geçmiş yerine **karar / yapıldı / sıradaki**
> listeleri tutulur.

## Decided

- Ürün V2 görsel dili ve mobil öncelikli düzen korunuyor.
- AI sağlayıcısı DeepSeek; anahtar yoksa offline plan fallback'i çalışır.
- Yol Arkadaşları ayrı `003-hitchhiker-match` spec'inde; ev sahipliği yalnızca niyet bilgisi.
- Sosyal eşleşmelerde sunucu tarafı `offset/limit`; UI en fazla 20’lik sayfalar yükler.
- Demo verisi local/production ayrımı korunur; `demo:seed` production için açık onay ister.
- Ana dal doğrudan merge edilmeden önce lint, typecheck, test ve build kanıtı gerekir.

## Done

- 14 şehir / 140 deneyim kataloğu; production katalogu seed edildi.
- Yol Arkadaşları: profil, eşleşme, istek, sohbet, engelleme/bildirim.
- Eşleşme boş durumu rehberi, ortak ilgi/ev sahipliği filtreleri ve “Daha fazla” sayfalama.
- 44px dokunma hedefleri; 390px mobil ve 1280px masaüstü audit temiz.
- 75 profilli demo hesabı ve `demo:clear` temizliği.
- 1000 kullanıcı / 14 gün kullanım simülasyonu ve mühendislik sprinti raporu.

## Next

- Bildirim/e-posta ve gerçek zamanlı sohbet.
- AI üretiminde adım adım ilerleme ve tahmini süre.
- Gerçek kullanıcı doğrulaması, moderasyon kuyruğu ve rapor SLA’sı.
- Mobil rota detayında kademeli özet ve daha az ilk ekran yoğunluğu.
- Gerçek 20-30 kişilik kullanılabilirlik testi.

## Open questions

- Sosyal özellikler production’da kalıcı mı kalacak, yoksa sunum sonrası temizlenecek mi?
- Google Places/Duffel gibi dış sağlayıcılar için gerçek anahtar sağlanacak mı?
- Ders sunumu için demo verisi local mi, canlı ortamda mı gösterilecek?
