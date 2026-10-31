import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig, type Connect, type Plugin } from 'vite';

function jellyfinConfigMiddleware(): Plugin {
  const serveConfig: Connect.NextHandleFunction = (request, response, next) => {
    if (request.url?.split('?')[0] !== '/config.json') {
      next();
      return;
    }

    response.statusCode = 200;
    response.setHeader('Content-Type', 'application/json; charset=utf-8');
    response.end(JSON.stringify({
      jellyfinUrl: process.env.JELLYFIN_URL || 'http://localhost:8096'
    }));
  };

  return {
    name: 'jellytube-config',
    configureServer(server) {
      server.middlewares.use(serveConfig);
    },
    configurePreviewServer(server) {
      server.middlewares.use(serveConfig);
    }
  };
}

export default defineConfig({
  plugins: [svelte(), jellyfinConfigMiddleware()],
  server: {
    port: 5173,
    strictPort: false
  }
});
