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
await send('Emulation.setDeviceMetricsOverride', { width: 375, height: 667, deviceScaleFactor: 1, mobile: true })
await send('Network.clearBrowserCookies')

await navigate('/kesfet/istanbul/ayasofya')
await waitFor(`document.querySelector('h1')?.textContent === 'Ayasofya'`, 'experience detail')
const experience = await evaluate(`({
  title: document.querySelector('h1')?.textContent,
  iframe: !!document.querySelector('.map-frame iframe'),
  facts: document.querySelectorAll('.fact').length,
  sticky: !!document.querySelector('.sticky-action'),
  overflow: document.documentElement.scrollWidth > window.innerWidth + 2,
})`)
await shot('v2-experience-mobile')

await navigate('/login')
await fill('input[name=email]', 'e2e-1792740709@example.com')
await fill('input[name=password]', 'parola123')
await evaluate(`document.querySelector('form').requestSubmit()`)
await waitFor(`location.pathname === '/trips'`, 'login')
await navigate('/onboarding')
await waitFor(`document.querySelector('h1')?.textContent === 'Nasıl gezersin?'`, 'onboarding')
const onboarding = await evaluate(`({
  step: document.querySelector('.onboarding-progress')?.innerText,
  chips: document.querySelectorAll('.chip').length,
  overflow: document.documentElement.scrollWidth > window.innerWidth + 2,
})`)
await shot('v2-onboarding-mobile')

const report = { experience, onboarding, errors }
console.log(JSON.stringify(report, null, 2))
writeFileSync('docs/audit/v2-extra.json', JSON.stringify(report, null, 2))
ws.close()
