from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "docs" / "professor" / "assets"
OUT.mkdir(parents=True, exist_ok=True)

W, H = 1600, 900
BG = "#F3F3F1"
SURFACE = "#FFFFFF"
INK = "#121212"
INK2 = "#55575C"
LINE = "#DEDED9"
SIGNAL = "#FFC400"
GO = "#1D7A4A"

FONT = "C:/Windows/Fonts/arial.ttf"
FONT_BOLD = "C:/Windows/Fonts/arialbd.ttf"
FONT_MONO = "C:/Windows/Fonts/consola.ttf"


def font(size: int, bold=False):
    return ImageFont.truetype(FONT_BOLD if bold else FONT, size)


def mono(size: int):
    return ImageFont.truetype(FONT_MONO, size)


def canvas(title: str, subtitle: str):
    image = Image.new("RGB", (W, H), BG)
    draw = ImageDraw.Draw(image)
    draw.text((64, 46), "WAYORA / JOB-191", font=mono(18), fill=INK2)
    draw.text((64, 84), title, font=font(42, True), fill=INK)
    draw.text((64, 142), subtitle, font=font(19), fill=INK2)
    draw.rectangle((64, 180, W - 64, 184), fill=SIGNAL)
    return image, draw


def box(draw, x, y, w, h, title, detail="", fill=SURFACE, border=LINE, accent=False):
    draw.rounded_rectangle((x, y, x + w, y + h), radius=14, fill=fill, outline=border, width=2)
    if accent:
        draw.rectangle((x, y, x + 8, y + h), fill=SIGNAL)
    draw.text((x + 20, y + 16), title, font=font(21, True), fill=INK)
    if detail:
        draw.multiline_text((x + 20, y + 50), detail, font=font(14), fill=INK2, spacing=5)


def arrow(draw, start, end, label="", color=INK2, width=2):
    draw.line((start, end), fill=color, width=width)
    import math
    angle = math.atan2(end[1] - start[1], end[0] - start[0])
    length = 13
    for offset in (-0.55, 0.55):
        point = (
            end[0] - length * math.cos(angle + offset),
            end[1] - length * math.sin(angle + offset),
        )
        draw.line((end, point), fill=color, width=width)
    if label:
        mx, my = (start[0] + end[0]) / 2, (start[1] + end[1]) / 2
        draw.text((mx + 8, my - 24), label, font=mono(13), fill=INK2)


def footer(draw, text):
    draw.text((64, H - 44), text, font=mono(13), fill=INK2)


# 1. System context
image, draw = canvas(
    "Sistem Bağlamı",
    "Kullanıcı, Vercel servisleri, veri katmanı ve dış sağlayıcılar",
)
box(draw, 64, 300, 240, 150, "Kullanıcı", "Tarayıcı / mobil web\nReact Router, fetch")
box(draw, 390, 235, 300, 120, "Vercel Web", "React 19 · Vite\nV2 arayüz")
box(draw, 390, 430, 300, 130, "Vercel API", "Express 5 · TypeScript\nzod · JWT cookie")
box(draw, 810, 220, 280, 115, "Neon PostgreSQL", "Prisma 7\nkullanıcı, rota, katalog, sosyal", accent=True)
box(draw, 810, 360, 280, 105, "DeepSeek", "AI plan üretimi\nopsiyonel web research")
box(draw, 810, 490, 280, 95, "Ticketmaster", "canlı etkinlikler")
box(draw, 810, 610, 280, 85, "Duffel", "opsiyonel uçuş fikri")
box(draw, 1180, 610, 300, 120, "MCP Context", "Yerel geliştirici aracı\nstdio · JSON-RPC 2.0")

