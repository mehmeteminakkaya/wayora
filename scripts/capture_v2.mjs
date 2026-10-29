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
ws.addEventListener('message', (event) => {
  const message = JSON.parse(event.data)
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
const shot = async (name) => {
  const image = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false })
  writeFileSync(`docs/audit/${name}.png`, Buffer.from(image.data, 'base64'))
}
const viewport = async (width, height, mobile) =>
  send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile })
const navigate = async (path) => {
  await send('Page.navigate', { url: `${BASE}${path}` })
  await wait(1200)
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

await send('Page.enable')
await send('Runtime.enable')
await send('Network.enable')
await send('Network.clearBrowserCookies')

await viewport(375, 667, true)
await navigate('/')
await shot('v2-landing-mobile')
const landing = await evaluate(`({
  heading: document.querySelector('h1')?.textContent,
  cityCards: document.querySelectorAll('.city-rail .city-card').length,
  images: [...document.querySelectorAll('img')].map((img) => ({ src: img.getAttribute('src'), ok: img.complete && img.naturalWidth > 0 })).slice(0, 12),
  overflow: document.documentElement.scrollWidth > window.innerWidth + 2,
})`)

await navigate('/kesfet')
await wait(800)
await shot('v2-explore-mobile')
const explore = await evaluate(`({
  title: document.querySelector('h1')?.textContent,
  cityCards: document.querySelectorAll('.city-grid .city-card').length,
  firstPhoto: (() => { const img = document.querySelector('.city-card img'); return img ? { src: img.getAttribute('src'), ok: img.complete && img.naturalWidth > 0 } : null })(),
  overflow: document.documentElement.scrollWidth > window.innerWidth + 2,
})`)

await evaluate(`document.querySelector('.city-grid .city-card')?.click()`)
await wait(1400)
await shot('v2-city-mobile')
const city = await evaluate(`({
  path: location.pathname,
  title: document.querySelector('.city-hero h1')?.textContent,
  experiences: document.querySelectorAll('.experience-row').length,
  images: [...document.querySelectorAll('.experience-row img')].slice(0, 3).map((img) => img.complete && img.naturalWidth > 0),
  overflow: document.documentElement.scrollWidth > window.innerWidth + 2,
})`)

await viewport(1440, 900, false)
await navigate('/kesfet')
await wait(1000)
await shot('v2-explore-desktop')
const desktop = await evaluate(`({
  cards: document.querySelectorAll('.city-grid .city-card').length,
  overflow: document.documentElement.scrollWidth > window.innerWidth + 2,
})`)

await viewport(375, 667, true)
await navigate('/login')
await shot('v2-login-mobile')
const login = await evaluate(`({ heading: document.querySelector('h1')?.textContent, overflow: document.documentElement.scrollWidth > window.innerWidth + 2 })`)

await fill('input[name=email]', 'e2e-1792740709@example.com')
await fill('input[name=password]', 'parola123')
await evaluate(`document.querySelector('form').requestSubmit()`)
await wait(1400)
await navigate('/trips')
await shot('v2-trips-mobile')
const trips = await evaluate(`({ path: location.pathname, title: document.querySelector('h1')?.textContent, cards: document.querySelectorAll('.trip-card').length, overflow: document.documentElement.scrollWidth > window.innerWidth + 2 })`)

await navigate('/profil')
await shot('v2-profile-mobile')
const profile = await evaluate(`({ path: location.pathname, heading: document.querySelector('h1')?.textContent, overflow: document.documentElement.scrollWidth > window.innerWidth + 2 })`)

const report = { landing, explore, city, desktop, login, trips, profile }
console.log(JSON.stringify(report, null, 2))
ws.close()
