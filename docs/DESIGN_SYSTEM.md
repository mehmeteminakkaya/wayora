# WAYORA / V2 Tasarım Sistemi

Wayora, fotoğrafla merak uyandıran, tipografisi güçlü ve seyahat sırasında hızlı
kullanılan kişisel bir şehir rehberidir. Bu dosya `web/src/index.css` içindeki
tokenların ve bileşen kurallarının gerekçesidir. Ekran bazlı ayrıntılar için
`docs/DESIGN_V2.md` dosyasına bakılır.

## 1. İlkeler

1. **Fotoğraf içeriktir.** Şehir ve deneyim kararını hızlandırır; süs değildir.
2. **Tek vurgu.** Sarı yalnızca seçim, aktif durum ve ürün vurgusunda kullanılır.
3. **Sakin yüzey.** Krem zemin, beyaz kart, 1 px çizgi; gölge yalnızca yükselen
   panel ve sürüklenen öğede.
4. **Hareket anlam taşır.** Durum değişimi ve ilişkiyi açıklar; scroll veya süs
   animasyonu yoktur.
5. **Dürüst veri.** Canlı olmayan fiyat, açık/kapalı durumu, rezervasyon veya
   kullanıcı yorumu varmış gibi gösterilmez.

## 2. Renk

| Token | Hex | Kullanım |
| :--- | :--- | :--- |
| `--bg` | `#F3F3F1` | sayfa zemini |
| `--surface` | `#FFFFFF` | kart, form, panel |
| `--ink` | `#121212` | ana metin, birincil buton |
| `--ink-2` | `#55575C` | ikincil metin, meta |
| `--line` | `#DEDED9` | 1 px ayraç |
| `--signal` | `#FFC400` | seçim, aktif gün, vurgu |
| `--go` | `#1D7A4A` | hazır/başarı |
| `--stop` | `#B42318` | hata/silme |

- Sarı metin olarak kullanılmaz; sarı zemin üzerinde `--ink` kullanılır.
- Renk tek başına anlam taşımaz; seçili çiplerde alt çizgi/kalınlık ve
  `aria-pressed`, gün sekmelerinde metin ve `aria-pressed` birlikte bulunur.
- Koyu tema yok. Gradient, vinyet ve fotoğraf filtresi yok.

## 3. Tipografi

| Rol | Font | Kullanım |
| :--- | :--- | :--- |
| Başlık | **Overpass** 700–900 | h1, h2, şehir/deneyim adı |
| Gövde | **Overpass** 400–600 | paragraf, buton, form |
| Veri | **Overpass Mono** 400–600 | saat, tarih, fiyat, etiket |

- H1 mobilde 32–38 px, masaüstünde 44–56 px; `letter-spacing: -0.035em`.
- Gövde 14–16 px / 1.5; mono etiket 10–12 px, büyük harf.
- Türkçe karakterler (`ğ, ü, ş, i, ö, ç`) latin-ext ile doğrulanır.
- Em dash kullanılmaz; `·` veya `–` kullanılır.

## 4. Boşluk, yarıçap ve katman

- Boşluk ölçeği: `4, 8, 12, 16, 24, 32, 48`.
- Ekran kenarı 16 px; bölüm arası 32 px; kart içi 12–16 px.
- Radius ailesi: kontrol `4 px`, yüzey `8 px`, bottom sheet `12 px`.
- Gölge: normal kartta yok. `--shadow-sheet` yükselen panelde,
  `--shadow-drag` sürüklenen satırda.
- Katmanlar: header `100`, alt menü `200`, bottom sheet `300`.
- Sabit alt eylem çubuğu `72 px + safe area`; mobil alt menü
  `64 px + safe area`.

## 5. Hareket

| Değişken | Değer |
| :--- | :--- |
| `--duration-fast` | `120 ms` |
| `--duration-base` | `180 ms` |
| `--duration-slow` | `260 ms` |
| `--ease-standard` | `cubic-bezier(0.2, 0, 0, 1)` |
| `--ease-emphasized` | `cubic-bezier(0.2, 0.8, 0.2, 1)` |

- Buton basımı 100–140 ms hafif ölçek; seçim 140–200 ms; sekme 180–240 ms;
  bottom sheet 260–360 ms.
- Yalnızca `transform` ve `opacity` ağırlıklı çalışılır.
- Çıkış animasyonu kullanıcıyı bekletmez; tekrarlı dokunuşlar kuyruk oluşturmaz.
- `prefers-reduced-motion: reduce` tüm animasyonları kapatır, bilgi kaybolmaz.

## 6. Bileşenler

- **Buton:** 48 px yükseklik, 4 px radius. Birincil siyah, ikincil çerçeveli,
  üçüncül altı çizili metin. Sarı buton yok.
- **Seçim çipi:** 44 px dokunma alanı; seçili durumda sarı zemin, siyah kenar,
  alt çizgi ve kalın metin. Tik ikonu kullanılmaz.
- **Kart:** 8 px radius, 1 px çizgi, gölgesiz. Şehir kartı 16:10 fotoğraf;
  deneyim satırı 88 px kare görsel.
- **Gün şeridi:** yatay kaydırma; büyük gün numarası, tarih ve durak sayısı.
  Aktif gün sarı; seçili gün otomatik görünür tutulur.
- **Bottom sheet:** `role=dialog`, `aria-modal`, odak tuzağı, Escape,
  gövde scroll kilidi ve güvenli alan.
- **Sabit eylem çubuğu:** detay ekranlarında beyaz zemin, üstte 1 px çizgi;
  ana eylem 44 px altında kalır.
- **Fotoğraf:** gerçek ve lisanslı; ilk kritik görsel `eager/high`, diğerleri
  lazy. Kırık görselde etiketli placeholder; kategori görseli olduğu belirtilir.

## 7. Erişilebilirlik

- Tüm ana dokunma hedefleri en az `44 × 44 px`.
- Görünür klavye odağı, doğru heading hiyerarşisi ve form etiketi.
- Seçili durumlar `aria-pressed` / `aria-selected` ile bildirilir.
- Sabit çubuklar içerik ve odak hedeflerini örtmez; sayfa alt boşluğu bırakır.
- Hareket azaltma, metin büyütme ve 320 px genişlikte yatay taşma kontrol edilir.
- Yükleme, boş, hata, işlem sürüyor ve başarı durumları ayrı metinlerle gösterilir.

## 8. Sayfa kompozisyonları

- **Landing:** ilk ekranda fotoğraf, değer önerisi, arama ve ana eylem; örnek gün.
- **Keşfet:** arama, filtre, sıralama, öne çıkan şehir ve karşılaştırılabilir kartlar.
- **Şehir:** atmosfer fotoğrafı, kısa özet, filtrelenebilir deneyim satırları ve
  sabit seçim özeti.
- **Deneyim:** 4:3 şehir arşivi, karar bilgileri, sabit “Plana ekle”, harita ve
  pratik bilgiler.
- **Rota detayı:** gün şeridi, siyah gün panosu, dikey rota çizgisi, liste/harita
  ve erişilebilir sıralama.
- **Auth/profil:** sade form, görünür etiket, eyleme dönük hata, okunabilir
  tercih özeti.

## 9. Sınırlar

- Google OAuth, gerçek şifre sıfırlama, Mapbox/MapLibre ve canlı rezervasyon
  sağlayıcısı bağlı değildir; arayüz sahte başarı üretmez.
- OSM embed haritası şehir merkezini gösterir; marker senkronizasyonu varmış
  gibi davranılmaz.
- Kullanıcı yorumu, canlı açık/kapalı bilgisi ve kesin transfer süresi uydurulmaz.
