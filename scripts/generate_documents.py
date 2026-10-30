from pathlib import Path
from docx import Document
from docx.enum.section import WD_SECTION
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm, Pt, RGBColor

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / 'docs' / 'assets'
OUT = ROOT / 'docs'

INK = RGBColor(0x1B, 0x18, 0x14)
TERRA = RGBColor(0xB6, 0x47, 0x2B)
MUTED = RGBColor(0x6B, 0x61, 0x54)
PAPER = 'F4EADA'
CREAM = 'FBF3E5'
PUTTY = 'C8BCAA'
OLIVE = '6D7355'

BODY_FONT = 'Arial'
DISPLAY_FONT = 'Arial Black'
MONO_FONT = 'Consolas'


def shade(cell, hex_fill):
    tc_pr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement('w:shd')
    shd.set(qn('w:fill'), hex_fill)
    tc_pr.append(shd)


def set_cell_margins(cell, top=70, start=90, bottom=70, end=90):
    tc = cell._tc
    tc_pr = tc.get_or_add_tcPr()
    tc_mar = tc_pr.first_child_found_in('w:tcMar')
    if tc_mar is None:
        tc_mar = OxmlElement('w:tcMar')
        tc_pr.append(tc_mar)
    for tag, value in [('w:top', top), ('w:start', start), ('w:bottom', bottom), ('w:end', end)]:
        node = OxmlElement(tag)
        node.set(qn('w:w'), str(value))
        node.set(qn('w:type'), 'dxa')
        tc_mar.append(node)


def add_page_field(paragraph):
    run = paragraph.add_run()
    begin = OxmlElement('w:fldChar')
    begin.set(qn('w:fldCharType'), 'begin')
    instr = OxmlElement('w:instrText')
    instr.set(qn('xml:space'), 'preserve')
    instr.text = 'PAGE'
    end = OxmlElement('w:fldChar')
    end.set(qn('w:fldCharType'), 'end')
    run._r.append(begin)
    run._r.append(instr)
    run._r.append(end)


def setup_document():
    doc = Document()
    section = doc.sections[0]
    section.top_margin = Cm(2.1)
    section.bottom_margin = Cm(2.0)
    section.left_margin = Cm(2.1)
    section.right_margin = Cm(2.1)

    styles = doc.styles
    normal = styles['Normal']
    normal.font.name = BODY_FONT
    normal.font.size = Pt(10.5)
    normal.font.color.rgb = INK
    normal.paragraph_format.space_after = Pt(4)
    normal.paragraph_format.line_spacing = 1.15

    for name, size, color, before, after in [
        ('Heading 1', 19, INK, 20, 8),
        ('Heading 2', 13, TERRA, 14, 5),
        ('Heading 3', 11, INK, 10, 3),
    ]:
        style = styles[name]
        style.font.name = DISPLAY_FONT if name == 'Heading 1' else BODY_FONT
        style.font.size = Pt(size)
        style.font.bold = True
        style.font.color.rgb = color
        style.paragraph_format.space_before = Pt(before)
        style.paragraph_format.space_after = Pt(after)
        style.paragraph_format.keep_with_next = True

    header = section.header.paragraphs[0]
    header.text = 'WAYORA / ROTASYON'
    header.alignment = WD_ALIGN_PARAGRAPH.LEFT
    for run in header.runs:
        run.font.name = DISPLAY_FONT
        run.font.size = Pt(8)
        run.font.color.rgb = MUTED
    header.add_run('\t')
    tail = header.add_run('JOB-191 · PROJE BELGESİ')
    tail.font.name = MONO_FONT
    tail.font.size = Pt(7)
    tail.font.color.rgb = MUTED

    footer = section.footer.paragraphs[0]
    footer.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    run = footer.add_run('Wayora · İstinye Üniversitesi · ')
    run.font.name = MONO_FONT
    run.font.size = Pt(7)
    run.font.color.rgb = MUTED
    add_page_field(footer)
    return doc


def add_cover(doc, kind, subtitle):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(18)
    r = p.add_run('WAYORA')
    r.font.name = DISPLAY_FONT
    r.font.size = Pt(30)
    r.font.color.rgb = INK
    r2 = p.add_run(' / ')
    r2.font.name = DISPLAY_FONT
    r2.font.size = Pt(30)
    r2.font.color.rgb = TERRA
    r3 = p.add_run('ROTASYON')
    r3.font.name = MONO_FONT
    r3.font.size = Pt(10)
    r3.font.color.rgb = MUTED

    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(8)
    r = p.add_run(kind.upper())
    r.font.name = DISPLAY_FONT
    r.font.size = Pt(24)
    r.font.color.rgb = INK

    p = doc.add_paragraph()
    r = p.add_run(subtitle)
    r.font.name = BODY_FONT
    r.font.size = Pt(12)
    r.font.color.rgb = MUTED

    image = ASSETS / 'landing-hero.png'
    if image.exists():
        doc.add_picture(str(image), width=Cm(16.8))
        doc.paragraphs[-1].alignment = WD_ALIGN_PARAGRAPH.CENTER

    table = doc.add_table(rows=4, cols=2)
    table.alignment = WD_TABLE_ALIGNMENT.LEFT
    table.style = 'Table Grid'
    rows = [
        ('Ders', 'JOB-191 · AI-Augmented Software Engineering'),
        ('Ekip', 'Bayram Selim Yılmaz · Mehmet Emin Akkaya · Ezgi Turan · Aykut Kayra Akkuş · Berfin Aksoy'),
        ('Sürüm', '1.0 · 27 Ekim 2026'),
        ('Durum', 'MVP tamamlandı · demo ve yayın adımları planlı'),
    ]
    for index, (key, value) in enumerate(rows):
        table.cell(index, 0).text = key
        table.cell(index, 1).text = value
        shade(table.cell(index, 0), PUTTY)
        for cell in table.rows[index].cells:
            set_cell_margins(cell)
            for paragraph in cell.paragraphs:
                for run in paragraph.runs:
                    run.font.name = BODY_FONT
                    run.font.size = Pt(8.5)
                    run.font.color.rgb = INK
        table.cell(index, 0).paragraphs[0].runs[0].font.bold = True
    doc.add_page_break()


def add_paragraph(doc, text, bold_lead=None, size=10.5, color=INK, space_after=4):
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(space_after)
    if bold_lead:
        r = p.add_run(bold_lead)
        r.bold = True
        r.font.size = Pt(size)
        r.font.color.rgb = color
    r = p.add_run(text)
    r.font.size = Pt(size)
    r.font.color.rgb = color
    return p


def add_bullets(doc, items):
    for item in items:
        p = doc.add_paragraph(item, style='List Bullet')
        p.paragraph_format.space_after = Pt(2)
        for run in p.runs:
            run.font.size = Pt(10)
            run.font.color.rgb = INK


def add_table(doc, headers, rows, widths=None, font_size=8.5):
    table = doc.add_table(rows=1, cols=len(headers))
    table.style = 'Table Grid'
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    header_cells = table.rows[0].cells
    for index, header in enumerate(headers):
        header_cells[index].text = header
        shade(header_cells[index], '1B1814')
        set_cell_margins(header_cells[index])
        for paragraph in header_cells[index].paragraphs:
            for run in paragraph.runs:
                run.font.name = BODY_FONT
                run.font.size = Pt(font_size)
                run.font.bold = True
                run.font.color.rgb = RGBColor(0xFB, 0xF3, 0xE5)

    for row in rows:
        cells = table.add_row().cells
        for index, value in enumerate(row):
            cells[index].text = str(value)
            set_cell_margins(cells[index])
            for paragraph in cells[index].paragraphs:
                for run in paragraph.runs:
                    run.font.name = BODY_FONT
                    run.font.size = Pt(font_size)
                    run.font.color.rgb = INK
    if widths:
        for row in table.rows:
            for index, width in enumerate(widths):
                row.cells[index].width = Cm(width)
    doc.add_paragraph().paragraph_format.space_after = Pt(2)
    return table


