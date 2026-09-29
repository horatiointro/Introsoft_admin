import React from 'react';
import { BookOpen, Braces, CircleAlert, ExternalLink, KeyRound, Layers3, ShieldCheck } from 'lucide-react';

const apiGroups = [
  {
    title: 'Public signup and package discovery',
    purpose: 'Lets a prospective customer review published packages and create a tenant trial without an existing account.',
    routes: ['GET /api/v1/public/plans', 'POST /api/v1/public/registrations'],
    how: 'Load the published plans first. Submit the registration form as JSON. The response creates a trial tenant, owner, application, and scoped API key; store the returned key securely because it is shown only once.'
  },
  {
    title: 'Tenants, users, plans, and licences',
    purpose: 'Manages tenant records and users, commercial plan templates, and application-level tenant licences.',
    routes: ['/api/v1/customers', '/api/v1/customers/{id}/users', '/api/v1/licensing/plans', '/api/v1/licensing/tenant-licenses', '/api/v1/admin/registrations'],
    how: 'Use a signed-in ALTIL session with an allowed administrative role. Read the tenant or plan first, then use the documented POST, PUT, PATCH, or DELETE operation. Replace each {id} with the record ID returned by an earlier request.'
  },
  {
    title: 'Billing, payments, and accounting',
    purpose: 'Creates and issues invoices, records payments, manages refunds and consented collection schedules, and reconciles gateway or bank settlements.',
    routes: ['/api/v1/billing/invoices', '/api/v1/billing/payments', '/api/v1/billing/refunds', '/api/v1/billing/payment-methods', '/api/v1/billing/schedules', '/api/v1/billing/accounting', '/api/v1/billing/reconciliation', '/api/v1/currency/config'],
    how: 'Start with GET operations to inspect the tenant-scoped state. Create drafts or requests using the required JSON body shown under each Swagger operation. Use the explicit issue, approve, confirm, and settle actions only at the matching workflow stage. Webhook routes are called by payment providers, not manually from a client.'
  },
  {
    title: 'Governed AI gateway',
    purpose: 'Provides an OpenAI-compatible chat endpoint with tenant, application, key, quota, billing, and policy checks before provider routing.',
    routes: ['GET /v1/models', 'POST /v1/chat/completions'],
    how: 'Send the tenant API key as Authorization: Bearer YOUR_KEY (or x-api-key where supported), plus Content-Type: application/json. Choose a model from GET /v1/models, then POST a model and messages array to /v1/chat/completions. The gateway can reject requests when a key, quota, billing, or policy check fails.'
  },
  {
    title: 'Communications and mobile devices',
    purpose: 'Configures encrypted SMTP/Firebase channel credentials, tests connections, sends notices, enrolls devices, and handles device inbox and replies.',
    routes: ['/api/v1/communications/channels', '/api/v1/communications/messages', '/api/v1/mobile/devices', '/api/v1/mobile/messages/{deviceId}'],
    how: 'An administrator configures a channel and tests it before sending. For device enrollment, use an active tenant API key; save the one-time device secret in the platform secure store. Mobile inbox, acknowledgements, and replies use the device secret header described in Swagger.'
  }
];

const card = 'rounded-2xl border border-white/[.08] bg-[#111722]';

