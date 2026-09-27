import 'dotenv/config';
import mysql from 'mysql2/promise';
import { createCipheriv, createHash, randomBytes } from 'node:crypto';

// Repeatable, clearly labelled demonstration records. These companies and events are fictional.
const companies = [
  ['Northstar Health', 'healthcare', 'ZA'],
  ['Meridian Finance', 'financial services', 'ZA'],
  ['Cedar & Stone Retail', 'retail', 'GB'],
  ['Atlas Mobility', 'transport', 'US'],
  ['Brightpath Learning', 'education', 'AU']
];
const perCompany = 20;
const now = new Date();
const dateTime = (daysAgo = 0) => new Date(now.getTime() - daysAgo * 86400000).toISOString().slice(0, 23).replace('T', ' ');
const dateOnly = (daysAgo = 0) => dateTime(daysAgo).slice(0, 10);
const json = value => JSON.stringify(value);
const encryptKnowledge = value => {
  const secret = process.env.ALTIL_KNOWLEDGE_ENCRYPTION_KEY;
  if (!secret || secret.length < 32) throw new Error('ALTIL_KNOWLEDGE_ENCRYPTION_KEY must be configured before seeding tenant knowledge.');
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', createHash('sha256').update(secret).digest(), iv);
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  return `v1:${iv.toString('base64')}:${cipher.getAuthTag().toString('base64')}:${encrypted.toString('base64')}`;
};
const id = (table, tenantIndex, row) => `demo-${table}-${tenantIndex + 1}-${String(row + 1).padStart(3, '0')}`;

async function insert(conn, table, columns, rows, updateColumns = []) {
  if (!rows.length) return;
  const marks = `(${columns.map(() => '?').join(',')})`;
  const sql = `INSERT ${updateColumns.length ? '' : 'IGNORE '}INTO \`${table}\` (${columns.map(column => `\`${column}\``).join(',')}) VALUES ${rows.map(() => marks).join(',')}${updateColumns.length ? ` ON DUPLICATE KEY UPDATE ${updateColumns.map(column => `\`${column}\`=VALUES(\`${column}\`)`).join(',')}` : ''}`;
  await conn.execute(sql, rows.flat());
}

