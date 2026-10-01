import { appendFile, mkdir, readFile, readdir, stat } from 'node:fs/promises';
import { AsyncLocalStorage } from 'node:async_hooks';
import path from 'node:path';
import { makeAltilEvent, type AltilEvent, type EventEnvironment, type NewAltilEvent } from './eventModel.ts';

export interface EventLoggerConfiguration {
  environment: EventEnvironment;
  testRunId?: string;
  localLogFile?: string;
  persist?: (event: AltilEvent) => Promise<void>;
}

let configuration: EventLoggerConfiguration = {
  environment: process.env.NODE_ENV === 'production' ? 'production' : 'development',
};
const requestContext = new AsyncLocalStorage<string>();

export function runWithEventRequestId<T>(requestId: string, operation: () => T): T {
  return requestContext.run(requestId, operation);
}

/** Build an event for insertion into a caller-owned transaction (for atomic audit). */
export function makeCurrentAltilEvent(input: NewAltilEvent): AltilEvent {
  return makeAltilEvent({ ...input, requestId: input.requestId || requestContext.getStore() }, { environment: configuration.environment, testRunId: configuration.testRunId });
}

/** Append an event whose durable database row was committed by the caller's transaction. */
export async function appendDurablyPersistedEvent(event: AltilEvent): Promise<void> {
  if (!configuration.localLogFile) return;
  const expectedRoot = path.resolve('.altil-data', 'logs') + path.sep;
  if (!path.resolve(configuration.localLogFile).startsWith(expectedRoot)) throw new Error('LOCAL E2E log files must stay under .altil-data/logs.');
  await mkdir(path.dirname(configuration.localLogFile), { recursive: true });
  await appendFile(configuration.localLogFile, `${JSON.stringify(event)}\n`, { encoding: 'utf8', mode: 0o600 });
}

export function configureEventLogger(next: EventLoggerConfiguration): void {
  if (next.environment === 'local-test') {
    if (!next.testRunId || !/^[A-Za-z0-9_-]{8,80}$/.test(next.testRunId)) throw new Error('LOCAL E2E logging requires a valid testRunId.');
    if (!next.localLogFile) throw new Error('LOCAL E2E logging requires a local log file.');
    const expectedRoot = path.resolve('.altil-data', 'logs') + path.sep;
    if (!path.resolve(next.localLogFile).startsWith(expectedRoot)) throw new Error('LOCAL E2E log files must stay under .altil-data/logs.');
    if (!next.persist) throw new Error('LOCAL E2E logging requires database persistence.');
  }
  configuration = next;
}

export async function emitAltilEvent(input: NewAltilEvent): Promise<AltilEvent> {
  const event = makeAltilEvent({ ...input, requestId: input.requestId || requestContext.getStore() }, { environment: configuration.environment, testRunId: configuration.testRunId });
  const serialized = `${JSON.stringify(event)}\n`;
  if (configuration.localLogFile) {
    await mkdir(path.dirname(configuration.localLogFile), { recursive: true });
    await appendFile(configuration.localLogFile, serialized, { encoding: 'utf8', mode: 0o600 });
  }
  if (configuration.persist) {
    try { await configuration.persist(event); }
    catch (error) {
      console.error(JSON.stringify({ event: 'event_persistence_failed', eventId: event.id, category: event.category, environment: event.environment, testRunId: event.testRunId }));
      throw error;
    }
  }
  else if (configuration.environment === 'production') {
    console.error(JSON.stringify({ event: 'event_persistence_unavailable', eventId: event.id, category: event.category }));
  } else {
    console.info(serialized.trimEnd());
  }
  return event;
}

export async function readLocalEventFile(filePath = configuration.localLogFile): Promise<AltilEvent[]> {
  if (!filePath) return [];
  try {
    const contents = await readFile(filePath, 'utf8');
    return contents.split(/\r?\n/).filter(Boolean).flatMap(line => {
      try {
        const event = JSON.parse(line) as AltilEvent;
        return event.schemaVersion === 1 && typeof event.id === 'string' && typeof event.timestamp === 'string' ? [event] : [];
      } catch { return []; }
    });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return [];
    throw error;
  }
}

export async function readLocalEventDirectory(directory = path.resolve('.altil-data', 'logs')): Promise<AltilEvent[]> {
  let files: string[];
  try { files = await readdir(directory); }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return [];
    throw error;
  }
  const cutoff = Date.now() - 5 * 24 * 60 * 60 * 1000;
  const eligible: string[] = [];
  for (const file of files.filter(file => /^events-[A-Za-z0-9_-]{8,80}\.ndjson$/.test(file))) {
    const filePath = path.join(directory, file);
    try {
      const metadata = await stat(filePath);
      if (metadata.mtimeMs >= cutoff) eligible.push(filePath);
    } catch { /* File may have been rotated between listing and stat. */ }
  }
  const records = await Promise.all(eligible.map(file => readLocalEventFile(file)));
  return records.flat().filter(event => Date.parse(event.timestamp) >= cutoff).sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp));
}

export function currentEventLoggerEnvironment(): EventEnvironment {
  return configuration.environment;
}
