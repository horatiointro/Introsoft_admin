import { createSign } from 'node:crypto';

type FirebaseServiceAccount = { project_id: string; client_email: string; private_key: string };
const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString('base64url');

export async function getFirebaseAccessToken(account: FirebaseServiceAccount): Promise<string> {
  if (!account.project_id || !account.client_email || !account.private_key) throw new Error('Firebase service account must include project_id, client_email and private_key.');
  const issued = Math.floor(Date.now()/1000); const head = encode({alg:'RS256',typ:'JWT'}); const claim = encode({iss:account.client_email,scope:'https://www.googleapis.com/auth/firebase.messaging',aud:'https://oauth2.googleapis.com/token',iat:issued,exp:issued+3600}); const unsigned = `${head}.${claim}`;
  const signature = createSign('RSA-SHA256').update(unsigned).sign(account.private_key).toString('base64url');
  const response = await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'urn:ietf:params:oauth:grant-type:jwt-bearer',assertion:`${unsigned}.${signature}`})});
  const result:any = await response.json(); if (!response.ok || !result.access_token) throw new Error(`Firebase authorization failed (${response.status}).`); return result.access_token;
}

export async function sendFirebaseMessage(account: FirebaseServiceAccount, accessToken: string, deviceToken: string, title: string, body: string, data: Record<string,string> = {}) {
  const response = await fetch(`https://fcm.googleapis.com/v1/projects/${encodeURIComponent(account.project_id)}/messages:send`,{method:'POST',headers:{Authorization:`Bearer ${accessToken}`,'Content-Type':'application/json'},body:JSON.stringify({message:{token:deviceToken,notification:{title,body},data}})});
  const result:any=await response.json().catch(()=>({})); if(!response.ok) throw new Error(`FCM delivery failed (${response.status}): ${result.error?.message||'provider rejected the message'}`); return result;
}
