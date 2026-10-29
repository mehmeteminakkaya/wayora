from pathlib import Path
from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.util import Inches, Pt
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / 'docs' / 'assets'
OUT = ROOT / 'docs' / 'Wayora-Sunum.pptx'

PUTTY = RGBColor(0xC8, 0xBC, 0xAA)
PAPER = RGBColor(0xF4, 0xEA, 0xDA)
CREAM = RGBColor(0xFB, 0xF3, 0xE5)
INK = RGBColor(0x1B, 0x18, 0x14)
MUTED = RGBColor(0x6B, 0x61, 0x54)
TERRA = RGBColor(0xB6, 0x47, 0x2B)
STAMP = RGBColor(0xA8, 0x3A, 0x2A)
OLIVE = RGBColor(0x6D, 0x73, 0x55)

DISPLAY = 'Arial Black'
BODY = 'Arial'
MONO = 'Consolas'

W = 13.333
H = 7.5

prs = Presentation()
prs.slide_width = Inches(W)
prs.slide_height = Inches(H)
blank = prs.slide_layouts[6]


def rgb(hex_value):
    return RGBColor.from_string(hex_value)


def rect(slide, x, y, w, h, fill=CREAM, line=INK, width=1.5):
    shape = slide.shapes.add_shape(1, Inches(x), Inches(y), Inches(w), Inches(h))
    shape.fill.solid()
    shape.fill.fore_color.rgb = fill
    if line is None:
        shape.line.fill.background()
    else:
        shape.line.color.rgb = line
        shape.line.width = Pt(width)
    shape.shadow.inherit = False
    return shape


def text(slide, value, x, y, w, h, size=16, color=INK, font=BODY, bold=False,
         align=PP_ALIGN.LEFT, valign=MSO_ANCHOR.TOP, spacing=1.0, margin=0):
    box = slide.shapes.add_textbox(Inches(x), Inches(y), Inches(w), Inches(h))
    tf = box.text_frame
    tf.word_wrap = True
    tf.margin_left = Inches(margin)
    tf.margin_right = Inches(margin)
    tf.margin_top = Inches(margin)
    tf.margin_bottom = Inches(margin)
    tf.vertical_anchor = valign
    p = tf.paragraphs[0]
    p.text = value
    p.alignment = align
    p.line_spacing = spacing
    for run in p.runs:
        run.font.name = font
        run.font.size = Pt(size)
        run.font.bold = bold
        run.font.color.rgb = color
    return box


def bullets(slide, items, x, y, w, h, size=14, color=INK, spacing=1.15):
    box = slide.shapes.add_textbox(Inches(x), Inches(y), Inches(w), Inches(h))
    tf = box.text_frame
    tf.word_wrap = True
    tf.margin_left = 0
    tf.margin_right = 0
    tf.margin_top = 0
    for index, item in enumerate(items):
        p = tf.paragraphs[0] if index == 0 else tf.add_paragraph()
        p.text = '•  ' + item
        p.space_after = Pt(6)
        p.line_spacing = spacing
        for run in p.runs:
            run.font.name = BODY
            run.font.size = Pt(size)
            run.font.color.rgb = color
    return box


def image_fit(slide, path, x, y, max_w, max_h, border=True):
    if not path.exists():
        return None
    with Image.open(path) as im:
        iw, ih = im.size
    scale = min(max_w / iw, max_h / ih)
    w = iw * scale
    h = ih * scale
    if border:
        rect(slide, x - 0.06, y - 0.06, w + 0.12, h + 0.12, fill=CREAM, line=INK, width=1)
    slide.shapes.add_picture(str(path), Inches(x), Inches(y), width=Inches(w), height=Inches(h))
    return (x, y, w, h)


def base(title, kicker, number):
    slide = prs.slides.add_slide(blank)
    bg = slide.background
    bg.fill.solid()
    bg.fill.fore_color.rgb = PUTTY
    rect(slide, 0.55, 0.32, W - 1.1, 0.02, fill=INK, line=None)
    text(slide, 'WAYORA', 0.62, 0.42, 2.2, 0.3, size=13, font=DISPLAY, color=INK)
    text(slide, '/ ROTASYON', 1.75, 0.47, 2.6, 0.25, size=7, font=MONO, color=MUTED)
    text(slide, kicker.upper(), 8.2, 0.46, 4.45, 0.25, size=7, font=MONO, color=MUTED, align=PP_ALIGN.RIGHT)
    text(slide, title, 0.62, 1.0, W - 1.25, 0.95, size=24, font=DISPLAY, color=INK, spacing=0.95)
    rect(slide, 0.62, 2.0, W - 1.24, 0.015, fill=INK, line=None)
    text(slide, 'WAYORA / ROTASYON', 0.62, 7.08, 3.2, 0.2, size=6.5, font=MONO, color=MUTED)
    text(slide, f'{number:02d}', 11.95, 7.05, 0.7, 0.25, size=8, font=MONO, color=INK, align=PP_ALIGN.RIGHT)
    return slide