def add_caption(doc, text):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = p.add_run(text)
    r.font.name = MONO_FONT
    r.font.size = Pt(7.5)
    r.font.color.rgb = MUTED


def add_image(doc, path, width=16.5, caption=None):
    if not path.exists():
        return
    doc.add_picture(str(path), width=Cm(width))
    doc.paragraphs[-1].alignment = WD_ALIGN_PARAGRAPH.CENTER
    if caption:
        add_caption(doc, caption)


def add_note_box(doc, title, body):
    table = doc.add_table(rows=1, cols=1)
    table.style = 'Table Grid'
    cell = table.cell(0, 0)
    cell.text = ''
    shade(cell, CREAM)
    set_cell_margins(cell, top=120, start=140, bottom=120, end=140)
    p = cell.paragraphs[0]
    r = p.add_run(title)
    r.bold = True
    r.font.name = BODY_FONT
    r.font.size = Pt(9)
    r.font.color.rgb = TERRA
    p2 = cell.add_paragraph(body)
    for run in p2.runs:
        run.font.name = BODY_FONT
        run.font.size = Pt(9)
        run.font.color.rgb = INK
    doc.add_paragraph().paragraph_format.space_after = Pt(2)


# ---------------------------------------------------------------------------
# 1. DETAYLI PROJE RAPORU
# ---------------------------------------------------------------------------

