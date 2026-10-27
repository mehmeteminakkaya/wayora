import { writeFileSync } from 'node:fs'

const PORT = 9223
const url = 'http://localhost:5180/'
const out = 'docs/audit/ui-audit.json'

async function main() {
  let version
  try {
    version = await (await fetch(`http://127.0.0.1:${PORT}/json/version`)).json()
  } catch {
    console.log('CDP_NOT_RUNNING')
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
      errors.push({ type: 'log', text: message.params.entry.text })
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

  await send('Page.enable')
  await send('Runtime.enable')
  await send('Log.enable')

  const widths = [
    { width: 375, height: 667, mobile: true },
    { width: 390, height: 844, mobile: true },
    { width: 768, height: 1024, mobile: true },
    { width: 1024, height: 768, mobile: false },
    { width: 1440, height: 900, mobile: false },
  ]
  const results = []

  for (const dims of widths) {
    errors.length = 0
    await send('Emulation.setDeviceMetricsOverride', {
      width: dims.width,
      height: dims.height,
      deviceScaleFactor: 1,
      mobile: dims.mobile,
    })
    await send('Page.navigate', { url })
    await new Promise((resolve) => setTimeout(resolve, 1800))
    const result = await send('Runtime.evaluate', {
      expression: `(() => {
        const rect = (el) => el ? el.getBoundingClientRect().toJSON() : null;
        const overflow = [...document.querySelectorAll('body *')]
          .map((el) => ({ el, r: el.getBoundingClientRect() }))
          .filter(({ el, r }) => r.width > 0 && r.right > window.innerWidth + 2 && getComputedStyle(el).position !== 'fixed')
          .slice(0, 12)
          .map(({ el, r }) => ({ tag: el.tagName, cls: typeof el.className === 'string' ? el.className : '', right: Math.round(r.right), width: Math.round(r.width) }));
        const unlabeledButtons = [...document.querySelectorAll('button')]
          .filter((b) => !(b.textContent || '').trim() && !b.getAttribute('aria-label'))
          .map((b) => b.outerHTML.slice(0, 120));
        const missingAlt = [...document.querySelectorAll('img')]
          .filter((img) => !img.hasAttribute('alt'))
          .map((img) => img.getAttribute('src'));
        const inputsWithoutLabel = [...document.querySelectorAll('input:not([type=hidden]), select, textarea')]
          .filter((el) => !el.closest('label') && !el.getAttribute('aria-label') && !el.getAttribute('aria-labelledby'))
          .map((el) => el.name || el.id || el.outerHTML.slice(0, 80));
        return {
          url: location.href,
          innerWidth: window.innerWidth,
          scrollWidth: document.documentElement.scrollWidth,
          bodyScrollWidth: document.body.scrollWidth,
          horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth + 2,
          header: rect(document.querySelector('.site-header')),
          heroTitle: rect(document.querySelector('.hero h1')),
          heroPhoto: rect(document.querySelector('.hero-photo')),
          bottomNav: rect(document.querySelector('.mobile-nav')),
          bottomNavDisplay: document.querySelector('.mobile-nav') ? getComputedStyle(document.querySelector('.mobile-nav')).display : null,
          images: [...document.images].map((img) => ({ src: img.getAttribute('src'), loaded: img.complete && img.naturalWidth > 0, alt: img.getAttribute('alt') })),
          overflow,
          unlabeledButtons,
          missingAlt,
          inputsWithoutLabel,
          h1: document.querySelector('h1')?.textContent?.trim().replace(/\\s+/g, ' ') ?? null,
        };
      })()`,
      returnByValue: true,
    })
    results.push({ viewport: dims, ...result.result.value, errors: [...errors] })
  }

  writeFileSync(out, JSON.stringify({ browser: version.Browser, results }, null, 2))
  console.log(JSON.stringify(results.map((r) => ({ viewport: r.viewport, overflow: r.horizontalOverflow, scrollWidth: r.scrollWidth, bottomNav: r.bottomNavDisplay, errors: r.errors.length, unlabeledButtons: r.unlabeledButtons.length, missingAlt: r.missingAlt.length, inputsWithoutLabel: r.inputsWithoutLabel.length })), null, 2))
  ws.close()
}

main()