def notes(slide, value):
    slide.notes_slide.notes_text_frame.text = value


# ---------------------------------------------------------------------------
# 01 · COVER
# ---------------------------------------------------------------------------
slide = prs.slides.add_slide(blank)
bg = slide.background
bg.fill.solid()
bg.fill.fore_color.rgb = PUTTY
rect(slide, 0.55, 0.32, W - 1.1, 0.02, fill=INK, line=None)
text(slide, 'WAYORA', 0.62, 0.43, 2.2, 0.3, size=14, font=DISPLAY, color=INK)
text(slide, '/ ROTASYON', 1.85, 0.48, 2.4, 0.25, size=7, font=MONO, color=MUTED)
text(slide, 'JOB-191 · 2026', 9.8, 0.47, 2.8, 0.25, size=7, font=MONO, color=MUTED, align=PP_ALIGN.RIGHT)

text(slide, 'SEYAHAT PLANLAMA / 01', 0.65, 1.02, 3.2, 0.25, size=8, font=MONO, color=TERRA)
text(slide, 'BİR ŞEHİR.', 0.62, 1.3, 6.8, 0.9, size=54, font=DISPLAY, color=INK, spacing=0.86)
text(slide, 'ÜÇ GÜN.', 0.62, 2.28, 6.8, 0.9, size=54, font=DISPLAY, color=INK, spacing=0.86)
text(slide, 'TEK ROTA.', 0.65, 3.22, 5.4, 0.4, size=20, font=DISPLAY, color=TERRA)
text(slide, 'AI destekli, bütçe odaklı ve düzenlenebilir seyahat planlama.', 0.66, 3.78, 5.7, 0.8, size=14, color=MUTED)
text(slide, 'JOB-191 · İstinye Üniversitesi', 0.66, 4.72, 5.2, 0.3, size=9, font=MONO, color=MUTED)
text(slide, 'Bayram Selim Yılmaz · Mehmet Emin Akkaya · Ezgi Turan · Aykut Kayra Akkuş · Berfin Aksoy', 0.66, 5.08, 6.3, 0.5, size=8, font=MONO, color=MUTED)

# mobile screenshot on a paper panel
rect(slide, 7.75, 0.72, 3.65, 6.1, fill=PAPER, line=INK, width=1.3)
image_fit(slide, ASSETS / 'mobile-home.png', 7.98, 0.95, 3.2, 5.6, border=False)
text(slide, 'PARİS // 14:02', 8.08, 6.6, 3.0, 0.2, size=6, font=MONO, color=CREAM, align=PP_ALIGN.CENTER)
notes(slide, 'Wayora, kullanıcının tercihlerine göre gün gün seyahat planı üreten bir web uygulaması. Bu sunum ürünü, mimariyi ve AI-native mühendislik yaklaşımını anlatır.')

# ---------------------------------------------------------------------------
# 02 · PROBLEM
# ---------------------------------------------------------------------------
slide = base('Planlamak hâlâ dağınık.', '01 / Problem', 2)
text(slide, 'Seyahat planlamak üç sekme, bir not defteri ve kayıp bir saat demek.', 0.65, 1.2, 11.6, 0.95, size=24, font=DISPLAY, color=INK, spacing=0.96)
text(slide, 'Gezgin; ilgi alanı, bütçe ve tempo arasında denge kurmak zorunda. Mevcut araçlar ya liste verir ya da düzenlenemeyen tek seferlik bir plan.', 0.68, 2.15, 9.0, 0.7, size=13, color=MUTED)