export const ApiDocumentationView: React.FC = () => {
  const swaggerUrl = new URL('/api-docs', window.location.origin).toString();
  const specUrl = new URL('/api/v1/openapi.yaml', window.location.origin).toString();

  return <div className="space-y-6 text-slate-200">
    <header className="rounded-2xl border border-cyan-200/15 bg-gradient-to-br from-cyan-300/[.09] via-[#111722] to-indigo-400/[.07] p-6 sm:p-8">
      <div className="flex flex-wrap items-start gap-4">
        <span className="grid h-12 w-12 place-items-center rounded-xl bg-cyan-200/10 text-cyan-100"><Braces size={24}/></span>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-cyan-200">Developer reference · OpenAPI 3.1</p>
          <h1 className="mt-2 text-2xl font-semibold text-white">ALTIL API documentation</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">Browse the documented API operations below. Expand an endpoint to see its purpose, parameters, request schema, responses, and try it with your credentials. The contract currently covers public signup, tenant administration, billing, governed AI, communications, and mobile devices.</p>
        </div>
        <a href={swaggerUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-cyan-200/20 px-3 py-2 text-xs text-cyan-100 hover:bg-cyan-200/10">Open Swagger separately <ExternalLink size={13}/></a>
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        <a href={specUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg bg-cyan-200 px-3 py-2 text-xs font-semibold text-slate-950"><Braces size={14}/> Open raw OpenAPI YAML</a>
        <a href={new URL('/v1/openapi.json', window.location.origin).toString()} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-300 hover:bg-white/[.05]">Gateway OpenAPI JSON <ExternalLink size={13}/></a>
      </div>
    </header>

    <section className={`${card} overflow-hidden`}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[.07] px-5 py-4">
        <div><h2 className="flex items-center gap-2 text-sm font-semibold text-white"><Layers3 size={16} className="text-cyan-200"/> Interactive Swagger reference</h2><p className="mt-1 text-xs text-slate-500">Expand a method, inspect the schema, then use “Try it out” to send a request.</p></div>
        <span className="rounded-full border border-emerald-300/15 bg-emerald-200/[.05] px-2.5 py-1 text-[10px] text-emerald-200">Contract: v1.1.0</span>
      </div>
      <iframe title="Interactive Swagger API reference" src={swaggerUrl} className="h-[75vh] min-h-[620px] w-full bg-white" loading="lazy" />
    </section>

    <section className="grid gap-4 lg:grid-cols-[.8fr_1.2fr]">
      <div className={`${card} p-5`}>
        <h2 className="flex items-center gap-2 font-semibold text-white"><KeyRound size={16} className="text-violet-200"/> Before making requests</h2>
        <ol className="mt-4 space-y-4 text-xs leading-5 text-slate-400">
          <li className="flex gap-3"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white/[.06] text-[10px] text-white">1</span><span><b className="text-slate-200">Choose the right credential.</b> Public plan/signup routes need no session. Management routes normally need an ALTIL login session and a permitted role. Gateway requests use a tenant API key. Device routes use their enrolled device secret.</span></li>
          <li className="flex gap-3"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white/[.06] text-[10px] text-white">2</span><span><b className="text-slate-200">Expand an operation.</b> Read its description, path/query parameters, required headers, JSON request body, and possible status codes before sending.</span></li>
          <li className="flex gap-3"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white/[.06] text-[10px] text-white">3</span><span><b className="text-slate-200">Try a safe read first.</b> Click “Try it out”, enter required IDs and credentials, then “Execute”. Swagger displays the exact request, response status, and response body.</span></li>
          <li className="flex gap-3"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white/[.06] text-[10px] text-white">4</span><span><b className="text-slate-200">Use returned IDs.</b> Copy IDs from successful responses into later path parameters. Keep secret keys out of screenshots, source control, and browser-visible examples.</span></li>
        </ol>
        <div className="mt-5 rounded-xl border border-amber-200/15 bg-amber-100/[.04] p-3 text-[11px] leading-5 text-amber-100/80"><CircleAlert size={14} className="mr-1 inline"/>“Try it out” sends a real request to the selected server. POST, PUT, PATCH, DELETE, payment, refund, issue, and settle actions can change data or contact a payment provider. Use a test environment and test credentials for write operations.</div>
      </div>
      <div className={`${card} p-5`}>
        <h2 className="flex items-center gap-2 font-semibold text-white"><BookOpen size={16} className="text-cyan-200"/> What each API area does and how to use it</h2>
        <div className="mt-4 space-y-3">{apiGroups.map(group => <details key={group.title} className="group rounded-xl border border-white/[.07] bg-black/10 p-4">
          <summary className="cursor-pointer list-none pr-4 text-sm font-medium text-slate-100 marker:hidden">{group.title}<span className="float-right text-slate-500 group-open:rotate-180">⌄</span></summary>
          <p className="mt-3 text-xs leading-5 text-slate-400">{group.purpose}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">{group.routes.map(route => <code key={route} className="rounded-md border border-white/[.07] bg-white/[.03] px-2 py-1 text-[10px] text-cyan-100">{route}</code>)}</div>
          <p className="mt-3 text-xs leading-5 text-slate-300"><b className="text-white">Typical workflow:</b> {group.how}</p>
        </details>)}</div>
      </div>
    </section>

    <div className="flex items-start gap-3 rounded-xl border border-white/[.06] bg-white/[.02] p-4 text-[11px] leading-5 text-slate-500"><ShieldCheck size={15} className="mt-0.5 shrink-0 text-emerald-200"/><p>The Swagger contract is the source of truth for the operations listed in the interactive reference. It currently documents the main integration APIs; the server also has internal and administrative routes that are not all represented in this shared contract. Access checks on the server still apply even when Swagger displays an operation.</p></div>
  </div>;
};
