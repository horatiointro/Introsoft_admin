import path from 'node:path';

const SERVER_ENTRYPOINTS = new Set(['server.ts', 'server.js', 'server.cjs']);

/** Production startup is allowed only when one of the supported server files is the process entrypoint. */
export function isServerEntrypoint(entrypoint: string | undefined): boolean {
  return typeof entrypoint === 'string' && SERVER_ENTRYPOINTS.has(path.basename(entrypoint.replace(/\\/g, '/')).toLowerCase());
}
