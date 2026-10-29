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
const navigate = async (path) => {
  await send('Page.navigate', { url: `${BASE}${path}` })
  await wait(900)
}

await send('Page.enable')
await send('Runtime.enable')
await send('Log.enable')
await send('Network.enable')
await send('Network.clearBrowserCookies')
await send('Emulation.setDeviceMetricsOverride', { width: 375, height: 667, deviceScaleFactor: 1, mobile: true })

await navigate('/kesfet?q=berlin&category=museum&sort=name')
await waitFor(`document.querySelectorAll('.city-grid .city-card').length === 1`, 'filtered explore')
const filteredUrl = await evaluate(`location.search`)
await evaluate(`document.querySelector('.city-grid .city-card')?.click()`)
await waitFor(`location.pathname === '/kesfet/berlin'`, 'city')
await waitFor(`!!document.querySelector('.back-link')`, 'city back button')
await evaluate(`document.querySelector('.back-link')?.click()`)
await waitFor(`location.pathname === '/kesfet'`, 'back to explore')
await waitFor(`document.querySelectorAll('.city-grid .city-card').length === 1`, 'restored explore')
const restoredSearch = await evaluate(`location.search`)
const restoredCards = await evaluate(`document.querySelectorAll('.city-grid .city-card').length`)

await navigate('/kesfet')
await waitFor(`document.querySelectorAll('.city-grid .city-card').length === 10`, 'explore full')
await evaluate(`window.scrollTo({ top: 500, behavior: 'auto' })`)
await wait(200)
const beforeScroll = await evaluate(`window.scrollY`)
await evaluate(`document.querySelector('.city-grid .city-card')?.click()`)
await waitFor(`location.pathname === '/kesfet/istanbul'`, 'city scroll')
await waitFor(`!!document.querySelector('.back-link')`, 'city scroll back button')
await evaluate(`document.querySelector('.back-link')?.click()`)
await waitFor(`location.pathname === '/kesfet'`, 'back scroll')
await wait(500)
const afterScroll = await evaluate(`window.scrollY`)

await navigate('/kesfet/berlin?filter=food')
await waitFor(`document.querySelectorAll('.experience-row').length === 1`, 'city filter')
const cityFilter = await evaluate(`({ filter: document.querySelector('.chip.is-active')?.textContent, rows: document.querySelectorAll('.experience-row').length })`)
await evaluate(`document.querySelector('.experience-row h3 a')?.click()`)
await waitFor(`location.pathname.startsWith('/kesfet/berlin/')`, 'experience')
await waitFor(`!!document.querySelector('.back-link')`, 'experience back button')
await evaluate(`document.querySelector('.back-link')?.click()`)
await waitFor(`location.pathname === '/kesfet/berlin'`, 'back city')
await wait(400)
const cityBack = await evaluate(`({ search: location.search, rows: document.querySelectorAll('.experience-row').length })`)

const report = { filteredUrl, restoredSearch, restoredCards, beforeScroll, afterScroll, cityFilter, cityBack, errors }
writeFileSync('docs/audit/navigation-e2e.json', JSON.stringify(report, null, 2))
console.log(JSON.stringify(report, null, 2))
ws.close()
