/**
 * Serve the built renderer assets from ../assets.
 *
 * Cache policy matters here. Vite emits two kinds of files:
 *   - `chunk/*.js` — content-hashed (`name-<version>-<hash>.js`), safe to cache
 *     forever, and they are the large ones;
 *   - `index.html`, `js/basic-<version>.js`, `js/vis-<version>.js`,
 *     `js/worker-<version>.js`, `css/style-<version>.css` — named after the app
 *     version only, NOT after their content.
 *
 * Caching the second group for a long time (this used to be a flat
 * `maxAge: 1 year`) breaks any rebuild that keeps the same version string: the
 * renderer keeps the previously cached entry bundle, that bundle asks for the
 * chunk names of the *previous* build, those files no longer exist, and the UI
 * silently fails to load its lazily imported views (404 on every chunk).
 * So only the content-hashed chunks are immutable; everything else revalidates.
 */

module.exports = (app) => {
  const express = require('express')
  const path = require('path')

  return new Promise((resolve) => {
    const assetsPath = path.resolve(__dirname, '../assets')
    const chunkDir = `${path.sep}chunk${path.sep}`

    // Handle _temp_*.css files - return empty CSS to prevent MIME type errors
    app.use((req, res, next) => {
      if (req.url.startsWith('/css/_temp_') && req.url.endsWith('.css')) {
        res.setHeader('Content-Type', 'text/css')
        res.send('')
        return
      }
      next()
    })

    app.use(
      express.static(assetsPath, {
        etag: true,
        lastModified: true,
        setHeaders: (res, filePath) => {
          if (filePath.includes(chunkDir)) {
            res.setHeader(
              'Cache-Control',
              'public, max-age=31536000, immutable'
            )
          } else {
            res.setHeader('Cache-Control', 'no-cache')
          }
        }
      })
    )

    resolve()
  })
}
