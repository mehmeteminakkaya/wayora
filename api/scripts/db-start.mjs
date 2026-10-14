// Yerel Postgres'i (prisma dev) başlatır; port zaten dinleniyorsa hiçbir şey yapmaz.
// prisma dev, başka bir terminalden açılmış sunucuyu her zaman tanımıyor ve "Port ... is not available" ile düşüyor.
import { spawnSync } from 'node:child_process'
import { connect } from 'node:net'

const DB_PORT = 51214

const isListening = () =>
  new Promise((resolve) => {
    const socket = connect(DB_PORT, '127.0.0.1')
    socket.once('connect', () => (socket.end(), resolve(true)))
    socket.once('error', () => resolve(false))
  })

if (await isListening()) {
  console.log(`Yerel veritabanı zaten çalışıyor (localhost:${DB_PORT}).`)
} else {
  const result = spawnSync('npx', ['prisma', 'dev', '--name', 'wayora', '--detach'], {
    stdio: 'inherit',
    shell: true,
  })
  process.exit(result.status ?? 1)
}
