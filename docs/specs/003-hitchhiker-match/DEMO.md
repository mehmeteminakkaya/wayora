# Yol Arkadaşları · Local Demo

Bu klasördeki demo verisi yalnızca sunum ve geliştirme içindir. Varsayılan olarak
local veritabanına yazılır. Production demo kasıtlı olarak ayrı bir onay ister:
`DEMO_SEED_ALLOW_PRODUCTION=true`. Bu onay verilmezse `seed-demo.ts` production
veya uzak `DATABASE_URL` ile çalışmayı reddeder.

## Çalıştırma

```bash
npm run db:start -w api
npm run dev -w api
npm run demo:seed -w api
```

`npm run demo:seed -w api` komutu local veritabanındaki eski `demo@wayora.app` ve
`demo+...@wayora.app` kayıtlarını temizler, ardından yeni demo verisini oluşturur.

Production demo verisi oluşturmak için (sunum sonrası ilgili demo hesapları
temizlemek kaydıyla):

```bash
# api/.env yerine production DATABASE_URL_UNPOOLED kullanılmalıdır.
DEMO_SEED_ALLOW_PRODUCTION=true npm run demo:seed -w api
```

## Demo hesabı

```text
E-posta: demo@wayora.app
Şifre:   demo1234
```

Demo hesabının rotası: **5-9 Aralık 2026, Berlin**.

## Demo verisi

- 75 görünür gezgin profili.
- 55 Berlin, 20 farklı şehir rotası.
- 20 eşleşme kartı (API üst sınırı).
- 3 gelen bağlantı isteği.
- 1 giden bağlantı isteği.
- 2 kabul edilmiş sohbet ve örnek mesajlar.
- Bazı profillerde ev sahipliği niyeti ve kısa not.

Profillerin tamamı aynı demo şifresini kullanır; bu hesaplar yalnızca sunum
içindir. Gerçek kullanıcı doğrulaması, moderasyon veya konaklama rezervasyonu
değildir.

Demo verisini temizlemek için:

```bash
npm run demo:clear -w api
```

Production temizliği için aynı `DEMO_SEED_ALLOW_PRODUCTION=true` onayı gerekir.
