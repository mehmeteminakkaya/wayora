import { mkdirSync, writeFileSync } from 'node:fs'

const BASE = process.env.AUDIT_BASE ?? 'https://wayora-ten.vercel.app'
const PORT = Number(process.env.CDP_PORT ?? 9224)
const EMAIL = process.env.AUDIT_EMAIL ?? 'demo@wayora.app'
const PASSWORD = process.env.AUDIT_PASSWORD ?? 'demo1234'

async function api(path, cookie = '') {
  const response = await fetch(`${BASE}${path}`, {
    headers: cookie ? { cookie } : undefined,
  })
  if (!response.ok) throw new Error(`${path} -> ${response.status}`)
  return response.json()
}

const login = await fetch(`${BASE}/api/auth/login`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
})
if (!login.ok) throw new Error(`login failed: ${login.status}`)
const cookieHeader = login.headers.get('set-cookie')?.split(';')[0] ?? ''
if (!cookieHeader) throw new Error('session cookie missing')
const cookie = cookieHeader.slice(cookieHeader.indexOf('=') + 1)
const trips = await api('/api/trips', cookieHeader)
const demoTrip = trips.trips?.[0]
const city = await api('/api/cities/berlin')
const experience = city.city?.experiences?.[0]

const routes = [
  { label: 'landing', path: '/' },
  { label: 'explore', path: '/kesfet' },
  { label: 'city', path: '/kesfet/berlin' },
  ...(experience
    ? [{ label: 'experience', path: `/kesfet/berlin/${experience.slug}` }]
    : []),
  { label: 'trips', path: '/trips' },
  ...(demoTrip ? [{ label: 'trip-detail', path: `/trips/${demoTrip.id}` }] : []),
  { label: 'new-trip', path: '/trips/new' },
  { label: 'social', path: '/yol-arkadaslari' },
  { label: 'profile', path: '/profil' },
  { label: 'onboarding', path: '/onboarding' },
  { label: 'not-found', path: '/bu-sayfa-yok' },
]

const targets = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json()
const target = targets.find((item) => item.type === 'page')
if (!target) throw new Error('CDP page target not found')

const ws = new WebSocket(target.webSocketDebuggerUrl)
await new Promise((resolve, reject) => {
  ws.addEventListener('open', resolve, { once: true })
  ws.addEventListener('error', reject, { once: true })
})

let id = 0
let currentRoute = 'start'
const runtimeErrors = []
const networkFailures = []
const pending = new Map()

