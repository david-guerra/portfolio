import assert from 'node:assert/strict'
import test from 'node:test'
import { activeSection, sectionTargetIndex } from '../src/lib/sections.ts'

const VIEWPORT = 800

test('hero and about panes both light the About nav item', () => {
    assert.equal(activeSection(0, VIEWPORT), 'about')
    assert.equal(activeSection(VIEWPORT, VIEWPORT), 'about')
})

test('third pane lights Projects, fourth lights Arcade', () => {
    assert.equal(activeSection(VIEWPORT * 2, VIEWPORT), 'projects')
    assert.equal(activeSection(VIEWPORT * 3, VIEWPORT), 'arcade')
})

test('mid-scroll snaps to the nearest pane', () => {
    assert.equal(activeSection(VIEWPORT * 1.4, VIEWPORT), 'about')
    assert.equal(activeSection(VIEWPORT * 1.6, VIEWPORT), 'projects')
})

test('overscroll past the last pane stays on Arcade', () => {
    assert.equal(activeSection(VIEWPORT * 9, VIEWPORT), 'arcade')
})

test('degenerate viewport height falls back to About', () => {
    assert.equal(activeSection(0, 0), 'about')
})

test('nav targets: About goes to the hero pane, others to their own', () => {
    assert.equal(sectionTargetIndex('about'), 0)
    assert.equal(sectionTargetIndex('projects'), 2)
    assert.equal(sectionTargetIndex('arcade'), 3)
})
