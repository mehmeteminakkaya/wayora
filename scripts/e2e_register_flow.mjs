const PORT = 9224
const BASE = 'http://localhost:5180'
const email = `flow-${Date.now()}@example.com`
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
await send('Emulation.setDeviceMetricsOverride', { width: 375, height: 667, deviceScaleFactor: 1, mobile: true })

await send('Page.navigate', { url: `${BASE}/trips/new?destination=Berlin` })
await waitFor(`location.pathname === '/login'`, 'protected redirect')
await evaluate(`document.querySelector('a[href="/register"]').click()`)
await waitFor(`location.pathname === '/register'`, 'register page')
await fill('input[name=name]', 'Akış Testi')
await fill('input[name=email]', email)
await fill('input[name=password]', 'parola123')
await evaluate(`document.querySelector('form').requestSubmit()`)
await waitFor(`location.pathname === '/onboarding'`, 'onboarding after register')
const onboarding = await evaluate(`({ path: location.pathname, fromPrefilled: document.body.innerText.includes('Berlin') })`)
await evaluate(`document.querySelector('a[href="/trips/new?destination=Berlin"]')?.click()`)
await waitFor(`location.pathname === '/trips/new'`, 'return to new trip')
await waitFor(`document.querySelector('input[name=destination]')?.value === 'Berlin'`, 'destination restored')
const restored = await evaluate(`({ path: location.pathname, search: location.search, destination: document.querySelector('input[name=destination]')?.value })`)
const report = { email, onboarding, restored, errors }
console.log(JSON.stringify(report, null, 2))
await send('Runtime.evaluate', { expression: `fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })`, awaitPromise: true })
ws.close()
