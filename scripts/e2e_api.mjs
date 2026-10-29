const API = 'http://127.0.0.1:4000'

function cookieFrom(response) {
  const raw = response.headers.getSetCookie?.()[0] ?? response.headers.get('set-cookie')
  if (!raw) throw new Error('Set-Cookie yok')
  return raw.split(';')[0]
}

async function json(path, options = {}) {
  const response = await fetch(API + path, options)
  const body = response.status === 204 ? null : await response.json().catch(() => null)
  return { response, body }
}

function auth(token, extra = {}) {
  return { ...extra, headers: { ...(extra.body ? { 'content-type': 'application/json' } : {}), ...(extra.headers ?? {}), cookie: token } }
}

const stamp = Date.now()
const email = `mobile-e2e-${stamp}@example.com`
const otherEmail = `mobile-other-${stamp}@example.com`
const password = 'parola123'

const register = await json('/api/auth/register', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ email, password, name: 'Mobil E2E' }),
})
if (!register.response.ok) throw new Error(`register ${register.response.status}: ${JSON.stringify(register.body)}`)
const cookie = cookieFrom(register.response)

const me = await json('/api/auth/me', auth(cookie))
const prefs = await json('/api/me/preferences', auth(cookie))
const savePrefs = await json('/api/me/preferences', auth(cookie, {
  method: 'PUT',
  body: JSON.stringify({
    interests: ['Müze', 'Yemek', 'Mimari'],
    budgetLevel: 'mid',
    travelStyle: 'balanced',
    pace: 'moderate',
  }),
}))
if (!savePrefs.response.ok) throw new Error(`prefs ${savePrefs.response.status}: ${JSON.stringify(savePrefs.body)}`)

const create = await json('/api/trips', auth(cookie, {
  method: 'POST',
  body: JSON.stringify({
    title: 'Mobil test rotası',
    destination: 'Paris',
    startDate: '2026-11-10',
    endDate: '2026-11-12',
    budget: 500,
    currency: 'EUR',
    notes: 'Sabah erken başla, müzeler öncelikli.',
  }),
}))
if (!create.response.ok) throw new Error(`create ${create.response.status}: ${JSON.stringify(create.body)}`)
const tripId = create.body.trip.id

const zeroBudget = await json('/api/trips', auth(cookie, {
  method: 'POST',
  body: JSON.stringify({
    title: 'Sıfır bütçe testi',
    destination: 'İstanbul',
    startDate: '2026-11-15',
    endDate: '2026-11-16',
    budget: 0,
    currency: 'TRY',
    notes: null,
  }),
}))
const zeroBudgetId = zeroBudget.body?.trip?.id
if (zeroBudgetId) {
  await json(`/api/trips/${zeroBudgetId}`, auth(cookie, { method: 'DELETE' }))
}

const generated = await json(`/api/trips/${tripId}/generate`, auth(cookie, { method: 'POST' }))
if (!generated.response.ok) throw new Error(`generate ${generated.response.status}: ${JSON.stringify(generated.body)}`)

const trip = generated.body.trip
const persisted = await json(`/api/trips/${tripId}`, auth(cookie))
const day = trip.days[0]
const added = await json(`/api/trips/${tripId}/days/${day.id}/activities`, auth(cookie, {
  method: 'POST',
  body: JSON.stringify({
    title: 'Elle eklenen kahve molası',
    category: 'food',
    startTime: '16:00',
    endTime: '17:00',
    estimatedCost: 12,
    notes: null,
  }),
}))
if (!added.response.ok) throw new Error(`add ${added.response.status}: ${JSON.stringify(added.body)}`)
const afterAdd = await json(`/api/trips/${tripId}`, auth(cookie))
const deletedActivity = await json(`/api/activities/${added.body.activity.id}`, auth(cookie, { method: 'DELETE' }))
const afterDelete = await json(`/api/trips/${tripId}`, auth(cookie))