ws.addEventListener('message', (event) => {
  const message = JSON.parse(event.data)
  if (message.method === 'Runtime.exceptionThrown') {
    runtimeErrors.push({
      route: currentRoute,
      text:
        message.params.exceptionDetails?.exception?.description ??
        message.params.exceptionDetails?.text ??
        'unknown exception',
    })
  }
  if (message.method === 'Log.entryAdded' && message.params.entry.level === 'error') {
    runtimeErrors.push({ route: currentRoute, text: message.params.entry.text })
  }
  if (message.method === 'Network.loadingFailed') {
    const failure = message.params
    if (failure.errorText && !failure.errorText.includes('ERR_ABORTED')) {
      networkFailures.push({
        route: currentRoute,
        error: failure.errorText,
        requestId: failure.requestId,
      })
    }
  }
  if (!message.id) return
  const waiter = pending.get(message.id)
  if (!waiter) return
  pending.delete(message.id)
  message.error
    ? waiter.reject(new Error(JSON.stringify(message.error)))
    : waiter.resolve(message.result)
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

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const waitFor = async (expression, label, timeout = 15000) => {
  const start = Date.now()
  while (Date.now() - start < timeout) {
    if (await evaluate(expression)) return
    await sleep(200)
  }
  throw new Error(`timeout: ${label}`)
}

await send('Page.enable')
await send('Runtime.enable')
await send('Log.enable')
await send('Network.enable')
await send('Network.setCookie', {
  name: 'wayora_session',
  value: cookie,
  url: BASE,
  secure: true,
  httpOnly: true,
  sameSite: 'Lax',
})

const viewports = [
  { label: 'mobile', width: 390, height: 844, mobile: true },
  { label: 'desktop', width: 1280, height: 900, mobile: false },
]

const results = []

for (const viewport of viewports) {
  await send('Emulation.setDeviceMetricsOverride', {
    width: viewport.width,
    height: viewport.height,
    deviceScaleFactor: 1,
    mobile: viewport.mobile,
  })

  for (const route of routes) {
    currentRoute = `${viewport.label}:${route.label}`
    runtimeErrors.length = 0
    networkFailures.length = 0
    await send('Page.navigate', { url: `${BASE}${route.path}` })
    await waitFor(
      `Boolean(document.querySelector('main') && document.readyState === 'complete')`,
      `${currentRoute} main`,
    )
    await sleep(1000)

    const metrics = await evaluate(`(() => {
      const all = [...document.querySelectorAll('*')];
      const root = document.documentElement;
      const visible = (el) => {
        const style = getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
      };
      const overflow = all
        .filter((el) => visible(el) && el.getBoundingClientRect().right > innerWidth + 2)
        .slice(0, 8)
        .map((el) => ({
          tag: el.tagName,
          className: String(el.className).slice(0, 80),
          right: Math.round(el.getBoundingClientRect().right),
        }));
      const shortTargets =
        innerWidth > 720
          ? []
          : all
              .filter(
                (el) =>
                  (el.tagName === 'BUTTON' ||
                    el.tagName === 'A' ||
                    el.tagName === 'INPUT' ||
                    el.tagName === 'SELECT' ||
                    el.tagName === 'TEXTAREA' ||
                    el.getAttribute('role') === 'button') &&
                  visible(el) &&
                  !el.closest('.experience-row, .city-card, .trip-card, .profile-row'),
              )
              .map((el) => ({
                text: (el.textContent || '').trim().slice(0, 50),
                height: Math.round(el.getBoundingClientRect().height),
              }))
              .filter((item) => item.height > 0 && item.height < 44);
      const images = [...document.images].filter(visible);
      const ids = [...document.querySelectorAll('[id]')].map((el) => el.id);
      const duplicateIds = [...new Set(ids.filter((value, index) => ids.indexOf(value) !== index))];
      return {
        path: location.pathname,
        title: document.title,
        h1: [...document.querySelectorAll('h1')].filter(visible).map((el) => el.textContent?.trim()),
        scrollWidth: root.scrollWidth,
        viewportWidth: innerWidth,
        horizontalOverflow: root.scrollWidth > innerWidth + 2,
        overflow,
        shortTargets,
        imageCount: images.length,
        imagesMissingAlt: images.filter((img) => !img.hasAttribute('alt')).length,
        duplicateIds,
        bodyTextLength: document.body.innerText.length,
        mainText: document.querySelector('main')?.innerText.slice(0, 120) ?? '',
      };
    })()`)

    results.push({
      viewport: viewport.label,
      route: route.label,
      path: route.path,
      metrics,
      runtimeErrors: [...runtimeErrors],
      networkFailures: [...networkFailures],
    })
    console.log(
      `${viewport.label.padEnd(7)} ${route.label.padEnd(12)} h1=${metrics.h1.length} overflow=${metrics.horizontalOverflow ? 'YES' : 'no'} short=${metrics.shortTargets.length} runtime=${runtimeErrors.length} network=${networkFailures.length}`,
    )
  }
}

const summary = {
  generatedAt: new Date().toISOString(),
  base: BASE,
  checks: results.length,
  routeIssues: results.filter(
    (result) =>
      result.metrics.horizontalOverflow ||
      result.metrics.shortTargets.length > 0 ||
      result.runtimeErrors.length > 0 ||
      result.networkFailures.length > 0 ||
      result.metrics.imagesMissingAlt > 0 ||
      result.metrics.h1.length !== 1 ||
      result.metrics.duplicateIds.length > 0,
  ),
  results,
}

mkdirSync('docs/audit', { recursive: true })
writeFileSync('docs/audit/apple-frontend-audit.json', `${JSON.stringify(summary, null, 2)}\n`)
console.log(`\nIssues: ${summary.routeIssues.length}/${summary.checks} checks`)
for (const issue of summary.routeIssues) {
  console.log(
    `${issue.viewport}:${issue.route} overflow=${issue.metrics.horizontalOverflow} short=${issue.metrics.shortTargets.length} h1=${issue.metrics.h1.length} alt=${issue.metrics.imagesMissingAlt} runtime=${issue.runtimeErrors.length} network=${issue.networkFailures.length}`,
  )
}
ws.close()