blocks = [
    ('01', 'DAĞINIK BİLGİ', 'Onlarca sekme, ekran görüntüsü ve not.'),
    ('02', 'GÖRÜNMEZ BÜTÇE', 'Maliyet planın sonunda ortaya çıkar.'),
    ('03', 'DÜZENLENEMEZ PLAN', 'Tek seferlik çıktı, kullanıcıya ait değil.'),
]
for index, (num, title, body) in enumerate(blocks):
    x = 0.65 + index * 4.15
    card = rect(slide, x, 3.3, 3.75, 2.2, fill=CREAM, line=INK, width=1.2)
    text(slide, num, x + 0.18, 3.48, 0.7, 0.4, size=24, font=DISPLAY, color=TERRA)
    text(slide, title, x + 0.18, 3.98, 3.2, 0.3, size=9, font=MONO, color=INK)
    text(slide, body, x + 0.18, 4.38, 3.25, 0.7, size=12, color=MUTED)
    rect(slide, x + 0.18, 5.18, 0.55, 0.02, fill=TERRA, line=None)
text(slide, 'Wayora bu üç dağınık parçayı tek bir okunabilir rotaya çevirir.', 0.65, 6.1, 10.0, 0.4, size=15, font=DISPLAY, color=INK)
notes(slide, 'Problem, kullanıcının çok fazla kaynak ve karar arasında kaybolması. Wayora karar sayısını azaltıp planı düzenlenebilir bir nesneye çeviriyor.')

# ---------------------------------------------------------------------------
# 03 · SOLUTION
# ---------------------------------------------------------------------------
slide = base('Bir plan değil, bir rota.', '02 / Çözüm', 3)
text(slide, 'GÜN GÜN PLAN.', 0.65, 1.2, 6.2, 0.7, size=36, font=DISPLAY, color=INK, spacing=0.9)
text(slide, 'SAAT SAAT GİT.', 0.65, 1.85, 6.2, 0.7, size=36, font=DISPLAY, color=TERRA, spacing=0.9)
text(slide, 'Wayora ilgi alanlarını, bütçeni ve temponu okur; şehri günlere, günleri saatlere böler.', 0.68, 2.7, 5.7, 0.8, size=14, color=MUTED)

steps = [
    ('01', 'Tercihleri gir', 'İlgi alanı, bütçe, tempo.'),
    ('02', 'Gezinin çerçevesini çiz', 'Şehir, tarih, bütçe.'),
    ('03', 'Planı kendine göre düzenle', 'Ekle, çıkar, saati değiştir.'),
]
for index, (num, title, body) in enumerate(steps):
    x = 6.85
    y = 1.35 + index * 1.65
    rect(slide, x, y, 5.55, 1.25, fill=CREAM, line=INK, width=1.1)
    text(slide, num, x + 0.18, y + 0.18, 0.6, 0.3, size=16, font=DISPLAY, color=TERRA)
    text(slide, title, x + 0.85, y + 0.16, 4.3, 0.3, size=13, font=DISPLAY, color=INK)
    text(slide, body, x + 0.85, y + 0.55, 4.3, 0.3, size=11, color=MUTED)
text(slide, 'Sonuç: 3 dakikada plan, 1 ekranda bütçe, istediğin zaman düzenleme.', 0.65, 5.85, 10.0, 0.4, size=13, font=MONO, color=MUTED)
notes(slide, 'Çözüm üç adıma indirildi. Plan bir çıktı değil, kullanıcıya ait düzenlenebilir bir defter.')

# ---------------------------------------------------------------------------
# 04 · PRODUCT
# ---------------------------------------------------------------------------
slide = base('Landing: çalışan bir plan vaadi.', '03 / Ürün', 4)
image_fit(slide, ASSETS / 'landing-hero.png', 0.65, 1.25, 7.4, 5.45)
text(slide, '01 / FİLM ÇERÇEVESİ', 8.4, 1.4, 4.2, 0.25, size=7, font=MONO, color=TERRA)
text(slide, 'Fotoğraf bir kart değil, sayfanın kanıtı.', 8.4, 1.7, 4.2, 0.5, size=14, font=DISPLAY, color=INK)
text(slide, '02 / ROTA FİŞİ', 8.4, 2.75, 4.2, 0.25, size=7, font=MONO, color=TERRA)
text(slide, 'Saat, durak ve fiyat aynı yüzeyde.', 8.4, 3.05, 4.2, 0.5, size=14, font=DISPLAY, color=INK)
text(slide, '03 / GÜNLÜK NOTLAR', 8.4, 4.1, 4.2, 0.25, size=7, font=MONO, color=TERRA)
text(slide, 'Üç ikon kutusu değil, üç günlük not.', 8.4, 4.4, 4.2, 0.5, size=14, font=DISPLAY, color=INK)
text(slide, 'Tasarım referansı: analog seyahat defteri.', 8.4, 5.55, 4.2, 0.4, size=9, font=MONO, color=MUTED)
notes(slide, 'Landing ekranı ürünün kendisini gösteriyor: film çerçeveli fotoğraf, rota fişi ve gün notları. Kullanıcıya soyut bir AI vaadi yerine somut bir plan gösteriliyor.')

