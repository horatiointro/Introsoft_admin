import 'dotenv/config';
import mysql from 'mysql2/promise';

// Generates a repeatable, entirely synthetic 90-day SaaS operating history.
// No model, payment processor, email, SMS, or push provider is contacted.
const tenants = [
  { id: 'demo-tenant-001', name: 'DEMO · Northstar Health', industry: 'healthcare', region: 'ZA', baseMonthly: 249, quota: 500000, callsPerDay: 48, vat: 0.15, currency: 'USD' },
  { id: 'demo-tenant-002', name: 'DEMO · Meridian Finance', industry: 'financial services', region: 'ZA', baseMonthly: 649, quota: 2000000, callsPerDay: 105, vat: 0.15, currency: 'USD' },
  { id: 'demo-tenant-003', name: 'DEMO · Cedar & Stone Retail', industry: 'retail', region: 'GB', baseMonthly: 399, quota: 1000000, callsPerDay: 235, vat: 0.20, currency: 'USD' },
  { id: 'demo-tenant-004', name: 'DEMO · Atlas Mobility', industry: 'transport', region: 'US', baseMonthly: 1499, quota: 10000000, callsPerDay: 520, vat: 0.08, currency: 'USD' },
  { id: 'demo-tenant-005', name: 'DEMO · Brightpath Learning', industry: 'education', region: 'AU', baseMonthly: 179, quota: 500000, callsPerDay: 118, vat: 0.10, currency: 'USD' }
];
const fallbackModelMix = [
  { id: 'demo-model-1', name: 'DEMO · Fast response model', in: 0.15, out: 0.60 },
  { id: 'demo-model-2', name: 'DEMO · Balanced reasoning model', in: 0.35, out: 1.05 },
  { id: 'demo-model-3', name: 'DEMO · Long context model', in: 0.80, out: 2.40 },
  { id: 'demo-model-4', name: 'DEMO · Open weight model', in: 0.10, out: 0.25 },
  { id: 'demo-model-5', name: 'DEMO · Extraction model', in: 0.20, out: 0.50 }
];
const now = new Date();
const todayUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
const historyStart = new Date(todayUtc.getTime() - 89 * 86400000);
const dateKey = date => date.toISOString().slice(0, 10);
const sqlDateTime = date => date.toISOString().slice(0, 23).replace('T', ' ');
const j = value => JSON.stringify(value);
const round = value => Number(value.toFixed(6));
const stable = value => { let n = 2166136261; for (const c of String(value)) n = Math.imul(n ^ c.charCodeAt(0), 16777619); return n >>> 0; };
const insertMany = async (db, table, columns, rows, updates = []) => {
  for (let offset = 0; offset < rows.length; offset += 400) {
    const batch = rows.slice(offset, offset + 400);
    if (!batch.length) continue;
    const marks = `(${columns.map(() => '?').join(',')})`;
    const onDup = updates.length ? ` ON DUPLICATE KEY UPDATE ${updates.map(col => `\`${col}\`=VALUES(\`${col}\`)`).join(',')}` : '';
    await db.execute(`INSERT IGNORE INTO \`${table}\` (${columns.map(col => `\`${col}\``).join(',')}) VALUES ${batch.map(() => marks).join(',')}${onDup}`, batch.flat());
  }
};

async function main() {
  const db = await mysql.createConnection({ host: process.env.MARIADB_HOST || '127.0.0.1', port: Number(process.env.MARIADB_PORT || 3306), user: process.env.MARIADB_USER || 'altil_user', password: process.env.MARIADB_PASSWORD || '', database: process.env.MARIADB_DATABASE || 'altil_db' });
  let requestRows = [], invoices = [], ledger = [], payments = [], refunds = [], journals = [], journalLines = [], reconBatches = [], reconItems = [], snapshots = [];
  try {
    const appRows = (await db.query('SELECT id,tenant_id FROM tenant_applications WHERE tenant_id LIKE \'demo-tenant-%\' ORDER BY id'))[0];
    const keyRows = (await db.query('SELECT id,tenant_id,application_id,key_prefix FROM tenant_api_keys WHERE tenant_id LIKE \'demo-tenant-%\' ORDER BY id'))[0];
    const modelRows = (await db.query("SELECT m.id,m.display_name,m.cost_per_1k_tokens_input_usd,m.cost_per_1k_tokens_output_usd FROM ai_models m JOIN ai_providers p ON p.id=m.provider_id WHERE p.is_active=1 AND m.status='online' ORDER BY m.id LIMIT 30"))[0];
    const modelMix = modelRows.length ? modelRows.map(model => ({ id: model.id, name: model.display_name, in: Number(model.cost_per_1k_tokens_input_usd || 0) * 1000, out: Number(model.cost_per_1k_tokens_output_usd || 0) * 1000 })) : fallbackModelMix;
    if (tenants.some(t => !appRows.some(a => a.tenant_id === t.id) || !keyRows.some(k => k.tenant_id === t.id))) throw new Error('Demo companies need at least one seeded application and API key before history simulation.');

    // Per-request traces: varied business-hour traffic, token sizes, model mix,
    // and a small deterministic retry/reroute share represented as successes.
    const businessBase = [48, 105, 235, 520, 118];
    for (let ti = 0; ti < tenants.length; ti++) {
      const tenant = tenants[ti];
      const apps = appRows.filter(row => row.tenant_id === tenant.id);
      const keys = keyRows.filter(row => row.tenant_id === tenant.id);
      for (let ago = 89; ago >= 0; ago--) {
        const day = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - ago));
        const weekday = day.getUTCDay();
        const weekendFactor = weekday === 0 || weekday === 6 ? 0.58 : 1;
        const dailyNoise = 0.86 + (stable(`${tenant.id}:${dateKey(day)}`) % 33) / 100;
        const dayProgress = ago === 0 ? Math.max(0.12, Math.min(1, (now.getUTCHours() - 6 + now.getUTCMinutes() / 60) / 15)) : 1;
        const requestCount = Math.max(8, Math.round(businessBase[ti] * weekendFactor * dailyNoise * dayProgress));
        for (let ri = 0; ri < requestCount; ri++) {
          const seed = stable(`${tenant.id}:${dateKey(day)}:${ri}`);
          const model = modelMix[seed % modelMix.length];
          const app = apps[seed % apps.length];
          const key = keys.find(row => row.application_id === app.id) || keys[seed % keys.length];
          const hour = 6 + ((seed >>> 3) % 15);
          const minute = (seed >>> 9) % 60;
          const second = (seed >>> 15) % 60;
          let occurred = new Date(Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate(), hour, minute, second));
          if (occurred > now) occurred = new Date(now.getTime() - (seed % 3600) * 1000);
          const inputTokens = 240 + ((seed >>> 5) % 4600);
          const outputTokens = 70 + ((seed >>> 13) % 2100);
          const cost = round((inputTokens * model.in + outputTokens * model.out) / 1_000_000);
          requestRows.push([`sim90-usage-${tenant.id.slice(-3)}-${dateKey(day).replaceAll('-', '')}-${String(ri).padStart(4, '0')}`, tenant.id, app.id, key.id, key.key_prefix, model.id, model.name, sqlDateTime(occurred), inputTokens, outputTokens, cost, 'success']);
        }
      }
    }

    const usageByTenantCycle = new Map();
    const usageByTenantMonth = new Map();
    for (const row of requestRows) {
      const tenant = tenants.find(item => item.id === row[1]);
      const month = row[7].slice(0, 7);
      const day = new Date(`${row[7].slice(0, 10)}T00:00:00.000Z`);
      const ago = Math.floor((todayUtc.getTime() - day.getTime()) / 86400000);
      const cycleIndex = Math.min(2, Math.floor(ago / 30));
      const cycleStart = new Date(historyStart.getTime() + cycleIndex * 30 * 86400000);
      const cycle = `${cycleIndex + 1}`;
      const key = `${tenant.id}:${cycle}`;
      const aggregate = usageByTenantCycle.get(key) || { tenant, cycle, cycleIndex, cycleStart, calls: 0, tokensIn: 0, tokensOut: 0, modelCost: 0 };
      aggregate.calls++; aggregate.tokensIn += row[8]; aggregate.tokensOut += row[9]; aggregate.modelCost += row[10];
      usageByTenantCycle.set(key, aggregate);
      const monthKey = `${tenant.id}:${month}`;
      const monthAggregate = usageByTenantMonth.get(monthKey) || { tenant, month, calls: 0, tokens: 0, modelCost: 0 };
      monthAggregate.calls++; monthAggregate.tokens += row[8] + row[9]; monthAggregate.modelCost += row[10];
      usageByTenantMonth.set(monthKey, monthAggregate);
    }
    // Calendar-month financial snapshots are aggregated directly from request traces.
    for (const item of usageByTenantMonth.values()) {
      snapshots.push([`sim90-snapshot-${item.tenant.id.slice(-3)}-${item.month}`, item.tenant.id, item.month, round(item.modelCost * 1.12), Number((item.tokens / 1_000_000).toFixed(5)), Math.max(3, Math.round(item.calls / 120)), sqlDateTime(now)]);
    }
    for (const tenant of tenants) {
      const currentCycle = usageByTenantCycle.get(`${tenant.id}:3`);
      if (currentCycle) await db.execute('UPDATE tenants SET metadata_json=JSON_SET(metadata_json,\'$.currentSpendUsd\',?) WHERE id=?', [round(currentCycle.modelCost * 1.12), tenant.id]);
    }
    for (const tenant of tenants) {
      for (let cycleIndex = 0; cycleIndex < 3; cycleIndex++) {
        const cycle = `${cycleIndex + 1}`;
        const usage = usageByTenantCycle.get(`${tenant.id}:${cycle}`);
        if (!usage) continue;
        const subscription = tenant.baseMonthly;
        const metered = round(usage.modelCost * 1.12); // transparent demo platform margin
        const subtotal = round(subscription + metered);
        const tax = round(subtotal * tenant.vat);
        const total = round(subtotal + tax);
        const periodStart = usage.cycleStart;
        const periodEndExclusive = new Date(Math.min(periodStart.getTime() + 30 * 86400000, todayUtc.getTime() + 86400000));
        const currentMonth = cycleIndex === 2;
        const issuedAt = currentMonth ? new Date(now) : periodEndExclusive;
        const dueAt = new Date(issuedAt.getTime() + 14 * 86400000);
        const cycleKey = dateKey(periodStart).replaceAll('-', '');
        const invoiceId = `sim90-invoice-${tenant.id.slice(-3)}-${cycleKey}`;
        const invoiceNumber = `SIM-${tenant.id.slice(-3)}-${cycleKey}`;
        const paid = currentMonth ? 0 : total;
        const status = currentMonth ? 'draft' : 'paid';
        const periodEnd = new Date(Math.min(periodEndExclusive.getTime() - 86400000, now.getTime()));
        const payload = { id: invoiceId, number: invoiceNumber, tenantId: tenant.id, tenantName: tenant.name, currency: 'USD', displayCurrency: ({ ZA: 'ZAR', GB: 'GBP', US: 'USD', AU: 'AUD' })[tenant.region], periodStart: dateKey(periodStart), periodEnd: dateKey(periodEnd), dueAt: dateKey(dueAt), subtotal, tax, total, paid, status, lines: [{ description: `DEMO · Cycle ${cycle} subscription`, quantity: 1, unitPrice: subscription, amount: subscription }, { description: `DEMO · ${usage.calls.toLocaleString()} API requests · model usage and ALTIL service margin`, quantity: usage.calls, unitPrice: usage.calls ? metered / usage.calls : 0, amount: metered }, { description: `DEMO · ${tenant.region} estimated tax`, quantity: 1, unitPrice: tax, amount: tax }], usage: { requests: usage.calls, inputTokens: usage.tokensIn, outputTokens: usage.tokensOut, providerModelCostEstimateUsd: round(usage.modelCost), platformUsageChargeUsd: metered }, demoData: true, simulated: true };
        invoices.push([invoiceId, invoiceNumber, tenant.id, status, 'USD', dateKey(dueAt), total, paid, sqlDateTime(issuedAt), j(payload)]);

        const invoiceJournalId = `sim90-journal-invoice-${tenant.id.slice(-3)}-${cycleKey}`;
        journals.push([invoiceJournalId, tenant.id, 'invoice_issued', invoiceId, 'USD', `DEMO · ${invoiceNumber} invoice posting`, sqlDateTime(issuedAt), 'ALTIL synthetic history simulator']);
        journalLines.push([`${invoiceJournalId}-ar`, invoiceJournalId, '1200', 'Accounts receivable', total, 0, invoiceNumber], [`${invoiceJournalId}-revenue`, invoiceJournalId, '4000', 'AI service revenue', 0, subtotal, invoiceNumber], [`${invoiceJournalId}-tax`, invoiceJournalId, '2200', `${tenant.region} tax payable`, 0, tax, invoiceNumber]);
        ledger.push([`sim90-ledger-charge-${tenant.id.slice(-3)}-${cycleKey}`, tenant.id, 'charge', total, 'USD', invoiceNumber, sqlDateTime(issuedAt), j({ demoData: true, simulated: true, invoiceId, subscriptionUsd: subscription, usageUsd: metered, taxUsd: tax, usageCalls: usage.calls })]);

        if (!currentMonth) {
          const fee = round(total * (tenant.region === 'US' ? 0.029 : 0.025) + 0.30);
          const net = round(total - fee);
          const paymentId = `sim90-payment-${tenant.id.slice(-3)}-${cycleKey}`;
          const paymentAt = new Date(issuedAt.getTime() + 5 * 86400000);
          const paymentPayload = { id: paymentId, tenantId: tenant.id, invoiceId, purpose: 'invoice', provider: 'demo_sim', status: 'succeeded', amount: total, currency: 'USD', externalReference: `SIM-SETTLEMENT-${tenant.id.slice(-3)}-${cycleKey}`, providerReference: `SIM-GATEWAY-${tenant.id.slice(-3)}-${cycleKey}`, capturedAmount: total, feeAmount: fee, settlementReference: `SIM-SETTLEMENT-${cycleKey}`, createdAt: sqlDateTime(paymentAt), updatedAt: sqlDateTime(paymentAt), demoData: true, simulated: true, externalPaymentExecuted: false };
          payments.push([paymentId, tenant.id, invoiceId, 'demo_sim', 'succeeded', total, 'USD', paymentPayload.externalReference, paymentPayload.providerReference, null, total, fee, paymentPayload.settlementReference, sqlDateTime(paymentAt), sqlDateTime(paymentAt), j(paymentPayload)]);
          ledger.push([`sim90-ledger-payment-${tenant.id.slice(-3)}-${cycleKey}`, tenant.id, 'payment', total, 'USD', paymentPayload.externalReference, sqlDateTime(paymentAt), j({ demoData: true, simulated: true, invoiceId, paymentIntentId: paymentId, provider: 'demo_sim', capturedAmount: total, settlementReference: paymentPayload.settlementReference })]);
          ledger.push([`sim90-ledger-fee-${tenant.id.slice(-3)}-${cycleKey}`, tenant.id, 'gateway_fee', fee, 'USD', paymentPayload.providerReference, sqlDateTime(paymentAt), j({ demoData: true, simulated: true, invoiceId, paymentIntentId: paymentId, provider: 'demo_sim' })]);
          const receiptId = `sim90-journal-payment-${tenant.id.slice(-3)}-${cycleKey}`;
          journals.push([receiptId, tenant.id, 'payment_captured', paymentId, 'USD', `DEMO · simulated settlement ${invoiceNumber}`, sqlDateTime(paymentAt), 'ALTIL synthetic history simulator']);
          journalLines.push([`${receiptId}-bank`, receiptId, '1000', 'Operating bank clearing', net, 0, paymentId], [`${receiptId}-fee`, receiptId, '6100', 'Payment processing fees', fee, 0, paymentId], [`${receiptId}-ar`, receiptId, '1200', 'Accounts receivable', 0, total, invoiceNumber]);

          const batchId = `sim90-recon-${tenant.id.slice(-3)}-${cycleKey}`;
          const statementReference = `SIM-STATEMENT-${tenant.id.slice(-3)}-${cycleKey}`;
          reconBatches.push([batchId, 'demo_sim', statementReference, 'USD', 1, 1, 0, total, fee, net, 'matched', sqlDateTime(new Date(paymentAt.getTime() + 86400000)), 'ALTIL synthetic history simulator', j({ demoData: true, simulated: true, matchedPaymentIds: [paymentId], externalStatementImported: false })]);
          reconItems.push([`sim90-recon-item-${tenant.id.slice(-3)}-${cycleKey}`, batchId, paymentPayload.providerReference, paymentId, total, fee, net, 'USD', 'matched', `Synthetic settlement matches demo payment ${paymentId}.`]);
          if (cycleIndex === 1) {
            const refundAmount = round(Math.min(25, total * 0.04));
            const refundId = `sim90-refund-${tenant.id.slice(-3)}-${cycleKey}`;
            const requestedAt = new Date(paymentAt.getTime() + 2 * 86400000);
            const processedAt = new Date(paymentAt.getTime() + 3 * 86400000);
            const refundPayload = { id: refundId, tenantId: tenant.id, invoiceId, paymentIntentId: paymentId, provider: 'demo_sim', status: 'succeeded', amount: refundAmount, currency: 'USD', reason: 'Synthetic goodwill service credit for demo lifecycle walkthrough.', providerReference: `SIM-REFUND-${tenant.id.slice(-3)}-${cycleKey}`, requestedBy: 'ALTIL synthetic history simulator', requestedAt: sqlDateTime(requestedAt), processedAt: sqlDateTime(processedAt), demoData: true, simulated: true, externalRefundExecuted: false };
            refunds.push([refundId, tenant.id, invoiceId, paymentId, 'demo_sim', 'succeeded', refundAmount, 'USD', refundPayload.reason, refundPayload.providerReference, refundPayload.requestedBy, sqlDateTime(requestedAt), sqlDateTime(processedAt), j(refundPayload)]);
            ledger.push([`sim90-ledger-refund-${tenant.id.slice(-3)}-${cycleKey}`, tenant.id, 'refund', -refundAmount, 'USD', refundPayload.providerReference, sqlDateTime(processedAt), j({ demoData: true, simulated: true, refundId, invoiceId, paymentIntentId: paymentId, effect: 'cash_outflow' })]);
            const refundJournalId = `sim90-journal-refund-${tenant.id.slice(-3)}-${cycleKey}`;
            journals.push([refundJournalId, tenant.id, 'refund_issued', refundId, 'USD', `DEMO · simulated goodwill refund ${invoiceNumber}`, sqlDateTime(processedAt), 'ALTIL synthetic history simulator']);
            journalLines.push([`${refundJournalId}-contra`, refundJournalId, '4090', 'Service credits and refunds', refundAmount, 0, refundId], [`${refundJournalId}-bank`, refundJournalId, '1000', 'Operating bank clearing', 0, refundAmount, refundId]);
          }
        }
      }
    }

    await db.beginTransaction();
    // Rebuild only rows owned by this simulator so repeated runs cannot double-count demo activity.
    await db.execute("DELETE FROM billing_reconciliation_items WHERE batch_id LIKE 'sim90-%'");
    await db.execute("DELETE FROM billing_reconciliation_batches WHERE id LIKE 'sim90-%'");
    await db.execute("DELETE FROM billing_payment_intents WHERE id LIKE 'sim90-%'");
    await db.execute("DELETE FROM billing_refunds WHERE id LIKE 'sim90-%'");
    await db.execute("DELETE l FROM accounting_journal_lines l JOIN accounting_journals j ON j.id=l.journal_id WHERE j.id LIKE 'sim90-journal-%'");
    await db.execute("DELETE FROM accounting_journals WHERE id LIKE 'sim90-journal-%'");
    await db.execute("DELETE FROM billing_invoices WHERE id LIKE 'sim90-invoice-%'");
    await db.execute("DELETE FROM billing_ledger_entries WHERE id LIKE 'sim90-ledger-%'");
    await db.execute("DELETE FROM tenant_key_usage WHERE id LIKE 'sim90-usage-%'");
    await db.execute("DELETE FROM financial_monthly_snapshots WHERE id LIKE 'sim90-snapshot-%'");
    await insertMany(db, 'tenant_key_usage', ['id','tenant_id','application_id','api_key_id','api_key_prefix','model_id','model_name','occurred_at','input_tokens','output_tokens','amount_usd','status'], requestRows);
    await insertMany(db, 'billing_invoices', ['id','invoice_number','tenant_id','status','currency','due_at','total','paid','created_at','payload_json'], invoices, ['status','due_at','total','paid','payload_json']);
    await insertMany(db, 'billing_ledger_entries', ['id','tenant_id','kind','amount','currency','reference','created_at','payload_json'], ledger);
    await insertMany(db, 'billing_payment_intents', ['id','tenant_id','invoice_id','provider','status','amount','currency','external_reference','provider_reference','checkout_url','captured_amount','fee_amount','settlement_reference','created_at','updated_at','payload_json'], payments);
    await insertMany(db, 'billing_refunds', ['id','tenant_id','invoice_id','payment_intent_id','provider','status','amount','currency','reason','provider_reference','requested_by','requested_at','processed_at','payload_json'], refunds);
    await insertMany(db, 'accounting_journals', ['id','tenant_id','source_type','source_id','currency','description','posted_at','actor'], journals);
    await insertMany(db, 'accounting_journal_lines', ['id','journal_id','account_code','account_name','debit','credit','memo'], journalLines);
    await insertMany(db, 'billing_reconciliation_batches', ['id','provider','statement_reference','currency','row_count','matched_count','exception_count','gross_total','fees_total','net_total','status','created_at','created_by','payload_json'], reconBatches);
    await insertMany(db, 'billing_reconciliation_items', ['id','batch_id','external_reference','payment_intent_id','gross_amount','fee_amount','net_amount','currency','status','memo'], reconItems);
    await insertMany(db, 'financial_monthly_snapshots', ['id','tenant_id','snapshot_month','spend_usd','tokens_consumed_millions','active_users_count','created_at'], snapshots, ['spend_usd','tokens_consumed_millions','active_users_count','created_at']);
    const [ledgerRecords] = await db.execute("SELECT l.*,t.name AS tenant_name FROM billing_ledger_entries l LEFT JOIN tenants t ON t.id=l.tenant_id WHERE l.tenant_id LIKE 'demo-tenant-%'");
    for (const row of ledgerRecords) {
      const payload = typeof row.payload_json === 'string' ? JSON.parse(row.payload_json) : (row.payload_json || {});
      const kind = row.kind === 'demo_charge' ? 'charge' : row.kind;
      const createdAt = row.created_at instanceof Date ? row.created_at.toISOString() : new Date(row.created_at).toISOString();
      const reference = String(row.reference || payload.reference || row.id);
      const normalized = { ...payload, id: row.id, tenantId: row.tenant_id, tenantName: row.tenant_name || row.tenant_id, kind, amount: Number(row.amount || 0), currency: String(row.currency || 'USD').toUpperCase(), reference, memo: payload.memo || payload.description || payload.reason || `DEMO · ${kind.replaceAll('_',' ')} entry · ${reference}`, createdAt, actor: payload.actor || payload.requestedBy || 'ALTIL synthetic history simulator', demoData: true, simulated: true };
      await db.execute('UPDATE billing_ledger_entries SET kind=?,payload_json=? WHERE id=?', [kind, j(normalized), row.id]);
    }
    await db.commit();

    const [counts] = await db.execute('SELECT tenant_id, COUNT(*) AS requests, SUM(input_tokens+output_tokens) AS tokens, ROUND(SUM(amount_usd),2) AS model_cost_usd, MIN(occurred_at) AS first_request, MAX(occurred_at) AS last_request FROM tenant_key_usage WHERE id LIKE \'sim90-usage-%\' GROUP BY tenant_id ORDER BY tenant_id');
    const [billing] = await db.execute("SELECT COUNT(*) AS invoices, ROUND(SUM(total),2) AS invoiced_usd, ROUND(SUM(paid),2) AS paid_usd FROM billing_invoices WHERE id LIKE 'sim90-invoice-%'");
    const [accounting] = await db.execute("SELECT COUNT(DISTINCT j.id) AS journals, ROUND(SUM(l.debit),2) AS debits, ROUND(SUM(l.credit),2) AS credits FROM accounting_journals j JOIN accounting_journal_lines l ON l.journal_id=j.id WHERE j.id LIKE 'sim90-journal-%'");
    const [integrity] = await db.execute("SELECT (SELECT COUNT(*) FROM billing_refunds WHERE id LIKE 'sim90-%') AS refunds_in_db, (SELECT COUNT(*) FROM billing_reconciliation_items WHERE batch_id LIKE 'sim90-%' AND status='matched') AS matched_reconciliation_items, (SELECT COUNT(*) FROM (SELECT j.id FROM accounting_journals j JOIN accounting_journal_lines l ON l.journal_id=j.id WHERE j.id LIKE 'sim90-journal-%' GROUP BY j.id HAVING ABS(SUM(l.debit)-SUM(l.credit))>0.000001) unbalanced) AS unbalanced_journals");
    console.log(JSON.stringify({ result: 'simulation stored', days: 90, companies: tenants.length, simulatedRequests: requestRows.length, simulatedPayments: payments.length, simulatedRefunds: refunds.length, reconciliationBatches: reconBatches.length, usageByTenant: counts, billing: billing[0], accounting: accounting[0], integrity: integrity[0], providerCallsOrRealPayments: 0 }, null, 2));
  } catch (error) {
    try { await db.rollback(); } catch {}
    throw error;
  } finally { await db.end(); }
}

main().catch(error => { console.error('Synthetic history simulation failed:', error?.message || 'Database operation failed.'); process.exitCode = 1; });