def build_report():
    doc = setup_document()
    add_cover(doc, 'Proje Raporu', 'AI destekli seyahat planlama platformu · Detaylı teslim raporu')

    doc.add_heading('Yönetici Özeti', level=1)
    add_paragraph(
        doc,
        'Wayora, kullanıcının ilgi alanlarına, bütçesine ve seyahat temposuna göre gün gün plan '
        'üreten bir web uygulamasıdır. Ürün; kayıt ve oturum yönetimi, tercih profili, gezi CRUD, '
        'AI destekli plan üretimi, aktivite düzenleme ve bütçe özetini tek bir akışta birleştirir.',
    )
    add_paragraph(
        doc,
        'Projenin ayırt edici tarafı, AI kullanımını bir gösteri unsurundan çıkarıp güvenilir bir '
        'mühendislik akışına yerleştirmesidir. LLM çıktısı zod ile doğrulanır, aday yer listesinde '
        'olmayan mekânlar elenir, sağlayıcı hatasında deterministik offline üreticiye düşülür ve '
        'kullanıcıya ham hata yerine anlaşılır bir durum gösterilir.',
    )
    add_bullets(
        doc,
        [
            '70 API testi ve 6 web testi ile kritik akışlar otomatik doğrulanır.',
            'AI anahtarı olmadan da uçtan uca demo çalışır; offline üretici varsayılandır.',
            'Güvenlik hattı; helmet, CORS allowlist, httpOnly cookie, bcrypt, zod, rate limit ve prompt injection sınırlarını içerir.',
            'Tasarım dili WAYORA / ROTASYON olarak adlandırıldı: krem kağıt, mürekkep, film çerçeveli fotoğraf, damga ve el yazısı not.',
            'Ders kapsamındaki SDD, AGENTS.md, agent skill, MCP, AI review ve orchestration pratikleri repoya işlendi.',
        ],
    )

    doc.add_heading('1. Proje Tanımı', level=1)
    doc.add_heading('1.1 Problem', level=2)
    add_paragraph(
        doc,
        'Seyahat planlamak çok sayıda sekme, not ve tahmin arasında kaybolmayı gerektirir. Gezginler '
        'ilgi alanlarına uygun yerleri bulmak, günleri dengeli biçimde dağıtmak ve bütçeyi kontrol '
        'etmek için saatler harcar. Mevcut araçların çoğu ya yalnızca liste verir ya da planı '
        'kullanıcıya düzenleme imkânı bırakmadan tek seferde üretir.',
    )
    doc.add_heading('1.2 Vizyon', level=2)
    add_paragraph(
        doc,
        'Wayora, bir şehirde geçirilecek birkaç günü okunabilir bir rotaya dönüştüren kişisel bir '
        'seyahat editörüdür. Amaç günün her saatini doldurmak değil; doğru durakları doğru saatlere '
        'yerleştirmek ve kullanıcıya düzenleyebileceği bir plan bırakmaktır.',
    )
    doc.add_heading('1.3 Hedef kullanıcı', level=2)
    add_bullets(
        doc,
        [
            '2 ile 7 gün arasında şehir gezisi planlayan, bütçesine dikkat eden gezgin.',
            'Planı hazır bir broşür gibi değil, üzerinde değişiklik yapabileceği bir defter gibi görmek isteyen kullanıcı.',
            'Ürünü demo sırasında dakikalar içinde değerlendirmek isteyen eğitmen ve jüri.',
        ],
    )
    doc.add_heading('1.4 Başarı kriterleri', level=2)
    add_table(
        doc,
        ['Kriter', 'Hedef', 'Sonuç'],
        [
            ('Kayıttan plana ulaşma', '≤ 3 dakika, ≤ 5 ekran', '3 ekran, tek akış'),
            ('Offline plan üretimi', '< 1 saniye', '1 ms civarı'),
            ('LLM plan üretimi', '< 20 saniye veya fallback', 'Timeout + offline fallback'),
            ('Kritik akış testi', 'auth, gezi, AI, fallback', '70 API + 6 web testi'),
            ('Güvenlik', 'Secret yok, rate limit var', 'gitleaks/CodeQL/Semgrep hattı'),
        ],
        widths=[4.6, 5.8, 5.6],
    )

    doc.add_heading('2. Kapsam', level=1)
    add_table(
        doc,
        ['MVP kapsamı', 'Kapsam dışı'],
        [
            ('Kayıt, giriş, çıkış ve oturum', 'Gerçek ödeme ve rezervasyon'),
            ('İlgi alanı, bütçe, tempo tercihleri', 'Uçuş ve otel entegrasyonu'),
            ('Gezi oluşturma, listeleme, silme', 'Çoklu kullanıcı işbirliği'),
            ('AI ile gün gün plan üretimi', 'Mobil native uygulama'),
            ('Aktivite ekleme, silme, bütçe özeti', 'Gerçek Google Maps/Places anahtarı'),
            ('Yerleşik şehir kataloğu ve yer arama', 'Sürükle-bırak sıralama (sonraki sprint)'),
        ],
        widths=[9, 8],
    )
    add_paragraph(
        doc,
        'Kapsam kararları docs/specs/001-mvp/spec.md içinde kabul kriterleriyle birlikte tutulur. '
        'Yeni fikirler doğrudan koda değil, önce backlog ve spec güncellemesine gider.',
    )

    doc.add_heading('3. Paydaşlar ve Ekip', level=1)
    add_table(
        doc,
        ['Kişi', 'Rol', 'Sorumluluk'],
        [
            ('Bayram Selim Yılmaz', 'Product Owner + Frontend Lead', 'Backlog, ürün kapsamı, arayüz mimarisi'),
            ('Mehmet Emin Akkaya', 'Scrum Master + Backend/AI Lead', 'API, AI servisi, CI, deploy'),
            ('Ezgi Turan', 'Designer', 'Tasarım sistemi, erişilebilirlik, görsel dil'),
            ('Aykut Kayra Akkuş', 'Database', 'Prisma şeması, migration, demo verisi'),
            ('Berfin Aksoy', 'Frontend + Test', 'Formlar, sayfalar, test senaryoları'),
        ],
        widths=[4.8, 5.2, 6.2],
    )
    add_note_box(
        doc,
        'Çalışma biçimi',
        'İki haftalık sprintler, günlük async standup, sprint review ve retro. Tek gerçek kaynak '
        'GrepThink board; kod tarafında her iş branch + PR + yeşil CI ile main’e alınır.',
    )

    doc.add_heading('4. Proje Yönetimi Yaklaşımı', level=1)
    add_paragraph(
        doc,
        'Proje Scrum ile yönetildi. Sprint 0’da iskelet ve CI; Sprint 1’de hesap, tercih ve gezi '
        'CRUD; Sprint 2’de yer kataloğu ve AI spike; Sprint 3’te AI plan üretimi MVP; Sprint 4’te '
        'düzenleme ve bütçe; Sprint 5’te test, erişilebilirlik ve teslim hazırlığı hedeflendi.',
    )
    add_table(
        doc,
        ['Sprint', 'Hedef', 'Çıktı', 'Durum'],
        [
            ('Sprint 0', 'Kurulum', 'Monorepo, CI, health, Prisma', 'Tamam'),
            ('Sprint 1', 'Temel', 'Auth, tercihler, gezi CRUD', 'Tamam'),
            ('Sprint 2', 'Harita ve yerler', 'Katalog, Place cache, AI spike', 'Kısmi: gerçek Places açık'),
            ('Sprint 3', 'AI MVP', 'Plan üretimi, doğrulama, fallback', 'Tamam'),
            ('Sprint 4', 'Zenginleştirme', 'Aktivite düzenleme, bütçe', 'Kısmi: sürükle-bırak açık'),
            ('Sprint 5', 'Kalite', 'Testler, erişilebilirlik, agent artefaktları', 'Tamam'),
        ],
        widths=[2.7, 3.4, 7.0, 4.3],
    )

    doc.add_heading('5. Gereksinimler ve User Story Özeti', level=1)
    add_paragraph(
        doc,
        'Ayrıntılı user story kataloğu docs/Wayora-User-Stories.docx içindedir. Aşağıdaki tablo '
        'ürünün ana dilimlerini ve mevcut durumunu özetler.',
    )
    add_table(
        doc,
        ['ID', 'Story', 'Öncelik', 'Sprint', 'Durum'],
        [
            ('US-04', 'E-posta ve şifreyle kayıt olma', 'Must', '1', 'Tamam'),
            ('US-05', 'Giriş, çıkış ve oturumu koruma', 'Must', '1', 'Tamam'),
            ('US-06', 'Tercihleri kaydetme', 'Must', '1', 'Tamam'),
            ('US-08', 'Gezi oluşturma', 'Must', '1', 'Tamam'),
            ('US-09', 'Gezileri listeleme ve silme', 'Must', '1', 'Tamam'),
            ('US-10', 'Gezi detayı ve günler', 'Must', '1', 'Tamam'),
            ('US-11', 'Aktivite ekleme ve silme', 'Must', '2', 'Tamam'),
            ('US-12', 'AI ile plan üretme', 'Must', '3', 'Tamam'),
            ('US-13', 'LLM çıktısını doğrulama', 'Must', '3', 'Tamam'),
            ('US-14', 'Offline fallback ve model routing', 'Must', '3', 'Tamam'),
            ('US-15', 'Bütçe özeti ve ipuçları', 'Should', '3', 'Tamam'),
            ('US-17', 'Mobil ve erişilebilir deneyim', 'Should', '5', 'Tamam'),
        ],
        widths=[1.8, 7.0, 2.2, 2.2, 3.2],
    )

    doc.add_heading('6. Sistem Mimarisi', level=1)
    add_paragraph(
        doc,
        'Uygulama npm workspaces ile iki parçalı bir monorepo olarak kuruldu. web/ React + Vite + '
        'TypeScript; api/ Express + TypeScript + Prisma + PostgreSQL. AI erişimi tek bir servis '
        'katmanından geçer; frontend hiçbir zaman sağlayıcı anahtarı görmez.',
    )
    add_table(
        doc,
        ['Katman', 'Teknoloji', 'Sorumluluk'],
        [
            ('Web', 'React 19, Vite, React Router', 'Sayfalar, formlar, auth context, API istemcisi'),
            ('API', 'Express 5, TypeScript', 'Auth, doğrulama, iş kuralları, rate limit'),
            ('Veri', 'PostgreSQL, Prisma 7', 'User, Preference, Trip, TripDay, Activity, Place'),
            ('AI', 'Offline + Gemini + OpenAI', 'Plan üretimi, model routing, fallback'),
            ('Test', 'Vitest, Supertest, Testing Library', 'API, servis ve web davranış testleri'),
            ('CI', 'GitHub Actions, CodeQL, Semgrep, gitleaks', 'Lint, tip, test, build, güvenlik'),
        ],
        widths=[3.0, 5.6, 7.6],
    )

    doc.add_heading('7. Veri Modeli', level=1)
    add_table(
        doc,
        ['Model', 'Ana alanlar', 'İlişki / kural'],
        [
            ('User', 'id, email, passwordHash, name', '1-1 Preference, 1-N Trip'),
            ('Preference', 'interests[], budgetLevel, travelStyle, pace', 'userId unique'),
            ('Trip', 'title, destination, startDate, endDate, budget, currency, status, tips[]', '1-N TripDay; userId sahiplik'),
            ('TripDay', 'dayIndex, date, notes', '(tripId, dayIndex) unique'),
            ('Activity', 'order, title, category, startTime, endTime, estimatedCost', '1-N; placeId opsiyonel'),
            ('Place', 'googlePlaceId, name, lat, lng, address, rating, types[]', 'googlePlaceId unique; cache'),
        ],
        widths=[2.5, 8.3, 5.4],
    )
    add_paragraph(
        doc,
        'Tüm alt kayıtlar cascade silinir. Activity.placeId SetNull ile korunur. Para alanları '
        'Decimal olarak tutulur; JSON’a çevrilirken sunucu tarafında number’a dönüştürülür.',
    )

    doc.add_heading('8. REST API', level=1)
    add_table(
        doc,
        ['Metot', 'Yol', 'Açıklama'],
        [
            ('POST', '/api/auth/register', 'Kayıt, 201 + httpOnly cookie'),
            ('POST', '/api/auth/login', 'Giriş, 200 + cookie'),
            ('POST', '/api/auth/logout', 'Çıkış, cookie temizleme'),
            ('GET', '/api/auth/me', 'Oturumdaki kullanıcı'),
            ('GET/PUT', '/api/me/preferences', 'Tercih okuma / upsert'),
            ('GET/POST', '/api/trips', 'Gezi listeleme / oluşturma'),
            ('GET/PATCH/DELETE', '/api/trips/:id', 'Gezi detayı / güncelleme / silme'),
            ('POST', '/api/trips/:id/generate', 'AI plan üretimi + meta'),
            ('POST', '/api/trips/:tripId/days/:dayId/activities', 'Aktivite ekleme'),
            ('PATCH/DELETE', '/api/activities/:id', 'Aktivite güncelleme / silme'),
            ('GET', '/api/places/search', 'Katalog arama + Place cache'),
        ],
        widths=[2.8, 8.0, 6.4],
    )
    add_paragraph(
        doc,
        'Hata biçimi her yerde aynıdır: { "error": { "code": "...", "message": "..." } }. '
        'Yetkisiz erişim 401, başkasının kaynağı 404, doğrulama hatası 400 döner.',
    )

    doc.add_heading('9. AI Plan Üretimi', level=1)
    add_bullets(
        doc,
        [
            'Girdi: destinasyon, tarih aralığı, bütçe, notlar ve kullanıcı tercihleri.',
            'Adaylar: yerleşik şehir kataloğundan kategori, puan ve maliyet bilgisiyle seçilir.',
            'Üretim: LLM_PROVIDER=offline ise deterministik üretici; gemini/openai ise güçlü model.',
            'Doğrulama: zod şeması; gün sayısı, saat biçimi, kategori ve maliyet aralığı.',
            'Halüsinasyon kontrolü: yalnızca aday listesindeki googlePlaceId kabul edilir.',
            'Fallback: sağlayıcı hatası, timeout veya şema uyuşmazlığında offline üreticiye düşülür.',
            'Kayıt: transaction içinde günler upsert edilir, aktiviteler oluşturulur, Place cache güncellenir.',
        ],
    )
    add_table(
        doc,
        ['Görev', 'Model', 'Neden'],
        [
            ('itinerary', 'LLM_MODEL_SMART', 'Çok günlü plan, saat ve bütçe dengesi'),
            ('quick_tip', 'LLM_MODEL_FAST', 'Kısa metin, düşük maliyet'),
            ('offline', 'wayora-offline', 'Anahtarsız demo, deterministik test'),
        ],
        widths=[3.2, 5.2, 8.0],
    )
    add_note_box(
        doc,
        'Prompt güvenliği',
        'Kullanıcı notları <untrusted_user_notes> sınırı içinde gönderilir; sistem promptu bunları '
        'talimat değil veri olarak işaretler. LLM yanıtı asla doğrudan DB’ye yazılmaz. Toplam '
        'maliyet ve gün sayısı sunucuda yeniden hesaplanır.',
    )

    doc.add_heading('10. Arayüz ve Tasarım Sistemi', level=1)
    add_paragraph(
        doc,
        'Tasarım yönü WAYORA / ROTASYON olarak adlandırıldı. Amaç, bir SaaS paneli yerine cebinde '
        'taşınan bir seyahat defteri hissi vermek: putty zemin, krem kağıt, ağır mürekkep '
        'tipografisi, film çerçeveli fotoğraflar, damgalar ve el yazısı notlar.',
    )
    add_table(
        doc,
        ['Öğe', 'Karar'],
        [
            ('Renk', 'Putty #C8BCAA, krem #F4EADA, mürekkep #1B1814, terracotta #B6472B, damga #A83A2A'),
            ('Tipografi', 'Anton (display), Public Sans (gövde), IBM Plex Mono (veri), Caveat (not)'),
            ('Yüzey', '2px mürekkep çizgi, keskin köşe, sert offset gölge, film çerçevesi'),
            ('Hareket', 'Yalnız durum geçişi; scroll animasyonu ve cursor efekti yok'),
            ('Mobil', 'Tek satır header, tam ekran fotoğraf, sabit alt tab bar'),
        ],
        widths=[3.2, 13.0],
    )
    add_image(doc, ASSETS / 'landing-hero.png', width=15.5, caption='Landing: film çerçeveli fotoğraf, rota fişi ve günlük notlar.')
    add_image(doc, ASSETS / 'mobile-home.png', width=4.6, caption='Mobil ana ekran: 375x667, alt tab bar ile.')
    add_image(doc, ASSETS / 'trip-detail-crop.png', width=16.8, caption='Plan detayı: gün numaraları, aktivite fişleri ve fiyat damgaları.')

    doc.add_heading('11. Güvenlik', level=1)
    add_table(
        doc,
        ['Tehdit', 'Kontrol'],
        [
            ('Kimlik sahteciliği', 'Her sorguda userId filtresi; başkasının kaynağı 404'),
            ('Şifre sızıntısı', 'bcrypt cost 12; yanıtta hash yok'),
            ('XSS / token çalınması', 'httpOnly cookie, sameSite=lax, helmet'),
            ('Brute force', 'Auth için 30 istek / 15 dakika; AI için günlük limit'),
            ('Prompt injection', 'Sınırlandırılmış not, zod şeması, aday filtresi, fallback'),
            ('Secret sızıntısı', '.env gitignore, .env.example, gitleaks'),
            ('Bağımlılık açığı', 'npm audit, CodeQL, Semgrep, Dependabot'),
        ],
        widths=[5.0, 11.2],
    )
    add_paragraph(
        doc,
        'Üretimde JWT_SECRET en az 32 karakter olmalı ve varsayılan değer kullanılmamalıdır. '
        'COOKIE_SECURE=true zorunludur. Rate limit bellek içidir; çok instance’lı dağıtımda Redis gerekir.',
    )

    doc.add_heading('12. Test ve Kalite', level=1)
    add_table(
        doc,
        ['Katman', 'Araç', 'Kapsam', 'Sonuç'],
        [
            ('API route', 'Supertest + fake DB', 'Auth, tercih, health, 404, validation', 'Geçti'),
            ('Servis', 'Vitest + fetch stub', 'Offline plan, halüsinasyon, prompt sınırı, fallback', 'Geçti'),
            ('Web', 'Testing Library', 'Landing, login, korumalı rota, boş liste', 'Geçti'),
            ('Statik', 'tsc, oxlint', 'Tip ve lint', 'Geçti'),
            ('Güvenlik', 'npm audit', 'Üretim bağımlılıkları', '0 vulnerability'),
        ],
        widths=[3.0, 4.6, 6.6, 3.0],
    )
    add_paragraph(
        doc,
        'Toplam 70 API ve 6 web testi bulunur. CI; lint, typecheck, test, build ve audit adımlarını '
        'her PR’da çalıştırır. Ayrıca gitleaks, CodeQL ve Semgrep iş akışları vardır.',
    )

    doc.add_heading('13. Kurulum ve Demo', level=1)
    add_table(
        doc,
        ['Komut', 'Ne yapar'],
        [
            ('npm run setup', 'Bağımlılıklar, api/.env, yerel Postgres ve migration'),
            ('npm run dev', 'DB + API :4000 + web :5180'),
            ('npm test', 'API ve web testleri'),
            ('npm run build', 'Üretim derlemesi'),
            ('npm run db:studio -w api', 'Prisma Studio'),
        ],
        widths=[5.0, 11.2],
    )
    add_paragraph(
        doc,
        'Demo akışı: kayıt → tercihler → Paris için 3 günlük gezi → AI ile plan oluştur → '
        'aktivite ekle/sil → bütçe özetini göster. Offline modda tüm akış yaklaşık 1 saniyede tamamlanır.',
    )

    doc.add_heading('14. AI-Augmented Mühendislik Pratikleri', level=1)
    add_bullets(
        doc,
        [
            'SDD: docs/specs/001-mvp/ altında constitution, spec, plan ve tasks dosyaları.',
            'Agent bağlamı: kök AGENTS.md, api/web/services için scoped talimatlar.',
            'Yeniden kullanılabilir iş akışları: .agents/skills/feature, review ve security.',
            'MCP: mcp/wayora-context ile API ve doküman bağlamı agent’a açılır.',
            'AI review: .coderabbit.yaml, PR şablonu ve insan onayı.',
            'Orchestration: worktree script’i, generator-critic döngüsü ve autonomy seviyeleri.',
            'Güvenlik ve kalite: gitleaks, CodeQL, Semgrep, Vitest ve Dependabot.',
        ],
    )

    doc.add_heading('15. Sonuç, Sınırlar ve Yol Haritası', level=1)
    add_paragraph(
        doc,
        'Wayora MVP’si uçtan uca çalışır durumdadır. Kayıt, tercih, gezi, AI plan üretimi, '
        'aktivite düzenleme ve bütçe akışları tamamlanmıştır. AI anahtarı olmadan da demo '
        'yapılabilmesi, projenin en güçlü teslim avantajıdır.',
    )
    add_bullets(
        doc,
        [
            'Açık: gerçek Google Places/Maps entegrasyonu ve harita pinleri.',
            'Açık: sürükle-bırak sıralama, kısmi gün/aktivite yeniden üretimi.',
            'Açık: bulut deploy, demo verisi ve sunum kaydı.',
            'Sonraki: e-posta doğrulama, şifre sıfırlama, paylaşılabilir salt-okunur plan.',
            'Sonraki: çok instance’lı rate limit için Redis ve gözlemlenebilirlik.',
        ],
    )
    add_paragraph(
        doc,
        'Sonuç olarak proje; ürün değeri, güvenli AI kullanımı ve agentic mühendislik pratiklerini '
        'aynı repoda birleştiren, demo edilebilir bir MVP ortaya koymuştur.',
    )

    doc.add_heading('Kaynaklar ve Ekler', level=1)
    add_bullets(
        doc,
        [
            'docs/specs/001-mvp/spec.md: ürün spec’i ve kabul kriterleri.',
            'docs/specs/001-mvp/plan.md: teknik plan ve kararlar.',
            'docs/DESIGN_SYSTEM.md: WAYORA / ROTASYON tasarım sistemi.',
            'docs/SECURITY.md: tehdit modeli ve kontroller.',
            'docs/AI_NATIVE_TEAM.md: LLM gateway, model routing ve maliyet.',
            'README.md: kurulum, komutlar ve demo akışı.',
        ],
    )

    output = OUT / 'Wayora-Proje-Raporu.docx'
    doc.save(output)
    print('wrote', output)


