import { MessageCircle, Send, X } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { api } from '../api'
import type { AgentAction } from '../api'

type Msg = { role: 'user' | 'assistant'; content: string; actions?: AgentAction[] }

const GREETING: Msg = {
  role: 'assistant',
  content: 'Merhaba! Ben Wayora Agent. Nereye gitmek istiyorsun? Rota, bütçe, yeme-içme, her konuda sorabilirsin.',
}

const FOCUSABLE =
  'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex="0"]'

export function AgentChat() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Msg[]>([GREETING])
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const logRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const fabRef = useRef<HTMLButtonElement>(null)
  const shouldRefocus = useRef(false)
  const titleId = useId()

  useEffect(() => {
    // jsdom ve eski tarayıcılarda scrollTo bulunmayabilir.
    const log = logRef.current
    if (log && typeof log.scrollTo === 'function') {
      log.scrollTo({ top: log.scrollHeight })
    }
  }, [messages, busy, open])

  useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    inputRef.current?.focus()

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        closePanel()
        return
      }
      if (event.key !== 'Tab' || !panelRef.current) return
      const focusable = panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last?.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first?.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  useEffect(() => {
    if (open || !shouldRefocus.current) return
    shouldRefocus.current = false
    fabRef.current?.focus()
  }, [open])

  function closePanel() {
    shouldRefocus.current = true
    setOpen(false)
  }

  async function send(event: React.FormEvent) {
    event.preventDefault()
    const content = text.trim()
    if (!content || busy) return
    const next = [...messages, { role: 'user' as const, content }]
    setMessages(next)
    setText('')
    setBusy(true)
    try {
      const { reply, actions } = await api.chatAgent(
        next
          .slice(1)
          .slice(-20)
          .map(({ role, content }) => ({ role, content })),
      )
      setMessages([...next, { role: 'assistant', content: reply, actions }])
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Bir hata oluştu.'
      setMessages([...next, { role: 'assistant', content: message }])
    } finally {
      setBusy(false)
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        className="agent-fab"
        ref={fabRef}
        aria-label="Wayora Agent sohbetini aç"
        onClick={() => setOpen(true)}
      >
        <MessageCircle size={22} strokeWidth={1.75} aria-hidden="true" />
        <span className="agent-fab-label">Wayora Agent</span>
      </button>
    )
  }

  return createPortal(
    <>
      <button
        type="button"
        className="agent-backdrop"
        aria-label="Sohbeti kapat"
        tabIndex={-1}
        onClick={closePanel}
      />
      <section
        className="agent-panel"
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <header className="agent-head">
          <div className="agent-heading">
            <span className="agent-mark" aria-hidden="true">
              <MessageCircle size={16} strokeWidth={2} />
            </span>
            <div>
              <strong id={titleId}>Wayora Agent</strong>
              <span className="agent-sub">Rota, bütçe ve yer önerileri</span>
            </div>
          </div>
          <button
            className="icon-btn"
            type="button"
            aria-label="Sohbeti kapat"
            onClick={closePanel}
          >
            <X size={20} strokeWidth={1.75} />
          </button>
        </header>

        <div className="agent-log" ref={logRef} aria-live="polite">
          {messages.map((m, i) => (
            <div key={i} className={m.role === 'user' ? 'agent-msg is-user' : 'agent-msg'}>
              {m.content}
              {m.actions && m.actions.length > 0 && (
                <div className="agent-actions">
                  {m.actions.map((a) =>
                    a.path ? (
                      <Link key={a.path} to={a.path} className="agent-chip" onClick={closePanel}>
                        {a.label} →
                      </Link>
                    ) : (
                      <a key={a.url} href={a.url} className="agent-chip" target="_blank" rel="noreferrer">
                        {a.label} ↗
                      </a>
                    ),
                  )}
                </div>
              )}
            </div>
          ))}
          {busy && (
            <div className="agent-msg agent-typing" role="status">
              <span className="spinner" aria-hidden="true" />
              Yazıyor…
            </div>
          )}
        </div>

        <form className="agent-form" onSubmit={send}>
          <input
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Bir şey sor…"
            maxLength={2000}
            aria-label="Mesajın"
            autoComplete="off"
          />
          <button type="submit" disabled={busy || !text.trim()} aria-label="Gönder">
            <Send size={18} strokeWidth={1.75} />
          </button>
        </form>
      </section>
    </>,
    document.body,
  )
}
