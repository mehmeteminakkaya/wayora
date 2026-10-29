import { writeFileSync } from 'node:fs'

const PORT = 9224
const BASE = 'http://localhost:5180'

async function main() {
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
    if (message.method === 'Runtime.exceptionThrown') {
      errors.push({ type: 'exception', text: message.params.exceptionDetails?.text })
    }
    if (message.method === 'Log.entryAdded' && message.params.entry.level === 'error') {
      const text = message.params.entry.text
      if (!text.includes('401 (Unauthorized)')) errors.push({ type: 'log', text })
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
    const result = await send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    })
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.text)
    return result.result.value
  }
  const waitFor = async (expression, label, timeout = 12000) => {
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

  await send('Page.enable')
  await send('Runtime.enable')
  await send('Log.enable')
  await send('Network.enable')
  await send('Network.clearBrowserCookies')
  await send('Emulation.setDeviceMetricsOverride', {
    width: 375,
    height: 667,
    deviceScaleFactor: 1,
    mobile: true,
  })

  await send('Page.navigate', { url: `${BASE}/kesfet` })
  await waitFor(`document.querySelectorAll('.city-guide-card').length === 10`, '10 city cards')
  const listing = await evaluate(`({
    path: location.pathname,
    cards: document.querySelectorAll('.city-guide-card').length,
    names: [...document.querySelectorAll('.city-guide-card h2')].map((item) => item.textContent),
    mobileNav: [...document.querySelectorAll('.mobile-nav a')].map((item) => item.textContent.trim()),
    horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth + 2,
  })`)
  await screenshot('explore-mobile')

  await evaluate(`(() => {
    const card = [...document.querySelectorAll('.city-guide-card')].find((item) => item.textContent.includes('Berlin'));
    if (!card) throw new Error('Berlin card missing');
    card.click();
  })()`)
  await waitFor(`location.pathname === '/kesfet/berlin'`, 'Berlin city page')
  await waitFor(`document.querySelectorAll('.experience-card').length === 10`, 'Berlin experiences')
  const city = await evaluate(`({
    path: location.pathname,
    heading: document.querySelector('h1')?.textContent,
    cards: document.querySelectorAll('.experience-card').length,
    categories: [...new Set([...document.querySelectorAll('.experience-card .stamp')].map((item) => item.textContent))],
    horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth + 2,
  })`)
  await screenshot('explore-berlin-mobile')

  await evaluate(`(() => {
    const button = [...document.querySelectorAll('.filter-chip')].find((item) => item.textContent.trim() === 'Müze');
    if (!button) throw new Error('museum filter missing');
    button.click();
  })()`)
  await waitFor(`document.querySelectorAll('.experience-card').length === 2`, 'museum filter')
  const filtered = await evaluate(`({
    cards: document.querySelectorAll('.experience-card').length,
    names: [...document.querySelectorAll('.experience-card h3')].map((item) => item.textContent),
  })`)

  await evaluate(`document.querySelector('.city-guide-actions .button').click()`)
  await waitFor(`location.pathname === '/login'`, 'login after guest CTA')
  const fromState = await evaluate(`document.body.innerText.includes('KALDIĞIN')`)
  await evaluate(`(() => {
    const set = (selector, value) => {
      const el = document.querySelector(selector);
      if (!el) throw new Error('missing ' + selector);
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, value);
      el.dispatchEvent(new Event('input', { bubbles: true }));
    };
    set('input[name=email]', 'e2e-1792740709@example.com');
    set('input[name=password]', 'parola123');
  })()`)
  await evaluate(`document.querySelector('form').requestSubmit()`)
  await waitFor(`location.pathname === '/trips/new'`, 'new trip after login')
  const ctaLogin = await evaluate(`({
    path: location.pathname,
    search: location.search,
    destination: document.querySelector('input[name=destination]')?.value,
    fromState: ${fromState},
  })`)
  await screenshot('explore-cta-login-mobile')

  await evaluate(`document.querySelector('form').requestSubmit()`)
  await waitFor(`location.pathname.startsWith('/trips/')`, 'Berlin trip created')
  await waitFor(`document.querySelectorAll('.day').length >= 3`, 'Berlin plan generated')
  const berlinTrip = await evaluate(`({
    path: location.pathname,
    days: document.querySelectorAll('.day').length,
    activities: document.querySelectorAll('.activity-card').length,
    cityPlate: !!document.querySelector('.city-plate-inner'),
    firstActivity: document.querySelector('.activity-card .activity-title')?.textContent,
  })`)
  await screenshot('trip-berlin-mobile')

  await send('Network.clearBrowserCookies')
  const responsive = []
  for (const dims of [
    { width: 320, height: 568, mobile: true },
    { width: 360, height: 640, mobile: true },
    { width: 768, height: 1024, mobile: true },
    { width: 1440, height: 900, mobile: false },
  ]) {
    await send('Emulation.setDeviceMetricsOverride', {
      width: dims.width,
      height: dims.height,
      deviceScaleFactor: 1,
      mobile: dims.mobile,
    })
    await send('Page.navigate', { url: `${BASE}/kesfet` })
    await waitFor(`document.querySelectorAll('.city-guide-card').length === 10`, `cities ${dims.width}`)
    const list = await evaluate(`({
      width: window.innerWidth,
      overflow: document.documentElement.scrollWidth > window.innerWidth + 2,
      cards: document.querySelectorAll('.city-guide-card').length,
      headerHeight: document.querySelector('.site-header')?.getBoundingClientRect().height,
    })`)
    await send('Page.navigate', { url: `${BASE}/kesfet/paris` })
    await waitFor(`document.querySelectorAll('.experience-card').length === 10`, `city ${dims.width}`)
    const detail = await evaluate(`({
      width: window.innerWidth,
      overflow: document.documentElement.scrollWidth > window.innerWidth + 2,
      cards: document.querySelectorAll('.experience-card').length,
    })`)
    responsive.push({ ...dims, list, detail })
  }

  const report = { listing, city, filtered, ctaLogin, berlinTrip, responsive, errors }
  writeFileSync('docs/audit/explore-audit.json', JSON.stringify(report, null, 2))
  console.log(JSON.stringify(report, null, 2))

  const failures = []
  if (listing.cards !== 10) failures.push('cityCount')
  if (!listing.names.includes('İstanbul') || !listing.names.includes('Lizbon')) failures.push('cityNames')
  if (listing.mobileNav.length !== 4) failures.push('mobileNav')
  if (listing.horizontalOverflow || city.horizontalOverflow) failures.push('horizontalOverflow')
  if (city.cards !== 10) failures.push('experiences')
  if (filtered.cards !== 2) failures.push('museumFilter')
  if (!ctaLogin.search.includes('destination=Berlin') || ctaLogin.destination !== 'Berlin') {
    failures.push('guestCtaPrefill')
  }
  if (berlinTrip.days < 3 || berlinTrip.activities < 1 || !berlinTrip.cityPlate) {
    failures.push('berlinTrip')
  }
  for (const item of responsive) {
    if (item.list.overflow || item.detail.overflow) failures.push(`overflow-${item.width}`)
    if (item.list.cards !== 10 || item.detail.cards !== 10) failures.push(`cards-${item.width}`)
  }
  if (errors.length > 0) failures.push('consoleErrors')
  if (failures.length) {
    console.error('FAILED:', failures.join(', '))
    process.exit(1)
  }
  console.log('EXPLORE_UI_OK')
  ws.close()
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