# ---------------------------------------------------------------------------
# 2. PROJE YÖNETİMİ PLANI
# ---------------------------------------------------------------------------

def build_pm_plan():
    doc = setup_document()
    add_cover(doc, 'Proje Yönetimi Planı', 'Kapsam, takvim, roller, riskler ve kalite yönetimi')

    doc.add_heading('Belge Kontrolü', level=1)
    add_table(
        doc,
        ['Alan', 'Değer'],
        [
            ('Belge sahibi', 'Bayram Selim Yılmaz (Product Owner)'),
            ('Sürüm', '1.0'),
            ('Tarih', '27 Ekim 2026'),
            ('Onay', 'Ekip sprint review’ında gözden geçirilecek'),
            ('İlgili belgeler', 'PROJECT_OVERVIEW, ROADMAP, BACKLOG, TEAM, spec/plan/tasks'),
        ],
        widths=[5.0, 11.2],
    )

    doc.add_heading('1. Amaç ve Kapsam', level=1)
    add_paragraph(
        doc,
        'Bu plan, Wayora MVP’sinin nasıl planlandığını, hangi rollerle yürütüldüğünü, hangi '
        'teslimlerin üretildiğini ve risklerin nasıl yönetildiğini tek belgede açıklar. Teknik '
        'ayrıntılar docs/ARCHITECTURE.md ve docs/specs/001-mvp/plan.md içindedir.',
    )
    add_paragraph(
        doc,
        'Planın kapsamı; keşif, tasarım, geliştirme, test, demo ve teslim adımlarını içerir. '
        'Gerçek ödeme, rezervasyon, uçuş/otel ve çoklu kullanıcı işbirliği kapsam dışıdır.',
    )

    doc.add_heading('2. Proje Hedefleri', level=1)
    add_table(
        doc,
        ['Hedef', 'Ölçüt', 'Durum'],
        [
            ('Kullanıcıyı 3 dakikada plana ulaştırmak', '≤ 3 ekran / ≤ 5 tıklama', 'Karşılandı'),
            ('AI planını güvenilir üretmek', 'Şema + aday filtresi + fallback', 'Karşılandı'),
            ('Anahtarsız demo', 'offline sağlayıcı', 'Karşılandı'),
            ('Kritik akışları otomatik doğrulamak', '70 API + 6 web testi', 'Karşılandı'),
            ('Agent-ready repo', 'AGENTS, skills, MCP, CI', 'Karşılandı'),
        ],
        widths=[5.8, 5.4, 5.0],
    )

    doc.add_heading('3. Paydaşlar ve Organizasyon', level=1)
    add_table(
        doc,
        ['Kişi', 'Rol', 'Sorumluluk', 'Yedek'],
        [
            ('Bayram Selim Yılmaz', 'PO / Frontend Lead', 'Kapsam, öncelik, arayüz', 'Berfin'),
            ('Mehmet Emin Akkaya', 'SM / Backend + AI', 'API, AI, CI, deploy', 'Aykut'),
            ('Ezgi Turan', 'Designer', 'Tasarım sistemi, UX', 'Selim'),
            ('Aykut Kayra Akkuş', 'Database', 'Şema, migration, seed', 'Mehmet'),
            ('Berfin Aksoy', 'Frontend + Test', 'Formlar, testler, demo', 'Selim'),
        ],
        widths=[4.2, 4.4, 5.4, 2.6],
    )
    add_note_box(
        doc,
        'RACI özeti',
        'Kapsam ve öncelik: PO (A), SM (R). Teknik mimari: Backend/AI (A), DB (C). Tasarım: '
        'Designer (A), Frontend (R). Test: Frontend+Test (R), tüm ekip (C). Deploy: SM (A/R).',
    )

    doc.add_heading('4. Kapsam ve İş Kırılım Yapısı', level=1)
    add_table(
        doc,
        ['WBS', 'İş paketi', 'Teslim'],
        [
            ('1.0', 'Kurulum ve altyapı', 'Monorepo, CI, health, yerel DB'),
            ('2.0', 'Hesap ve tercihler', 'Auth, cookie, preference ekranı'),
            ('3.0', 'Gezi yönetimi', 'Trip/Day CRUD, sahiplik, bütçe'),
            ('4.0', 'AI plan üretimi', 'Servis, doğrulama, fallback, UI'),
            ('5.0', 'Tasarım sistemi', 'Rotasyon dili, responsive, erişilebilirlik'),
            ('6.0', 'Kalite ve agentic yapı', 'Testler, CI, AGENTS, skills, MCP'),
            ('7.0', 'Demo ve teslim', 'Rapor, sunum, demo senaryosu, deploy'),
        ],
        widths=[2.0, 6.0, 8.2],
    )

    doc.add_heading('5. Zaman Planı', level=1)
    add_table(
        doc,
        ['Sprint', 'Tarih', 'Hedef', 'Durum'],
        [
            ('Sprint 0', '14-26 Ekim 2026', 'Kurulum, repo, CI, iskelet', 'Tamam'),
            ('Sprint 1', '27 Ekim-9 Kasım 2026', 'Auth, tercih, gezi CRUD', 'Tamam'),
            ('Sprint 2', '10-23 Kasım 2026', 'Yerler, katalog, AI spike', 'Kısmi'),
            ('Sprint 3', '24 Kasım-7 Aralık 2026', 'AI plan MVP', 'Tamam'),
            ('Sprint 4', '8-21 Aralık 2026', 'Düzenleme, bütçe, ekranlar', 'Kısmi'),
            ('Sprint 5', '22 Aralık 2026-4 Ocak 2027', 'Test, erişilebilirlik, demo', 'Devam'),
        ],
        widths=[2.8, 5.2, 5.6, 2.6],
    )
    add_paragraph(
        doc,
        'Planlanan takvim 12 haftalık dönem varsayımıyla hazırlandı. MVP erken tamamlandığı için '
        'Sprint 4 ve 5’in bir kısmı öne çekildi; kalan işler deploy ve demo hazırlığına ayrıldı.',
    )

    doc.add_heading('6. Kaynak Planı', level=1)
    add_table(
        doc,
        ['Kaynak', 'Kullanım'],
        [
            ('İnsan', '5 kişilik ekip; haftada yaklaşık 6-8 saat/kişi'),
            ('Geliştirme', 'Node 24, VS Code/OpenCode, Git, GitHub'),
            ('Veri', 'Yerel Prisma PostgreSQL; üretimde Neon/Supabase planı'),
            ('AI', 'Offline varsayılan; Gemini/OpenAI opsiyonel'),
            ('Tasarım', 'Figma/kağıt eskiz, saf CSS tasarım sistemi'),
            ('CI/CD', 'GitHub Actions; deploy Vercel/Render planı'),
        ],
        widths=[3.4, 12.8],
    )

    doc.add_heading('7. Kalite Planı', level=1)
    add_bullets(
        doc,
        [
            'Definition of Done: kabul kriteri, test, yeşil CI, review ve doküman güncellemesi.',
            'Test piramidi: servis testleri, route testleri ve web davranış testleri.',
            'Statik kontrol: oxlint, tsc, build.',
            'Güvenlik: npm audit, gitleaks, CodeQL, Semgrep.',
            'Review: en az bir insan onayı; AI review sinyal olarak kullanılır.',
        ],
    )

    doc.add_heading('8. Risk Yönetimi', level=1)
    add_table(
        doc,
        ['Risk', 'Olasılık', 'Etki', 'Önlem', 'Sahip'],
        [
            ('LLM uydurma mekân', 'Yüksek', 'Yüksek', 'Aday listesi + ID filtresi + fallback', 'Mehmet'),
            ('LLM maliyeti / kota', 'Orta', 'Orta', 'Günlük limit, timeout, model routing', 'Mehmet'),
            ('Prompt injection', 'Orta', 'Yüksek', 'Sınırlı not, şema, çıktıyı veri sayma', 'Mehmet'),
            ('Google Maps faturası', 'Orta', 'Orta', 'Katalog/cache, anahtar yoksa offline', 'Aykut'),
            ('Kapsam kayması', 'Orta', 'Orta', 'Spec ve backlog; MVP’ye sadakat', 'Selim'),
            ('Tek kişiye bağımlılık', 'Orta', 'Orta', 'Eşli çalışma, çapraz review', 'Tüm ekip'),
            ('Sınav haftaları', 'Yüksek', 'Orta', 'Sprint 4-5’i hafif planlama', 'Mehmet'),
        ],
        widths=[4.6, 2.2, 1.8, 6.2, 2.0],
    )

    doc.add_heading('9. İletişim Planı', level=1)
    add_table(
        doc,
        ['Toplantı / kanal', 'Sıklık', 'Çıktı'],
        [
            ('Günlük async standup', 'Her gün', 'Dün / bugün / engel'),
            ('Sprint planning', 'Sprint başı', 'Sprint hedefi ve story seçimi'),
            ('Sprint review', 'Sprint sonu', 'Çalışan demo ve geri bildirim'),
            ('Retro', 'Sprint sonu', '1 iyi, 1 kötü, 1 aksiyon'),
            ('TSR', 'İstenen hafta', 'Katkı, durum, engel özeti'),
            ('GitHub PR', 'Sürekli', 'Kod, test, review kaydı'),
        ],
        widths=[5.0, 4.0, 7.2],
    )

    doc.add_heading('10. Değişiklik Yönetimi', level=1)
    add_paragraph(
        doc,
        'Yeni istekler doğrudan koda girmez. Önce backlog’a story olarak eklenir, kabul kriteri '
        'yazılır, spec/plan güncellenir ve sprint planında öncelik verilir. Acil hata düzeltmeleri '
        'küçük bir fix branch’i ve PR ile ilerler.',
    )

    doc.add_heading('11. İzleme ve Kontrol', level=1)
    add_table(
        doc,
        ['Metrik', 'Kaynak', 'Hedef'],
        [
            ('Kritik akış testi', 'npm test', 'Her akışta başarı + hata'),
            ('CI süresi', 'GitHub Actions', '< 5 dakika'),
            ('Offline plan süresi', 'meta.latencyMs', '< 100 ms'),
            ('LLM fallback oranı', 'meta.fallback', '< %10'),
            ('Açık yüksek güvenlik açığı', 'npm audit', '0'),
            ('Demo tamamlama', 'manuel', '< 5 dakika'),
        ],
        widths=[6.0, 5.0, 5.2],
    )

    doc.add_heading('12. Kapanış ve Devir', level=1)
    add_bullets(
        doc,
        [
            'Kod ve dokümanlar main’e merge edilmiş olmalı.',
            'README ile yeni bir kişi 15 dakikada projeyi çalıştırabilmeli.',
            'Demo senaryosu ve sunum dosyası teslim edilmeli.',
            'Bilinen sınırlar ve sonraki sprint listesi açıkça yazılmalı.',
            'Erişim bilgileri ve ortam değişkenleri ekip ile paylaşılmalı; secret repoya girmemeli.',
        ],
    )

    output = OUT / 'Wayora-Proje-Yonetimi.docx'
    doc.save(output)
    print('wrote', output)


