import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { AgentChat } from './AgentChat'

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
})