# ---------------------------------------------------------------------------
# 05 · MOBILE
# ---------------------------------------------------------------------------
slide = base('Mobilde web sitesi değil, uygulama.', '04 / Mobil', 5)
image_fit(slide, ASSETS / 'mobile-home.png', 0.85, 1.3, 3.1, 5.25, border=True)
image_fit(slide, ASSETS / 'trip-detail-crop.png', 4.45, 1.55, 4.9, 4.9, border=True)
text(slide, 'Tek satır header.', 9.55, 1.45, 3.2, 0.3, size=12, font=DISPLAY, color=INK)
text(slide, 'Yalnız marka ve tek eylem.', 9.55, 1.78, 3.35, 0.4, size=10, color=MUTED)
text(slide, 'Sabit alt tab bar.', 9.55, 2.65, 3.2, 0.3, size=12, font=DISPLAY, color=INK)
text(slide, 'Rotasyon / Keşif / Kurulum.', 9.55, 2.98, 3.35, 0.4, size=10, color=MUTED)
text(slide, '375 px’te tam sığan ilk ekran.', 9.55, 3.85, 3.2, 0.3, size=12, font=DISPLAY, color=INK)
text(slide, 'Başlık, fotoğraf, rota fişi ve nav.', 9.55, 4.18, 3.35, 0.4, size=10, color=MUTED)
text(slide, 'Aktivite fişleri ve fiyat damgaları.', 9.55, 5.05, 3.35, 0.4, size=12, font=DISPLAY, color=INK)
text(slide, 'Plan okunur, düzenlenebilir.', 9.55, 5.38, 3.35, 0.4, size=10, color=MUTED)
notes(slide, 'Mobil ekran, referanstaki üç telefonun dilini gerçek ürüne taşıyor: büyük başlık, tam ekran film çerçeveli fotoğraf, rota fişi ve sabit alt menü.')

# ---------------------------------------------------------------------------
# 06 · JOURNEY
# ---------------------------------------------------------------------------
slide = base('3 dakikada plana.', '05 / Kullanıcı yolculuğu', 6)
journey = [
    ('01', 'KAYIT', 'E-posta + şifre\nveya yeni hesap'),
    ('02', 'TERCİH', 'İlgi alanı, bütçe,\ntempo'),
    ('03', 'GEZİ', 'Şehir, tarih,\nbütçe'),
    ('04', 'PLAN', 'AI üretir,\nkullanıcı düzenler'),
]
for index, (num, title, body) in enumerate(journey):
    x = 0.7 + index * 3.15
    rect(slide, x, 2.0, 2.75, 2.65, fill=CREAM, line=INK, width=1.2)
    text(slide, num, x + 0.2, 2.2, 0.55, 0.35, size=21, font=DISPLAY, color=TERRA)
    text(slide, title, x + 0.2, 2.75, 2.2, 0.3, size=10, font=MONO, color=INK)
    text(slide, body, x + 0.2, 3.15, 2.2, 0.8, size=12, color=MUTED)
    if index < 3:
        text(slide, '→', x + 2.82, 3.12, 0.3, 0.3, size=16, font=DISPLAY, color=TERRA, align=PP_ALIGN.CENTER)

text(slide, '≤ 3 EKRAN', 0.7, 5.2, 2.7, 0.55, size=24, font=DISPLAY, color=INK)
text(slide, '≤ 3 DAKİKA', 3.7, 5.2, 2.7, 0.55, size=24, font=DISPLAY, color=INK)
text(slide, '1 PLAN', 6.7, 5.2, 2.7, 0.55, size=24, font=DISPLAY, color=TERRA)
text(slide, 'Kayıttan plana kadar tek akış; gereksiz ekran ve karar yok.', 0.7, 5.9, 10.5, 0.4, size=12, color=MUTED)
notes(slide, 'Kullanıcı akışı üç ekrana indirildi. Onboarding, gezi formu ve plan detayı arasında geri dönüş yok.')

