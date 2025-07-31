import { initAttributesCache } from '$lib/server/db/attributes-mapping';
import { queue } from '$lib/server/queue';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { HonoAdapter } from '@bull-board/hono';
import { serveStatic } from '@hono/node-server/serve-static';
import { Hono } from 'hono';

await initAttributesCache();

const bullboard = (() => {
  const serverAdapter = new HonoAdapter(serveStatic);

  createBullBoard({
    queues: [new BullMQAdapter(queue, { readOnlyMode: false })],
    serverAdapter,
    options: {
      uiConfig: {
        boardTitle: 'Perfume Jobs'
      }
    }
  });
  const app = new Hono({ strict: false });
  const basePath = '/jobs';
  serverAdapter.setBasePath(basePath);
  app.route(basePath, serverAdapter.registerPlugin());

  return app;
})();

/**
 * @param {Parameters<import('@sveltejs/kit').Handle>[0]} input
 */
export const handle = async ({ event, resolve }) => {
  if (event.url.pathname.match(/^\/jobs($|\/)/)) {
    return bullboard.fetch(event.request);
  }

  return resolve(event);
};
