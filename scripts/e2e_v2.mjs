import { writeFileSync } from 'node:fs'

const PORT = 9224
const BASE = 'http://localhost:5180'

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
  if (message.method === 'Runtime.exceptionThrown') {
    errors.push({ type: 'exception', text: message.params.exceptionDetails?.text })
  }
  if (message.method === 'Log.entryAdded' && message.params.entry.level === 'error') {
    const text = message.params.entry.text
    if (!text.includes('401 (Unauthorized)')) errors.push({ type: 'log', text })
  }
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
const evaluate = async (expression) => {
  const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text)
  return result.result.value
}
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const waitFor = async (expression, label, timeout = 12000) => {
  const start = Date.now()
  while (Date.now() - start < timeout) {
    if (await evaluate(expression)) return
    await wait(250)
  }
  throw new Error(`timeout: ${label}`)
}
const shot = async (name) => {
  const image = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false })
  writeFileSync(`docs/audit/${name}.png`, Buffer.from(image.data, 'base64'))
}
const fill = (selector, value) =>
  evaluate(`(() => {
    const el = document.querySelector(${JSON.stringify(selector)});
    if (!el) throw new Error('missing ${selector}');
    const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, ${JSON.stringify(value)});
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  })()`)
const clickText = (selector, text) =>
  evaluate(`(() => {
    const el = [...document.querySelectorAll(${JSON.stringify(selector)})].find((item) => item.textContent.trim().includes(${JSON.stringify(text)}));
    if (!el) throw new Error('missing ${selector}: ${text}');
    el.click();
    return true;
  })()`)

await send('Page.enable')
await send('Runtime.enable')
await send('Log.enable')
await send('Network.enable')
await send('Network.clearBrowserCookies')
await send('Emulation.setDeviceMetricsOverride', {
  width: 375,
  height: 667,
  deviceScaleFactor: 1,
  mobile: true,
})

await send('Page.navigate', { url: `${BASE}/kesfet` })
await waitFor(`document.querySelectorAll('.city-grid .city-card').length === 10`, 'explore cities')
await fill('input[aria-label="Şehir veya deneyim ara"]', 'Berlin')
await waitFor(`document.querySelectorAll('.city-grid .city-card').length === 1`, 'search result')
const search = await evaluate(`({ cards: document.querySelectorAll('.city-grid .city-card').length, name: document.querySelector('.city-card-title')?.textContent })`)

await fill('input[aria-label="Şehir veya deneyim ara"]', '')
await waitFor(`document.querySelectorAll('.city-grid .city-card').length === 10`, 'cleared search')
await clickText('.city-grid .city-card', 'İstanbul')
await waitFor(`location.pathname === '/kesfet/istanbul'`, 'Istanbul city')
await waitFor(`document.querySelectorAll('.experience-row').length === 10`, 'Istanbul experiences')
await shot('v2-city-istanbul-mobile')

await evaluate(`document.querySelectorAll('.experience-row .select-button')[0].click()`)
await evaluate(`document.querySelectorAll('.experience-row .select-button')[1].click()`)
await waitFor(`!!document.querySelector('.sticky-action')`, 'selection bar')
const selection = await evaluate(`({ count: document.querySelector('.sticky-action .selection-count')?.textContent, href: document.querySelector('.sticky-action a')?.getAttribute('href') })`)
await clickText('.sticky-action a', 'rotası oluştur')
await waitFor(`location.pathname === '/login'`, 'login required')
await fill('input[name=email]', 'e2e-1792740709@example.com')
await fill('input[name=password]', 'parola123')
await evaluate(`document.querySelector('form').requestSubmit()`)
await waitFor(`location.pathname === '/trips/new'`, 'new trip prefill')
await waitFor(`document.querySelector('input[name=destination]')?.value === 'İstanbul'`, 'destination prefill')
const prefilled = await evaluate(`({
  path: location.pathname,
  search: location.search,
  destination: document.querySelector('input[name=destination]')?.value,
  selectedNotice: document.body.innerText.includes('deneyim seçili'),
})`)
await shot('v2-new-trip-prefilled-mobile')