# ---------------------------------------------------------------------------
# 07 · ARCHITECTURE
# ---------------------------------------------------------------------------
slide = base('Tek repo, net sınırlar.', '06 / Mimari', 7)
# boxes
rect(slide, 0.7, 2.15, 2.65, 1.55, fill=CREAM, line=INK, width=1.2)
text(slide, 'WEB', 0.9, 2.32, 2.2, 0.3, size=12, font=DISPLAY, color=INK)
text(slide, 'React 19 · Vite\nReact Router', 0.9, 2.7, 2.2, 0.6, size=10, color=MUTED)

rect(slide, 4.1, 2.15, 2.65, 1.55, fill=CREAM, line=INK, width=1.2)
text(slide, 'API', 4.3, 2.32, 2.2, 0.3, size=12, font=DISPLAY, color=INK)
text(slide, 'Express 5 · TypeScript\nzod · JWT · rate limit', 4.3, 2.7, 2.3, 0.6, size=10, color=MUTED)

rect(slide, 7.5, 2.15, 2.65, 1.55, fill=CREAM, line=INK, width=1.2)
text(slide, 'VERİ', 7.7, 2.32, 2.2, 0.3, size=12, font=DISPLAY, color=INK)
text(slide, 'PostgreSQL\nPrisma 7', 7.7, 2.7, 2.2, 0.6, size=10, color=MUTED)

rect(slide, 2.4, 4.45, 3.05, 1.35, fill=CREAM, line=INK, width=1.2)
text(slide, 'AI SERVİSİ', 2.6, 4.6, 2.6, 0.3, size=11, font=DISPLAY, color=INK)
text(slide, 'offline · Gemini · OpenAI\nrouting + fallback', 2.6, 4.95, 2.65, 0.55, size=9, color=MUTED)

rect(slide, 6.9, 4.45, 3.05, 1.35, fill=CREAM, line=INK, width=1.2)
text(slide, 'YER KATALOĞU', 7.1, 4.6, 2.6, 0.3, size=11, font=DISPLAY, color=INK)
text(slide, 'yerleşik katalog\nPlace cache', 7.1, 4.95, 2.65, 0.55, size=9, color=MUTED)

# arrows
text(slide, '→', 3.45, 2.65, 0.5, 0.4, size=22, font=DISPLAY, color=TERRA)
text(slide, '→', 6.85, 2.65, 0.5, 0.4, size=22, font=DISPLAY, color=TERRA)
text(slide, '↘', 5.9, 3.55, 0.4, 0.4, size=18, font=DISPLAY, color=TERRA)
text(slide, '↘', 8.35, 3.55, 0.4, 0.4, size=18, font=DISPLAY, color=TERRA)
text(slide, 'Frontend hiçbir sağlayıcı anahtarı görmez. AI, API içinde tek servis üzerinden çağrılır.', 0.7, 6.2, 11.8, 0.4, size=10, font=MONO, color=MUTED)
notes(slide, 'Mimari iki workspace: web ve api. AI anahtarları yalnızca API tarafında. Veritabanı Prisma ile erişiliyor; Place tablosu kota ve maliyet için cache.')

# ---------------------------------------------------------------------------
# 08 · AI PIPELINE
# ---------------------------------------------------------------------------
slide = base('LLM bir kara kutu değil, doğrulanan bir servis.', '07 / AI', 8)
flow = [
    ('01', 'GİRDİ', 'Tarih, bütçe,\ntercih, not'),
    ('02', 'ADAYLAR', 'Katalogdan\nseçilmiş yerler'),
    ('03', 'ÜRETİM', 'Offline veya\nLLM'),
    ('04', 'ZOD', 'Şema ve\ngün kontrolü'),
    ('05', 'FİLTRE', 'Aday dışı\nID atılır'),
    ('06', 'KAYIT', 'Transaction\n+ tips'),
]
for index, (num, title, body) in enumerate(flow):
    x = 0.65 + index * 2.06
    rect(slide, x, 2.2, 1.82, 2.15, fill=CREAM, line=INK, width=1)
    text(slide, num, x + 0.12, 2.35, 0.4, 0.25, size=8, font=MONO, color=TERRA)
    text(slide, title, x + 0.12, 2.68, 1.55, 0.25, size=8, font=MONO, color=INK)
    text(slide, body, x + 0.12, 3.05, 1.5, 0.7, size=9, color=MUTED)
    if index < 5:
        text(slide, '→', x + 1.85, 3.05, 0.2, 0.3, size=14, font=DISPLAY, color=TERRA)

