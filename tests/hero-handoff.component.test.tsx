import { cleanup, fireEvent, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import Hero from '../src/components/Hero.tsx'

const rect = {
    x: 0,
    y: 0,
    top: 0,
    left: 0,
    right: 800,
    bottom: 800,
    width: 800,
    height: 800,
    toJSON: () => ({}),
}

let reducedMotion = false
let frameId = 0
let frames: FrameRequestCallback[] = []

const context = {
    clearRect: vi.fn(),
    drawImage: vi.fn(),
    fillRect: vi.fn(),
    setTransform: vi.fn(),
    globalAlpha: 1,
    fillStyle: '',
}

class TestResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
}

function flushFrames(now = performance.now()) {
    const pending = frames
    frames = []
    for (const callback of pending) callback(now)
}

beforeEach(() => {
    reducedMotion = false
    frameId = 0
    frames = []
    vi.clearAllMocks()
    vi.stubGlobal('ResizeObserver', TestResizeObserver)
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
        frames.push(callback)
        return ++frameId
    })
    vi.stubGlobal('cancelAnimationFrame', vi.fn())
    vi.stubGlobal('matchMedia', () => ({
        matches: reducedMotion,
        media: '(prefers-reduced-motion: reduce)',
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
    }))
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue(rect)
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
        context as unknown as CanvasRenderingContext2D,
    )
})

afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
})

function renderHero() {
    const result = render(
        <div data-testid="scroller">
            <section id="hero">
                <Hero
                    theme="dark"
                    seed={42}
                    onReseed={vi.fn()}
                    onLayout={vi.fn()}
                    onScrollNext={vi.fn()}
                />
            </section>
        </div>,
    )
    const scroller = result.getByTestId('scroller')
    Object.defineProperty(scroller, 'clientHeight', { configurable: true, value: 800 })
    Object.defineProperty(scroller.querySelector('#hero'), 'offsetTop', {
        configurable: true,
        value: 0,
    })
    const copy = result.getByRole('heading', { name: 'David Guerra' }).parentElement!
    const cue = result.getByRole('button', { name: 'scroll ↓' })
    flushFrames(100)
    return { ...result, scroller, copy, cue }
}

describe('Hero -> About hand-off', () => {
    test('scroll progress fades the copy and repaints the crumble wavefront', () => {
        const { scroller, copy, cue } = renderHero()
        context.clearRect.mockClear()
        context.drawImage.mockClear()
        context.fillRect.mockClear()

        scroller.scrollTop = 64
        fireEvent.scroll(scroller)
        flushFrames()

        const opacity = Number(copy.style.opacity)
        expect(opacity).toBeGreaterThan(0)
        expect(opacity).toBeLessThan(1)
        expect(cue.style.opacity).toBe(copy.style.opacity)
        expect(context.clearRect).toHaveBeenCalled()
        expect(context.fillRect).toHaveBeenCalled()
        expect(context.drawImage).not.toHaveBeenCalled()
    })

    test('reduced motion keeps scroll effects off and the hero copy fully visible', () => {
        reducedMotion = true
        const { scroller, copy, cue } = renderHero()

        scroller.scrollTop = 400
        fireEvent.scroll(scroller)
        flushFrames()

        expect(copy.style.opacity).toBe('1')
        expect(cue.style.opacity).toBe('1')
    })

    test('caps scroll-driven canvas paints at sixty frames per second', () => {
        const { scroller } = renderHero()

        scroller.scrollTop = 32
        fireEvent.scroll(scroller)
        flushFrames(100)
        context.clearRect.mockClear()

        scroller.scrollTop = 64
        fireEvent.scroll(scroller)
        flushFrames(108)

        expect(context.clearRect).not.toHaveBeenCalled()
        expect(frames).toHaveLength(1)

        flushFrames(116)
        expect(context.clearRect).toHaveBeenCalled()
        expect(frames).toHaveLength(0)
    })

    test('does not schedule another paint when clamped scroll progress is unchanged', () => {
        const { scroller } = renderHero()

        scroller.scrollTop = 800
        fireEvent.scroll(scroller)
        flushFrames(116)
        expect(frames).toHaveLength(0)

        fireEvent.scroll(scroller)
        expect(frames).toHaveLength(0)
    })
})
