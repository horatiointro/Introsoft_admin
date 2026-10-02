import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import type { Server } from 'node:http';
import { canonicalClientIp } from './clientIp';

async function start(app: express.Express): Promise<Server> {
  return new Promise(resolve => {
    const server = app.listen(0, '127.0.0.1', () => resolve(server));
  });
}

async function stop(server: Server): Promise<void> {
  await new Promise<void>(resolve => server.close(() => resolve()));
}

test('canonical client IP normalizes IPv4-mapped IPv6 and ignores forwarded headers unless Express trusts a proxy', async () => {
  const app = express();
  app.get('/', (req, res) => res.json({ ip: canonicalClientIp(req) }));
  const server = await start(app);
  try {
    const address = server.address();
    assert.ok(address && typeof address !== 'string');
    const response = await fetch(`http://127.0.0.1:${address.port}/`, { headers: { 'x-forwarded-for': '203.0.113.99' } });
    const body = await response.json() as { ip: string };
    assert.equal(body.ip, '127.0.0.1');
  } finally {
    await stop(server);
  }
  assert.equal(canonicalClientIp({ ip: '::ffff:192.0.2.25', socket: { remoteAddress: '::ffff:192.0.2.25' } as never }), '192.0.2.25');
});

test('proxy-derived request IP is used only when the app explicitly trusts its proxy address', async () => {
  const app = express();
  app.set('trust proxy', ['127.0.0.1']);
  app.get('/', (req, res) => res.json({ ip: canonicalClientIp(req) }));
  const server = await start(app);
  try {
    const address = server.address();
    assert.ok(address && typeof address !== 'string');
    const response = await fetch(`http://127.0.0.1:${address.port}/`, { headers: { 'x-forwarded-for': '198.51.100.24' } });
    const body = await response.json() as { ip: string };
    assert.equal(body.ip, '198.51.100.24');
  } finally {
    await stop(server);
  }
});