rect(slide, 0.65, 5.05, 11.9, 0.85, fill=CREAM, line=INK, width=1)
text(slide, 'FALLBACK', 0.85, 5.2, 1.4, 0.2, size=8, font=MONO, color=STAMP)
text(slide, 'Sağlayıcı hatası, timeout veya şema uyuşmazlığında deterministik offline üretici devreye girer; kullanıcı ham hata görmez.', 1.95, 5.18, 10.3, 0.45, size=10, color=INK)
text(slide, 'Model routing: itinerary → güçlü model · quick_tip → hızlı model · günlük limit + timeout', 0.65, 6.25, 11.9, 0.3, size=8, font=MONO, color=MUTED)
notes(slide, 'AI çıktısı doğrudan yazılmıyor. Önce şema, sonra aday filtresi, sonra transaction. Sağlayıcı hatasında offline üretici devreye giriyor.')

# ---------------------------------------------------------------------------
# 09 · SECURITY
# ---------------------------------------------------------------------------
slide = base('Güvenlik sonradan eklenen bir katman değil.', '08 / Güvenlik', 9)
cards = [
    ('01', 'KİMLİK', 'JWT httpOnly cookie, bcrypt cost 12. Her sorguda userId filtresi.'),
    ('02', 'GİRDİ', 'Tüm gövde ve parametreler zod ile doğrulanır. Standart hata biçimi.'),
    ('03', 'PROMPT', 'Kullanıcı notu <untrusted_user_notes> içinde; çıktı şema + aday filtresi.'),
    ('04', 'KÖTÜYE KULLANIM', 'Auth 30/15 dk; AI günlük limit. Secret yok; gitleaks/CodeQL/Semgrep.'),
]
for index, (num, title, body) in enumerate(cards):
    x = 0.65 + (index % 2) * 6.2
    y = 2.15 + (index // 2) * 2.05
    rect(slide, x, y, 5.85, 1.75, fill=CREAM, line=INK, width=1.1)
    text(slide, num, x + 0.2, y + 0.18, 0.55, 0.25, size=16, font=DISPLAY, color=TERRA)
    text(slide, title, x + 0.85, y + 0.2, 4.5, 0.25, size=9, font=MONO, color=INK)
    text(slide, body, x + 0.85, y + 0.58, 4.65, 0.8, size=11, color=MUTED)
text(slide, '51 API + 4 web testi · 0 audit vulnerability · CI her PR’da', 0.65, 6.55, 11.8, 0.3, size=9, font=MONO, color=MUTED)
notes(slide, 'Güvenlik; kimlik, girdi, prompt ve kötüye kullanım olarak dört katmanda ele alındı. Prompt injection testi servis testleri içinde.')

# ---------------------------------------------------------------------------
# 10 · AI-AUGMENTED ENGINEERING
# ---------------------------------------------------------------------------
slide = base('Repo, agent’ın da okuyabildiği bir ürün.', '09 / AI-native mühendislik', 10)
practices = [
    ('01', 'SDD', 'constitution · spec\nplan · tasks'),
    ('02', 'AGENTS', 'kök + api + web\nscoped talimat'),
    ('03', 'SKILLS', 'feature · review\nsecurity'),
    ('04', 'MCP', 'Wayora Context\nAPI + docs'),
    ('05', 'AI REVIEW', 'CodeRabbit + rubric\ninsan onayı'),
    ('06', 'CI', 'lint · test · build\ngitleaks · CodeQL'),
]
for index, (num, title, body) in enumerate(practices):
    x = 0.65 + (index % 3) * 4.15
    y = 2.0 + (index // 3) * 1.95
    rect(slide, x, y, 3.8, 1.65, fill=CREAM, line=INK, width=1.1)
    text(slide, num, x + 0.16, y + 0.16, 0.45, 0.25, size=9, font=MONO, color=TERRA)
    text(slide, title, x + 0.65, y + 0.18, 2.8, 0.25, size=9, font=MONO, color=INK)
    text(slide, body, x + 0.65, y + 0.55, 2.9, 0.65, size=10, color=MUTED)
text(slide, 'Aynı komutlar, aynı kurallar, aynı kabul kriterleri: insan ve agent aynı hattı kullanır.', 0.65, 6.3, 11.8, 0.3, size=10, font=MONO, color=MUTED)
notes(slide, 'Dersin haftalık pratikleri repoya işlendi: SDD artefaktları, AGENTS.md, skill’ler, MCP sunucusu, AI review ve CI. Amaç agent’ın bağlamı hızlı bulması.')

# ---------------------------------------------------------------------------
# 11 · PROJECT MANAGEMENT
# ---------------------------------------------------------------------------
slide = base('Sprint 0’dan MVP’ye.', '10 / Proje yönetimi', 11)
sprints = [
    ('S0', 'Kurulum', 'TAMAM'),
    ('S1', 'Auth + CRUD', 'TAMAM'),
    ('S2', 'Yerler + spike', 'KISMİ'),
    ('S3', 'AI MVP', 'TAMAM'),
    ('S4', 'Düzenleme', 'KISMİ'),
    ('S5', 'Kalite + demo', 'DEVAM'),
]
for index, (code, title, status) in enumerate(sprints):
    x = 0.65 + index * 2.07
    rect(slide, x, 2.35, 1.8, 1.6, fill=CREAM, line=INK, width=1)
    text(slide, code, x + 0.12, 2.5, 0.5, 0.25, size=8, font=MONO, color=TERRA)
    text(slide, title, x + 0.12, 2.85, 1.55, 0.5, size=10, font=DISPLAY, color=INK)
    text(slide, status, x + 0.12, 3.5, 1.5, 0.25, size=7, font=MONO, color=OLIVE if status == 'TAMAM' else (STAMP if status == 'AÇIK' else MUTED))
    if index < 5:
        text(slide, '—', x + 1.8, 3.0, 0.3, 0.25, size=10, font=MONO, color=MUTED)

text(slide, 'RİSKLER', 0.65, 4.55, 1.2, 0.25, size=8, font=MONO, color=TERRA)
text(slide, 'LLM halüsinasyonu · kota/maliyet · prompt injection · Google Maps faturası · kapsam kayması', 1.7, 4.52, 10.5, 0.45, size=11, color=INK)
text(slide, 'RİTİM', 0.65, 5.25, 1.2, 0.25, size=8, font=MONO, color=TERRA)
text(slide, '2 haftalık sprint · günlük async standup · review + retro · her iş branch + PR + yeşil CI', 1.7, 5.22, 10.7, 0.45, size=11, color=INK)
text(slide, 'Takım: PO + frontend · Scrum Master + backend/AI · designer · database · frontend/test', 0.65, 6.1, 11.8, 0.3, size=9, font=MONO, color=MUTED)
notes(slide, 'Sprint 0-3 tamamlandı; Sprint 4’te sürükle-bırak, Sprint 5’te deploy ve demo açık. Riskler ve azaltma planları proje yönetimi belgesinde.')

# ---------------------------------------------------------------------------
# 12 · QUALITY
# ---------------------------------------------------------------------------
slide = base('Kanıt: testler ve CI.', '11 / Kalite', 12)
text(slide, '51', 0.65, 2.1, 2.3, 1.1, size=76, font=DISPLAY, color=TERRA)
text(slide, 'API TESTİ', 0.72, 3.25, 2.2, 0.25, size=9, font=MONO, color=INK)
text(slide, '4', 3.3, 2.1, 1.3, 1.1, size=76, font=DISPLAY, color=TERRA)
text(slide, 'WEB TESTİ', 3.37, 3.25, 1.8, 0.25, size=9, font=MONO, color=INK)
text(slide, '0', 5.1, 2.1, 1.3, 1.1, size=76, font=DISPLAY, color=OLIVE)
text(slide, 'AUDIT BULGUSU', 5.17, 3.25, 2.2, 0.25, size=9, font=MONO, color=INK)
text(slide, 'Lint · typecheck · test · build · audit · gitleaks · CodeQL · Semgrep', 0.68, 4.1, 11.5, 0.35, size=11, color=MUTED)
rect(slide, 0.65, 4.75, 11.9, 0.015, fill=INK, line=None)
text(slide, 'Kritik akışlar', 0.65, 4.95, 3.0, 0.3, size=13, font=DISPLAY, color=INK)
bullets(slide, ['Auth başarı + hata yolları', 'Gezi doğrulama ve sahiplik', 'Offline plan + halüsinasyon filtresi', 'Prompt sınırı + fallback', 'Landing, login, korumalı rota, boş liste'], 0.65, 5.35, 11.3, 1.3, size=10, spacing=1.1)
notes(slide, 'Kalite deterministik guardrail’lere dayanıyor: 51 API, 4 web testi, lint, tip, build, audit, gitleaks, CodeQL ve Semgrep.')

# ---------------------------------------------------------------------------
# 13 · DEMO
# ---------------------------------------------------------------------------
slide = base('5 dakikada uçtan uca.', '12 / Demo', 13)
steps = [
    ('01', 'Kayıt ol', 'E-posta + şifre'),
    ('02', 'Tercihleri seç', 'Müze + yemek, orta bütçe'),
    ('03', 'Paris, 3 gün', '500 € bütçe'),
    ('04', 'Planı üret', 'AI ile gün gün plan'),
    ('05', 'Düzenle', 'Aktivite ekle / sil'),
]
for index, (num, title, body) in enumerate(steps):
    x = 0.65 + index * 2.4
    rect(slide, x, 2.15, 2.05, 1.8, fill=CREAM, line=INK, width=1)
    text(slide, num, x + 0.14, 2.3, 0.4, 0.25, size=8, font=MONO, color=TERRA)
    text(slide, title, x + 0.14, 2.62, 1.75, 0.35, size=11, font=DISPLAY, color=INK)
    text(slide, body, x + 0.14, 3.1, 1.7, 0.6, size=9, color=MUTED)
text(slide, '5:00', 0.65, 4.7, 2.0, 0.8, size=44, font=DISPLAY, color=TERRA)
text(slide, 'Demo hedefi: kayıttan düzenlenmiş plana kadar tek akış.', 2.2, 4.95, 8.8, 0.5, size=13, color=INK)
text(slide, 'http://localhost:5180', 0.65, 5.95, 5.0, 0.3, size=10, font=MONO, color=MUTED)
text(slide, 'E2E: e2e-1792740709@example.com / parola123', 0.65, 6.3, 8.0, 0.3, size=8, font=MONO, color=MUTED)
notes(slide, 'Demo: kayıt, tercih, Paris 3 gün, plan üret, aktivite düzenle. Offline modda hızlı; LLM modunda fallback anlatılır.')

# ---------------------------------------------------------------------------
# 14 · CLOSE
# ---------------------------------------------------------------------------
slide = prs.slides.add_slide(blank)
bg = slide.background
bg.fill.solid()
bg.fill.fore_color.rgb = INK
text(slide, 'WAYORA / ROTASYON', 0.65, 0.46, 5.0, 0.25, size=8, font=MONO, color=PAPER)
text(slide, 'SORULAR?', 0.65, 1.2, 8.5, 1.0, size=58, font=DISPLAY, color=PAPER, spacing=0.9)
text(slide, 'Sırada: harita pinleri, sürükle-bırak, kısmi AI üretimi, deploy ve paylaşılabilir plan.', 0.68, 2.65, 10.5, 0.8, size=15, color=PAPER)
rect(slide, 0.65, 3.75, 11.9, 0.02, fill=TERRA, line=None)
text(slide, 'Teşekkürler.', 0.65, 4.0, 6.0, 0.6, size=26, font=DISPLAY, color=PAPER)
text(slide, 'Bayram Selim Yılmaz · Mehmet Emin Akkaya · Ezgi Turan · Aykut Kayra Akkuş · Berfin Aksoy', 0.68, 4.85, 10.8, 0.4, size=9, font=MONO, color=MUTED)
text(slide, 'github.com/mehmeteminakkaya/wayora', 0.68, 5.55, 8.0, 0.3, size=9, font=MONO, color=TERRA)
text(slide, 'JOB-191 · İstinye Üniversitesi · 2026', 0.68, 6.55, 8.0, 0.3, size=8, font=MONO, color=MUTED)
notes(slide, 'Kapanış: ürün demo edilebilir, testler yeşil, agent artefaktları hazır. Sonraki adımlar harita, sürükle-bırak, kısmi AI ve deploy.')

prs.save(OUT)
print('wrote', OUT)
