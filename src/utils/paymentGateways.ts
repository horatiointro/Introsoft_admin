import { createHash, createHmac, randomUUID } from 'node:crypto';

export type PaymentProvider = 'stripe' | 'payfast' | 'ikhokha';
export type CheckoutRequest = { id: string; tenantId: string; invoiceId?: string; invoiceNumber: string; amount: number; currency: string; email: string; description: string; returnUrl: string; cancelUrl: string; notifyUrl: string };

const required = (value: string | undefined, name: string) => { if (!value) throw new Error(`${name} is not configured.`); return value; };
const encode = (value: string) => encodeURIComponent(value).replace(/%20/g, '+').replace(/[!'()*]/g, character => `%${character.charCodeAt(0).toString(16).toUpperCase()}`);

export async function createHostedPayment(provider: PaymentProvider, payment: CheckoutRequest) {
  if (payment.currency !== 'ZAR' && provider !== 'stripe') throw new Error(`${provider} hosted checkout is currently available for ZAR only.`);
  const amountCents = Math.round(payment.amount * 100);
  if (amountCents < 1) throw new Error('Payment amount must be greater than zero.');
  if (provider === 'stripe') {
    const secret = required(process.env.STRIPE_SECRET_KEY, 'STRIPE_SECRET_KEY');
    const params = new URLSearchParams({ mode: 'payment', success_url: `${payment.returnUrl}?payment=success&reference=${payment.id}`, cancel_url: `${payment.cancelUrl}?payment=cancelled&reference=${payment.id}`, customer_email: payment.email, 'line_items[0][quantity]': '1', 'line_items[0][price_data][currency]': payment.currency.toLowerCase(), 'line_items[0][price_data][unit_amount]': String(amountCents), 'line_items[0][price_data][product_data][name]': payment.description, 'metadata[paymentIntentId]': payment.id, 'metadata[tenantId]': payment.tenantId, 'metadata[invoiceId]': payment.invoiceId || '' });
    const response = await fetch('https://api.stripe.com/v1/checkout/sessions', { method: 'POST', headers: { Authorization: `Bearer ${secret}`, 'Content-Type': 'application/x-www-form-urlencoded' }, body: params });
    const data = await response.json() as any; if (!response.ok || !data.url) throw new Error(data.error?.message || 'Stripe checkout could not be created.');
    return { checkoutUrl: data.url as string, providerReference: data.id as string };
  }
  if (provider === 'payfast') {
    const merchantId = required(process.env.PAYFAST_MERCHANT_ID, 'PAYFAST_MERCHANT_ID');
    const merchantKey = required(process.env.PAYFAST_MERCHANT_KEY, 'PAYFAST_MERCHANT_KEY');
    const host = process.env.PAYFAST_SANDBOX === 'true' ? 'https://sandbox.payfast.co.za/eng/process' : 'https://www.payfast.co.za/eng/process';
    const fields: Record<string, string> = { merchant_id: merchantId, merchant_key: merchantKey, return_url: payment.returnUrl, cancel_url: payment.cancelUrl, notify_url: payment.notifyUrl, name_first: payment.email.split('@')[0].slice(0, 100), email_address: payment.email, m_payment_id: payment.id, amount: payment.amount.toFixed(2), item_name: payment.invoiceNumber.slice(0, 100), item_description: payment.description.slice(0, 255), custom_str1: payment.tenantId, custom_str2: payment.invoiceId || '' };
    const pairs = Object.entries(fields).filter(([, value]) => value !== '').map(([key, value]) => `${key}=${encode(value.trim())}`);
    const passphrase = process.env.PAYFAST_PASSPHRASE; if (passphrase) pairs.push(`passphrase=${encode(passphrase.trim())}`);
    fields.signature = createHash('md5').update(pairs.join('&')).digest('hex');
    return { checkoutUrl: `${host}?${new URLSearchParams(fields).toString()}`, providerReference: payment.id };
  }
  const appId = required(process.env.IKHOKHA_APP_ID, 'IKHOKHA_APP_ID');
  const appSecret = required(process.env.IKHOKHA_APP_SECRET, 'IKHOKHA_APP_SECRET');
  const endpoint = process.env.IKHOKHA_API_URL || 'https://api.ikhokha.com/public-api/v1/api/payment';
  const callbackUrl = payment.notifyUrl;
  const payload = { entityID: appId, externalEntityID: payment.tenantId, amount: amountCents, currency: 'ZAR', requesterUrl: payment.returnUrl, mode: process.env.IKHOKHA_MODE || 'live', description: payment.description.slice(0, 255), paymentReference: payment.invoiceNumber.slice(0, 100), externalTransactionID: payment.id, urls: { callbackUrl, successPageUrl: payment.returnUrl, failurePageUrl: payment.cancelUrl, cancelUrl: payment.cancelUrl } };
  const body = JSON.stringify(payload); const path = new URL(endpoint).pathname;
  const signed = `${path}${body}`.replace(/[\\"']/g, '\\$&').replace(/\u0000/g, '\\0');
  const signature = createHmac('sha256', appSecret.trim()).update(signed).digest('hex');
  const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'IK-APPID': appId, 'IK-SIGN': signature }, body });
  const data = await response.json() as any; const url = data.paylinkUrl || data.paymentUrl || data.url;
  if (!response.ok || typeof url !== 'string') throw new Error(data.message || `iKhokha payment link could not be created (HTTP ${response.status}).`);
  return { checkoutUrl: url, providerReference: String(data.paylinkID || payment.id) };
}

export async function createPaymentMethodSetup(provider:PaymentProvider,tenantId:string,email:string,setupId:string,returnUrl:string,notifyUrl:string){
  if(provider==='ikhokha')throw new Error('The published iKhokha iK Pay API provides hosted payment links; its current public guide does not document card-token vaulting for automatic recurring/threshold debits. Use iKhokha for one-time invoice checkout, or select Stripe/PayFast for a separately consented card mandate.');
  if(provider==='stripe'){
    const secret=required(process.env.STRIPE_SECRET_KEY,'STRIPE_SECRET_KEY');const params=new URLSearchParams({mode:'setup',success_url:`${returnUrl}?payment_method=connected`,cancel_url:`${returnUrl}?payment_method=cancelled`,'customer_email':email,'metadata[tenantId]':tenantId,'metadata[paymentMethodSetupId]':setupId,'metadata[purpose]':'payment_method_setup','setup_intent_data[metadata][tenantId]':tenantId,'setup_intent_data[metadata][paymentMethodSetupId]':setupId});const response=await fetch('https://api.stripe.com/v1/checkout/sessions',{method:'POST',headers:{Authorization:`Bearer ${secret}`,'Content-Type':'application/x-www-form-urlencoded'},body:params});const data=await response.json() as any;if(!response.ok||!data.url)throw new Error(data.error?.message||'Stripe mandate setup could not be created.');return{checkoutUrl:data.url as string,providerReference:data.id as string};
  }
  const merchantId=required(process.env.PAYFAST_MERCHANT_ID,'PAYFAST_MERCHANT_ID'),merchantKey=required(process.env.PAYFAST_MERCHANT_KEY,'PAYFAST_MERCHANT_KEY');const host=process.env.PAYFAST_SANDBOX==='true'?'https://sandbox.payfast.co.za/eng/process':'https://www.payfast.co.za/eng/process';const fields:Record<string,string>={merchant_id:merchantId,merchant_key:merchantKey,return_url:returnUrl,cancel_url:returnUrl,notify_url:notifyUrl,name_first:email.split('@')[0].slice(0,100),email_address:email,m_payment_id:setupId,amount:'0.00',item_name:'ALTIL saved payment method',item_description:'Customer-authorised card token setup',subscription_type:'2',custom_str1:tenantId,custom_str2:setupId,custom_str3:'payment_method_setup'};const pairs=Object.entries(fields).map(([key,value])=>`${key}=${encode(value.trim())}`);const passphrase=process.env.PAYFAST_PASSPHRASE;if(passphrase)pairs.push(`passphrase=${encode(passphrase.trim())}`);fields.signature=createHash('md5').update(pairs.join('&')).digest('hex');return{checkoutUrl:`${host}?${new URLSearchParams(fields).toString()}`,providerReference:setupId};
}

export async function chargeSavedPaymentMethod(provider:PaymentProvider,providerToken:string,amount:number,currency:string,reference:string){
  const cents=Math.round(amount*100);if(cents<1)throw new Error('Automatic collection amount must be positive.');
  if(provider==='stripe'){const secret=required(process.env.STRIPE_SECRET_KEY,'STRIPE_SECRET_KEY');const token=JSON.parse(providerToken) as {customer:string;paymentMethod:string};const params=new URLSearchParams({amount:String(cents),currency:currency.toLowerCase(),customer:token.customer,payment_method:token.paymentMethod,confirm:'true',off_session:'true',description:`ALTIL usage collection ${reference}`});const response=await fetch('https://api.stripe.com/v1/payment_intents',{method:'POST',headers:{Authorization:`Bearer ${secret}`,'Content-Type':'application/x-www-form-urlencoded','Idempotency-Key':reference},body:params});const data=await response.json() as any;if(!response.ok||data.status!=='succeeded')throw new Error(data.error?.message||`Stripe collection status: ${data.status||response.status}`);return{providerReference:String(data.id),capturedAmount:amount};}
  if(provider==='payfast'){if(currency!=='ZAR')throw new Error('PayFast token collection currently supports ZAR-denominated mandates only.');const merchantId=required(process.env.PAYFAST_MERCHANT_ID,'PAYFAST_MERCHANT_ID'),passphrase=required(process.env.PAYFAST_PASSPHRASE,'PAYFAST_PASSPHRASE');const token=providerToken;const timestamp=new Date().toISOString().slice(0,19)+'+00:00';const fields:Record<string,string>={'merchant-id':merchantId,version:'v1',timestamp,amount:String(cents),item_name:'ALTIL usage payment',m_payment_id:reference};const signedValues={...fields,passphrase};const signature=createHash('md5').update(Object.entries(signedValues).sort(([a],[b])=>a.localeCompare(b)).map(([key,value])=>`${key}=${encode(value)}`).join('&')).digest('hex');const response=await fetch(`https://api.payfast.co.za/subscriptions/${encodeURIComponent(token)}/adhoc`,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded','merchant-id':merchantId,version:'v1',timestamp,signature},body:new URLSearchParams({amount:String(cents),item_name:'ALTIL usage payment',m_payment_id:reference})});const data=await response.json() as any;if(!response.ok||data.status==='failed'||data.data?.response===false)throw new Error(data.data?.message||'PayFast token charge failed.');return{providerReference:String(data.data?.pf_payment_id||reference),capturedAmount:amount};}
  throw new Error('iKhokha hosted payment links do not currently document stored-token debit. Create a new hosted checkout for each invoice.');
}

export function verifyPayfastSignature(data: Record<string, unknown>, supplied: string, passphrase?: string) {
  const pairs = Object.entries(data).filter(([key, value]) => key !== 'signature' && value !== undefined && value !== null && String(value) !== '').map(([key, value]) => `${key}=${encode(String(value).trim())}`);
  if (passphrase) pairs.push(`passphrase=${encode(passphrase.trim())}`);
  const expected = createHash('md5').update(pairs.join('&')).digest('hex');
  return expected.length === supplied.length && Buffer.from(expected).equals(Buffer.from(supplied));
}

export function verifyIkhokhaSignature(rawBody: Buffer | undefined, callbackPath: string, supplied: string, secret: string) {
  if (!rawBody || !supplied || !secret) return false;
  const signed = `${callbackPath}${rawBody.toString('utf8')}`.replace(/[\\"']/g, '\\$&').replace(/\u0000/g, '\\0');
  const expected = createHmac('sha256', secret.trim()).update(signed).digest(); const given = Buffer.from(supplied, 'hex');
  return expected.length === given.length && expected.equals(given);
}

export const newPaymentIntentId = () => `pay-${randomUUID()}`;
