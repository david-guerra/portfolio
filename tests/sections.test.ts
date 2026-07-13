import assert from 'node:assert/strict'
import test from 'node:test'
import { activeSection, sectionTargetIndex } from '../src/lib/sections.ts'

const VIEWPORT = 800

test('hero pane lights no nav item', () => {
    assert.equal(activeSection(0, VIEWPORT), null)
})

test('each section pane lights its own nav item', () => {
    assert.equal(activeSection(VIEWPORT, VIEWPORT), 'about')
    assert.equal(activeSection(VIEWPORT * 2, VIEWPORT), 'projects')
    assert.equal(activeSection(VIEWPORT * 3, VIEWPORT), 'arcade')
})

test('mid-scroll snaps to the nearest pane', () => {
    assert.equal(activeSection(VIEWPORT * 0.4, VIEWPORT), null)
    assert.equal(activeSection(VIEWPORT * 0.6, VIEWPORT), 'about')
})

test('overscroll past the last pane stays on Arcade', () => {
    assert.equal(activeSection(VIEWPORT * 9, VIEWPORT), 'arcade')
})

test('degenerate viewport height falls back to the hero state', () => {
    assert.equal(activeSection(0, 0), null)
})

test('nav targets: every section scrolls to its own pane', () => {
    assert.equal(sectionTargetIndex('about'), 1)
    assert.equal(sectionTargetIndex('projects'), 2)
    assert.equal(sectionTargetIndex('arcade'), 3)
})
