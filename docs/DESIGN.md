# Tasarım temeli (W-16)

Ortak renkler, yazı tipi ve temel bileşenler. Figma'daki tasarım netleşince (Ezgi) değerleri burada ve
`web/src/index.css`'te birlikte güncelleyin.

## Renkler

`web/src/index.css` → `:root` değişkenleri. Açık ve koyu tema aynı isimleri kullanır.

| Değişken | Açık | Kullanım |
| :--- | :--- | :--- |
| `--bg` / `--surface` | `#f7f5f0` / `#ffffff` | Sayfa / kart arka planı |
| `--text` / `--muted` | `#1d2a2e` / `#5d6b6f` | Metin / ikincil metin |
| `--accent` | `#0f766e` | Marka rengi, birincil buton, bağlantılar |
| `--danger` | `#b42318` | Hata, silme |
| `--success` | `#1e7b34` | Başarı mesajı |
| `--border` | `#dcd8cf` | Kenarlıklar |

Yazı tipi: sistem yazı tipi (`--font`). Boşluk: `--space-1` … `--space-8`. Köşe: `--radius`.

## Bileşenler

`web/src/components/ui.tsx`

| Bileşen | Kullanım |
| :--- | :--- |
| `Button` | `variant="primary" \| "secondary" \| "danger"`. Varsayılan `type="button"`; formda `type="submit"` verin. |
| `Field` | Etiketli girdi. `error` verilirse girdi `aria-invalid` olur ve hata ekran okuyucuya bağlanır. |
| `Alert` | `kind="info" \| "error" \| "success"`. Hata `role="alert"` ile duyurulur. |
| `Card` | Kenarlıklı içerik kutusu. |

Sayfa düzeni: `web/src/components/Layout.tsx` (üst menü + içerik + alt bilgi). Sayfalar `web/src/routes.tsx`'e eklenir.
