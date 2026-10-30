import { mkdirSync, writeFileSync } from 'node:fs'

const PORT = 9224
const BASE = 'http://localhost:5180'
const EMAIL = process.env.SOCIAL_AUDIT_EMAIL ?? 'social-1793319547752-Selin@example.com'
const PASSWORD = process.env.SOCIAL_AUDIT_PASSWORD ?? 'parola123'

const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json()
const target = list.find((item) => item.type === 'page')
if (!target) throw new Error('CDP page target not found')

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
  const result = await send('Runtime.evaluate', {
    expression,
    returnByValue: true,
    awaitPromise: true,
  })
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text)
  return result.result.value
}
const waitFor = async (expression, label, timeout = 15000) => {
  const start = Date.now()
  while (Date.now() - start < timeout) {
    if (await evaluate(expression)) return
    await new Promise((resolve) => setTimeout(resolve, 250))
  }
  throw new Error(`timeout: ${label}`)
}
const screenshot = async (name) => {
  const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false })
  writeFileSync(`docs/audit/${name}.png`, Buffer.from(shot.data, 'base64'))
}
const fill = (selector, value) => `(() => {
  const el = document.querySelector(${JSON.stringify(selector)});
  if (!el) throw new Error('missing ${selector}');
  const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, 'value').set;
  setter.call(el, ${JSON.stringify(value)});
  el.dispatchEvent(new Event('input', { bubbles: true }));
  return true;
})()`

await send('Page.enable')
await send('Runtime.enable')
await send('Emulation.setDeviceMetricsOverride', {
  width: 390,
  height: 844,
  deviceScaleFactor: 1,
  mobile: true,
})
await send('Page.navigate', { url: `${BASE}/login` })
await waitFor(`Boolean(location.pathname === '/login' && document.querySelector('input[type=email]'))`, 'login')
await evaluate(fill('input[type=email]', EMAIL))
await evaluate(fill('input[type=password]', PASSWORD))
await evaluate(`document.querySelector('form button[type=submit]').click()`)
await waitFor(`location.pathname !== '/login'`, 'login redirect')
await send('Page.navigate', { url: `${BASE}/yol-arkadaslari` })
await waitFor(`Boolean(location.pathname === '/yol-arkadaslari' && document.querySelector('.social-page'))`, 'social page')
await waitFor(`document.querySelectorAll('.social-tab').length === 3`, 'social tabs')
await waitFor(`document.querySelectorAll('.match-card').length > 0`, 'match cards')

const metrics = await evaluate(`(() => {
  const root = document.documentElement;
  const offenders = [...document.querySelectorAll('*')]
    .map((el) => ({ el, rect: el.getBoundingClientRect() }))
    .filter(({ rect }) => rect.width > 0 && (rect.right > innerWidth + 1 || rect.left < -1))
    .slice(0, 10)
    .map(({ el, rect }) => ({ tag: el.tagName, className: String(el.className), left: Math.round(rect.left), right: Math.round(rect.right) }));
  const shortTargets = [...document.querySelectorAll('.social-page button, .social-page a.btn')]
    .map((el) => ({ text: el.textContent?.trim(), height: Math.round(el.getBoundingClientRect().height) }))
    .filter((item) => item.height > 0 && item.height < 44);
  return {
    viewport: { width: innerWidth, height: innerHeight },
    scrollWidth: root.scrollWidth,
    overflow: offenders,
    shortTargets,
    matchCards: document.querySelectorAll('.match-card').length,
    tabs: [...document.querySelectorAll('.social-tab')].map((el) => el.textContent?.trim()),
    bottomNav: Boolean(document.querySelector('.bottom-nav')),
    bottomActive: [...document.querySelectorAll('.bottom-nav a')].map((el) => ({
      text: el.textContent?.trim(),
      active: el.classList.contains('is-active'),
      color: getComputedStyle(el).color,
    })),
  };
})()`)

await screenshot('wayora-hitchhiker-mobile')

await send('Emulation.setDeviceMetricsOverride', {
  width: 1280,
  height: 900,
  deviceScaleFactor: 1,
  mobile: false,
})
await send('Page.reload')
await waitFor(`Boolean(location.pathname === '/yol-arkadaslari' && document.querySelector('.social-page'))`, 'desktop social page')
await waitFor(`document.querySelectorAll('.match-card').length > 0`, 'desktop match cards')
const desktop = await evaluate(`({
  viewport: { width: innerWidth, height: innerHeight },
  scrollWidth: document.documentElement.scrollWidth,
  matchCards: document.querySelectorAll('.match-card').length,
  bottomNav: Boolean(document.querySelector('.bottom-nav')),
})`)
await screenshot('wayora-hitchhiker-desktop')

mkdirSync('docs/audit', { recursive: true })
console.log(JSON.stringify({ mobile: metrics, desktop }, null, 2))
ws.close()
