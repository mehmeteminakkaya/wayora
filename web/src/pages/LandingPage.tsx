import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

const stops = [
  { time: '09:00', title: 'Louvre / Merdivenler', price: '22 €', checked: true },
  { time: '12:30', title: 'Latin Quarter / Pazarlar', price: '35 €', checked: true },
  { time: '15:00', title: 'Luxembourg Bahçesi', price: 'Ücretsiz', checked: false },
]

const dayNotes = [
  {
    stamp: 'GÜN 01',
    title: 'Müze, mahalle, bahçe.',
    meta: '3 durak · 09:00–17:00',
    rows: [
      { time: '09:00', title: 'Louvre', price: '22 €' },
      { time: '12:30', title: 'Latin Quarter', price: '35 €' },
      { time: '15:00', title: 'Luxembourg', price: 'Ücretsiz' },
    ],
    hand: 'sabah sakin.',
  },
  {
    stamp: 'GÜN 02',
    title: 'Eyfel, sokaklar, akşam.',
    meta: '3 durak · 10:00–20:00',
    rows: [
      { time: '10:00', title: 'Eyfel Kulesi', price: '29 €' },
      { time: '13:00', title: 'Montmartre', price: 'Ücretsiz' },
      { time: '18:30', title: 'Seine kıyısı', price: 'Ücretsiz' },
    ],
    hand: 'gün batımını kaçırma.',
  },
  {
    stamp: 'GÜN 03',
    title: 'Pazar, kahve, dönüş.',
    meta: '2 durak · 09:30–15:00',
    rows: [
      { time: '09:30', title: 'Borough Market', price: '20 €' },
      { time: '13:00', title: 'Galeries Lafayette', price: 'Ücretsiz' },
    ],
    hand: 'çantada yer bırak.',
  },
]

const cities = [
  { name: 'İstanbul', image: '/images/istanbul.jpg', label: '3 GÜN / 7 DURAK' },
  { name: 'Paris', image: '/images/paris.jpg', label: '3 GÜN / 9 DURAK' },
  { name: 'Roma', image: '/images/rome.jpg', label: '2 GÜN / 6 DURAK' },
]