# ---------------------------------------------------------------------------
# 3. USER STORIES
# ---------------------------------------------------------------------------

STORIES = [
    dict(
        id='US-01', epic='Platform', title='Tek komutla kurulum', role='Geliştirici',
        story='Projeyi kendi bilgisayarımda tek komutla çalıştırmak istiyorum.',
        priority='Must', points=3, sprint='Sprint 0', status='Tamam',
        criteria=['npm run setup bağımlılıkları, api/.env dosyasını, yerel Postgres’i ve migration’ları hazırlar.', 'npm run dev API ve web’i birlikte başlatır.', 'Yeni bir kişi README ile 15 dakikada uygulamayı açar.'],
        evidence='package.json, api/scripts/db-start.mjs, README.md',
    ),
    dict(
        id='US-02', epic='Platform', title='Sağlık ve CI', role='Ekip',
        story='Her PR’da lint, tip, test ve build otomatik çalışsın istiyorum.',
        priority='Must', points=2, sprint='Sprint 0', status='Tamam',
        criteria=['/api/health DB durumunu döner.', 'CI lint, typecheck, test ve build adımlarını çalıştırır.', 'Kırık PR merge edilemez.'],
        evidence='.github/workflows/ci.yml, api/src/routes/health.ts',
    ),
    dict(
        id='US-03', epic='Hesap', title='Kayıt olma', role='Ziyaretçi',
        story='E-posta ve şifreyle hesap açmak istiyorum.',
        priority='Must', points=5, sprint='Sprint 1', status='Tamam',
        criteria=['Geçersiz e-posta ve 8 karakterden kısa şifre Türkçe hata döner.', 'Aynı e-posta ikinci kez kaydolamaz; 409 EMAIL_TAKEN döner.', 'Şifre bcrypt ile saklanır, yanıtta hash yoktur.', 'Başarılı kayıtta httpOnly cookie verilir ve onboarding’e yönlendirilir.'],
        evidence='api/src/routes/auth.ts, api/src/lib/password.ts, api/src/routes/auth.test.ts',
    ),
    dict(
        id='US-04', epic='Hesap', title='Giriş ve çıkış', role='Kullanıcı',
        story='Hesabıma giriş yapmak ve oturumumu güvenli biçimde kapatmak istiyorum.',
        priority='Must', points=3, sprint='Sprint 1', status='Tamam',
        criteria=['Doğru bilgilerle giriş 200 ve cookie döner.', 'Yanlış şifre 401 INVALID_CREDENTIALS döner.', 'Çıkış cookie’yi temizler; korumalı sayfa login’e yönlenir.'],
        evidence='api/src/routes/auth.ts, web/src/auth/AuthContext.tsx, web/src/components/ProtectedRoute.tsx',
    ),
    dict(
        id='US-05', epic='Hesap', title='Tercihler', role='Kullanıcı',
        story='İlgi alanlarımı, bütçe seviyemi ve tempomu kaydetmek istiyorum.',
        priority='Must', points=5, sprint='Sprint 1', status='Tamam',
        criteria=['İlgi alanları en fazla 12 etiket olabilir.', 'Bütçe low/mid/high; tempo slow/moderate/fast.', 'Tercih yoksa makul varsayılanlarla oluşturulur.', 'AI planı bu tercihleri kullanır.'],
        evidence='api/src/routes/preferences.ts, web/src/pages/OnboardingPage.tsx',
    ),
    dict(
        id='US-06', epic='Hesap', title='Yetki ve sahiplik', role='Kullanıcı',
        story='Yalnızca kendi gezilerimi görmek istiyorum.',
        priority='Must', points=5, sprint='Sprint 1', status='Tamam',
        criteria=['Trip/Day/Activity sorguları userId ile filtrelenir.', 'Başkasının kaynağı 404 döner.', 'Korumalı endpoint’ler cookie olmadan 401 döner.'],
        evidence='api/src/middleware/auth.ts, api/src/routes/trips.ts',
    ),
    dict(
        id='US-07', epic='Gezi', title='Gezi oluşturma', role='Kullanıcı',
        story='Destinasyon, tarih ve bütçe girerek gezi oluşturmak istiyorum.',
        priority='Must', points=5, sprint='Sprint 1', status='Tamam',
        criteria=['Bitiş tarihi başlangıçtan önce olamaz.', 'Gezi en fazla 21 gün olabilir.', 'Gün sayısı kadar TripDay oluşur.', 'Para birimi 3 harf; bütçe negatif olamaz.'],
        evidence='api/src/routes/trips.ts, web/src/pages/NewTripPage.tsx, api/src/routes/trips.test.ts',
    ),
    dict(
        id='US-08', epic='Gezi', title='Gezileri listeleme ve silme', role='Kullanıcı',
        story='Gezilerimi tek ekranda görmek ve gerektiğinde silmek istiyorum.',
        priority='Must', points=3, sprint='Sprint 1', status='Tamam',
        criteria=['Liste tarihe göre sıralıdır.', 'Her satırda rota, tarih, durum, durak ve bütçe görünür.', 'Silme iki adımlı onay ister; alt kayıtlar cascade silinir.'],
        evidence='web/src/pages/TripsPage.tsx, api/src/routes/trips.ts',
    ),
    dict(
        id='US-09', epic='Gezi', title='Gezi detayı ve günler', role='Kullanıcı',
        story='Gezimin günlerini ve planını tek defterde görmek istiyorum.',
        priority='Must', points=5, sprint='Sprint 1', status='Tamam',
        criteria=['Her gün tarih, durak sayısı ve toplam maliyet gösterir.', 'Aktiviteler saat ve kategori ile listelenir.', 'Boş gün için yönlendirici bir durum vardır.'],
        evidence='web/src/pages/TripDetailPage.tsx, api/src/routes/trips.ts',
    ),
    dict(
        id='US-10', epic='Gezi', title='Aktivite ekleme ve silme', role='Kullanıcı',
        story='Plana elle yeni bir durak eklemek veya gereksiz durağı silmek istiyorum.',
        priority='Must', points=5, sprint='Sprint 2', status='Tamam',
        criteria=['Başlık zorunlu; saat SS:DD biçiminde.', 'Yeni aktivite günün sonuna eklenir.', 'Silme sahiplik kontrolünden geçer.', 'Form açılınca ilk alana odaklanır.'],
        evidence='api/src/routes/trips.ts, web/src/pages/TripDetailPage.tsx',
    ),
    dict(
        id='US-11', epic='AI', title='AI ile plan üretimi', role='Kullanıcı',
        story='Tek tıkla gün gün, saatli ve maliyetli bir plan almak istiyorum.',
        priority='Must', points=8, sprint='Sprint 3', status='Tamam',
        criteria=['Plan, gezi gün sayısı kadar gün içerir.', 'Her aktivitede saat, kategori ve tahmini maliyet vardır.', 'Tercihler plana yansır.', 'Toplam maliyet sunucuda hesaplanır.', 'Plan tips alanıyla birlikte kalıcıdır.'],
        evidence='api/src/services/itinerary.ts, api/src/routes/trips.ts, api/src/services/itinerary.test.ts',
    ),
    dict(
        id='US-12', epic='AI', title='Halüsinasyon filtresi', role='Ekip',
        story='LLM’in olmayan mekânları uydurmasını engellemek istiyorum.',
        priority='Must', points=5, sprint='Sprint 3', status='Tamam',
        criteria=['Yalnızca aday listesindeki googlePlaceId kabul edilir.', 'Şema dışı yanıt plana dönüşmez.', 'Gün sayısı ve toplam maliyet sunucuda doğrulanır.'],
        evidence='api/src/services/itinerary.ts, normalizeLlmPlan testleri',
    ),
    dict(
        id='US-13', epic='AI', title='Fallback ve model routing', role='Ekip',
        story='Sağlayıcı hatasında uygulamanın ayakta kalmasını istiyorum.',
        priority='Must', points=5, sprint='Sprint 3', status='Tamam',
        criteria=['LLM_PROVIDER=offline anahtarsız çalışır.', 'Gemini/OpenAI timeout veya hatasında offline üreticiye düşer.', 'meta.fallback=true döner.', 'Günlük AI limiti uygulanır.'],
        evidence='api/src/services/itinerary.ts, docs/AI_NATIVE_TEAM.md',
    ),
    dict(
        id='US-14', epic='AI', title='Bütçe ve pratik notlar', role='Kullanıcı',
        story='Planın bütçemi aşıp aşmadığını ve pratik notları görmek istiyorum.',
        priority='Should', points=3, sprint='Sprint 3', status='Tamam',
        criteria=['Kalan bütçe büyük ve okunur gösterilir.', 'Aşım varsa metinle uyarı verilir.', 'Toplam ve günlük maliyet görünür.', 'AI ipuçları “Pratik notlar” olarak gösterilir.'],
        evidence='web/src/pages/TripDetailPage.tsx',
    ),
    dict(
        id='US-15', epic='Yerler', title='Yer kataloğu ve arama', role='Kullanıcı',
        story='Şehirdeki yerleri arayıp plana bağlamak istiyorum.',
        priority='Should', points=5, sprint='Sprint 2', status='Kısmi',
        criteria=['Yerleşik katalog İstanbul, Paris, Roma, Barselona, Londra ve Amsterdam’ı kapsar.', 'Arama Place tablosuna cache yazar.', 'Gerçek Google Places proxy’si anahtar sağlanınca eklenecek.'],
        evidence='api/src/data/places.ts, api/src/routes/places.ts',
    ),
    dict(
        id='US-16', epic='UX', title='Mobil uygulama deneyimi', role='Gezgin',
        story='Siteyi telefonda uygulama gibi kullanmak istiyorum.',
        priority='Should', points=5, sprint='Sprint 5', status='Tamam',
        criteria=['375 px’te tek satır header ve sabit alt tab bar vardır.', 'Başlık, fotoğraf ve rota fişi tek akışta okunur.', 'Dokunma hedefleri 44 px’tir.'],
        evidence='web/src/index.css, web/src/components/Layout.tsx, docs/preview-rotasyon-se.png',
    ),
    dict(
        id='US-17', epic='UX', title='Erişilebilirlik ve boş durumlar', role='Kullanıcı',
        story='Klavyeyle gezinebilmek ve hata/boş durumlarda ne yapacağımı bilmek istiyorum.',
        priority='Should', points=3, sprint='Sprint 5', status='Tamam',
        criteria=['Form alanları görünür etiketlidir.', 'Odak halkası 2-3 px ve görünürdür.', 'Hatalar role=alert ile duyurulur.', 'Boş gezi, boş gün ve 404 için yönlendirici metin vardır.'],
        evidence='web/src/pages/*.tsx, web/src/index.css',
    ),
    dict(
        id='US-18', epic='Güvenlik', title='Rate limit ve secret koruması', role='Ekip',
        story='Auth ve AI endpoint’lerini kötüye kullanıma karşı korumak istiyorum.',
        priority='Must', points=3, sprint='Sprint 3', status='Tamam',
        criteria=['Auth için 30 istek / 15 dakika limiti vardır.', 'AI için günlük limit vardır.', '.env gitignore’dadır; repoda anahtar yoktur.'],
        evidence='api/src/app.ts, .gitignore, .env.example',
    ),
    dict(
        id='US-19', epic='Kalite', title='AI review ve agent artefaktları', role='Ekip',
        story='Agent’ların aynı kurallarla çalışmasını ve review’un standart olmasını istiyorum.',
        priority='Should', points=5, sprint='Sprint 5', status='Tamam',
        criteria=['Kök AGENTS.md ve alan bazlı talimatlar vardır.', 'Feature/review/security skill’leri vardır.', 'MCP sunucusu ve AI review config’i vardır.', 'PR şablonu AI triage bölümü içerir.'],
        evidence='AGENTS.md, .agents/skills, mcp/wayora-context, .coderabbit.yaml',
    ),
    dict(
        id='US-20', epic='Kalite', title='Kritik akış testleri', role='Ekip',
        story='Auth, gezi ve AI akışlarının otomatik doğrulanmasını istiyorum.',
        priority='Must', points=5, sprint='Sprint 5', status='Tamam',
        criteria=['Auth başarı ve hata yolları test edilir.', 'Gezi doğrulama testleri vardır.', 'Offline plan, halüsinasyon, prompt sınırı ve fallback test edilir.', 'Web’de landing, login, korumalı rota ve boş liste test edilir.'],
        evidence='api/src/**/*.test.ts, web/src/App.test.tsx',
    ),
]


