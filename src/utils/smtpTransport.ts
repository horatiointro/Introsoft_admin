import net from 'node:net';
import tls from 'node:tls';

type SmtpConfig = { host: string; port: number; secure?: boolean; username?: string; password?: string; from: string };
type Socket = net.Socket | tls.TLSSocket;

/** Small SMTP client for ALTIL's transactional mail path; credentials must be decrypted only in memory. */
export async function sendSmtpMail(config: SmtpConfig, to: string[], subject: string, text: string) {
  if (!config.host || !config.port || !config.from || !to.length) throw new Error('SMTP host, port, sender and recipients are required.');
  let socket: Socket = await new Promise((resolve, reject) => {
    const connection = config.secure ? tls.connect({ host: config.host, port: config.port, servername: config.host }, () => resolve(connection)) : net.connect({ host: config.host, port: config.port }, () => resolve(connection));
    connection.setTimeout(15000, () => { connection.destroy(new Error('SMTP connection timed out.')); });
    connection.once('error', reject);
  });
  let buffer = '';
  let pending: { resolve: (response: string) => void; reject: (error: Error) => void } | null = null;
  let responses: string[] = [];
  const completed: string[] = [];
  const onData = (chunk: Buffer) => {
    buffer += chunk.toString('utf8');
    const lines = buffer.split(/\r?\n/); buffer = lines.pop() || '';
    for (const line of lines) {
      responses.push(line);
      if (/^\d{3} /.test(line)) { const value=responses.join('\n'); responses=[]; if(pending){const current=pending;pending=null;current.resolve(value);}else completed.push(value); }
    }
  };
  socket.on('data', onData);
  const expect = (codes: number[]) => new Promise<string>((resolve, reject) => {
    if (pending) return reject(new Error('SMTP response state is busy.'));
    const check=(response:string)=>{const code=Number(response.slice(0,3));codes.includes(code)?resolve(response):reject(new Error(`SMTP ${code}: ${response.slice(4,300)}`));};
    if(completed.length){check(completed.shift()!);return;}
    pending = { resolve: check, reject };
  });
  const command = async (value: string, codes: number[]) => { const response = expect(codes); socket.write(`${value}\r\n`); return response; };
  try {
    await expect([220]); await command('EHLO altil.introsoft.com', [250]);
    if (!config.secure) {
      await command('STARTTLS', [220]); socket.off('data', onData);
      socket = await new Promise<tls.TLSSocket>((resolve, reject) => { const secureSocket = tls.connect({ socket: socket as net.Socket, servername: config.host }, () => resolve(secureSocket)); secureSocket.once('error', reject); });
      buffer = ''; responses = []; completed.length=0; socket.on('data', onData); await command('EHLO altil.introsoft.com', [250]);
    }
    if (config.username) { await command('AUTH LOGIN', [334]); await command(Buffer.from(config.username).toString('base64'), [334]); await command(Buffer.from(config.password || '').toString('base64'), [235]); }
    const fromMatch=config.from.match(/<([^<>\r\n]+)>/);const envelopeFrom=(fromMatch?.[1]||config.from).trim().replace(/[<>\s\r\n]/g,'');const fromHeader=config.from.replace(/[\r\n]/g,' ').slice(0,240);
    await command(`MAIL FROM:<${envelopeFrom}>`, [250]);
    for (const recipient of to) await command(`RCPT TO:<${recipient.replace(/[<>\r\n]/g, '')}>`, [250, 251]);
    await command('DATA', [354]);
    const safeSubject = subject.replace(/[\r\n]/g, ' ').slice(0, 200);
    const safeBody = text.replace(/\r?\n/g, '\r\n').replace(/^\./gm, '..');
    const dataResponse = expect([250]); socket.write(`From: ${fromHeader}\r\nTo: ${to.join(', ')}\r\nSubject: ${safeSubject}\r\nMIME-Version: 1.0\r\nContent-Type: text/plain; charset=utf-8\r\nContent-Transfer-Encoding: 8bit\r\n\r\n${safeBody}\r\n.\r\n`); await dataResponse;
    await command('QUIT', [221]);
  } finally { socket.removeListener('data', onData); socket.end(); }
}

export async function testSmtpConnection(config: Pick<SmtpConfig, 'host'|'port'|'secure'>) {
  const socket = config.secure ? tls.connect({host:config.host,port:config.port,servername:config.host}) : net.connect({host:config.host,port:config.port});
  await new Promise<void>((resolve,reject)=>{socket.once(config.secure?'secureConnect':'connect',()=>resolve());socket.once('error',reject);socket.setTimeout(8000,()=>{socket.destroy();reject(new Error('SMTP connection timed out.'));});});
  socket.end();
}
