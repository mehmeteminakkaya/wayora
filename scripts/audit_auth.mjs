import { writeFileSync } from 'node:fs'

const PORT = 9223
const API = 'http://127.0.0.1:4000'
const BASE = 'http://localhost:5180'
const out = 'docs/audit/auth-audit.json'

async function login() {
  const response = await fetch(`${API}/api/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'e2e-1792740709@example.com', password: 'parola123' }),
  })
  if (!response.ok) throw new Error(`login ${response.status}`)
  const setCookie = response.headers.getSetCookie?.()[0] ?? response.headers.get('set-cookie')
  return setCookie.split(';')[0]
}

async function main() {
  const cookie = await login()
  const tripsResponse = await fetch(`${API}/api/trips`, { headers: { cookie } })
  const tripsBody = await tripsResponse.json()
  const tripId = tripsBody.trips?.[0]?.id
  if (!tripId) throw new Error('no trip')

  const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json()
  const target = list.find((item) => item.type === 'page')
  const ws = new WebSocket(target.webSocketDebuggerUrl)
  await new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve, { once: true })
    ws.addEventListener('error', reject, { once: true })
  })
  let id = 0
  const pending = new Map()
  const errors = []
  ws.addEventListener('message', (event) => {
    const message = JSON.parse(event.data)
    if (message.method === 'Runtime.exceptionThrown') errors.push({ type: 'exception', text: message.params.exceptionDetails?.text })
    if (message.method === 'Log.entryAdded' && message.params.entry.level === 'error') errors.push({ type: 'log', text: message.params.entry.text })
    if (!message.id) return
    const waiter = pending.get(message.id)
    if (!waiter) return
    pending.delete(message.id)
    message.error ? waiter.reject(new Error(JSON.stringify(message.error))) : waiter.resolve(message.result)
  })
  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const current = ++id
      pending.set(current, { resolve, reject })
      ws.send(JSON.stringify({ id: current, method, params }))
    })

  await send('Page.enable')
  await send('Runtime.enable')
  await send('Log.enable')
  await send('Network.enable')
  await send('Network.setCookie', { name: 'wayora_session', value: cookie.split('=')[1], url: BASE })

  const pages = [
    ['/trips', 'Rotalar'],
    [`/trips/${tripId}`, 'Plan detayı'],
    ['/trips/new', 'Yeni rota'],
    ['/onboarding', 'Tercihler'],
  ]
  const viewports = [
    { width: 375, height: 667, mobile: true },
    { width: 1440, height: 900, mobile: false },
  ]
  const results = []

  for (const page of pages) {
    for (const dims of viewports) {
      errors.length = 0
      await send('Emulation.setDeviceMetricsOverride', {
        width: dims.width,
        height: dims.height,
        deviceScaleFactor: 1,
        mobile: dims.mobile,
      })
      await send('Page.navigate', { url: BASE + page[0] })
      await new Promise((resolve) => setTimeout(resolve, 1800))
      const response = await send('Runtime.evaluate', {
        expression: `(() => {
          const overflow = [...document.querySelectorAll('body *')]
            .map((el) => ({ el, r: el.getBoundingClientRect() }))
            .filter(({ el, r }) => r.width > 0 && r.right > window.innerWidth + 2 && getComputedStyle(el).position !== 'fixed')
            .slice(0, 10)
            .map(({ el, r }) => ({ tag: el.tagName, cls: typeof el.className === 'string' ? el.className : '', right: Math.round(r.right), width: Math.round(r.width) }));
          return {
            url: location.href,
            scrollWidth: document.documentElement.scrollWidth,
            horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth + 2,
            bottomNav: document.querySelector('.mobile-nav') ? getComputedStyle(document.querySelector('.mobile-nav')).display : null,
            imagesBroken: [...document.images].filter((img) => !img.complete || img.naturalWidth === 0).map((img) => img.src),
            unlabeledButtons: [...document.querySelectorAll('button')].filter((b) => !(b.textContent || '').trim() && !b.getAttribute('aria-label')).length,
            overflow,
            h1: document.querySelector('h1')?.textContent?.trim().replace(/\\s+/g, ' ') ?? null,
          };
        })()`,
        returnByValue: true,
      })
      results.push({ page: page[0], name: page[1], viewport: dims, ...response.result.value, errors: [...errors] })
    }
  }

  writeFileSync(out, JSON.stringify(results, null, 2))
  console.log(JSON.stringify(results.map((r) => ({ page: r.page, viewport: r.viewport.width, overflow: r.horizontalOverflow, bottomNav: r.bottomNav, broken: r.imagesBroken.length, errors: r.errors.length, unlabeled: r.unlabeledButtons })), null, 2))
  ws.close()
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
