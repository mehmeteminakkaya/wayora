import { MessageCircle, Send, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { api } from '../api'

type Msg = { role: 'user' | 'assistant'; content: string }

const GREETING: Msg = {
  role: 'assistant',
  content: 'Merhaba! Ben Wayora Agent. Nereye gitmek istiyorsun? Rota, bütçe, yeme-içme, her konuda sorabilirsin.',
}

export function AgentChat() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Msg[]>([GREETING])
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const logRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight })
  }, [messages, busy, open])

  async function send(event: React.FormEvent) {
    event.preventDefault()
    const content = text.trim()
    if (!content || busy) return
    const next = [...messages, { role: 'user' as const, content }]
    setMessages(next)
    setText('')
    setBusy(true)
    try {
      const { reply } = await api.chatAgent(next.slice(1).slice(-20))
      setMessages([...next, { role: 'assistant', content: reply }])
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Bir hata oluştu.'
      setMessages([...next, { role: 'assistant', content: message }])
    } finally {
      setBusy(false)
    }
  }

  if (!open) {
    return (
      <button type="button" className="agent-fab" onClick={() => setOpen(true)}>
        <MessageCircle size={18} aria-hidden="true" /> Wayora Agent
      </button>
    )
  }

  return (
    <section className="agent-panel" aria-label="Wayora Agent sohbet">
      <div className="agent-head">
        <strong>Wayora Agent</strong>
        <button type="button" onClick={() => setOpen(false)} aria-label="Sohbeti kapat">
          <X size={18} />
        </button>
      </div>
      <div className="agent-log" ref={logRef} aria-live="polite">
        {messages.map((m, i) => (
          <div key={i} className={m.role === 'user' ? 'agent-msg is-user' : 'agent-msg'}>
            {m.content}
          </div>
        ))}
        {busy && <div className="agent-msg">Yazıyor…</div>}
      </div>
      <form className="agent-form" onSubmit={send}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Bir şey sor…"
          maxLength={2000}
          aria-label="Mesajın"
        />
        <button type="submit" disabled={busy || !text.trim()} aria-label="Gönder">
          <Send size={16} />
        </button>
      </form>
    </section>
  )
}
