import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig, type Connect, type Plugin } from 'vite';

function getServerConfig() {
  const serverUrl =
    process.env.SERVER_URL ||
    process.env.MEDIA_SERVER_URL ||
    process.env.JELLYFIN_URL ||
    'http://localhost:8096';
  const serverType = process.env.SERVER_TYPE || 'auto';

  if (serverType !== 'auto' && serverType !== 'emby' && serverType !== 'jellyfin') {
    throw new Error('Invalid SERVER_TYPE. Expected "auto", "emby", or "jellyfin".');
  }

  return { serverUrl, serverType };
}

function jellyfinConfigMiddleware(): Plugin {
  const serveConfig: Connect.NextHandleFunction = (request, response, next) => {
    if (request.url?.split('?')[0] !== '/config.json') {
      next();
      return;
    }

    response.statusCode = 200;
    response.setHeader('Content-Type', 'application/json; charset=utf-8');
    const config = getServerConfig();
    response.end(
      JSON.stringify({
        ...config,
        mediaServerUrl: config.serverUrl,
        jellyfinUrl: config.serverUrl
      })
    );
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
