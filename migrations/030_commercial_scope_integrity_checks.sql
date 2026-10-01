-- Keep persisted link purposes and effective periods inside the Phase A contract.
ALTER TABLE commercial_organization_tenant_scopes
  ADD CONSTRAINT ck_commercial_org_scope_type CHECK (scope_link_type IN ('PRIMARY','PRODUCTION','SANDBOX','DEVELOPMENT')),
  ADD CONSTRAINT ck_commercial_org_scope_period CHECK (effective_to IS NULL OR effective_to > effective_from);

ALTER TABLE commercial_customer_tenant_links
  ADD CONSTRAINT ck_commercial_customer_scope_type CHECK (scope_link_type IN ('CUSTOMER_RUNTIME','CUSTOMER_INTEGRATION')),
  ADD CONSTRAINT ck_commercial_customer_scope_period CHECK (effective_to IS NULL OR effective_to > effective_from);

ALTER TABLE commercial_evidence_approvals
  ADD CONSTRAINT ck_commercial_scope_approval_details CHECK (
    (operation = 'ORGANIZATION_TENANT_SCOPE_CREATE' AND target_tenant_id IS NOT NULL AND requested_scope_link_type IS NOT NULL AND requested_effective_from IS NOT NULL AND (requested_effective_to IS NULL OR requested_effective_to > requested_effective_from))
    OR
    (operation <> 'ORGANIZATION_TENANT_SCOPE_CREATE' AND target_tenant_id IS NULL AND requested_scope_link_type IS NULL AND requested_effective_from IS NULL AND requested_effective_to IS NULL)
  );
