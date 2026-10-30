import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  CalendarDays,
  Check,
  HeartHandshake,
  Home,
  LockKeyhole,
  MessageCircle,
  Send,
  ShieldCheck,
  UserRound,
  X,
} from 'lucide-react'
import { api } from '../api'
import type {
  SocialConnection,
  SocialConnections,
  SocialMatch,
  SocialMessage,
  SocialPreferences,
  SocialProfile,
  SocialProfileInput,
} from '../api'
import { BottomSheet } from '../components/BottomSheet'
import { DetailSkeleton } from '../components/Skeletons'
import { formatShortDate, interestLabel } from '../lib/format'

type SocialTab = 'matches' | 'requests' | 'chats'
type Tab = SocialTab

const LANGUAGE_HINTS = 'Türkçe, İngilizce, Almanca'

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toLocaleUpperCase('tr-TR') ?? '')
    .join('')
}

function dateRange(start: string, end: string): string {
  const startDate = new Date(`${start}T00:00:00.000Z`)
  const endDate = new Date(`${end}T00:00:00.000Z`)
  const short = (date: Date, options: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat('tr-TR', { ...options, timeZone: 'UTC' }).format(date)
  if (startDate.getUTCFullYear() !== endDate.getUTCFullYear()) {
    return `${formatShortDate(start)} – ${formatShortDate(end)}`
  }
  if (startDate.getUTCMonth() === endDate.getUTCMonth()) {
    return `${short(startDate, { day: 'numeric' })}–${short(endDate, {
      day: 'numeric',
      month: 'short',
    })} ${startDate.getUTCFullYear()}`
  }
  return `${short(startDate, { day: 'numeric', month: 'short' })} – ${short(endDate, {
    day: 'numeric',
    month: 'short',
  })} ${startDate.getUTCFullYear()}`
}

function matchLabel(score: number): string {
  if (score >= 80) return 'Güçlü ortak nokta'
  if (score >= 60) return 'İyi eşleşme'
  return 'Ortak nokta var'
}

function profileForm(profile: SocialProfile | null) {
  return {
    displayName: profile?.displayName ?? '',
    bio: profile?.bio ?? '',
    languages: profile?.languages.join(', ') ?? '',
    hostingAvailable: profile?.hostingAvailable ?? false,
    hostingNote: profile?.hostingNote ?? '',
    visible: profile?.visible ?? false,
    safetyAccepted: profile?.safetyAccepted ?? false,
  }
}

export function HitchhikerPage() {
  const [profile, setProfile] = useState<SocialProfile | null>(null)
  const [preferences, setPreferences] = useState<SocialPreferences | null>(null)
  const [matches, setMatches] = useState<SocialMatch[]>([])
  const [connections, setConnections] = useState<SocialConnections>({
    incoming: [],
    outgoing: [],
    accepted: [],
  })
  const [tab, setTab] = useState<Tab>('matches')
  const [loading, setLoading] = useState(true)
  const [matchesLoading, setMatchesLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(profileForm(null))

  const [requestTarget, setRequestTarget] = useState<SocialMatch | null>(null)
  const [requestMessage, setRequestMessage] = useState('')
  const [requestBusy, setRequestBusy] = useState(false)
  const [requestError, setRequestError] = useState<string | null>(null)

  const [chatConnection, setChatConnection] = useState<SocialConnection | null>(null)
  const [chatMessages, setChatMessages] = useState<SocialMessage[]>([])
  const [chatBusy, setChatBusy] = useState(false)
  const [chatError, setChatError] = useState<string | null>(null)
  const [chatRefreshing, setChatRefreshing] = useState(false)
  const [safetyConfirm, setSafetyConfirm] = useState<'block' | 'report' | null>(null)

  useEffect(() => {
    let active = true
    Promise.all([api.getSocialProfile(), api.getSocialConnections()])
      .then(([profileResult, connectionResult]) => {
        if (!active) return
        setProfile(profileResult.profile)
        setPreferences(profileResult.preferences)
        setForm(profileForm(profileResult.profile))
        setEditing(false)
        setConnections(connectionResult)
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : 'Yol arkadaşları yüklenemedi.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (!profile?.visible) {
      return
    }
    let active = true
    // Eşleşme isteği başlarken yükleme durumunu görünür tut.
    // oxlint-disable-next-line react/set-state-in-effect
    setMatchesLoading(true)
    api
      .getSocialMatches()
      .then((result) => {
        if (active) setMatches(result.matches)
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : 'Eşleşmeler yüklenemedi.')
      })
      .finally(() => {
        if (active) setMatchesLoading(false)
      })
    return () => {
      active = false
    }
  }, [profile?.visible])

  useEffect(() => {
    if (!chatConnection) return
    let active = true
    async function loadMessages() {
      try {
        const result = await api.getSocialMessages(chatConnection!.id)
        if (active) setChatMessages(result.messages)
        if (active) setChatError(null)
      } catch (err) {
        if (active) setChatError(err instanceof Error ? err.message : 'Mesajlar yüklenemedi.')
      } finally {
        if (active) setChatRefreshing(false)
      }
    }
    void loadMessages()
    const timer = window.setInterval(loadMessages, 5000)
    return () => {
      active = false
      window.clearInterval(timer)
    }
  }, [chatConnection])

  async function reloadConnections() {
    const result = await api.getSocialConnections()
    setConnections(result)
  }

  async function handleSaveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError(null)
    setNotice(null)
    const input: SocialProfileInput = {
      displayName: form.displayName,
      bio: form.bio,
      languages: form.languages
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
      hostingAvailable: form.hostingAvailable,
      hostingNote: form.hostingNote.trim() || null,
      visible: form.visible,
      safetyAccepted: form.safetyAccepted,
    }
    try {
      const result = await api.saveSocialProfile(input)
      setProfile(result.profile)
      setForm(profileForm(result.profile))
      setEditing(false)
      setNotice(
        result.profile.visible
          ? 'Yol arkadaşı profilin açıldı. Eşleşmeleri aşağıdan görebilirsin.'
          : 'Profilin kaydedildi. Görünür olduğunda eşleşmeleri görebilirsin.',
      )
      await reloadConnections()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Profil kaydedilemedi.')
    } finally {
      setSaving(false)
    }
  }

  async function sendRequest() {
    if (!requestTarget) return
    setRequestBusy(true)
    setRequestError(null)
    try {
      await api.sendSocialRequest(requestTarget.userId, requestMessage)
      setMatches((current) => current.filter((item) => item.userId !== requestTarget.userId))
      setRequestTarget(null)
      setRequestMessage('')
      setNotice(`${requestTarget.displayName} kişisine bağlantı isteği gönderildi.`)
      await reloadConnections()
      setTab('requests')
    } catch (err) {
      setRequestError(err instanceof Error ? err.message : 'İstek gönderilemedi.')
    } finally {
      setRequestBusy(false)
    }
  }

  async function answerConnection(connection: SocialConnection, action: 'accept' | 'decline' | 'cancel') {
    try {
      await api.updateSocialConnection(connection.id, action)
      await reloadConnections()
      if (action === 'accept') {
        setNotice(`${connection.other.name} ile bağlantı kuruldu. Artık mesajlaşabilirsiniz.`)
        setTab('chats')
      } else {
        setNotice('Bağlantı isteği güncellendi.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bağlantı güncellenemedi.')
    }
  }

  async function openChat(connection: SocialConnection) {
    setChatConnection(connection)
    setChatMessages([])
    setChatError(null)
    setChatRefreshing(true)
    setSafetyConfirm(null)
  }

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!chatConnection) return
    const formElement = event.currentTarget
    const formData = new FormData(formElement)
    const body = String(formData.get('message') ?? '').trim()
    if (!body || chatBusy) return
    setChatBusy(true)
    setChatError(null)
    try {
      const result = await api.sendSocialMessage(chatConnection.id, body)
      setChatMessages((current) => [...current, { ...result.message, senderId: '', senderName: 'Sen', mine: true }])
      formElement.reset()
    } catch (err) {
      setChatError(err instanceof Error ? err.message : 'Mesaj gönderilemedi.')
    } finally {
      setChatBusy(false)
    }
  }

  async function blockOther() {
    if (!chatConnection) return
    try {
      await api.blockSocialUser(chatConnection.other.id)
      setChatConnection(null)
      setSafetyConfirm(null)
      setNotice(`${chatConnection.other.name} engellendi.`)
      await reloadConnections()
      if (profile?.visible) {
        const result = await api.getSocialMatches()
        setMatches(result.matches)
      }
    } catch (err) {
      setChatError(err instanceof Error ? err.message : 'Kullanıcı engellenemedi.')
    }
  }

  async function reportOther() {
    if (!chatConnection) return
    try {
      await api.reportSocialConnection(chatConnection.id, 'safety', 'Sohbet güvenliği bildirimi')
      setChatConnection(null)
      setSafetyConfirm(null)
      setNotice('Bildirim alındı. Kullanıcı engellendi.')
      await reloadConnections()
    } catch (err) {
      setChatError(err instanceof Error ? err.message : 'Bildirim gönderilemedi.')
    }
  }

  if (loading) return <DetailSkeleton />

  const incoming = connections.incoming
  const outgoing = connections.outgoing
  const accepted = connections.accepted
  const hasProfile = Boolean(profile)
  const showProfileForm = editing || (hasProfile && !profile?.visible)
  const tabCount = (value: Tab) =>
    value === 'matches'
      ? matches.length
      : value === 'requests'
        ? incoming.length + outgoing.length
        : accepted.length

  return (
    <div className="page social-page">
      <header className="social-hero">
        <p className="label">YOL ARKADAŞLARI</p>
        <h1>Aynı yöne gidenler.</h1>
        <p>
          Aynı şehirde, benzer tarihlerde olacağın gezginleri bul. Ortak noktalarınızı gör,
          güvenli biçimde bağlantı kur.
        </p>
      </header>

      {error && (
        <p className="notice error" role="alert">
          {error}
        </p>
      )}
      {notice && (
        <p className="notice success" role="status">
          {notice}
        </p>
      )}

      {!hasProfile && !editing && (
        <section className="social-start">
          <div className="social-start-icon">
            <HeartHandshake size={26} strokeWidth={1.75} aria-hidden="true" />
          </div>
          <h2>Profilini aç, yol arkadaşını bul.</h2>
          <p>
            E-posta ve telefonun asla gösterilmez. Sadece şehir, tarih ve seyahat tarzı
            üzerinden eşleşirsin.
          </p>
          <button className="btn btn-primary" type="button" onClick={() => setEditing(true)}>
            Yol arkadaşı profili oluştur
          </button>
        </section>
      )}

      {showProfileForm && (
        <form className="social-profile-form" onSubmit={handleSaveProfile}>
          <div className="section-head">
            <div>
              <p className="label">{hasProfile ? 'PROFİLİ DÜZENLE' : 'YENİ PROFİL'}</p>
              <h2>Kendini kısaca anlat.</h2>
            </div>
            <ShieldCheck size={22} strokeWidth={1.75} aria-hidden="true" />
          </div>

          <label className="field">
            <span>Görünen ad</span>
            <input
              className="input"
              name="displayName"
              value={form.displayName}
              onChange={(event) => setForm({ ...form, displayName: event.target.value })}
              maxLength={80}
              placeholder="Örn. Deniz"
              required
            />
          </label>

          <label className="field">
            <span>Kısa tanıtım</span>
            <textarea
              className="textarea"
              name="bio"
              value={form.bio}
              onChange={(event) => setForm({ ...form, bio: event.target.value })}
              maxLength={240}
              minLength={20}
              rows={4}
              placeholder="Nasıl seyahat edersin? Neyi seversin?"
              required
            />
            <span className="helper">{form.bio.length}/240 · en az 20 karakter</span>
          </label>

          <label className="field">
            <span>Diller</span>
            <input
              className="input"
              name="languages"
              value={form.languages}
              onChange={(event) => setForm({ ...form, languages: event.target.value })}
              placeholder={LANGUAGE_HINTS}
            />
            <span className="helper">Virgülle ayır. En fazla 6 dil.</span>
          </label>

          <div className="social-checks">
            <label className="check-row">
              <input
                type="checkbox"
                checked={form.visible}
                onChange={(event) => setForm({ ...form, visible: event.target.checked })}
              />
              <span>
                <strong>Yol arkadaşı profilim görünür olsun</strong>
                <small>Yalnızca aynı şehir ve tarihlerdeki gezginlere görünürsün.</small>
              </span>
            </label>

            <label className="check-row">
              <input
                type="checkbox"
                checked={form.hostingAvailable}
                onChange={(event) => setForm({ ...form, hostingAvailable: event.target.checked })}
              />
              <span>
                <strong>Ev sahipliğine açığım</strong>
                <small>Bu bir rezervasyon değildir; adres veya ödeme paylaşılmaz.</small>
              </span>
            </label>

            {form.hostingAvailable && (
              <label className="field">
                <span>Ev sahipliği notu (opsiyonel)</span>
                <input
                  className="input"
                  value={form.hostingNote}
                  onChange={(event) => setForm({ ...form, hostingNote: event.target.value })}
                  maxLength={160}
                  placeholder="Örn. Kısa sohbet eşliğinde çay."
                />
              </label>
            )}

            <label className="check-row social-safety-check">
              <input
                type="checkbox"
                checked={form.safetyAccepted}
                onChange={(event) => setForm({ ...form, safetyAccepted: event.target.checked })}
              />
              <span>
                <strong>18 yaşından büyüğüm ve güvenlik kurallarını kabul ediyorum</strong>
                <small>
                  Karşındaki kişiye e-posta, telefon, adres veya canlı konum göndermemelisin.
                  Rahatsız edici davranışta bulunma, engelle ve bildir.
                </small>
              </span>
            </label>
          </div>

          <div className="form-actions">
            <button className="btn btn-primary" type="submit" disabled={saving}>
              {saving ? 'Kaydediliyor...' : 'Profili kaydet'}
            </button>
            {hasProfile && profile?.visible && (
              <button
                className="btn btn-ghost"
                type="button"
                onClick={() => {
                  setEditing(false)
                  setForm(profileForm(profile))
                }}
              >
                Vazgeç
              </button>
            )}
          </div>
        </form>
      )}

      {hasProfile && profile?.visible && !editing && (
        <>
          <section className="social-profile-card" aria-label="Yol arkadaşı profilin">
            <div className="social-avatar">{initials(profile?.displayName ?? '')}</div>
            <div className="social-profile-copy">
              <div className="social-profile-title">
                <h2>{profile?.displayName}</h2>
                <span className={profile?.visible ? 'status-pill go' : 'status-pill'}>
                  {profile?.visible ? 'Görünür' : 'Gizli'}
                </span>
              </div>
              <p>{profile?.bio}</p>
              <div className="social-tags">
                {(profile?.languages ?? []).map((language) => (
                  <span className="social-tag" key={language}>
                    {language}
                  </span>
                ))}
                {(preferences?.interests ?? []).slice(0, 4).map((interest) => (
                  <span className="social-tag muted-tag" key={interest}>
                    {interestLabel(interest)}
                  </span>
                ))}
                {profile?.hostingAvailable && <span className="social-tag signal-tag">Ev sahipliği</span>}
              </div>
            </div>
            <button className="btn btn-secondary btn-sm" type="button" onClick={() => setEditing(true)}>
              Düzenle
            </button>
          </section>

          <div className="social-tabs" role="tablist" aria-label="Yol arkadaşları bölümleri">
            {([
              ['matches', 'Eşleşmeler'],
              ['requests', 'İstekler'],
              ['chats', 'Sohbetler'],
            ] as const).map(([value, label]) => (
              <button
                key={value}
                className={tab === value ? 'social-tab is-active' : 'social-tab'}
                type="button"
                role="tab"
                aria-selected={tab === value}
                onClick={() => setTab(value)}
              >
                {label}
                {tabCount(value) > 0 && <span>{tabCount(value)}</span>}
              </button>
            ))}
          </div>

          {tab === 'matches' && (
            <section className="social-section" aria-label="Eşleşmeler">
              <div className="section-head">
                <div>
                  <p className="label">ROTANA GÖRE</p>
                  <h2>Yol arkadaşları</h2>
                </div>
                <span className="helper">Skor, ortak noktaların özetidir.</span>
              </div>
              {matchesLoading ? (
                <div className="loading-grid">
                  {[1, 2].map((item) => (
                    <div className="skeleton" style={{ height: 156 }} key={item} />
                  ))}
                </div>
              ) : matches.length === 0 ? (
                <div className="social-empty">
                  <UserRound size={26} strokeWidth={1.5} aria-hidden="true" />
                  <h3>Henüz eşleşme yok.</h3>
                  <p>
                    Profilin görünür olmalı ve en az bir rota tarihin olmalı. Yeni bir rota
                    oluşturduğunda aynı tarihlerdeki gezginler burada görünür.
                  </p>
                  <Link className="btn btn-secondary btn-sm" to="/trips/new">
                    Yeni rota oluştur
                  </Link>
                </div>
              ) : (
                <div className="match-grid">
                  {matches.map((match) => (
                    <article className="match-card" key={match.userId}>
                      <div className="match-card-head">
                        <div className="social-avatar">{initials(match.displayName)}</div>
                        <div>
                          <h3>{match.displayName}</h3>
                          <p>
                            <CalendarDays size={14} strokeWidth={1.75} aria-hidden="true" />
                            {match.destination} · {dateRange(match.startDate, match.endDate)}
                          </p>
                        </div>
                        <span className="match-score">{match.score}%</span>
                      </div>
                      <p className="match-bio">{match.bio}</p>
                      <div className="match-meter" aria-hidden="true">
                        <span style={{ width: `${match.score}%` }} />
                      </div>
                      <p className="match-label">{matchLabel(match.score)}</p>
                      <div className="match-reasons">
                        {match.reasons.slice(0, 3).map((reason) => (
                          <span className="social-tag" key={reason}>
                            {reason}
                          </span>
                        ))}
                        {match.hostingAvailable && (
                          <span className="social-tag signal-tag">
                            <Home size={13} strokeWidth={1.75} aria-hidden="true" />
                            Ev sahipliği
                          </span>
                        )}
                      </div>
                      {match.hostingAvailable && match.hostingNote && (
                        <p className="match-hosting-note">
                          <Home size={13} strokeWidth={1.75} aria-hidden="true" />
                          {match.hostingNote}
                        </p>
                      )}
                      <div className="match-actions">
                        <button
                          className="btn btn-primary btn-sm"
                          type="button"
                          onClick={() => {
                            setRequestTarget(match)
                            setRequestMessage('')
                            setRequestError(null)
                          }}
                        >
                          <Send size={16} strokeWidth={1.75} aria-hidden="true" />
                          Bağlantı iste
                        </button>
                        <span className="helper">{match.overlapDays} gün ortak</span>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          )}

          {tab === 'requests' && (
            <section className="social-section" aria-label="Bağlantı istekleri">
              <div className="social-columns">
                <div>
                  <div className="section-head">
                    <h2>Gelen istekler</h2>
                    <span className="helper">{incoming.length}</span>
                  </div>
                  {incoming.length === 0 ? (
                    <p className="social-empty small-empty">Şimdilik gelen istek yok.</p>
                  ) : (
                    incoming.map((connection) => (
                      <ConnectionRow
                        key={connection.id}
                        connection={connection}
                        onAccept={() => void answerConnection(connection, 'accept')}
                        onDecline={() => void answerConnection(connection, 'decline')}
                      />
                    ))
                  )}
                </div>
                <div>
                  <div className="section-head">
                    <h2>Gönderilen</h2>
                    <span className="helper">{outgoing.length}</span>
                  </div>
                  {outgoing.length === 0 ? (
                    <p className="social-empty small-empty">Henüz bir istek göndermedin.</p>
                  ) : (
                    outgoing.map((connection) => (
                      <ConnectionRow
                        key={connection.id}
                        connection={connection}
                        onCancel={() => void answerConnection(connection, 'cancel')}
                      />
                    ))
                  )}
                </div>
              </div>
            </section>
          )}

          {tab === 'chats' && (
            <section className="social-section" aria-label="Sohbetler">
              {accepted.length === 0 ? (
                <div className="social-empty">
                  <MessageCircle size={26} strokeWidth={1.5} aria-hidden="true" />
                  <h3>Henüz aktif sohbet yok.</h3>
                  <p>Karşılıklı kabul edilen bağlantılar burada mesajlaşabilir.</p>
                </div>
              ) : (
                <div className="connection-list">
                  {accepted.map((connection) => (
                    <article className="connection-row" key={connection.id}>
                      <div className="social-avatar small-avatar">{initials(connection.other.name)}</div>
                      <div>
                        <h3>{connection.other.name}</h3>
                        <p>{connection.message || 'Bağlantı kuruldu. İlk mesajı sen yaz.'}</p>
                      </div>
                      <button className="btn btn-secondary btn-sm" type="button" onClick={() => void openChat(connection)}>
                        <MessageCircle size={16} strokeWidth={1.75} aria-hidden="true" />
                        Mesajlar
                      </button>
                    </article>
                  ))}
                </div>
              )}
            </section>
          )}
        </>
      )}

      <BottomSheet
        open={Boolean(requestTarget)}
        title={requestTarget ? `${requestTarget.displayName} ile bağlantı` : 'Bağlantı isteği'}
        onClose={() => {
          if (!requestBusy) setRequestTarget(null)
        }}
        footer={
          <>
            <span className="helper">İstek karşı taraf kabul edince sohbet açılır.</span>
            <button className="btn btn-primary" type="button" onClick={() => void sendRequest()} disabled={requestBusy}>
              {requestBusy ? 'Gönderiliyor...' : 'İsteği gönder'}
            </button>
          </>
        }
      >
        {requestError && (
          <p className="notice error" role="alert">
            {requestError}
          </p>
        )}
        {requestTarget && (
          <div className="request-preview">
            <div className="social-avatar">{initials(requestTarget.displayName)}</div>
            <div>
              <strong>{requestTarget.displayName}</strong>
              <p>
                {requestTarget.destination} · {requestTarget.overlapDays} gün ortak
              </p>
            </div>
          </div>
        )}
        <label className="field">
          <span>Kısa mesaj (opsiyonel)</span>
          <textarea
            className="textarea"
            value={requestMessage}
            onChange={(event) => setRequestMessage(event.target.value)}
            maxLength={300}
            rows={3}
            placeholder="Merhaba, aynı tarihlerde Berlin'de olacağız..."
          />
        </label>
      </BottomSheet>

      <BottomSheet
        open={Boolean(chatConnection)}
        title={chatConnection ? `${chatConnection.other.name} ile sohbet` : 'Sohbet'}
        onClose={() => {
          setChatConnection(null)
          setSafetyConfirm(null)
        }}
        footer={
          <form className="chat-form" onSubmit={sendMessage}>
            <input
              className="input"
              name="message"
              placeholder="Mesaj yaz..."
              maxLength={500}
              autoComplete="off"
              aria-label="Mesaj"
            />
            <button className="btn btn-primary" type="submit" disabled={chatBusy}>
              <Send size={17} strokeWidth={1.75} aria-hidden="true" />
              Gönder
            </button>
          </form>
        }
      >
        <div className="chat-safety">
          <LockKeyhole size={16} strokeWidth={1.75} aria-hidden="true" />
          <span>Adres, telefon veya canlı konum paylaşma. Rahatsız edilirsen engelle.</span>
        </div>
        {chatError && (
          <p className="notice error" role="alert">
            {chatError}
          </p>
        )}
        <div className="chat-messages" aria-live="polite">
          {chatRefreshing && chatMessages.length === 0 ? (
            <div className="skeleton" style={{ height: 64 }} />
          ) : chatMessages.length === 0 ? (
            <p className="social-empty small-empty">Henüz mesaj yok. İlk mesajı sen yaz.</p>
          ) : (
            chatMessages.map((message) => (
              <div className={message.mine ? 'chat-message mine' : 'chat-message'} key={message.id}>
                <span>{message.body}</span>
                <small>
                  {message.mine ? 'Sen' : message.senderName} ·{' '}
                  {new Intl.DateTimeFormat('tr-TR', { hour: '2-digit', minute: '2-digit' }).format(
                    new Date(message.createdAt),
                  )}
                </small>
              </div>
            ))
          )}
        </div>
        <div className="chat-actions">
          {safetyConfirm === null ? (
            <>
              <button className="section-link" type="button" onClick={() => setSafetyConfirm('report')}>
                Bildir
              </button>
              <button className="section-link danger-link" type="button" onClick={() => setSafetyConfirm('block')}>
                Engelle
              </button>
            </>
          ) : (
            <div className="safety-confirm" role="alert">
              <span>
                {safetyConfirm === 'block'
                  ? `${chatConnection?.other.name} engellensin mi?`
                  : 'Bu kişiyi güvenlik nedeniyle bildirip engelleyelim mi?'}
              </span>
              <div className="form-actions">
                <button
                  className="btn btn-danger btn-sm"
                  type="button"
                  onClick={() => void (safetyConfirm === 'block' ? blockOther() : reportOther())}
                >
                  {safetyConfirm === 'block' ? 'Evet, engelle' : 'Bildir ve engelle'}
                </button>
                <button className="btn btn-ghost btn-sm" type="button" onClick={() => setSafetyConfirm(null)}>
                  Vazgeç
                </button>
              </div>
            </div>
          )}
        </div>
      </BottomSheet>
    </div>
  )
}

function ConnectionRow({
  connection,
  onAccept,
  onDecline,
  onCancel,
}: {
  connection: SocialConnection
  onAccept?: () => void
  onDecline?: () => void
  onCancel?: () => void
}) {
  return (
    <article className="connection-row">
      <div className="social-avatar small-avatar">{initials(connection.other.name)}</div>
      <div className="connection-copy">
        <h3>{connection.other.name}</h3>
        <p>{connection.message || 'Merhaba demek istiyor.'}</p>
        <small>
          {connection.direction === 'incoming' ? 'Sana istek gönderdi' : 'İstek gönderildi'} ·{' '}
          {new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'short' }).format(
            new Date(connection.createdAt),
          )}
        </small>
      </div>
      <div className="connection-actions">
        {onAccept && (
          <button className="btn btn-primary btn-sm" type="button" onClick={onAccept}>
            <Check size={16} strokeWidth={2} aria-hidden="true" />
            Kabul et
          </button>
        )}
        {onDecline && (
          <button className="btn btn-secondary btn-sm" type="button" onClick={onDecline}>
            <X size={16} strokeWidth={2} aria-hidden="true" />
            Reddet
          </button>
        )}
        {onCancel && (
          <button className="btn btn-ghost btn-sm" type="button" onClick={onCancel}>
            İptal et
          </button>
        )}
      </div>
    </article>
  )
}
