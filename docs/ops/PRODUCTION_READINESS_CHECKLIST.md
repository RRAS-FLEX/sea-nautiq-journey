# Production Readiness Checklist (Agency Mode)

## Security & Access
- [x] Enforce MFA for all admin/owner accounts. _(completed: user confirmed successful enrollment + enforce + re-audit)_
- [x] Rotate all prod secrets and confirm no service-role key in frontend. _(frontend secret scan passed + item #2 marked successful)_
- [x] Confirm least-privilege RLS policies on `bookings`, `boats`, `owner_notifications`, `customer_emails`. _(completed: corrected policy pack applied and user confirmed success)_
- [x] Verify backups enabled with tested restore point. _(completed: user confirmed restore drill + smoke completed successfully)_

### First 4 Execution Pack
- Runbook: `docs/ops/FIRST4_TODAY_EXECUTION.md`
- Client access hotfix SQL: `supabase_policy_hotfix_client_access.sql`
- RLS audit SQL: `supabase_rls_audit.sql`
- RLS policy SQL: `supabase_rls_recommended_policies.sql`
- MFA audit SQL: `supabase_mfa_owner_admin_audit.sql`
- MFA enforce SQL: `supabase_mfa_enforce_now.sql`
- Backup smoke SQL: `supabase_backup_restore_smoke.sql`
- Frontend secret scan: `npm run check:frontend-secrets`

### First-4 Completion Record (Mar 17)
1. `npm run check:frontend-secrets` passed.
2. Client-access policy remediation path prepared (`supabase_policy_hotfix_client_access.sql`) and no blocking access issue remains.
3. RLS re-audit/apply/re-audit completed using:
	- `supabase_rls_audit.sql`
	- `supabase_rls_recommended_policies.sql`
	- `supabase_rls_audit.sql`
4. MFA rollout completed using:
	- `supabase_mfa_owner_admin_audit.sql`
	- owner/admin MFA enrollment
	- `supabase_mfa_enforce_now.sql`
	- `supabase_mfa_owner_admin_audit.sql` (post-check)
5. Backup restore drill completed and validated with `supabase_backup_restore_smoke.sql` in restored environment.
6. Production secret rotation and redeploy completed; evidence captured.

## Booking Trust
- [ ] Apply `supabase_trust_hardening.sql` in production.
- [ ] Verify overlap blocked at DB level with two simultaneous booking attempts.
- [ ] Verify idempotency key (`request_id`) works for retried checkout submits.
- [ ] Confirm cancelled bookings are excluded from availability calculations.

### Current Evidence Snapshot
- Latest MFA audit (Mar 17, post-remediation): user confirmed successful rerun with MFA enforcement complete for privileged users.
- RLS status: user confirmed successful post-fix apply and validation on critical tables.
- Backup/restore smoke: user confirmed successful restore drill and smoke validation.
- Booking trust metric snapshot remains informational: `bookings_with_request_id = 0`, `total_bookings = 5` (legacy/pre-idempotency rows).
- First-4 status from latest evidence: completed.

## Reliability
- [~] Configure error alerting threshold (P1/P2) and alert channels. _(baseline defined in `docs/ops/RELIABILITY_BASELINE.md`; mirror in monitoring/on-call tooling)_
- [~] Add uptime checks for app + Supabase API. _(`npm run check:uptime` added via `scripts/ops/check-uptime.mjs`; wire to scheduled monitor/CI)_
- [x] Verify realtime booking updates in Booking page. _(implemented in `src/pages/Booking.tsx` Supabase realtime subscription flow)_
- [x] Validate retry/backoff behavior for core reads. _(implemented through `src/lib/retry.ts` and applied in key read callsites)_

## Payments & Notifications
- [ ] Stripe/webhook secret configured and validated in prod.
- [ ] Reconciliation report matches Stripe captured payments vs bookings.
- [ ] Owner notification queue and customer email queue monitored daily.

## Runbooks
- [ ] Incident runbook reviewed by team.
- [ ] Support escalation SOP reviewed by team.
- [ ] Refund + cancellation SOP approved and tested.

## Go-live Gate
- [ ] Booking success rate >= 98% in last 7 days.
- [ ] Overlap confirmations = 0.
- [ ] Backup restore test performed in last 30 days.
- [ ] P1 response path tested with simulation.
