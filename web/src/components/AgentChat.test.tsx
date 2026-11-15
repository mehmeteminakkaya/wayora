import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AgentChat } from './AgentChat'

afterEach(() => vi.unstubAllGlobals())

describe('AgentChat', () => {
  it('sohbeti açar, odağı mesaj alanına verir ve Escape ile kapatır', () => {
    render(
      <MemoryRouter>
        <AgentChat />
      </MemoryRouter>,
    )

    const trigger = screen.getByRole('button', { name: 'Wayora Agent sohbetini aç' })
    fireEvent.click(trigger)

    expect(screen.getByRole('dialog', { name: 'Wayora Agent' })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Mesajın' })).toHaveFocus()

    fireEvent.keyDown(document, { key: 'Escape' })

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Wayora Agent sohbetini aç' })).toHaveFocus()
  })

  it('mesajı gönderir, yanıtı ve site içi eylemi gösterir', async () => {
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => {
      return new Response(
        JSON.stringify({
          reply: 'Berlin sayfasını açabilirsin.',
          actions: [{ kind: 'navigate', label: 'Şehri aç', path: '/kesfet/berlin' }],
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      )
    })
    vi.stubGlobal('fetch', fetchMock)

    render(
      <MemoryRouter>
        <AgentChat />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Wayora Agent sohbetini aç' }))
    fireEvent.change(screen.getByRole('textbox', { name: 'Mesajın' }), {
      target: { value: 'Berlin için ne var?' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Gönder' }))

    expect(await screen.findByText('Berlin sayfasını açabilirsin.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Şehri aç/ })).toHaveAttribute(
      'href',
      '/kesfet/berlin',
    )
    expect(screen.getByText('Berlin için ne var?')).toBeInTheDocument()

    const body = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body))
    expect(body.messages.at(-1)).toEqual({
      role: 'user',
      content: 'Berlin için ne var?',
    })

    fireEvent.click(screen.getByRole('button', { name: 'Yeni sohbet başlat' }))
    expect(screen.queryByText('Berlin için ne var?')).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Şehri aç/ })).not.toBeInTheDocument()
    expect(screen.getByText(/Merhaba! Ben Wayora Agent/)).toBeInTheDocument()
  })

  it('API hatasını sohbet içinde eyleme dönük gösterir', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        return new Response(
          JSON.stringify({
            error: { code: 'AGENT_FAILED', message: 'Asistan şu an yanıt veremiyor. Tekrar dene.' },
          }),
          { status: 502, headers: { 'content-type': 'application/json' } },
        )
      }),
    )

    render(
      <MemoryRouter>
        <AgentChat />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Wayora Agent sohbetini aç' }))
    fireEvent.change(screen.getByRole('textbox', { name: 'Mesajın' }), {
      target: { value: 'Merhaba' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Gönder' }))

    expect(
      await screen.findByText('Asistan şu an yanıt veremiyor. Tekrar dene.'),
    ).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Mesajın' })).toBeEnabled()
  })
})
