import { writeFileSync } from 'node:fs'

const API = 'http://127.0.0.1:4000'
const BASE = 'http://localhost:5180'
const response = await fetch(`${API}/api/auth/login`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ email: 'e2e-1792740709@example.com', password: 'parola123' }),
})
const setCookie = response.headers.getSetCookie?.()[0] ?? response.headers.get('set-cookie')
const cookie = setCookie.split(';')[0]

const list = await (await fetch('http://127.0.0.1:9223/json/list')).json()
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

for (const path of ['/trips', '/trips/new', '/onboarding']) {
  await send('Page.navigate', { url: BASE + path })
  await new Promise((resolve) => setTimeout(resolve, 1800))
  const result = await send('Runtime.evaluate', {
    expression: `({ url: location.href, header: document.querySelector('.main-nav')?.innerText, h1: document.querySelector('h1')?.innerText, body: document.body.innerText.slice(0, 120) })`,
    returnByValue: true,
  })
  console.log(path, result.result.value)
}

ws.close()
