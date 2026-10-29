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

const setViewport = async (width, height, mobile) => {
  await send('Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: 1,
    mobile,
  })
}

const navigate = async (path) => {
  await send('Page.navigate', { url: `${BASE}${path}` })
  await wait(1200)
}

const fill = async (selector, value) =>
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

await setViewport(1440, 900, false)
await navigate('/')
await shot('design-landing-desktop')

await setViewport(375, 667, true)
await navigate('/')
await shot('design-landing-mobile')

await navigate('/login')
await shot('design-login-mobile')

await setViewport(1440, 900, false)
await navigate('/login')
await shot('design-login-desktop')

await setViewport(375, 667, true)
await fill('input[name=email]', 'e2e-1792740709@example.com')
await fill('input[name=password]', 'parola123')
await evaluate(`document.querySelector('form').requestSubmit()`)
await wait(1400)
await navigate('/trips')
await shot('design-trips-mobile')

await navigate('/onboarding')
await shot('design-onboarding-mobile')

await navigate('/trips/new')
await shot('design-new-trip-mobile')

await navigate('/trips')
const tripHref = await evaluate(`document.querySelector('.trip-ticket h2 a')?.getAttribute('href') ?? null`)
if (tripHref) {
  await navigate(tripHref)
  await shot('design-trip-detail-mobile')
}

await setViewport(1440, 900, false)
await navigate('/kesfet')
await shot('design-explore-desktop')

await setViewport(375, 667, true)
await navigate('/kesfet')
await shot('design-explore-mobile-current')

console.log('DESIGN_SCREENSHOTS_OK')
ws.close()
