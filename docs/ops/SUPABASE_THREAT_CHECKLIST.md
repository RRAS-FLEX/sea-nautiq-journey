# Supabase Threat Checklist (RLS/Data Exposure)

## Current Risk Snapshot
- Dependency scan is clean (`npm audit` found 0 vulnerabilities).
- Main app-level security posture is improved (service-role key guard in client config and chart CSS token hardening).
- Highest ongoing risk is policy drift in Supabase SQL scripts/orders, not npm packages.

## High-Priority Checks
1. Run `supabase_rls_threat_audit.sql` after every policy migration.
2. Confirm no `RESTRICTIVE ... FOR ALL` MFA guard policies exist on critical tables.
3. Confirm no broad `USING (true)` or `WITH CHECK (true)` appears on sensitive read/write paths unless explicitly accepted.
4. Confirm `bookings` SELECT remains customer/owner/admin scoped.
5. If policy counts show drift/overlap, run `supabase_rls_policy_cleanup.sql`, then rerun `supabase_rls_threat_audit.sql`.

## Notable Design Risks
- `owner_notifications` and `customer_emails` currently allow broad insert checks in the policy pack (`WITH CHECK (true)`).
  - This keeps current booking UX working from client-side code.
  - It also increases abuse/spam risk if endpoint traffic is not rate-limited.
  - Recommended medium-term fix: move notification/email inserts into a server-side function or edge function with stricter checks.
- SQL execution order can accidentally re-open broad policies if older migration scripts are rerun after hardening scripts.

## Recommended Guardrails
- Keep `supabase_rls_recommended_policies.sql` as the final authority for critical tables.
- Run `supabase_rls_threat_audit.sql` + `supabase_rls_audit.sql` after every deploy touching auth/RLS.
- Add a release gate: block production rollout if threat audit returns rows in section (2) or (3).
- Preserve MFA write-only restriction pattern (insert/update/delete guarded, read path unaffected).

## Verification Cadence
- Every auth/RLS change: run both audit scripts immediately.
- Weekly: rerun threat audit and capture result screenshot/export in ops evidence.
- Before go-live: confirm zero failing rows in sections (2) and (3) of threat audit.
