# Wayora Şehir Kataloğu

## Kapsam

Keşif rehberi 10 şehir ve toplam 100 deneyim içerir:

| Şehir | Ülke | Deneyim |
| :--- | :--- | ---: |
| İstanbul | Türkiye | 10 |
| Paris | Fransa | 10 |
| Roma | İtalya | 10 |
| Barselona | İspanya | 10 |
| Londra | Birleşik Krallık | 10 |
| Amsterdam | Hollanda | 10 |
| Berlin | Almanya | 10 |
| Prag | Çekya | 10 |
| Viyana | Avusturya | 10 |
| Lizbon | Portekiz | 10 |

Her deneyimde şu alanlar bulunur:

- ad, kategori, mahalle ve adres
- yaklaşık kişi başı fiyat ve para birimi
- tahmini süre
- şehir içi ulaşım için kısa açıklama
- etiketler, puan, açılış saati notu
- varsa resmî site veya bilet bağlantısı

Fiyatlar 2026 sonbaharı için yaklaşık değerlerdir. Amaç kesin bilet fiyatı vermek değil, plan
bütçesinde karşılaştırma yapılabilmesini sağlamaktır. Müze saatleri, sezonluk kapanışlar ve
bilet koşulları değişebilir; kullanıcı resmî bağlantıya yönlendirilir.

## Veri kaynağı ve güncelleme

Katalog `api/src/data/city-catalog.ts` dosyasındaki sürümlenmiş veridir. Sunucu açılışında
`seedCityCatalog` ile `City` ve `CityExperience` tablolarına idempotent olarak yazılır.
Veritabanı geçici olarak boşsa `/api/cities` statik katalogdan aynı cevabı üretir.

Canlı scrape bilinçli olarak tercih edilmedi:

- Tripadvisor, GetYourGuide ve benzeri sitelerin kullanım koşulları scraping'e izin vermiyor.
- Fiyatlar ve saatler sık değişiyor; doğrulanmamış scrape verisi kullanıcıyı yanıltabilir.
- Uygulamanın anahtar olmadan ve çevrimdışı demo modunda çalışması gerekiyor.

Gerçek bir sağlayıcı anahtarı eklendiğinde Google Places veya benzeri bir servis, bu kataloğun
üzerine zenginleştirme katmanı olarak eklenebilir. Şu anki ürün bu veriyi kendi veritabanında
tutuyor ve API üzerinden sunuyor.

## API

| Endpoint | Açıklama |
| :--- | :--- |
| `GET /api/cities` | 10 şehir özeti, deneyim sayısı ve ortalama maliyet |
| `GET /api/cities/:slug` | Şehir özeti ve tüm deneyimler |
| `GET /api/cities/:slug/experiences?category=museum` | Kategoriye göre deneyimler |
| `GET /api/cities/_meta/count` | Veritabanı ve statik katalog sayıları |

Bu endpoint'ler herkese açıktır; kullanıcı verisi döndürmez.

## Plan üretimiyle bağlantı

`findCandidates` artık bu kataloğun tamamını kullanır. Yeni bir gezi oluşturulduğunda offline plan
üreticisi 10 şehir için gerçek deneyim adlarını, kategorilerini ve maliyetlerini kullanır. LLM
sağlayıcısı yapılandırılmışsa aynı aday listesi prompt'a verilir; halüsinasyon filtresi korunur.

## Bakım

Yeni bir deneyim eklerken:

1. `city-catalog.ts` içindeki ilgili şehir dizisine kaydı ekle.
2. `npm test -w api` ile katalog testlerini çalıştır.
3. API'yi yeniden başlat; seed otomatik güncellenir.
4. Fiyat ve resmî bağlantıyı kontrol et.
5. Şehir sayısı veya deneyim sayısı değişirse bu belgeyi ve audit raporunu güncelle.