arrow(draw, (304, 375), (390, 300), "HTTPS")
arrow(draw, (540, 355), (540, 430), "REST/JSON")
arrow(draw, (690, 260), (810, 260), "Prisma")
arrow(draw, (690, 480), (810, 410), "LLM")
arrow(draw, (690, 510), (810, 530), "API")
arrow(draw, (690, 540), (810, 650), "API")
arrow(draw, (1180, 665), (700, 545), "geliştirici bağlamı", color=GO)
footer(draw, "Secret'lar yalnızca Vercel env · Tarayıcıya yalnızca public API yanıtı gider.")
image.save(OUT / "architecture-context.png")

# 2. AI flow
image, draw = canvas(
    "AI Plan Üretim Akışı",
    "Katalog adaylarından doğrulanmış, kalıcı plana",
)
steps = [
    (64, "1 · Girdi", "şehir, tarih,\nbütçe, tercih"),
    (316, "2 · Adaylar", "14 şehir katalogu\n+ yer filtresi"),
    (568, "3 · Bağlam", "DeepSeek Search\nopsiyonel, hata toleranslı"),
    (820, "4 · LLM", "JSON plan\nmodel routing"),
    (1072, "5 · Doğrulama", "zod · aday ID\nmaliyet · dedupe"),
    (1324, "6 · Kayıt", "TripDay / Activity\nUI + tips"),
]
for x, title, detail in steps:
    box(draw, x, 270, 210, 150, title, detail)
for index in range(len(steps) - 1):
    arrow(draw, (steps[index][0] + 210, 345), (steps[index + 1][0], 345))
box(draw, 64, 520, 500, 130, "Offline fallback", "sağlayıcı hatası / timeout / şema uyuşmazlığı\n→ deterministik plan, kullanıcıya ham hata yok", fill="#FFFDF2", border=SIGNAL)
arrow(draw, (820, 420), (560, 520), "hata", color="#B42318")
box(draw, 620, 520, 480, 130, "Güvenlik sınırı", "aday olmayan googlePlaceId atılır\nkullanıcı notu <untrusted_user_notes> içinde")
box(draw, 1150, 520, 384, 130, "Gözlemlenebilirlik", "provider · model\nfallback · latencyMs")
footer(draw, "LLM çıktısı doğrudan DB'ye yazılmaz; normalize edilmeden plan kabul edilmez.")
image.save(OUT / "architecture-ai-flow.png")

# 3. Deployment
image, draw = canvas(
    "Deploy ve Ortam",
    "Vercel Services + Neon + MCP local",
)
box(draw, 64, 280, 260, 150, "Kullanıcı", "tarayıcı / PWA hissi\nHTTPS")
box(draw, 420, 210, 320, 130, "Vercel · web", "static Vite build\nSPA rewrite", accent=True)
box(draw, 420, 410, 320, 145, "Vercel · api", "Express serverless\napp.mts entrypoint", accent=True)
box(draw, 850, 280, 300, 150, "Neon PostgreSQL", "pooled + unpooled\nPrisma migrations", accent=True)
box(draw, 1230, 190, 300, 130, "Vercel env", "DeepSeek / Ticketmaster\nJWT / DATABASE_URL")
arrow(draw, (324, 355), (420, 275), "HTTPS")
arrow(draw, (580, 340), (580, 410), "service")
arrow(draw, (740, 480), (850, 380), "Prisma")
draw.text((1250, 330), "runtime env → API", font=mono(13), fill=INK2)
box(draw, 64, 535, 300, 130, "Build kapısı", "npm run db:generate\nlint · typecheck · test · build")
box(draw, 400, 535, 320, 130, "Güvenlik", "httpOnly cookie · CORS\nhelmet · rate limit · secret scan")
box(draw, 760, 535, 280, 130, "Sağlık", "/api/health\nDB + API durumu")
box(draw, 1180, 535, 356, 130, "MCP local", "Wayora Context · stdio\nrepo docs + API bağlamı")
arrow(draw, (1180, 540), (740, 475), "araç", color=GO)
footer(draw, ".vercelignore: local dist ve .env yüklenmez; migration deploy ayrı ve kontrollü çalışır.")
image.save(OUT / "architecture-deploy.png")

print("wrote architecture diagrams")
