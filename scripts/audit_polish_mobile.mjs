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
  if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails?.text)
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
const shot = async (name) => {
  const image = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false })
  writeFileSync(`docs/audit/${name}.png`, Buffer.from(image.data, 'base64'))
}
const viewport = (width, height) =>
  send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: true })
const navigate = async (path) => {
  await send('Page.navigate', { url: `${BASE}${path}` })
  await wait(1000)
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

await send('Page.enable')
await send('Runtime.enable')
await send('Log.enable')
await send('Network.enable')
await send('Network.clearBrowserCookies')

await viewport(320, 568)
await navigate('/kesfet')
await waitFor(`document.querySelectorAll('.city-grid .city-card').length === 10`, 'explore 320')
const explore320 = await evaluate(`({ overflow: document.documentElement.scrollWidth > window.innerWidth + 2 })`)

await navigate('/kesfet/berlin')
await waitFor(`document.querySelectorAll('.experience-row').length === 10`, 'city 320')
await evaluate(`document.querySelectorAll('.experience-row .select-button')[0].click()`)
await evaluate(`document.querySelectorAll('.experience-row .select-button')[1].click()`)
await waitFor(`!!document.querySelector('.sticky-action')`, 'sticky summary 320')
const summary = await evaluate(`({ text: document.querySelector('.selection-summary-button')?.innerText, overflow: document.documentElement.scrollWidth > window.innerWidth + 2 })`)
await evaluate(`document.querySelector('.selection-summary-button')?.click()`)
await waitFor(`!!document.querySelector('[role="dialog"]')`, 'sheet 320')
await new Promise((resolve) => setTimeout(resolve, 400))
const sheet = await evaluate(`({ width: document.querySelector('.sheet')?.getBoundingClientRect().width, overflow: document.documentElement.scrollWidth > window.innerWidth + 2 })`)
await shot('polish-city-sheet-320')
await evaluate(`document.querySelector('[role="dialog"] .icon-btn')?.click()`)

await viewport(430, 800)
await navigate('/kesfet/berlin')
await waitFor(`document.querySelectorAll('.experience-row').length === 10`, 'city 430')
const city430 = await evaluate(`({ overflow: document.documentElement.scrollWidth > window.innerWidth + 2 })`)

await viewport(320, 568)
await navigate('/login')
await fill('input[name=email]', 'e2e-1792740709@example.com')
await fill('input[name=password]', 'parola123')
await evaluate(`document.querySelector('form').requestSubmit()`)
await waitFor(`location.pathname === '/trips'`, 'login mobile')
await waitFor(`document.querySelectorAll('.trip-card').length > 0`, 'trips list')
const tripHref = await evaluate(`(() => {
  const cards = [...document.querySelectorAll('.trip-card')];
  const card = cards.find((item) => item.querySelector('.status.go')) ?? cards[0];
  return card?.querySelector('h2 a')?.getAttribute('href') ?? null;
})()`)
if (tripHref) {
  await navigate(tripHref)
  await waitFor(`document.querySelectorAll('.day-tab').length > 0`, 'trip detail 320')
  const trip320 = await evaluate(`({
    overflow: document.documentElement.scrollWidth > window.innerWidth + 2,
    stickyOverflow: document.querySelector('.sticky-action .btn')?.getBoundingClientRect().right > window.innerWidth,
    timelineLine: getComputedStyle(document.querySelector('.timeline'), '::before').content,
  })`)
  await shot('polish-trip-320')
  const liveDiscovery = await evaluate(`(() => {
    const section = document.querySelector('.live-discovery');
    const panels = [...document.querySelectorAll('.discovery-panel')].map((panel) => panel.innerText.slice(0, 180));
    return {
      exists: !!section,
      panels,
      overflow: document.documentElement.scrollWidth > window.innerWidth + 2,
    };
  })()`)
  await evaluate(`document.querySelector('.live-discovery')?.scrollIntoView({ block: 'start' })`)
  await new Promise((resolve) => setTimeout(resolve, 300))
  await shot('polish-live-discovery-320')
  const report = { explore320, summary, sheet, city430, trip320, liveDiscovery, errors }
  console.log(JSON.stringify(report, null, 2))
  writeFileSync('docs/audit/polish-mobile.json', JSON.stringify(report, null, 2))
}
ws.close()
