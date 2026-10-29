import { writeFileSync } from 'node:fs'

const PORT = 9224
const BASE = 'http://localhost:5180'
const stamp = Date.now()
const email = `mobile-ui-${stamp}@example.com`
const password = 'parola123'

async function main() {
  let version
  try {
    version = await (await fetch(`http://127.0.0.1:${PORT}/json/version`)).json()
  } catch {
    console.error('CDP_NOT_RUNNING')
    process.exit(2)
  }

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
      // Misafir oturumda /api/auth/me 401 döner; beklenen oturum kontrolüdür.
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
    const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
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
  await send('Emulation.setDeviceMetricsOverride', { width: 375, height: 667, deviceScaleFactor: 1, mobile: true })

  await send('Page.navigate', { url: `${BASE}/register` })
  await waitFor(`document.querySelector('form') && location.pathname === '/register'`, 'register page')

  const fill = (selector, value) => `(() => {
    const el = document.querySelector(${JSON.stringify(selector)});
    if (!el) throw new Error('missing ${selector}');
    const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : el instanceof HTMLSelectElement ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, ${JSON.stringify(value)});
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  })()`

  await evaluate(fill('input[name=name]', 'Mobil Kullanıcı'))
  await evaluate(fill('input[name=email]', email))
  await evaluate(fill('input[name=password]', password))
  await screenshot('e2e-register-mobile')
  await evaluate(`document.querySelector('form').requestSubmit()`)
  await waitFor(`location.pathname === '/onboarding'`, 'onboarding after register')

  await waitFor(`!!document.querySelector('.chip-toggle')`, 'onboarding form')
  await evaluate(`document.querySelectorAll('.chip-toggle')[0].click()`)
  await screenshot('e2e-onboarding-mobile')
  await evaluate(`document.querySelector('form').requestSubmit()`)
  await waitFor(`location.pathname === '/trips'`, 'trips after onboarding')

  await waitFor(`!!document.querySelector('a[href="/trips/new"]')`, 'new trip link')
  await evaluate(`document.querySelector('a[href="/trips/new"]').click()`)
  await waitFor(`location.pathname === '/trips/new'`, 'new trip page')
  await waitFor(
    `document.querySelector('.mobile-nav .is-active')?.textContent.trim() === 'Planlama'`,
    'planlama active nav',
  )
  const newTripActive = await evaluate(
    `[...document.querySelectorAll('.mobile-nav .is-active')].map((item) => item.textContent.trim())`,
  )

  await evaluate(fill('input[name=destination]', 'Roma'))
  await evaluate(fill('input[name=budget]', '450'))
  await evaluate(fill('textarea[name=notes]', 'Mobil uçtan uca test notu.'))
  await screenshot('e2e-new-trip-mobile')
  await evaluate(`document.querySelector('form').requestSubmit()`)
  await waitFor(`location.pathname.startsWith('/trips/')`, 'trip detail after create')

  await waitFor(`document.querySelectorAll('.day').length >= 3`, 'generated days')
  const tripSummary = await evaluate(`({
    url: location.pathname,
    title: document.querySelector('.trip-hero h1')?.textContent,
    days: document.querySelectorAll('.day').length,
    activities: document.querySelectorAll('.activity-card').length,
    budget: document.querySelector('.budget-figure')?.textContent,
    bottomNav: getComputedStyle(document.querySelector('.mobile-nav')).display,
    activeNav: [...document.querySelectorAll('.mobile-nav .is-active')].map((item) => item.textContent.trim()),
  })`)
  await screenshot('e2e-trip-mobile')

  await evaluate(`(() => {
    const button = [...document.querySelectorAll('.trip-actions .button')].find((item) => item.textContent.includes('Planı yeniden hazırla'));
    if (!button) throw new Error('regenerate button missing');
    button.click();
  })()`)
  await waitFor(`!!document.querySelector('.trip-actions .inline-confirm')`, 'regenerate confirm')
  const regenerateConfirm = await evaluate(
    `document.querySelector('.trip-actions .inline-confirm')?.innerText ?? ''`,
  )
  await evaluate(`document.querySelector('.trip-actions .inline-confirm .button.ghost').click()`)

  await evaluate(`document.querySelectorAll('.day .button')[0].click()`)
  await waitFor(`!!document.querySelector('.activity-form')`, 'activity form')
  await evaluate(fill('.activity-form input[type=text]', 'Mobil kahve molası'))
  await evaluate(fill('.activity-form input[type=number]', '8'))
  await evaluate(`document.querySelector('.activity-form').requestSubmit()`)
  await waitFor(`document.querySelectorAll('.activity-card').length === ${tripSummary.activities + 1}`, 'activity added')

  const afterAdd = await evaluate(`({
    activities: document.querySelectorAll('.activity-card').length,
    body: document.body.innerText.includes('Mobil kahve molası'),
  })`)

  await evaluate(`(() => {
    const card = [...document.querySelectorAll('.activity-card')].find((item) => item.innerText.includes('Mobil kahve molası'));
    if (!card) throw new Error('activity card missing');
    card.querySelector('.icon-button').click();
  })()`)
  await waitFor(`!!document.querySelector('.activity-card .inline-confirm .button.danger')`, 'activity delete confirm')
  await evaluate(`(() => {
    const card = [...document.querySelectorAll('.activity-card')].find((item) => item.innerText.includes('Mobil kahve molası'));
    if (!card) throw new Error('activity card missing');
    card.querySelector('.inline-confirm .button.danger').click();
  })()`)
  await waitFor(`!document.body.innerText.includes('Mobil kahve molası')`, 'activity deleted')

  const final = await evaluate(`({
    url: location.pathname,
    activities: document.querySelectorAll('.activity-card').length,
    horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth + 2,
    bottomNav: getComputedStyle(document.querySelector('.mobile-nav')).display,
  })`)
  await screenshot('e2e-trip-after-edit-mobile')

  await evaluate(`(() => {
    const button = [...document.querySelectorAll('.site-header button')].find((item) => item.textContent.trim().length > 0);
    if (!button) throw new Error('header action button missing');
    button.click();
  })()`)
  await waitFor(`location.pathname === '/'`, 'logout redirect')
  await waitFor(`!!document.querySelector('a[href="/login"]')`, 'logout complete')
  const logoutState = await evaluate(`({
    path: location.pathname,
    loginLink: !!document.querySelector('a[href="/login"]'),
  })`)

  await evaluate(`document.querySelector('a[href="/login"]').click()`)
  await waitFor(`location.pathname === '/login'`, 'login page')
  await evaluate(fill('input[name=email]', email))
  await evaluate(fill('input[name=password]', password))
  await evaluate(`document.querySelector('form').requestSubmit()`)
  await waitFor(`location.pathname === '/trips'`, 'login redirect')
  const loginState = await evaluate(`({
    path: location.pathname,
    mobileNav: !!document.querySelector('.mobile-nav'),
  })`)

  const report = {
    browser: version.Browser,
    email,
    newTripActive,
    tripSummary,
    regenerateConfirm,
    afterAdd,
    final,
    logoutState,
    loginState,
    errors,
  }
  writeFileSync('docs/audit/mobile-e2e.json', JSON.stringify(report, null, 2))
  console.log(JSON.stringify(report, null, 2))

  const failures = []
  if (tripSummary.days < 3) failures.push('days')
  if (tripSummary.activities < 1) failures.push('activities')
  if (tripSummary.bottomNav !== 'grid') failures.push('bottomNav')
  if (newTripActive.join(',') !== 'Planlama') failures.push('newTripActiveNav')
  if (tripSummary.activeNav.join(',') !== 'Rotasyon') failures.push('tripActiveNav')
  if (!regenerateConfirm.includes('MEVCUT PLAN')) {
    failures.push('regenerateConfirm')
  }
  if (afterAdd.activities !== tripSummary.activities + 1) failures.push('activityAdd')
  if (final.activities !== tripSummary.activities) failures.push('activityDelete')
  if (final.horizontalOverflow) failures.push('horizontalOverflow')
  if (logoutState.path !== '/' || !logoutState.loginLink) failures.push('logout')
  if (loginState.path !== '/trips' || !loginState.mobileNav) failures.push('login')
  if (errors.length > 0) failures.push('consoleErrors')
  if (failures.length) {
    console.error('FAILED:', failures.join(', '))
    process.exit(1)
  }
  console.log('MOBILE_UI_E2E_OK')
  ws.close()
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
