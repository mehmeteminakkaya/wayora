import { mkdirSync, writeFileSync } from 'node:fs'

const BASE = 'https://wayora-ten.vercel.app'
const PORT = 9224
const OUT = 'docs/professor/assets'

async function login() {
  const response = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'demo@wayora.app', password: 'demo1234' }),
  })
  if (!response.ok) throw new Error(`login ${response.status}`)
  const header = response.headers.get('set-cookie')?.split(';')[0] ?? ''
  return { cookie: header.slice(header.indexOf('=') + 1), header }
}

const { cookie, header } = await login()
const trips = await (await fetch(`${BASE}/api/trips`, { headers: { cookie: header } })).json()
const tripId = trips.trips?.find((trip) => trip.destination === 'Berlin')?.id ?? trips.trips?.[0]?.id
const targets = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json()
const target = targets.find((item) => item.type === 'page')
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
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const waitFor = async (expression, label, timeout = 15000) => {
  const start = Date.now()
  while (Date.now() - start < timeout) {
    if (await evaluate(expression)) return
    await sleep(200)
  }
  throw new Error(`timeout ${label}`)
}

await send('Page.enable')
await send('Runtime.enable')
await send('Network.enable')
await send('Network.setCookie', {
  name: 'wayora_session',
  value: cookie,
  url: BASE,
  secure: true,
  httpOnly: true,
  sameSite: 'Lax',
})
mkdirSync(OUT, { recursive: true })

const routes = [
  ['landing', '/'],
  ['explore', '/kesfet'],
  ['city', '/kesfet/berlin'],
  ...(tripId ? [['trip-detail', `/trips/${tripId}`]] : []),
  ['social', '/yol-arkadaslari'],
  ['profile', '/profil'],
]

for (const viewport of [
  { name: 'mobile', width: 390, height: 844, mobile: true },
  { name: 'desktop', width: 1280, height: 900, mobile: false },
]) {
  await send('Emulation.setDeviceMetricsOverride', {
    width: viewport.width,
    height: viewport.height,
    deviceScaleFactor: 1,
    mobile: viewport.mobile,
  })
  for (const [name, path] of routes) {
    await send('Page.navigate', { url: `${BASE}${path}` })
    await waitFor(`Boolean(document.querySelector('main') && document.readyState === 'complete')`, name)
    await sleep(1000)
    const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false })
    writeFileSync(`${OUT}/${name}-${viewport.name}.png`, Buffer.from(shot.data, 'base64'))
    console.log(`${name}-${viewport.name}.png`)
  }
}
ws.close()