def build_user_stories():
    doc = setup_document()
    add_cover(doc, 'User Story Kataloğu', 'Kabul kriterleri, öncelikler, sprint eşlemesi ve test kanıtları')

    doc.add_heading('Nasıl Okunur?', level=1)
    add_bullets(
        doc,
        [
            'Her story tek bir kullanıcı değeri taşır; kabul kriterleri test edilebilir olmalıdır.',
            'MoSCoW: Must, Should, Could. Puanlar Fibonacci (1, 2, 3, 5, 8).',
            'Durum: Tamam, Kısmi veya Açık. Kısmi story’nin eksik parçası açıkça yazılır.',
            'Kanıt alanı; ilgili dosya, route veya test dosyasını gösterir.',
        ],
    )

    doc.add_heading('Özet Tablo', level=1)
    rows = [(s['id'], s['title'], s['epic'], s['priority'], str(s['points']), s['sprint'], s['status']) for s in STORIES]
    add_table(
        doc,
        ['ID', 'Story', 'Epic', 'Öncelik', 'Puan', 'Sprint', 'Durum'],
        rows,
        widths=[1.5, 6.2, 2.2, 2.0, 1.2, 2.2, 2.2],
        font_size=7.5,
    )
    total_points = sum(s['points'] for s in STORIES)
    done_points = sum(s['points'] for s in STORIES if s['status'] == 'Tamam')
    add_paragraph(doc, f'Toplam {len(STORIES)} story · {total_points} puan · tamamlanan {done_points} puan.')

    doc.add_heading('Story Detayları', level=1)
    for story in STORIES:
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(10)
        r = p.add_run(f"{story['id']} · {story['title']}")
        r.bold = True
        r.font.name = BODY_FONT
        r.font.size = Pt(12)
        r.font.color.rgb = TERRA

        p = doc.add_paragraph()
        r = p.add_run(f"Epic: {story['epic']} · Öncelik: {story['priority']} · Puan: {story['points']} · {story['sprint']} · {story['status']}")
        r.font.name = MONO_FONT
        r.font.size = Pt(7.5)
        r.font.color.rgb = MUTED

        add_paragraph(doc, f"Olarak {story['role'].lower()}, {story['story'].lower()}", bold_lead='Kullanıcı hikâyesi: ')
        p = doc.add_paragraph()
        r = p.add_run('Kabul kriterleri')
        r.bold = True
        r.font.size = Pt(9)
        r.font.color.rgb = INK
        for criterion in story['criteria']:
            b = doc.add_paragraph(criterion, style='List Bullet')
            b.paragraph_format.space_after = Pt(1)
            for run in b.runs:
                run.font.size = Pt(9)
        p = doc.add_paragraph()
        r = p.add_run('Kanıt: ')
        r.bold = True
        r.font.size = Pt(8.5)
        r.font.color.rgb = MUTED
        r2 = p.add_run(story['evidence'])
        r2.font.name = MONO_FONT
        r2.font.size = Pt(7.5)
        r2.font.color.rgb = MUTED

    doc.add_heading('İzlenebilirlik Matrisi', level=1)
    add_table(
        doc,
        ['Story', 'Uygulama', 'Test'],
        [
            ('US-03, US-04', 'api/src/routes/auth.ts', 'api/src/routes/auth.test.ts'),
            ('US-05', 'api/src/routes/preferences.ts', 'auth.test.ts içinde tercih testleri'),
            ('US-06', 'middleware/auth.ts, trips.ts', 'trips.test.ts, auth.test.ts'),
            ('US-07, US-08, US-09', 'api/src/routes/trips.ts', 'api/src/routes/trips.test.ts'),
            ('US-11, US-12, US-13', 'api/src/services/itinerary.ts', 'api/src/services/itinerary.test.ts'),
            ('US-16, US-17', 'web/src/index.css, pages', 'web/src/App.test.tsx'),
            ('US-19, US-20', 'AGENTS.md, skills, CI, tests', 'CI + test çıktıları'),
        ],
        widths=[4.2, 6.4, 5.6],
    )

    doc.add_heading('Kapsam Dışı ve Sonraki Sprint', level=1)
    add_table(
        doc,
        ['Fikir', 'Durum', 'Not'],
        [
            ('Gerçek Google Places / harita pinleri', 'Açık', 'Anahtar ve bütçe gerekiyor'),
            ('Sürükle-bırak sıralama', 'Açık', 'Sprint 4 kapsamı'),
            ('Kısmi gün / aktivite yeniden üretimi', 'Açık', 'LLM maliyeti ve UX tasarımı gerekli'),
            ('Paylaşılabilir salt-okunur link', 'Açık', 'Token ve public görünüm'),
            ('E-posta doğrulama / şifre sıfırlama', 'Açık', 'E-posta servisi gerekli'),
            ('Bulut deploy ve demo verisi', 'Açık', 'Vercel/Render/Neon planı'),
        ],
        widths=[7.0, 2.2, 7.0],
    )

    output = OUT / 'Wayora-User-Stories.docx'
    doc.save(output)
    print('wrote', output)


if __name__ == '__main__':
    build_report()
    build_pm_plan()
    build_user_stories()