export function LandingPage() {
  const { user } = useAuth()

  return (
    <div className="landing">
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">SEYAHAT PLANLAMA / 01</p>
          <h1>
            Bir şehir.
            <span>Üç gün.</span>
          </h1>
        </div>

        <div className="hero-visual">
          <p className="hand hero-hand">
            bütçe 500 € <span className="hand-arrow" aria-hidden="true">↙</span>
          </p>
          <figure className="photo-frame hero-photo">
            <img src="/images/paris.jpg" alt="Eyfel Kulesi ve Paris silüeti" />
            <span className="film-code film-code-left" aria-hidden="true">
              253.35.3'30f
            </span>
            <span className="film-code film-code-right" aria-hidden="true">
              18.20.06'27
            </span>
            <figcaption className="photo-caption">
              <span>PARİS // 14:02</span>
              <span>48.8584 / 2.2945</span>
            </figcaption>
          </figure>

          <div className="route-card" aria-label="Örnek günlük rota">
            <div className="route-card-head">
              <span className="mono">01 / GÜNLÜK ROTA</span>
              <span className="stamp">03 GÜN</span>
            </div>
            {stops.map((stop) => (
              <div className="route-stop" key={stop.time}>
                <span className="route-check" aria-hidden="true">
                  {stop.checked ? '✓' : ''}
                </span>
                <span className="route-time">{stop.time}</span>
                <span className="route-title">{stop.title}</span>
                <span className="route-price">{stop.price}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="hero-details">
          <p className="hero-lead">
            Wayora; ilgi alanlarını, bütçeni ve temponu okur. Şehri günlere, günleri saatlere
            böler. Planı hazır bırakmaz, düzenlemen için eline verir.
          </p>
          <div className="hero-actions">
            <Link className="button large" to={user ? '/trips/new' : '/register'}>
              {user ? 'Rotanı çiz' : 'İlk rotayı çiz'}
            </Link>
            <a className="text-link" href="#gunluk-rota">
              Örnek plana bak
            </a>
          </div>
          <p className="hand hero-note">üç gün yeter.</p>
        </div>
      </section>

      <div className="route-strip" aria-hidden="true">
        <span>İSTANBUL</span>
        <span>PARİS</span>
        <span>ROMA</span>
        <span>LİZBON</span>
        <span>AMSTERDAM</span>
      </div>

      <section className="notebook" id="gunluk-rota">
        <div className="section-head">
          <div>
            <p className="eyebrow">02 / DEFTER</p>
            <h2>Günün notları.</h2>
          </div>
          <p>Her gün bir sayfa. Saatler, duraklar ve maliyetler aynı yerde.</p>
        </div>

        <div className="notebook-grid">
          {dayNotes.map((day) => (
            <article className="note-card" key={day.stamp}>
              <span className="stamp">{day.stamp}</span>
              <h3>{day.title}</h3>
              <p className="note-meta">{day.meta}</p>
              {day.rows.map((row) => (
                <div className="note-row" key={row.time}>
                  <span className="route-check" aria-hidden="true">
                    ✓
                  </span>
                  <span className="route-time">{row.time}</span>
                  <span className="route-title">{row.title}</span>
                  <span className="route-price">{row.price}</span>
                </div>
              ))}
              <div className="note-foot">
                <span className="mono">{day.rows.length} DURAK</span>
                <span className="hand">{day.hand}</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="photo-break">
        <img src="/images/street.jpg" alt="Akşam ışığında Paris sokağı" />
        <div className="photo-overlay">
          <p className="eyebrow">03 / ŞEHİR NOTLARI</p>
          <h2>Sessiz keşif.</h2>
          <p>
            Kalabalığın olmadığı saatleri plana ekle. Wayora durakları sıraya koyar; sen sadece
            yürürsün.
          </p>
        </div>
        <aside className="paper-note">
          <p className="hand">notlar: sabah erken çık, ara sokaklara gir.</p>
        </aside>
      </section>

      <section className="budget-section">
        <div>
          <p className="eyebrow">04 / BÜTÇE</p>
          <h2>500 € nereye gider?</h2>
          <p>
            Tahmini maliyet planın içinde görünür. Bütçeni aşarsan Wayora bunu saklamaz; kalan
            tutarı ve aşımı aynı sayfada gösterir.
          </p>
          <p className="hand" style={{ marginTop: '1.2rem' }}>
            para cebinde kalsın.
          </p>
          <span className="stamp" style={{ marginTop: '0.8rem' }}>
            BÜTÇE 500 €
          </span>
        </div>

        <div className="receipt">
          <div className="receipt-head">
            <span className="mono">PARİS / 3 GÜN</span>
            <span className="mono">TAHMİN</span>
          </div>
          <div className="receipt-row">
            <span>Ulaşım</span>
            <span>60 €</span>
          </div>
          <div className="receipt-row">
            <span>Müzeler</span>
            <span>40 €</span>
          </div>
          <div className="receipt-row">
            <span>Yemek</span>
            <span>72 €</span>
          </div>
          <div className="receipt-total">
            <span className="mono">TOPLAM</span>
            <strong>172 €</strong>
          </div>
        </div>
      </section>

      <section className="city-strip" aria-label="Şehirler">
        {cities.map((city) => (
          <article className="city-card" key={city.name}>
            <img src={city.image} alt={`${city.name} şehir görünümü`} />
            <div className="city-caption">
              <span>{city.name}</span>
              <span>{city.label}</span>
            </div>
          </article>
        ))}
      </section>

      <section className="cta explore-teaser">
        <div>
          <p className="eyebrow">05 / ŞEHİR REHBERİ</p>
          <h2>10 şehir. 100 deneyim.</h2>
          <p>Müzeler, sokak lezzetleri, parklar ve günübirlik rotalar. Fiyatları gör, bütçeni kur.</p>
        </div>
        <Link className="button large" to="/kesfet">
          Keşfe başla
        </Link>
      </section>

      <section className="cta">
        <div>
          <h2>Rotanı çiz.</h2>
          <p>Üç soruya cevap ver, planını al. Sonra kendi ritmine göre düzenle.</p>
        </div>
        <Link className="button large" to={user ? '/trips/new' : '/register'}>
          {user ? 'Yeni rota çiz' : 'Hesap aç'}
        </Link>
      </section>
    </div>
  )
}
