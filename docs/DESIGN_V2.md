# Wayora V2 Tasarım Sistemi

Bu dosya, `Wayora Mobil Tasarım.pdf` belgesindeki kuralların uygulama özetidir. V2'de bu
kurallar tek referanstır. Eski Rotasyon tasarımı geçersizdir.

## Temel ilkeler

1. Fotoğraf karar verdirir. Şehir ve deneyim kartlarında gerçek fotoğraf kullan. Tipografik
   plaka yok.
2. Fiyat, süre ve puan her zaman kartın içinde, başlığın hemen altında ve en az 14 px.
3. Her ekranda tek ana eylem. Mobilde ana eylem başparmak bölgesinde, sabit alt çubukta.
4. Sarı yalnızca "seçili / aktif" durumu gösterir. Buton rengi veya dekorasyon değildir.
5. Siyah pano yalnızca rota detayındaki gün özeti ve yaklaşan gezi kartındaki geri sayım için.
6. Düz yüzeyler: 1 px çizgi, gölge yok. Döndürülmüş kart, kâğıt dokusu, damga, el yazısı,
   gradyan, emoji yok.

## Renkler

```css
--bg: #F3F3F1;
--surface: #FFFFFF;
--ink: #121212;
--ink-2: #55575C;
--line: #DEDED9;
--signal: #FFC400;
--board: #141414;
--go: #1D7A4A;
--stop: #B42318;
```

- Krem zemin, terracotta ve koyu tema yok.
- Sarı zemin üzerinde her zaman `ink` metin kullan.

## Tipografi

- Overpass ve Overpass Mono.
- Anton yalnızca pazarlama görsellerinde; ürün ekranında kullanılmaz.
- Display 30/34 800.
- H1 24/30 800.
- H2 19/24 700.
- Gövde 16/24 400.
- Small 14/20 400.
- Label 12/16 700. En küçük metin 12 px.
- Veri: Overpass Mono 14-18 px, 600.

## Bileşenler

- Buton: 48 px yükseklik, 4 px radius. Birincil ink dolu, ikincil çerçeveli, üçüncül altı
  çizili metin. Sarı buton yok.
- Filtre çipi: 36 px görünür, 44 px dokunma alanı. Seçili: sarı zemin + ink kenar, tik yok.
- Gün sekmesi: büyük numara + tarih. Aktif gün sarı.
- Pano: siyah zemin, sarı mono, tek satır, en fazla 4 veri.
- İkon: Lucide, 24 px, çizgi 1,75.
- Alt menü: 64 px + güvenli alan, 4 sekme: Keşfet, Rotalarım, Planla, Profil.
  Aktif sekmenin üstünde 3 px sarı çizgi, ikon + 12 px etiket.
- Sabit alt çubuk: detay ekranlarında birincil eylem + fiyat, 72 px + güvenli alan, beyaz zemin,
  üstte 1 px çizgi.
- Kartlar: 8 px radius, 1 px çizgi, gölgesiz.
- Buton, çip, input: 4 px radius. Hap buton yok.
- Boşluk: 4, 8, 12, 16, 24, 32, 48. Ekran kenarı 16, bölüm arası 32.
- Dokunma alanı en az 44 x 44.
- Fotoğraf oranları: şehir 16:10, deneyim 4:3, detay hero 4:3, liste küçük resmi 1:1 88 px.
- Fotoğraf üzerine metin bindirme, filtre veya vinyet yok. Başlık fotoğrafın altında.

## Sayfalar

- Landing: logo, giriş, arama, planı başlat, 3 adım, şehirler, örnek gün, footer.
- Giriş: e-posta, şifre, şifremi unuttum, giriş, Google, kayıt bağlantısı.
- Onboarding: 3 adım. Adım 1 ilgi alanları, adım 2 bütçe, adım 3 tempo. Üstte ilerleme.
- Keşfet: arama, kategori çipleri, 10 şehir, sıralama, fotoğraflı şehir kartları.
- Şehir: hero fotoğraf, geri, şehir bilgisi, filtreler, deneyim satırları, seçim, sabit CTA.
- Deneyim detayı: hero fotoğraf, açıklama, süre/fiyat/puan, harita, bilmen gerekenler, sabit
  "Plana ekle".
- Rotalarım: yaklaşan, taslak, geçmiş sekmeleri; yaklaşan kartta siyah geri sayım panosu.
- Yeni rota: adım göstergesi, şehir/tarih, hızlı tarih seçenekleri, devam.
- Rota detayı: başlık, tarih/bütçe, liste/harita, gün sekmeleri, siyah gün panosu, zaman
  çizelgesi, sürükle sırala, sabit "güne durak ekle".
- Profil: kullanıcı bilgisi, tercihler, hesap işlemleri.

## V2'de yasak

- Krem, terracotta, kâğıt dokusu, tane, damga, el yazısı, döndürülmüş kart, gölge, gradient,
  emoji, koyu tema, Anton ürün ekranında, hap buton, sarı buton.
