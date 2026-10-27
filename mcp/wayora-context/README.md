# Wayora Context MCP

Wayora hakkında **canlı bağlam** sağlayan küçük bir [MCP](https://modelcontextprotocol.io/)
sunucusu. Agent; API'nin durumunu, yer kataloğunu, bir gezi planını ve repo dokümanlarını
araç çağrısıyla okuyabilir.

> Bu sunucu yalnızca yerel geliştirme içindir. İnternete açılmaz, STDIO transport kullanır.

## Kurulum

```bash
cd mcp/wayora-context
npm install
```

Wayora API'si çalışıyor olmalı:

```bash
npm run dev          # kök dizinden (db + api + web)
```

## Oturum çerezi

`search_places` ve `get_trip` korumalı endpoint'leri kullanır. Çerezi bir kez alın:

```bash
curl -i -X POST http://localhost:4000/api/auth/login \
  -H "content-type: application/json" \
  -d '{"email":"ornek@eposta.com","password":"parola123"}'
```

Yanıttaki `Set-Cookie` satırındaki `wayora_session=...` değerini `WAYORA_COOKIE` olarak verin.

## Çalıştırma

```bash
WAYORA_API_URL=http://localhost:4000 \
WAYORA_COOKIE="wayora_session=..." \
node server.mjs
```

Windows PowerShell:

```powershell
$env:WAYORA_COOKIE="wayora_session=..."
node server.mjs
```

## MCP istemcisine kaydetme

`/.mcp.json` örneğini kullanın veya istemcinizin yapılandırmasına ekleyin:

```json
{
  "mcpServers": {
    "wayora-context": {
      "command": "node",
      "args": ["mcp/wayora-context/server.mjs"],
      "env": {
        "WAYORA_API_URL": "http://localhost:4000",
        "WAYORA_COOKIE": "wayora_session=..."
      }
    }
  }
}
```

Çerezi repoya commit'lemeyin.

## Araçlar

| Araç | Parametreler | Dönüş |
| :--- | :--- | :--- |
| `get_health` | yok | `{ status, db }` |
| `search_places` | `query`, `destination?` | `{ places: [...] }` |
| `get_trip` | `tripId` (uuid) | `{ trip: { days, activities, tips } }` |
| `list_docs` | yok | `{ docs: ["docs/..."] }` |
| `read_doc` | `path` | `{ path, content }` |

`read_doc` yol doğrulaması yapar; `docs/` dışına çıkan veya `.md` olmayan istekler reddedilir.

## Örnek agent akışı

1. `get_health` → API ayakta mı?
2. `list_docs` → `specs/001-mvp/spec.md` yolunu bul.
3. `read_doc` → kabul kriterlerini oku.
4. `search_places` → Paris için aday yerleri getir.
5. `get_trip` → mevcut planı incele ve boşlukları raporla.

## Notlar

- `@modelcontextprotocol/sdk` ve `zod` bu klasörün kendi `node_modules`'ındadır; kök workspace'e
  dahil değildir, CI build'ini etkilemez.
- Hata durumunda araç `isError: true` ve açıklayıcı metin döner; sunucu çökmez.