await clickText('.wizard-actions .btn-primary', 'Devam')
await wait(300)
await clickText('.wizard-actions .btn-primary', 'Devam')
await wait(300)
await clickText('.wizard-actions .btn-primary', 'Planı oluştur')
await waitFor(`location.pathname.startsWith('/trips/')`, 'trip created')
await waitFor(`document.querySelectorAll('.day-tab').length >= 3`, 'trip days')
const dayOneActivities = await evaluate(`document.querySelectorAll('.timeline-item').length`)
await evaluate(`document.querySelectorAll('.day-tab')[1]?.click()`)
await wait(300)
const secondDay = await evaluate(`({ active: document.querySelector('.day-tab.is-active')?.textContent, activities: document.querySelectorAll('.timeline-item').length })`)
const totalActivities = dayOneActivities + secondDay.activities
const trip = await evaluate(`({
  path: location.pathname,
  heading: document.querySelector('.trip-header h1')?.textContent,
  days: document.querySelectorAll('.day-tab').length,
  activities: ${totalActivities},
  status: document.body.innerText.includes('Plan hazır'),
  overflow: document.documentElement.scrollWidth > window.innerWidth + 2,
})`)
await shot('v2-trip-detail-mobile')

await evaluate(`document.querySelector('.back-link')?.click()`)
await waitFor(`location.pathname === '/trips'`, 'trips after detail')
await waitFor(`!!document.querySelector('.trip-card, .empty-state')`, 'trips loaded')
const trips = await evaluate(`({ path: location.pathname, cards: document.querySelectorAll('.trip-card').length, overflow: document.documentElement.scrollWidth > window.innerWidth + 2 })`)

await evaluate(`document.querySelector('a[href="/profil"]')?.click()`)
await waitFor(`location.pathname === '/profil'`, 'profile')
await waitFor(`document.querySelector('h1')?.textContent === 'Hesabın'`, 'profile loaded')
const profile = await evaluate(`({ heading: document.querySelector('h1')?.textContent, preferences: document.body.innerText.includes('Tercihler'), overflow: document.documentElement.scrollWidth > window.innerWidth + 2 })`)

await waitFor(
  `!![...document.querySelectorAll('button')].find((item) => item.textContent.includes('Çıkış yap'))`,
  'logout button',
)
await evaluate(`(() => { const b = [...document.querySelectorAll('button')].find((item) => item.textContent.includes('Çıkış yap')); if (b) b.click(); })()`)
await waitFor(`location.pathname === '/'`, 'logout')
await waitFor(`!!document.querySelector('a[href="/login"]')`, 'logout complete')
const logout = await evaluate(`({ path: location.pathname, loginLink: !!document.querySelector('a[href="/login"]') })`)
await shot('v2-landing-auth-mobile')

const report = { search, selection, prefilled, trip, secondDay, trips, profile, logout, errors }
console.log(JSON.stringify(report, null, 2))
writeFileSync('docs/audit/v2-e2e.json', JSON.stringify(report, null, 2))

const failures = []
if (search.cards !== 1) failures.push('search')
if (selection.count?.includes('2 durak') !== true) failures.push('selection')
if (!selection.href?.includes('/trips/new?')) failures.push('selectionLink')
if (prefilled.destination !== 'İstanbul') failures.push('prefill')
if (!prefilled.search.includes('experiences=')) failures.push('experiencesQuery')
if (trip.days < 3 || trip.activities < 2) failures.push('importedTrip')
if (trip.overflow || trips.overflow || profile.overflow) failures.push('overflow')
if (logout.path !== '/' || !logout.loginLink) failures.push('logout')
if (errors.length > 0) failures.push('consoleErrors')
if (failures.length) {
  console.error('FAILED:', failures.join(', '))
  process.exit(1)
}
console.log('V2_E2E_OK')
ws.close()