const other = await json('/api/auth/register', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ email: otherEmail, password, name: 'Diğer' }),
})
if (!other.response.ok) throw new Error(`other register ${other.response.status}`)
const otherCookie = cookieFrom(other.response)
const foreignGet = await json(`/api/trips/${tripId}`, auth(otherCookie))
const foreignDelete = await json(`/api/trips/${tripId}`, auth(otherCookie, { method: 'DELETE' }))
const otherLogout = await json('/api/auth/logout', auth(otherCookie, { method: 'POST' }))
const logoutCookie = otherLogout.response.headers.getSetCookie?.()[0] ?? otherLogout.response.headers.get('set-cookie') ?? ''
const meWithoutCookie = await json('/api/auth/me')
const otherLogin = await json('/api/auth/login', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ email: otherEmail, password }),
})
const otherCookieAfterLogin = otherLogin.response.ok ? cookieFrom(otherLogin.response) : ''
const otherMeAfterLogin = await json('/api/auth/me', auth(otherCookieAfterLogin))

const remove = await json(`/api/trips/${tripId}`, auth(cookie, { method: 'DELETE' }))
const gone = await json(`/api/trips/${tripId}`, auth(cookie))

const checks = {
  register: register.response.status,
  me: me.response.status,
  meEmail: me.body?.user?.email,
  defaultPrefs: prefs.response.status,
  savePrefs: savePrefs.response.status,
  create: create.response.status,
  zeroBudget: zeroBudget.response.status,
  generate: generated.response.status,
  provider: generated.body?.meta?.provider,
  fallback: generated.body?.meta?.fallback,
  days: trip.days.length,
  activities: trip.days.flatMap((item) => item.activities).length,
  tips: trip.tips.length,
  persisted: persisted.response.status,
  addActivity: added.response.status,
  activityCountAfterAdd: afterAdd.body.trip.days.flatMap((item) => item.activities).length,
  deleteActivity: deletedActivity.response.status,
  activityCountAfterDelete: afterDelete.body.trip.days.flatMap((item) => item.activities).length,
  foreignGet: foreignGet.response.status,
  foreignDelete: foreignDelete.response.status,
  logout: otherLogout.response.status,
  logoutClearsCookie: /wayora_session=;|Max-Age=0|Expires=Thu, 01 Jan 1970/.test(logoutCookie),
  meWithoutCookie: meWithoutCookie.response.status,
  login: otherLogin.response.status,
  meAfterLogin: otherMeAfterLogin.response.status,
  deleteTrip: remove.response.status,
  gone: gone.response.status,
}
console.log(JSON.stringify(checks, null, 2))

const failures = []
if (checks.register !== 201) failures.push('register')
if (checks.me !== 200) failures.push('me')
if (checks.defaultPrefs !== 200) failures.push('defaultPrefs')
if (checks.savePrefs !== 200) failures.push('savePrefs')
if (checks.create !== 201) failures.push('create')
if (checks.zeroBudget !== 201) failures.push('zeroBudget')
if (checks.generate !== 200) failures.push('generate')
if (checks.days !== 3) failures.push('days')
if (checks.activities < 1) failures.push('activities')
if (checks.tips < 1) failures.push('tips')
if (checks.persisted !== 200) failures.push('persisted')
if (checks.addActivity !== 201) failures.push('addActivity')
if (checks.activityCountAfterAdd !== checks.activities + 1) failures.push('activityCountAfterAdd')
if (checks.deleteActivity !== 204) failures.push('deleteActivity')
if (checks.activityCountAfterDelete !== checks.activities) failures.push('activityCountAfterDelete')
if (checks.foreignGet !== 404) failures.push('foreignGet')
if (checks.foreignDelete !== 404) failures.push('foreignDelete')
if (checks.logout !== 204) failures.push('logout')
if (!checks.logoutClearsCookie) failures.push('logoutClearsCookie')
if (checks.meWithoutCookie !== 401) failures.push('meWithoutCookie')
if (checks.login !== 200) failures.push('login')
if (checks.meAfterLogin !== 200) failures.push('meAfterLogin')
if (checks.deleteTrip !== 204) failures.push('deleteTrip')
if (checks.gone !== 404) failures.push('gone')

if (failures.length) {
  console.error('FAILED:', failures.join(', '))
  process.exit(1)
}
console.log('API_E2E_OK')
