# WAYORA / ROTASYON Tasarım Sistemi

Wayora bir SaaS paneli değil, **cebinde taşınan bir seyahat defteri** gibi görünür.
Krem kağıt, putty zemin, ağır mürekkep tipografisi, gerçek fotoğraflar, damgalar ve el yazısı
notlar taşır. Referans: analog seyahat günlükleri, boarding pass'ler ve baskı damgaları.

Bu dosya `web/src/index.css` içindeki tokenların gerekçesidir.
Yeni ekran veya bileşen eklerken önce buraya bakılır.

## 1. Marka fikri

- **Metafor:** sahaf tezgâhında bulunmuş, arasına fotoğraf ve bilet düşmüş bir seyahat defteri.
- **Ses:** doğrudan, kısa, sakin. Abartılı sıfat yok.
- **Görsel imza:** krem kağıt, siyah çerçeve, turuncu damga, el yazısı not.
- **Vaad:** planı süslemek değil, günü saat saat okunur hale getirmek.

## 2. İlkeler

1. **Kağıt gibi davran.** Zemin putty; içerik krem bir sayfa. Kart yığını değil, tek defter.
2. **Her şey çerçeveli.** 2px mürekkep çizgi, keskin köşe, sert offset gölge.
3. **Fotoğraf kanıttır.** Şehir fotoğrafı süs değil, sayfanın parçası; çerçevesi ve alt yazısı var.
4. **Damga ve not.** Fiyatlar damga, küçük açıklamalar el yazısı; bunlar süs değil, ritim.
5. **Tek vurgu.** Birincil eylem mürekkep; hover'da terracotta.
6. **Hareket yalnız durum.** Scroll animasyonu, cursor efekti ve dekoratif geçiş yok.
7. **Erişilebilirlik temel.** Kontrast, odak ve dokunma hedefi baştan gelir.

## 3. Renk paleti

### Açık tema

| Token | Hex | Kullanım |
| :--- | :--- | :--- |
| `--putty` | `#C8BCAA` | sayfa dış zemini |
| `--paper` | `#F4EADA` | defter sayfası |
| `--paper-2` | `#EADCC7` | ikincil kağıt |
| `--cream` | `#FBF3E5` | kart, fiş, form |
| `--ink` | `#1B1814` | metin, 2px çizgi |
| `--muted` | `#6B6154` | ikincil metin |
| `--terracotta` | `#B6472B` | vurgu, birincil hover |
| `--stamp` | `#A83A2A` | damga, hata, fiyat |
| `--olive` | `#6D7355` | hazır plan, doğa |

### Koyu tema

| Token | Hex |
| :--- | :--- |
| `--putty` | `#2B2620` |
| `--paper` | `#1E1A15` |
| `--paper-2` | `#28221B` |
| `--cream` | `#241F19` |
| `--ink` | `#F4EADA` |
| `--muted` | `#B6A894` |
| `--terracotta` | `#D96A4B` |
| `--stamp` | `#E07A5F` |
| `--olive` | `#A9B08A` |

Kurallar:

- Damga ve fiyatlar her zaman `--stamp`.
- Renk tek başına anlam taşımaz; durum etiketi metinle birlikte yazılır.
- Fotoğraflar hafif desatüre edilir (`saturate(.8) contrast(1.05)`); renkli filtre yok.
- Gradient yok; gölge yalnız sert offset (`box-shadow: 5px 5px 0`).

## 4. Tipografi

| Rol | Font | Kullanım |
| :--- | :--- | :--- |
| Display | **Anton** | h1, h2, büyük rakamlar, marka |
| Gövde | **Public Sans** | paragraf, form, buton |
| Veri | **IBM Plex Mono** | saat, tarih, bütçe, durum |
| Not | **Caveat** | el yazısı notlar, damga altı açıklamalar |

- Display daima büyük harf, dar satır aralığı, `letter-spacing: .005em`.
- H1: `clamp(3.4rem, 8.4vw, 7.8rem)`, satır yüksekliği `1.18`.
- Gövde 1rem / 1.55. Mono etiket 0.55–0.65rem, büyük harf.
- Caveat yalnız kısa notlarda; paragraf veya butonlarda kullanılmaz.
- Serif, italik vurgu, Space Grotesk, Instrument Serif yok.
- Türkçe için `lang="tr"` ve latin-ext alt kümesi korunur.

## 5. Düzen

- İçerik: `min(100% - 2rem, 1320px)`.
- Ana sayfa/defter: krem `paper`, 2px mürekkep çerçeve, `8px 8px 0` sert gölge.
- Boşluk ölçeği: 4, 8, 12, 16, 24, 32, 48, 64, 96 px.
- Hero: 1.06 / 0.94 asimetrik iki kolon; fotoğraf sağda, rota fişi fotoğrafın üzerine taşar.
- Bölümler 2px çizgiyle ayrılır; kart yığını yok.
- Radius yok. Buton, input, kart ve fotoğraf çerçevesi keskin.
- Header opak krem; blur ve saydamlık yok.

