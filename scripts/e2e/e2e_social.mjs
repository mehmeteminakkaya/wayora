const BASE = 'http://localhost:4000'
const stamp = Date.now()

async function api(path, options = {}, cookie = '') {
  const authCookie = cookie || options.cookie || ''
  const response = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { 'content-type': 'application/json' } : {}),
      ...(authCookie ? { cookie: authCookie } : {}),
      ...options.headers,
    },
  })
  const text = await response.text()
  let body = null
  try {
    body = text ? JSON.parse(text) : null
  } catch {
    body = text
  }
  return { response, body, cookie: response.headers.get('set-cookie')?.split(';')[0] ?? authCookie }
}

async function register(name) {
  const email = `social-${stamp}-${name}@example.com`
  const password = 'parola123'
  const result = await api('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, name }),
  })
  if (!result.response.ok) throw new Error(`register ${name}: ${JSON.stringify(result.body)}`)
  const loggedIn = await api('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
  if (!loggedIn.response.ok) throw new Error(`login ${name}: ${JSON.stringify(loggedIn.body)}`)
  return { email, cookie: loggedIn.cookie, user: loggedIn.body.user }
}

async function createTrip(cookie, title, startDate, endDate) {
  const result = await api('/api/trips', {
    method: 'POST',
    cookie,
    body: JSON.stringify({
      title,
      destination: 'Berlin',
      startDate,
      endDate,
      budget: 500,
      currency: 'EUR',
      notes: 'Yol arkadaşı testi',
    }),
  })
  if (!result.response.ok) throw new Error(`trip: ${JSON.stringify(result.body)}`)
  return result.body.trip
}

async function setProfile(cookie, name) {
  const result = await api('/api/social/profile', {
    method: 'PUT',
    cookie,
    body: JSON.stringify({
      displayName: name,
      bio: 'Müzeleri, yerel mutfağı ve sakin yürüyüşleri seven bir gezgin.',
      languages: ['Türkçe', 'İngilizce'],
      hostingAvailable: name === 'Deniz',
      hostingNote: name === 'Deniz' ? 'Kısa bir çay sohbeti.' : null,
      visible: true,
      safetyAccepted: true,
    }),
  })
  if (!result.response.ok) throw new Error(`profile: ${JSON.stringify(result.body)}`)
  return result.body.profile
}

const alice = await register('Alice')
const bob = await register('Bob')

await api('/api/me/preferences', {
  method: 'PUT',
  cookie: alice.cookie,
  body: JSON.stringify({
    interests: ['museum', 'food', 'nature'],
    budgetLevel: 'mid',
    travelStyle: 'balanced',
    pace: 'moderate',
  }),
})
await api('/api/me/preferences', {
  method: 'PUT',
  cookie: bob.cookie,
  body: JSON.stringify({
    interests: ['museum', 'food'],
    budgetLevel: 'mid',
    travelStyle: 'balanced',
    pace: 'moderate',
  }),
})

await createTrip(alice.cookie, 'Alice Berlin', '2026-11-05', '2026-11-08')
await createTrip(bob.cookie, 'Bob Berlin', '2026-11-06', '2026-11-10')
await setProfile(alice.cookie, 'Alice')
await setProfile(bob.cookie, 'Deniz')

const aliceMatches = await api('/api/social/matches', { cookie: alice.cookie })
const bobMatches = await api('/api/social/matches', { cookie: bob.cookie })
if (!aliceMatches.response.ok || !bobMatches.response.ok) {
  throw new Error('matches endpoint failed')
}

const aliceMatch = aliceMatches.body.matches.find((item) => item.userId === bob.user.id)
const bobMatch = bobMatches.body.matches.find((item) => item.userId === alice.user.id)
if (!aliceMatch || !bobMatch) throw new Error('mutual match not found')

const request = await api('/api/social/requests', {
  method: 'POST',
  cookie: alice.cookie,
  body: JSON.stringify({
    recipientId: bob.user.id,
    message: 'Aynı tarihlerde Berlin’deyiz, tanışmak isterim.',
  }),
})
if (!request.response.ok) throw new Error(`request: ${JSON.stringify(request.body)}`)

const bobConnections = await api('/api/social/connections', { cookie: bob.cookie })
const incoming = bobConnections.body.incoming[0]
if (!incoming) throw new Error('incoming connection missing')

const accepted = await api(`/api/social/connections/${incoming.id}`, {
  method: 'PATCH',
  cookie: bob.cookie,
  body: JSON.stringify({ action: 'accept' }),
})
if (!accepted.response.ok) throw new Error(`accept: ${JSON.stringify(accepted.body)}`)

const message = await api(`/api/social/connections/${incoming.id}/messages`, {
  method: 'POST',
  cookie: alice.cookie,
  body: JSON.stringify({ body: 'Merhaba, müzeler için bir planın var mı?' }),
})
if (!message.response.ok) throw new Error(`message: ${JSON.stringify(message.body)}`)

const messages = await api(`/api/social/connections/${incoming.id}/messages`, { cookie: bob.cookie })
if (!messages.response.ok || messages.body.messages.length !== 1) throw new Error('messages missing')

const blocked = await api('/api/social/block', {
  method: 'POST',
  cookie: bob.cookie,
  body: JSON.stringify({ userId: alice.user.id }),
})
if (!blocked.response.ok) throw new Error(`block: ${JSON.stringify(blocked.body)}`)

const afterBlock = await api('/api/social/matches', { cookie: bob.cookie })
const blockedUserStillVisible = afterBlock.body.matches.some((match) => match.userId === alice.user.id)
if (blockedUserStillVisible) throw new Error('blocked user is still visible in matches')

console.log(JSON.stringify({
  alice: { email: alice.email, match: aliceMatch },
  bob: { email: bob.email, match: bobMatch },
  incoming: incoming.id,
  accepted: accepted.body.connection.status,
  message: messages.body.messages[0].body,
  block: blocked.body.ok,
  blockedUserStillVisible,
}, null, 2))
