import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// public/previous holds a built copy of the earlier design (git tag design-v1) so the two can be
// compared side by side. Without this, the dev and preview servers answer /previous/ with the
// current app instead of the saved copy.
function previousDesign() {
  const rewrite = (server) => {
    server.middlewares.use((request, _response, next) => {
      if (request.url === '/previous' || request.url === '/previous/') request.url = '/previous/index.html'
      next()
    })
  }
  return { name: 'previous-design', configureServer: rewrite, configurePreviewServer: rewrite }
}

export default defineConfig({ plugins: [react(), previousDesign()] })
