import { cleanup, render } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, expect, test, vi } from 'vitest'
import GameFrame from '../src/features/arcade/GameFrame.tsx'

afterEach(cleanup)

function renderGameFrame(actionZone?: ReactNode) {
    return render(
        <GameFrame
            title="TEST GAME"
            subtitle="A test game"
            status="READY"
            onBack={vi.fn()}
            sidebar={<div data-testid="sidebar-slot">Sidebar utilities</div>}
            actionZone={actionZone}
            mobileHelp="Tap to play"
            footer={<span>Footer help</span>}
        >
            <div data-testid="play-slot">Play surface</div>
        </GameFrame>,
    )
}

test('orders the compact frame as header, play surface, then sidebar utilities', () => {
    const { getByRole, getByTestId } = renderGameFrame()
    const header = getByRole('heading', { level: 2, name: 'TEST GAME' }).parentElement
    const playViewport = getByTestId('play-slot').parentElement
    const surface = getByTestId('play-slot').parentElement?.parentElement
    const sidebar = getByTestId('sidebar-slot').parentElement
    const layout = header?.parentElement

    expect(header).not.toBeNull()
    expect(playViewport).not.toBeNull()
    expect(surface).not.toBeNull()
    expect(sidebar).not.toBeNull()
    expect(Array.from(layout?.children ?? [])).toEqual([header, surface, sidebar])
    expect(sidebar?.classList).toContain('pb-[calc(1rem+env(safe-area-inset-bottom))]')

    const back = getByRole('button', { name: 'Back to Arcade' })
    expect(back.classList).toContain('min-h-11')
    expect(back.classList).toContain('min-w-11')
    expect(back.classList).toContain('wide:absolute')
    expect(layout?.classList).toContain('wide:mt-0')
    expect(playViewport?.classList).toContain('min-h-0')
    expect(playViewport?.classList).toContain('wide:[container-type:size]')
})

test('places one action zone last on compact screens and beneath the desktop play surface', () => {
    const { getByRole, getByTestId, getAllByTestId } = renderGameFrame(
        <div data-testid="action-slot">Game actions</div>,
    )
    const header = getByRole('heading', { level: 2, name: 'TEST GAME' }).parentElement
    const surface = getByTestId('play-slot').parentElement?.parentElement
    const sidebar = getByTestId('sidebar-slot').parentElement
    const actionZone = getByTestId('action-slot').parentElement
    const layout = header?.parentElement

    expect(Array.from(layout?.children ?? [])).toEqual([header, surface, sidebar, actionZone])
    expect(getAllByTestId('sidebar-slot')).toHaveLength(1)
    expect(getAllByTestId('action-slot')).toHaveLength(1)
    expect(sidebar?.classList).not.toContain(
        'pb-[calc(1rem+env(safe-area-inset-bottom))]',
    )
    expect(actionZone?.classList).toContain(
        'pb-[calc(1rem+env(safe-area-inset-bottom))]',
    )
    expect(actionZone?.classList).toContain('wide:pb-0')

    expect(layout?.classList).toContain('wide:grid-cols-[340px_minmax(0,1fr)]')
    expect(layout?.classList).toContain('wide:grid-rows-[auto_minmax(0,1fr)_auto]')
    expect(header?.classList).toContain('wide:col-start-1')
    expect(header?.classList).toContain('wide:row-start-1')
    expect(header?.classList).toContain('wide:border-r')
    expect(surface?.classList).toContain('wide:col-start-2')
    expect(surface?.classList).toContain('wide:row-span-2')
    expect(surface?.classList).toContain('wide:row-start-1')
    expect(sidebar?.classList).toContain('wide:col-start-1')
    expect(sidebar?.classList).toContain('wide:row-span-2')
    expect(sidebar?.classList).toContain('wide:row-start-2')
    expect(sidebar?.classList).toContain('wide:border-r')
    expect(actionZone?.classList).toContain('wide:col-start-2')
    expect(actionZone?.classList).toContain('wide:row-start-3')
})
