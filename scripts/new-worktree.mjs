// Kısa adla izole bir git worktree açar: node scripts/new-worktree.mjs w-42-budget
import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'

const rawName = process.argv[2]
if (!rawName) {
  console.error('Kullanım: node scripts/new-worktree.mjs <kısa-ad> [branch]')
  process.exit(1)
}

const slug = rawName
  .toLowerCase()
  .replace(/[^a-z0-9-]+/g, '-')
  .replace(/^-+|-+$/g, '')

if (!slug) {
  console.error('Geçersiz worktree adı.')
  process.exit(1)
}

const branch = process.argv[3] ?? `feat/${slug}`
const target = resolve('..', `wayora-${slug}`)

if (existsSync(target)) {
  console.error(`Hedef zaten var: ${target}`)
  process.exit(1)
}

const branchExists =
  spawnSync('git', ['rev-parse', '--verify', branch], { stdio: 'ignore' }).status === 0

const args = ['worktree', 'add', target, ...(branchExists ? [branch] : ['-b', branch, 'main'])]
console.log(`git ${args.join(' ')}`)
const result = spawnSync('git', args, { stdio: 'inherit' })
process.exit(result.status ?? 1)
