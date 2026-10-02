import type { Request } from 'express';
import { isIP } from 'node:net';

/**
 * Returns Express's proxy-aware client address. Forwarded headers are only
 * considered when server.ts has explicitly configured trusted proxy CIDRs.
 */
export function canonicalClientIp(req: Pick<Request, 'ip' | 'socket'>): string {
  const address = String(req.ip || req.socket.remoteAddress || 'unknown').trim();
  const mappedV4 = address.match(/^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i);
  if (mappedV4 && isIP(mappedV4[1]) === 4) return mappedV4[1];
  return address;
}
