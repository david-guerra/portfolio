import assert from 'node:assert/strict'
import { readFileSync, statSync } from 'node:fs'
import test from 'node:test'

const ASSET_DIRECTORY = 'public/project-images'
const FULL_IMAGE_BUDGET = 350 * 1024
const THUMBNAIL_BUDGET = 60 * 1024
const ACTIVE_THEME_BUDGET = 2 * 1024 * 1024
const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])

const themedMedia = [
    ['browser-arcade-carousel', [1600, 900], false],
    ['arcade-gallery-01-hub', [1600, 1000], true],
    ['arcade-gallery-02-connect-four', [1600, 1000], true],
    ['arcade-gallery-03-sudoku', [820, 512], true],
    ['arcade-gallery-04-game-of-life', [1600, 1000], true],
] as const

function pngDimensions(filename: string): readonly [number, number] {
    const header = readFileSync(`${ASSET_DIRECTORY}/${filename}`).subarray(0, 24)
    assert.equal(header.length, 24, `${filename} has no complete PNG header`)
    assert.deepEqual(header.subarray(0, 8), PNG_SIGNATURE, `${filename} is not a PNG`)
    assert.equal(header.toString('ascii', 12, 16), 'IHDR', `${filename} has no IHDR chunk`)
    return [header.readUInt32BE(16), header.readUInt32BE(20)]
}

test('Arcade theme pairs are valid, dimension-matched PNGs within budget', () => {
    for (const theme of ['light', 'dark'] as const) {
        let activeThemeBytes = 0

        for (const [basename, expectedDimensions, hasThumbnail] of themedMedia) {
            const fullImage = `${basename}-${theme}.png`
            const fullImageBytes = statSync(`${ASSET_DIRECTORY}/${fullImage}`).size

            assert.deepEqual(pngDimensions(fullImage), expectedDimensions, fullImage)
            assert.ok(fullImageBytes <= FULL_IMAGE_BUDGET, `${fullImage} exceeds the full-image cap`)
            activeThemeBytes += fullImageBytes

            if (hasThumbnail) {
                const thumbnail = `${basename}-${theme}-thumbnail.png`
                const thumbnailBytes = statSync(`${ASSET_DIRECTORY}/${thumbnail}`).size

                assert.deepEqual(pngDimensions(thumbnail), [480, 300], thumbnail)
                assert.ok(
                    thumbnailBytes <= THUMBNAIL_BUDGET,
                    `${thumbnail} exceeds the thumbnail cap`,
                )
                activeThemeBytes += thumbnailBytes
            }
        }

        assert.ok(activeThemeBytes <= ACTIVE_THEME_BUDGET, `${theme} media set exceeds 2 MiB`)
        assert.equal(activeThemeBytes, theme === 'light' ? 622_589 : 610_943)
    }
})
