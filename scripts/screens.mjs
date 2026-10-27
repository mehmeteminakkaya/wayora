import { writeFileSync } from 'node:fs'

const PORT = 9223
const API = 'http://127.0.0.1:4000'
const BASE = 'http://localhost:5180'

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

const cookie = await login()
const tripsResponse = await fetch(`${API}/api/trips`, { headers: { cookie } })
const trips = (await tripsResponse.json()).trips
const tripId = trips?.[0]?.id

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

await send('Page.enable')
await send('Network.enable')
await send('Network.setCookie', { name: 'wayora_session', value: cookie.split('=')[1], url: BASE })
await send('Emulation.setDeviceMetricsOverride', { width: 375, height: 667, deviceScaleFactor: 1, mobile: true })

const pages = [
  ['/trips', 'trips-mobile'],
  [`/trips/${tripId}`, 'trip-mobile'],
  ['/trips/new', 'new-trip-mobile'],
  ['/onboarding', 'onboarding-mobile'],
]

for (const [path, name] of pages) {
  await send('Page.navigate', { url: BASE + path })
  await new Promise((resolve) => setTimeout(resolve, 1800))
  const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true })
  writeFileSync(`docs/audit/${name}.png`, Buffer.from(shot.data, 'base64'))
}
console.log('done')
ws.close()
