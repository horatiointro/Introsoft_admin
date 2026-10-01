# Phase B1 — Commercial catalogue and reseller authority

## Scope

B1 adds catalogue intelligence and resale/pricing authority over the existing `billing_products` records. It does not create another product or order ledger. Bundle membership is a typed product relationship, so later order conversion can expand a bundle into the existing `billing_order_lines` structure. B1 itself does not create or change orders.

## Product relationships

`commercial_product_relationships` stores directed, effective-dated links between existing products: requirements, recommendations, compatibility, upgrades/downgrades, add-ons, bundle members, alternatives, replacements, and follow-on products. Explanatory relationship types require an explanation. A bundle must be an existing product in the `bundle` category; its members must be existing non-bundle products. Nested bundles are rejected. Recommendations remain optional and never add a paid product automatically.

## Resale authority

`commercial_reseller_product_authorizations` grants one explicitly related child organization the right to resell one product for a bounded effective period. The owner must be under the Introsoft root through persisted, effective organization relationships, and the reseller must be a direct child relationship that remains effective for the whole authorization. A visible product is not necessarily sellable. A catalogue read reports the separate `resaleAuthorized` flag.

The write requires tenant-write authorization in the owner scope, a matching single-use global owner approval, an idempotency key, and an atomic business/approval/audit transaction. This commercial grant does not create IAM permissions, tenant access, customer visibility, or access to sibling reseller data.

## Pricing authority

The existing `billing_products.price` remains the base product price. `commercial_reseller_product_prices` records an effective reseller cost, a minimum customer price, and a recommended markup. The recommended customer price is calculated as reseller cost × (1 + markup/100), rounded to six decimals. It must not be below the minimum price. Currency must match the product currency; B1 does not infer FX. Existing `billing_products.cost_markup_percent` remains provider-inference cost markup and is not treated as reseller margin.

Price versions are linked to an active resale authorization. A new version may close the prior open-ended version inside the same transaction; conflicting or backdated overlapping versions are rejected. The persisted approval, effective dates, idempotency record, and audit row preserve the authorization context. No order price is snapshotted in B1; order-price authority and snapshots belong to B3.

## API and authorization

The protected routes are:

- `GET /api/v1/commercial/catalogue`
- `POST /api/v1/commercial/catalogue/relationships`
- `GET` and `POST /api/v1/commercial/reseller-authorizations`
- `GET` and `POST /api/v1/commercial/reseller-pricing`

All writes require `Idempotency-Key`; mutations consume an exact one-use owner approval and write an audit event in the existing Phase A transaction boundary. Read routes require the existing `billing.read` permission and persisted organization scope; write routes require `tenant.write` and object-level checks. Catalogue-wide product relationship changes require a GLOBAL Super Admin grant.

## Deliberate boundaries

- `billing_products`, orders, invoices, payments, refunds, reconciliation, settlement, and accounting remain existing financial authorities.
- Product relationships and bundle composition are catalogue data. Checkout and expansion into real order lines are not implemented in B1.
- Offers, quotes, acceptance, and quote-to-order conversion are B2.
- Order ownership/pricing snapshots are B3.
- Checkout and provider simulators are B4.
- Invoice/payment allocation lifecycle is B5; reconciliation and bank evidence are B6.
- Portals, revenue intelligence, and external reseller API are B7–B9.
- No special ALTIL.co.za behavior or reseller-specific customer dataset is introduced.
