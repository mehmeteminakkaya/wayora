// Yerel Prisma Postgres'i (prisma dev) ayakta tutar. Daemon ara ara kendiliğinden
// durduğu için portu izler ve kapalıysa yeniden başlatır. `npm run dev` ile birlikte çalışır.
import { spawn } from 'node:child_process'
import { connect } from 'node:net'

const DB_PORT = 51214
const CHECK_MS = 6000
const START_COOLDOWN_MS = 15000

function isListening() {
  return new Promise((resolve) => {
    const socket = connect(DB_PORT, '127.0.0.1')
    socket.once('connect', () => {
      socket.end()
      resolve(true)
    })
    socket.once('error', () => resolve(false))
  })
}

function runNpm(script) {
  return new Promise((resolve) => {
    const child = spawn('npm', ['run', script, '-w', 'api'], {
      stdio: 'inherit',
      shell: true,
    })
    child.on('exit', () => resolve())
    child.on('error', () => resolve())
  })
}

function killHungDaemons() {
  return new Promise((resolve) => {
    if (process.platform !== 'win32') {
      resolve()
      return
    }
    // Asılı kalan daemon "Lock file is already being held" bırakıyor; süreci
    // öldürünce kilit serbest kalıyor. Port zaten kapalı olduğu için güvenli.
    const ps = spawn(
      'powershell',
      [
        '-NoProfile',
        '-Command',
        "Get-CimInstance Win32_Process -Filter \"Name='node.exe'\" | Where-Object { $_.CommandLine -match 'daemon.cjs' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }",
      ],
      { stdio: 'ignore' },
    )
    ps.on('exit', () => resolve())
    ps.on('error', () => resolve())
  })
}

async function startDb() {
  await killHungDaemons()
  await runNpm('db:stop')
  await runNpm('db:start')
}

let starting = false
let lastStart = 0

async function tick() {
  if (starting) return
  if (Date.now() - lastStart < START_COOLDOWN_MS) return
  if (await isListening()) return

  starting = true
  lastStart = Date.now()
  console.log('[db-watchdog] veritabanı kapalı görünüyor, yeniden başlatılıyor...')
  await startDb()
  starting = false
  console.log('[db-watchdog] başlatma denemesi bitti.')
}

console.log(`[db-watchdog] izleniyor: localhost:${DB_PORT} (her ${CHECK_MS / 1000}s)`)
await tick()
setInterval(() => {
  void tick()
}, CHECK_MS)
