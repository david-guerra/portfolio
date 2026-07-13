import assert from 'node:assert/strict'
import test from 'node:test'
import { resolveInitialTheme, toggleTheme } from '../src/lib/theme.ts'

test('defaults to dark when nothing is stored', () => {
    assert.equal(resolveInitialTheme(null), 'dark')
})

test('restores a stored light choice', () => {
    assert.equal(resolveInitialTheme('light'), 'light')
})

test('restores a stored dark choice', () => {
    assert.equal(resolveInitialTheme('dark'), 'dark')
})

test('falls back to dark on garbage storage values', () => {
    assert.equal(resolveInitialTheme('solarized'), 'dark')
    assert.equal(resolveInitialTheme(''), 'dark')
})

test('toggle flips between the two themes', () => {
    assert.equal(toggleTheme('dark'), 'light')
    assert.equal(toggleTheme('light'), 'dark')
})