async function main() {
  const connection = await mysql.createConnection({
    host: process.env.MARIADB_HOST || '127.0.0.1', port: Number(process.env.MARIADB_PORT || 3306),
    user: process.env.MARIADB_USER || 'altil_user', password: process.env.MARIADB_PASSWORD || '',
    database: process.env.MARIADB_DATABASE || 'altil_db', multipleStatements: false
  });
  try {
    await connection.beginTransaction();
    const tenantIds = companies.map((_, i) => `demo-tenant-${String(i + 1).padStart(3, '0')}`);
    const planIds = ['demo-plan-starter', 'demo-plan-growth', 'demo-plan-scale', 'demo-plan-enterprise', 'demo-plan-usage'];
    const planRows = [
      ['Starter', 29, 100000], ['Growth', 99, 500000], ['Scale', 299, 2000000], ['Enterprise', 999, 10000000], ['Usage Flex', 0, 1000000]
    ].map(([name, price, quota], i) => [planIds[i], `DEMO-${i + 1}`, `DEMO · ${name}`, 'Synthetic plan for demonstration tenants', 'monthly_base_plus_overage', price, 'USD', 'Monthly', quota, 0.05, 14, 2500, 99.95, 'hard_block_402', 1, json({ demoData: true })]);
    await insert(connection, 'licensing_plans', ['id','plan_code','name','description','pricing_model','base_price','currency','billing_cycle','included_transactions_quota','overage_rate_per_1k','grace_period_days','max_rpm_limit','sla_guarantee_percent','enforcement_rule','is_active','metadata_json'], planRows);

    const tenantRows = companies.map(([name, industry, country], i) => [tenantIds[i], `DEMO-${String(i + 1).padStart(3, '0')}`, `DEMO · ${name}`, 'Business', 'Global', 1, 1000 + i * 500, 250000 + i * 100000, 'active', json({ demoData: true, industry, country, onboardingSource: 'repeatable database demo seeder' })]);
    await insert(connection, 'tenants', ['id','tenant_code','name','tier','region','popia_compliant','max_rpm','max_tpm','status','metadata_json'], tenantRows);

    const appRecords = companies.map((_, ti) => Array.from({ length: perCompany }, (_, ri) => ({
      id: id('app', ti, ri), tenantId: tenantIds[ti], code: `DEMO-${ti + 1}-${String(ri + 1).padStart(3, '0')}`,
      name: `DEMO · ${companies[ti][0]} ${['Service Assistant','Knowledge Search','Operations Copilot','Customer Support'][ri % 4]} ${ri + 1}`,
      createdAt: dateTime(180 - ri * 3)
    })));
    await insert(connection, 'tenant_applications', ['id','tenant_id','app_code','name','description','capability_type','status','created_at','metadata_json'], appRecords.flat().map(a => [a.id,a.tenantId,a.code,a.name,'Fictional demo application for ALTIL database validation.','general_ai','active',a.createdAt,json({ id:a.id, customerId:a.tenantId, customerName:companies.find((_,i)=>tenantIds[i]===a.tenantId)[0], parentApplicationId:null, applicationType:'application', appIdentifier:a.code.toLowerCase(), name:a.name, description:'Fictional demonstration application.', status:'active', environment:'demo', allowedCapabilities:['general_ai','fast_chat'], rateLimitRpm:120, quotaMonthlyRequests:100000, quotaUsedRequests:0, assignedPolicyIds:['pol-global-safety'], demoData:true, createdAt:a.createdAt })]));

    const keysByCompany = appRecords.map((apps, ti) => apps.map((app, ri) => {
      const keyId = id('key', ti, ri); const prefix = `DEMO-${String(ti + 1)}-${String(ri + 1).padStart(3, '0')}`;
      const keyHash = createHash('sha256').update(`${keyId}:not-a-real-credential`).digest('hex');
      const record = { id:keyId, customerId:tenantIds[ti], customerName:`DEMO · ${companies[ti][0]}`, appId:app.id, name:`${app.name} demo key`, prefix, status:'revoked', createdAt:app.createdAt, expiresAt:null, lastUsedAt:null, rateLimitRpm:120, ipWhitelist:[], scopes:['read:inference'], demoData:true };
      return { id:keyId, tenantId:tenantIds[ti], appId:app.id, prefix, keyHash, record };
    }));
    await insert(connection, 'tenant_api_keys', ['id','tenant_id','application_id','key_hash','key_prefix','status','metadata_json','created_at'], keysByCompany.flat().map(k => [k.id,k.tenantId,k.appId,k.keyHash,k.prefix,'revoked',json(k.record),now]));

    const licenses = [];
    const usageRows = [];
    const invoiceRows = [];
    const ledgerRows = [];
    const auditRows = [];
    const journalRows = [];
    const journalLineRows = [];
    const incidentRows = [];
    const incidentEventRows = [];
    const problemRows = [];
    const changeRows = [];
    const cmdbRows = [];
    const dependencyRows = [];
    const slaProfileRows = [];
    const slaTargetRows = [];
    const slaMeasurementRows = [];
    const slaBreachRows = [];
    const kpiRows = [];
    const guardrailRows = [];
    const dsarRows = [];
    const breachRows = [];
    const communicationRows = [];
    const snapshotRows = [];
    const profileRows = [];
    const itemTypes = (await connection.query('SELECT id FROM cmdb_item_types ORDER BY id'))[0].map(row => row.id);
    if (!itemTypes.length) throw new Error('CMDB item types are missing; apply database migrations before seeding.');

    for (let ti = 0; ti < companies.length; ti++) {
      const [companyName, industry, country] = companies[ti]; const tenantId = tenantIds[ti];
      const apps = appRecords[ti]; const keys = keysByCompany[ti];
      const demoUsers = [
        ['owner','Workspace Owner','owner','Owner'],
        ['developer','API Developer','developer','Developer'],
        ['billing','Finance Contact','billing','Billing administrator'],
        ['compliance','Privacy Contact','compliance_officer','Compliance officer']
      ].map(([role,name,userRole,designation],ui)=>({id:`demo-user-${ti+1}-${role}`,customerId:tenantId,name:`DEMO · ${name}`,email:`demo-${role}-${ti+1}@example.invalid`,role:userRole,designation,mfaEnabled:true,status:'active',lastLogin:new Date(Date.now()-(ui+1)*86400000).toISOString(),createdAt:dateTime(180),demoData:true,loginAccountProvisioned:false}));
      const statutoryOfficers = {
        informationOfficer:{name:`DEMO · Information Officer ${ti+1}`,email:`demo-io-${ti+1}@example.invalid`,phone:'+27 000 000 000',designation:'Synthetic Information Officer',registrationNumber:`DEMO-UNVERIFIED-IO-${String(ti+1).padStart(3,'0')}`,registeredDate:dateOnly(30),deputyOfficerName:`DEMO · Deputy Officer ${ti+1}`,deputyOfficerEmail:`demo-deputy-${ti+1}@example.invalid`,demoData:true},
        dataProtectionOfficer:{name:`DEMO · Data Protection Officer ${ti+1}`,email:`demo-dpo-${ti+1}@example.invalid`,phone:'+27 000 000 000',dpoType:'internal',leadSupervisoryAuthority:country==='GB'?'ICO (demo)':country==='AU'?'OAIC (demo)':country==='US'?'US authority (demo)':'Information Regulator (demo)',registrationNumber:`DEMO-UNVERIFIED-DPO-${String(ti+1).padStart(3,'0')}`,registeredDate:dateOnly(30),demoData:true}
      };
      const customerMetadata = { id:tenantId, type:'company', orgRole:'direct_client', parentId:null, name:`DEMO · ${companyName}`, legalName:`DEMO · ${companyName} Ltd`, industry, country, status:'active', tier:'business', monthlyBudgetUsd:1000 + ti * 500, currentSpendUsd:0, rateLimitRpm:1000 + ti * 500, rateLimitTpm:250000 + ti * 100000, primaryContact:{name:'Demo Workspace Owner',email:`demo-owner-${ti+1}@example.invalid`,role:'Owner'}, billingConfig:{billingCycle:'monthly',billingCycleStartDate:dateOnly(0).slice(0,8)+'01',autoRenew:false,paymentMethod:'invoice',currency:'USD',creditBalanceUsd:0,creditLimitUsd:5000,prepaidCredits:false,billingEmail:`demo-billing-${ti+1}@example.invalid`,overageAllowed:false,overageAlertThresholdPercent:80}, statutoryOfficers, users:demoUsers, connectedAppIds:apps.map(a=>a.id), assignedPolicyIds:['pol-global-safety'], demoData:true, createdAt:dateTime(240), updatedAt:dateTime(0), notes:'Synthetic demonstration tenant. Officer records are unverified and user entries are not provisioned login accounts.' };
      await connection.execute('UPDATE tenants SET metadata_json=? WHERE id=?',[json(customerMetadata),tenantId]);
      profileRows.push([tenantId,encryptKnowledge(json({ demoData:true, industry, country, preferences:{displayCurrency:['ZAR','USD','GBP','USD','AUD'][ti]}, activity:{requests:0,topics:[industry,'AI governance']}})),dateTime(0)]);
      slaProfileRows.push([id('sla-profile',ti,0),tenantId,'DEMO · Standard AI service SLA',99.95,100,250,600,0.5,60,240,15,120,60,15,1.5,'24x7 demo support']);
      slaTargetRows.push([id('sla-target',ti,0),tenantId,'ALTIL AI Gateway',99.95,250,0.5,99.98,180,0.1]);

      for (let ri = 0; ri < perCompany; ri++) {
        const app=apps[ri], key=keys[ri], recordId=(kind)=>id(kind,ti,ri), days=ri*4+(ti*2), amount=Number((0.2+(ri%7)*0.17).toFixed(6));
        const planId=planIds[(ti+ri)%planIds.length], planName=['Starter','Growth','Scale','Enterprise','Usage Flex'][(ti+ri)%planIds.length];
        licenses.push([recordId('license'),tenantId,`DEMO · ${companyName}`,app.id,app.name,planId,`DEMO · ${planName}`,`DEMO-LIC-${ti+1}-${String(ri+1).padStart(3,'0')}`,'active','current',dateOnly(120),dateOnly(-245),'none',0,14,null,0,'USD',json({demoData:true,source:'seed_demo_companies.js'})]);
        const invoiceId=recordId('invoice'), invoiceNumber=`DEMO-${ti+1}-${String(ri+1).padStart(4,'0')}`, status=ri%4===0?'issued':'paid', paid=status==='paid'?amount:0;
        const invoicePayload={id:invoiceId,number:invoiceNumber,tenantId,tenantName:`DEMO · ${companyName}`,currency:'USD',periodStart:dateOnly(days+30),periodEnd:dateOnly(days),dueAt:dateOnly(days-14),subtotal:amount,tax:0,total:amount,paid,status,lines:[{description:'DEMO · metered AI usage',quantity:1,unitPrice:amount,amount}],createdAt:dateTime(days),issuedAt:dateTime(days),demoData:true};
        invoiceRows.push([invoiceId,invoiceNumber,tenantId,status,'USD',dateOnly(days-14),amount,paid,dateTime(days),json(invoicePayload)]);
        const ledgerId=recordId('ledger'), ledgerCreatedAt=dateTime(days), ledgerIso=new Date(`${ledgerCreatedAt.replace(' ','T')}Z`).toISOString();
        ledgerRows.push([ledgerId,tenantId,'charge',amount,'USD',invoiceNumber,ledgerCreatedAt,json({id:ledgerId,tenantId,tenantName:`DEMO · ${companyName}`,kind:'charge',amount,currency:'USD',reference:invoiceNumber,memo:`Synthetic usage charge for ${invoiceNumber}; not a real payment.`,createdAt:ledgerIso,actor:'ALTIL demo seeder',demoData:true,simulated:true,invoiceId})]);
        const journalId=recordId('journal'); journalRows.push([journalId,tenantId,'demo_invoice',invoiceId,'USD',`DEMO · Invoice ${invoiceNumber}`,dateTime(days),'ALTIL demo seeder']);
        journalLineRows.push([`${journalId}-ar`,journalId,'1200','DEMO · Accounts receivable',amount,0,invoiceNumber],[`${journalId}-rev`,journalId,'4000','DEMO · AI service revenue',0,amount,invoiceNumber]);
        const inputTokens=100+ri*17, outputTokens=60+ri*11;
        usageRows.push([recordId('usage'),tenantId,app.id,key.id,key.prefix,`demo-model-${(ri%10)+1}`,`DEMO · Model ${(ri%10)+1}`,dateTime(days),inputTokens,outputTokens,amount,'success']);
        auditRows.push([recordId('audit'),dateTime(days),tenantId,`demo-operator-${ti+1}@example.invalid`,'demo_usage_recorded','DEMO_BILLING','INFO','127.0.0.1',json({demoData:true,invoiceNumber}),json({demoData:true,status:'success'}),dateTime(days)]);
        const incidentId=recordId('incident');
        incidentRows.push([incidentId,`DEMO-INC-${ti+1}-${String(ri+1).padStart(4,'0')}`,tenantId,`DEMO · ${companyName}`,app.id,app.name,`DEMO · ${['Provider latency review','Quota alert drill','Policy tuning exercise','Regional failover rehearsal'][ri%4]}`,`Fictional operational exercise ${ri+1} for ${companyName}. No production outage occurred.`,['P1','P2','P3','P4'][ri%4],['RESOLVED','CLOSED','MONITORING'][ri%3],'AI Orchestration Gateway','OpenRouter',`demo-model-${ri%10+1}`,`demo-operator-${ti+1}@example.invalid`,`demo-operator-${ti+1}@example.invalid`,'Synthetic training scenario.','Runbook checked; no external action was taken.','Demo exercise completed.',ri%8===0?1:0,5+ri%8,18+ri%30,0,0,0,dateTime(days),dateTime(days)]);
        incidentEventRows.push([`${incidentId}-event`,incidentId,`demo-operator-${ti+1}@example.invalid`,'DEMO_RECORDED','Synthetic exercise timeline event; not a real incident.',json({demoData:true}),dateTime(days)]);
        problemRows.push([recordId('problem'),tenantId,`DEMO-PRB-${ti+1}-${String(ri+1).padStart(4,'0')}`,`DEMO · ${companyName} · ${['Retry policy review','Capacity planning','Usage attribution','Model health telemetry'][ri%4]}`,`Fictional root-cause analysis record for ${companyName}; created for database demonstration only.`,['CAPACITY','CONFIGURATION','PROVIDER','OBSERVABILITY'][ri%4],'Temporary mitigation documented.','Long-term action tracked in demo change record.','CLOSED',0,dateTime(days),dateTime(days-1)]);
        changeRows.push([recordId('change'),tenantId,`DEMO-RFC-${ti+1}-${String(ri+1).padStart(4,'0')}`,`DEMO · ${companyName} · ${['Rotate a demo provider route','Tune usage alerts','Review model catalog','Update resilience playbook'][ri%4]}`,['STANDARD','NORMAL','EMERGENCY'][ri%3],['LOW','MEDIUM','HIGH'][ri%3],`Demo tenant ${tenantId}`,`Synthetic backout plan: restore the previous demo setting.`,['APPROVED','IMPLEMENTED','PENDING'][ri%3],'demo-approver@example.invalid',dateTime(days-1),dateTime(days),dateTime(days+1)]);
        const ciId=recordId('ci'); cmdbRows.push([ciId,itemTypes[ri%itemTypes.length],tenantId,`DEMO-CI-${ti+1}-${String(ri+1).padStart(4,'0')}`,`DEMO · ${companyName} · ${['Gateway','Knowledge Store','Usage Meter','Policy Engine'][ri%4]} ${ri+1}`,'OPERATIONAL','DEMO',null,`demo-operator-${ti+1}@example.invalid`,['HIGH','MEDIUM','LOW'][ri%3],json({demoData:true,company:companyName,environment:'synthetic'}),dateTime(days),dateTime(0)]);
        const dayOffset=days+1;
        slaMeasurementRows.push([recordId('sla-measure'),tenantId,dateOnly(dayOffset),Number((99.8+(ri%3)*0.05).toFixed(2)),50+ri,130+ri*2,260+ri*4,5000+ri*100,ri%5,Number((0.02+(ri%5)*0.02).toFixed(2)),'DEMO']);
        if (ri>0) dependencyRows.push([recordId('dep'),id('ci',ti,ri-1),ciId,'DEMO_DEPENDS_ON',Number((0.5+(ri%5)*0.1).toFixed(2)),dateTime(days)]);
        slaBreachRows.push([recordId('sla-breach'),tenantId,incidentId,dateOnly(days),['p95_latency','uptime','error_rate'][ri%3],200+ri,210+ri,ri%2?5:0,'DEMO_REVIEW',`Synthetic breach simulation for ${companyName}; not an actual SLA claim.`,dateTime(days)]);
        kpiRows.push([recordId('kpi'),tenantId,['REQUEST_SUCCESS_RATE','P95_LATENCY_MS','POLICY_PASS_RATE','MODEL_AVAILABILITY'][ri%4],Number((90+(ri%10)).toFixed(4)),ri%4===1?'MILLISECONDS':'PERCENT',dateTime(days),'DEMO']);
        guardrailRows.push([recordId('guardrail'),tenantId,`DEMO-RULE-${ti+1}-${String(ri+1).padStart(3,'0')}`,['privacy','safety','quota','data_residency'][ri%4],`Synthetic guardrail example for ${companyName}; enforcement remains illustrative.`,ri%4===0?'POPIA_SECTION_11':null,'REDACT_DEMO',1,ri*2,dateTime(days)]);
        dsarRows.push([recordId('dsar'),`DEMO-DSAR-${ti+1}-${String(ri+1).padStart(4,'0')}`,tenantId,`SYNTHETIC-SUBJECT-${ti+1}-${ri+1}`,['ACCESS','CORRECTION','DELETION','PORTABILITY'][ri%4],['NEW','IN_PROGRESS','COMPLETED'][ri%3],'POPIA_SECTION_23',dateOnly(days),dateOnly(days-30),ri%3===2?dateOnly(days-5):null,`privacy-${ti+1}@example.invalid`,1,'DEMO_VERIFICATION',`Fictional data-subject request for ${companyName}; contains no real personal information.`,createHash('sha256').update(`${tenantId}:${ri}:demo-dsar`).digest('hex'),dateTime(days),dateTime(days-1)]);
        breachRows.push([recordId('privacy-event'),`DEMO-PRIV-${ti+1}-${String(ri+1).padStart(4,'0')}`,tenantId,dateTime(days),0,null,0,ri%3,json(['synthetic identifiers']), 'SIMULATION',null,dateTime(days)]);
        communicationRows.push([recordId('comms'),tenantId,'outbound',['email','in_app','push'][ri%3],'demo_recorded',json({demoData:true,subject:`DEMO · ALTIL service notice ${ri+1}`,body:'Synthetic message history only. No email, SMS, or push notification was sent.',recipient:`demo-contact-${ti+1}@example.invalid`}),dateTime(days)]);
        const snapshotMonthDate=new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth()-ri-1,1));
        snapshotRows.push([recordId('snapshot'),tenantId,snapshotMonthDate.toISOString().slice(0,7),Number((amount*100).toFixed(4)),Number(((inputTokens+outputTokens)/1000000).toFixed(4)),1+ri%8,dateTime(days)]);
      }
      dependencyRows.push([id('dep',ti,perCompany),id('ci',ti,perCompany-1),id('ci',ti,0),'DEMO_DEPENDS_ON',1.1,dateTime(0)]);
      for (let month = 1; month <= 20; month++) {
        const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - month, 1));
        slaBreachRows.push([id('sla-breach-month',ti,month-1),tenantId,null,d.toISOString().slice(0,10),'P95_LATENCY_MS',250,255+month,0,'DEMO_SIMULATION','Synthetic monthly SLA exercise. No customer service credit was issued.',dateTime(month*30)]);
      }
    }

    await insert(connection,'tenant_licenses',['id','tenant_id','tenant_name','application_id','application_name','plan_id','plan_name','license_key','license_status','payment_status','start_date','renewal_date','active_enforcement','current_accrued_bill_usd','grace_period_days_remaining','last_payment_date','last_payment_amount','currency','metadata_json'],licenses);
    await insert(connection,'tenant_key_usage',['id','tenant_id','application_id','api_key_id','api_key_prefix','model_id','model_name','occurred_at','input_tokens','output_tokens','amount_usd','status'],usageRows);
    await insert(connection,'billing_invoices',['id','invoice_number','tenant_id','status','currency','due_at','total','paid','created_at','payload_json'],invoiceRows);
    await insert(connection,'billing_ledger_entries',['id','tenant_id','kind','amount','currency','reference','created_at','payload_json'],ledgerRows,['kind','amount','currency','reference','created_at','payload_json']);
    await insert(connection,'accounting_journals',['id','tenant_id','source_type','source_id','currency','description','posted_at','actor'],journalRows);
    await insert(connection,'accounting_journal_lines',['id','journal_id','account_code','account_name','debit','credit','memo'],journalLineRows);
    await insert(connection,'audit_logs',['id','timestamp','tenant_id','user_email','action_type','category','severity','ip_address','request_payload','raw_response_payload','created_at'],auditRows);
    await insert(connection,'operations_incidents',['id','incident_number','tenant_id','tenant_name','application_id','application_name','title','description','severity','status','affected_service','affected_provider','affected_model','owner_email','assignee_email','root_cause','containment_action','resolution_summary','sla_breached','mtta_minutes','mttr_minutes','is_major_incident','pir_required','pir_completed','created_at','updated_at'],incidentRows);
    await insert(connection,'incident_events',['id','incident_id','actor_email','event_type','description','metadata','created_at'],incidentEventRows);
    await insert(connection,'operations_problems',['id','tenant_id','problem_number','title','description','root_cause_category','workaround','permanent_fix','status','known_error','created_at','updated_at'],problemRows,['tenant_id']);
    await insert(connection,'change_requests',['id','tenant_id','change_number','title','change_type','risk_level','impact_scope','backout_plan','approval_status','approved_by','scheduled_start','scheduled_end','created_at'],changeRows,['tenant_id']);
    await insert(connection,'cmdb_items',['id','item_type_id','tenant_id','ci_code','name','status','environment','ip_endpoint','owner_email','criticality','attributes','created_at','updated_at'],cmdbRows);
    await insert(connection,'cmdb_dependencies',['id','source_ci_id','target_ci_id','relationship_type','impact_weight','created_at'],dependencyRows);
    await insert(connection,'sla_profiles',['id','tenant_id','profile_name','uptime_target_percent','p50_latency_target_ms','p95_latency_target_ms','p99_latency_target_ms','max_error_rate_percent','p1_response_sla_minutes','p2_response_sla_minutes','mtta_target_minutes','mttr_target_minutes','rto_target_minutes','rpo_target_minutes','credit_rebate_multiplier','support_hours'],slaProfileRows);
    await insert(connection,'service_sla_targets',['id','tenant_id','service_name','target_uptime_percent','target_latency_p95_ms','max_error_rate_percent','current_uptime_percent','current_latency_p95_ms','current_error_rate_percent'],slaTargetRows);
    await insert(connection,'sla_measurements',['id','tenant_id','measurement_date','uptime_measured_percent','p50_latency_measured_ms','p95_latency_measured_ms','p99_latency_measured_ms','total_requests','failed_requests','error_rate_measured_percent','provenance'],slaMeasurementRows);
    await insert(connection,'sla_breaches',['id','tenant_id','incident_id','breach_date','metric_name','target_value','actual_value','service_credit_amount_usd','credit_status','reconciliation_notes','created_at'],slaBreachRows);
    await insert(connection,'kpi_measurements',['id','tenant_id','kpi_code','metric_value','unit','recorded_at','provenance'],kpiRows);
    await insert(connection,'security_guardrails',['id','tenant_id','rule_code','category','description','popia_section','enforcement_mode','is_enabled','total_interceptions','created_at'],guardrailRows);
    await insert(connection,'compliance_dsar_requests',['id','request_number','tenant_id','data_subject_ref','request_type','status','statutory_basis','received_date','due_date','completed_date','assigned_officer_email','identity_verified','verification_method','redacted_summary','audit_hash','created_at','updated_at'],dsarRows);
    await insert(connection,'compliance_breach_events',['id','incident_number','tenant_id','detection_timestamp','regulator_notified','regulator_notification_date','data_subjects_notified','affected_records_count','data_categories_involved','remediation_status','information_officer_signoff','created_at'],breachRows);
    await insert(connection,'communication_messages',['id','tenant_id','direction','channel_type','status','payload_json','created_at'],communicationRows);
    await insert(connection,'financial_monthly_snapshots',['id','tenant_id','snapshot_month','spend_usd','tokens_consumed_millions','active_users_count','created_at'],snapshotRows);
    await insert(connection,'tenant_ai_profiles',['tenant_id','profile_json','updated_at'],profileRows,['profile_json','updated_at']);
    await connection.commit();

    const tables=['tenants','tenant_applications','tenant_api_keys','tenant_licenses','tenant_key_usage','billing_invoices','billing_ledger_entries','accounting_journals','accounting_journal_lines','audit_logs','operations_incidents','incident_events','operations_problems','change_requests','cmdb_items','cmdb_dependencies','sla_profiles','service_sla_targets','sla_measurements','sla_breaches','kpi_measurements','security_guardrails','compliance_dsar_requests','compliance_breach_events','communication_messages','financial_monthly_snapshots','tenant_ai_profiles'];
    const summary=[];
    for(const table of tables){const [rows]=await connection.execute(`SELECT COUNT(*) AS total FROM \`${table}\` WHERE ${table==='tenants'?'id LIKE ?':table==='licensing_plans'?'id LIKE ?':table==='tenant_ai_profiles'?'tenant_id LIKE ?':table==='tenant_applications'||table==='tenant_api_keys'||table==='tenant_licenses'||table==='tenant_key_usage'||table==='billing_invoices'||table==='billing_ledger_entries'||table==='accounting_journals'||table==='audit_logs'||table==='operations_incidents'||table==='sla_profiles'||table==='service_sla_targets'||table==='sla_measurements'||table==='sla_breaches'||table==='kpi_measurements'||table==='security_guardrails'||table==='compliance_dsar_requests'||table==='compliance_breach_events'||table==='communication_messages'||table==='financial_monthly_snapshots'?'tenant_id LIKE ?': 'id LIKE ?'}`,['demo-%']);summary.push({table,seeded:Number(rows[0].total)});}
    console.log(JSON.stringify({database:process.env.MARIADB_DATABASE||'altil_db',demoTenants:companies.map(([name])=>name),records:summary},null,2));
  } catch (error) { await connection.rollback(); throw error; }
  finally { await connection.end(); }
}

main().catch(error=>{console.error('Demo database seeding failed:',error?.message||'Unknown database error.');process.exitCode=1;});