## 6. Bileşenler

| Bileşen | Kural |
| :--- | :--- |
| Buton | 46px, mürekkep dolgu, krem metin; hover terracotta |
| Ghost buton | 2px mürekkep çerçeve; hover ters dolgu |
| Damga | 2px `--stamp` çerçeve, mono büyük harf, `rotate(-4deg)` |
| Fotoğraf | 8px krem çerçeve + 2px mürekkep outline + alt yazı |
| Rota fişi | Krem kart, 2px çerçeve, sert gölge, `rotate(2deg)` |
| Input | 46px, 2px mürekkep, krem zemin; odak 3px terracotta |
| Çip | 2px çerçeve, mono; seçili mürekkep/krem |
| Gün notu | Krem kart, damga, dashed satırlar, el yazısı kapanış |
| Aktivite | Krem kart, checkbox, saat, fiyat damgası, `rotate(-0.25deg)` |
| Boş durum | Krem kart, dev `00`, tek CTA |
| Bildirim | 2px çerçeve; yumuşak renkli kutu yok |

## 7. Hareket

- Süreler: 120ms geri bildirim, 180ms yerel geçiş.
- Hover yalnız renk ve çerçeve değiştirir; buton zıplamaz.
- Scroll fade-in, cursor beam, sürekli dönen dekorasyon yok.
- `prefers-reduced-motion`: spinner durur, geçişler kapanır.

## 8. Ses ve metin

- Tekil “sen”. Kısa cümle. Somut sahne.
- “Bir şehir. Üç gün.” gibi kısa başlıklar; “hayalindeki gezi” yok.
- Em dash yok; `·` ve `–` kullanılır.
- Hata suçlamaz: “Planı oluşturamadık. Tercihlerin kayıtlı, tekrar deneyebilirsin.”
- Teknik sağlayıcı/model/milisaniye kullanıcıya gösterilmez.

| Yerine | Wayora |
| :--- | :--- |
| Hayalindeki geziyi yaşa | Bir şehir. Üç gün. |
| AI destekli seyahat planlama | Rotasyon |
| Bir sonraki rotan seni bekliyor | Rotanı çiz. |
| Henüz bir gezin yok | Henüz rota yok. Bir şehir, iki tarih yeterli. |
| AI ipuçları | Pratik notlar |

## 9. Kaçınılan klişeler ve karşılıkları

| Klişe | Wayora kararı |
| :--- | :--- |
| Mor-mavi/teal gradient | Putty/krem zemin, düz renk |
| Gradient başlık | Tek renk Anton |
| Başlıkta emoji | Damga ve el yazısı not |
| Her yerde Inter | Anton + Public Sans + Plex Mono + Caveat |
| Renkli kenarlıklı kart | 2px mürekkep çerçeve |
| Glassmorphism | Opak kağıt yüzey |
| Düşük kontrast dark mode | Yüksek kontrast, sıcak kömür |
| Üç ikonlu kutu | Gün notu fişleri, ikon yok |
| Başlık üstü badge | Mono eyebrow |
| Lucide her yerde | Özel çizgi dili; çoğu yerde ikon yok |
| Varsayılan shadcn | Saf CSS |
| Scroll fade-in | Yok |
| Cursor beam | Yok |
| Hover'da solan buton | Renk değişir, buton kaybolmaz |
| Tutarsız boşluk | 4/8 ölçeği |
| Em dash | `·` ve `–` |
| Jenerik pazarlama dili | Somut başlık ve fiyat |
| Serif + italik vurgu | El yazısı yalnız notlarda |
| Space Grotesk + Instrument Serif | Anton + Public Sans |
| Gradient + grain | Düz kağıt |

## 10. Erişilebilirlik

- Normal metin en az 4.5:1; büyük metin/UI en az 3:1.
- 3px terracotta odak halkası, 2px offset.
- Dokunma hedefleri 44px; ikon butonlarda `aria-label`.
- Form etiketi, `aria-describedby`, `role="alert"`.
- Timeline/aktivite listeleri `role="list"`.
- Renk tek başına anlam taşımaz.

## 11. Uygulama

- Tokenlar: `web/src/index.css`.
- Fontlar: `web/index.html` Google Fonts bağlantısı.
- Fotoğraflar: `web/public/images/` (Unsplash, demo amaçlı).
- Favicon: `web/public/favicon.svg` (krem zemin, siyah W, terracotta nokta).
- Yeni bileşen eklerken mevcut radius/çizgi/damga dilini kullan.
- Görsel regresyon: landing, giriş, rotalar, plan detayı, yeni rota ve 500px mobil.
