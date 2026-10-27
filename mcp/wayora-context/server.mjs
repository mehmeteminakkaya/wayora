#!/usr/bin/env node
// Wayora Context MCP sunucusu — stdio transport.
// Agent'a canlı API durumu, yer arama, gezi planı ve repo dokümanlarını araç olarak açar.
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { readFile, readdir } from 'node:fs/promises'
import { dirname, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { z } from 'zod'

const API_URL = process.env.WAYORA_API_URL ?? 'http://localhost:4000'
const COOKIE = process.env.WAYORA_COOKIE ?? ''
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const DOCS_DIR = resolve(ROOT, 'docs')

async function callApi(path, init = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      ...(COOKIE ? { cookie: COOKIE } : {}),
      ...(init.body ? { 'content-type': 'application/json' } : {}),
      ...init.headers,
    },
  })
  const text = await response.text()
  let body
  try {
    body = JSON.parse(text)
  } catch {
    body = text
  }
  if (!response.ok) {
    throw new Error(`API ${response.status}: ${typeof body === 'string' ? body : JSON.stringify(body)}`)
  }
  return body
}

function textResult(value) {
  return { content: [{ type: 'text', text: JSON.stringify(value, null, 2) }] }
}

function errorResult(error) {
  return {
    isError: true,
    content: [{ type: 'text', text: `Wayora Context hatası: ${error instanceof Error ? error.message : String(error)}` }],
  }
}

async function listMarkdown(dir) {
  const entries = await readdir(dir, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const full = resolve(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...(await listMarkdown(full)))
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      files.push(relative(ROOT, full).split(sep).join('/'))
    }
  }
  return files.sort()
}

const server = new McpServer({
  name: 'wayora-context',
  version: '1.0.0',
})

server.registerTool(
  'get_health',
  {
    title: 'Wayora API sağlık durumu',
    description: 'API ve veritabanının çalışıp çalışmadığını döner.',
    inputSchema: {},
  },
  async () => {
    try {
      return textResult(await callApi('/api/health'))
    } catch (error) {
      return errorResult(error)
    }
  },
)

server.registerTool(
  'search_places',
  {
    title: 'Yer ara',
    description:
      'Wayora yer kataloğunda arama yapar. destination verilirse o şehirde arar. Oturum çerezi gerekir.',
    inputSchema: {
      query: z.string().describe('Aranan yer adı veya anahtar kelime'),
      destination: z.string().optional().describe('Şehir adı (ör. Paris)'),
    },
  },
  async ({ query, destination }) => {
    try {
      const params = new URLSearchParams({ q: query })
      if (destination) params.set('destination', destination)
      return textResult(await callApi(`/api/places/search?${params.toString()}`))
    } catch (error) {
      return errorResult(error)
    }
  },
)

server.registerTool(
  'get_trip',
  {
    title: 'Gezi planını getir',
    description: 'Kimliği verilen gezinin gün gün planını döner. Oturum çerezi gerekir.',
    inputSchema: {
      tripId: z.string().uuid().describe('Gezi kimliği'),
    },
  },
  async ({ tripId }) => {
    try {
      return textResult(await callApi(`/api/trips/${tripId}`))
    } catch (error) {
      return errorResult(error)
    }
  },
)

server.registerTool(
  'list_docs',
  {
    title: 'Dokümanları listele',
    description: 'docs/ altındaki markdown dosyalarını göreli yollarla listeler.',
    inputSchema: {},
  },
  async () => {
    try {
      return textResult({ docs: await listMarkdown(DOCS_DIR) })
    } catch (error) {
      return errorResult(error)
    }
  },
)

server.registerTool(
  'read_doc',
  {
    title: 'Doküman oku',
    description: 'docs/ altındaki bir markdown dosyasını okur. Yol docs/ dışına çıkamaz.',
    inputSchema: {
      path: z.string().describe('docs/ içindeki göreli yol, ör. specs/001-mvp/spec.md'),
    },
  },
  async ({ path }) => {
    try {
      const requested = resolve(DOCS_DIR, path)
      const relativePath = relative(DOCS_DIR, requested)
      if (relativePath.startsWith('..') || relativePath.includes(`..${sep}`) || !relativePath.endsWith('.md')) {
        throw new Error('Yalnızca docs/ altındaki markdown dosyaları okunabilir')
      }
      const content = await readFile(requested, 'utf8')
      return textResult({ path: `docs/${relativePath.split(sep).join('/')}`, content })
    } catch (error) {
      return errorResult(error)
    }
  },
)

const transport = new StdioServerTransport()
await server.connect(transport)
console.error(`Wayora Context MCP çalışıyor — API: ${API_URL}`)
