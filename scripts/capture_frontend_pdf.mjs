import { mkdirSync, writeFileSync } from 'node:fs'

const PORT = 9224
const BASE = 'http://localhost:5180'
const OUT = 'docs/audit/pdf-v2'
mkdirSync(OUT, { recursive: true })

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
    errors.push(message.params.exceptionDetails?.text)
  }
  if (message.method === 'Log.entryAdded' && message.params.entry.level === 'error') {
    const text = message.params.entry.text
    if (!text.includes('401 (Unauthorized)')) errors.push(text)
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
const viewport = (width, height, mobile) =>
  send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile })
const navigate = async (path) => {
  await send('Page.navigate', { url: `${BASE}${path}` })
  await wait(900)
}
const shot = async (name) => {
  const image = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false })
  writeFileSync(`${OUT}/${name}.png`, Buffer.from(image.data, 'base64'))
}
const fill = (selector, value) =>
  evaluate(`(() => {
    const el = document.querySelector(${JSON.stringify(selector)});
    if (!el) throw new Error('missing ${selector}');
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, ${JSON.stringify(value)});
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  })()`)
const clickText = (selector, text) =>
  evaluate(`(() => {
    const el = [...document.querySelectorAll(${JSON.stringify(selector)})].find((item) => item.textContent.includes(${JSON.stringify(text)}));
    if (!el) throw new Error('missing ${selector}: ${text}');
    el.click();
    return true;
  })()`)

await send('Page.enable')
await send('Runtime.enable')
await send('Log.enable')
await send('Network.enable')
await send('Network.clearBrowserCookies')

await viewport(375, 667, true)
await navigate('/')
await shot('landing-mobile-top')
await evaluate(`window.scrollTo({ top: 720, behavior: 'auto' })`)
await wait(300)
await shot('landing-mobile-bottom')
await navigate('/login')
await shot('login-mobile')
await navigate('/register')
await shot('register-mobile')
await navigate('/kesfet')
await waitFor(`document.querySelectorAll('.city-grid .city-card').length === 10`, 'explore')
await shot('explore-mobile')
await navigate('/kesfet/berlin')
await waitFor(`document.querySelectorAll('.experience-row').length === 10`, 'berlin city')
await shot('city-mobile-top')
await evaluate(`window.scrollTo({ top: 620, behavior: 'auto' })`)
await wait(300)
await shot('city-mobile-list')
await navigate('/kesfet/berlin/museum-island')
await waitFor(`document.querySelector('h1')?.textContent === 'Museum Island'`, 'museum experience')
await shot('experience-mobile-top')
await evaluate(`window.scrollTo({ top: 650, behavior: 'auto' })`)
await wait(300)
await shot('experience-mobile-mid')
await navigate('/olmayan-sayfa')
await wait(500)
await shot('notfound-mobile')

await navigate('/login')
await fill('input[name=email]', 'e2e-1792740709@example.com')
await fill('input[name=password]', 'parola123')
await evaluate(`document.querySelector('form').requestSubmit()`)
await waitFor(`location.pathname === '/trips'`, 'login')

await navigate('/onboarding')
await waitFor(`document.querySelector('h1')?.textContent === 'Nasıl gezersin?'`, 'onboarding')
await shot('onboarding-step1')
await clickText('.onboarding-foot .btn-primary', 'Devam')
await waitFor(`document.body.innerText.includes('Bütçen nasıl?')`, 'onboarding step2')
await shot('onboarding-step2')
await clickText('.onboarding-foot .btn-primary', 'Devam')
await waitFor(`document.body.innerText.includes('Hangi hızda gezersin?')`, 'onboarding step3')
await shot('onboarding-step3')

await navigate('/trips')
await waitFor(`document.querySelectorAll('.trip-card').length > 0`, 'trip list')
await shot('trips-mobile')
const plannedTrip = await evaluate(`(() => {
  const cards = [...document.querySelectorAll('.trip-card')];
  const card = cards.find((item) => item.querySelector('.status.go')) ?? cards[0];
  const link = card?.querySelector('h2 a');
  if (!link) return null;
  return { href: link.getAttribute('href'), title: link.textContent };
})()`)
if (plannedTrip?.href) {
  await navigate(plannedTrip.href)
  await waitFor(`document.querySelectorAll('.day-tab').length > 0`, 'trip detail')
  await shot('trip-detail-list-mobile')
  await evaluate(`window.scrollTo({ top: 300, behavior: 'auto' })`)
  await wait(200)
  await shot('trip-detail-timeline-mobile')
  await clickText('.segmented button', 'Harita')
  await waitFor(`!!document.querySelector('.trip-map')`, 'trip map')
  await shot('trip-detail-map-mobile')
}

await navigate('/trips/new?destination=Berlin')
await waitFor(`document.querySelector('input[name=destination]')?.value === 'Berlin'`, 'new trip wizard')
await shot('new-trip-step1')
await clickText('.wizard-actions .btn-primary', 'Devam')
await wait(300)
await shot('new-trip-step2')
await clickText('.wizard-actions .btn-primary', 'Devam')
await wait(300)
await shot('new-trip-step3')

await navigate('/profil')
await waitFor(`document.querySelector('h1')?.textContent === 'Hesabın'`, 'profile')
await shot('profile-mobile')

await viewport(1440, 900, false)
await navigate('/')
await shot('landing-desktop')
await navigate('/login')
await shot('login-desktop')
await navigate('/kesfet')
await waitFor(`document.querySelectorAll('.city-grid .city-card').length === 10`, 'desktop explore')
await shot('explore-desktop')
await navigate('/kesfet/berlin')
await waitFor(`document.querySelectorAll('.experience-row').length === 10`, 'desktop city')
await shot('city-desktop')
await navigate('/kesfet/berlin/museum-island')
await waitFor(`document.querySelector('h1')?.textContent === 'Museum Island'`, 'desktop experience')
await shot('experience-desktop')

const report = { plannedTrip, errors }
writeFileSync(`${OUT}/capture-report.json`, JSON.stringify(report, null, 2))
console.log(JSON.stringify(report, null, 2))
ws.close()
