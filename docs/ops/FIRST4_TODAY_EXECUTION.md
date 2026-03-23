# First 4 Checklist Items — Execute Today

## Scope
1. Enforce MFA for all admin/owner accounts.
2. Rotate all prod secrets and confirm no service-role key in frontend.
3. Confirm least-privilege RLS policies on critical tables.
4. Verify backups enabled with tested restore point.

## 1) MFA (Owner/Admin) — Manual Dashboard Step
- Run this only after client reads are confirmed healthy.
- Go to Supabase Auth settings and enforce MFA policy for sensitive roles.
- Run SQL audit first: `supabase_mfa_owner_admin_audit.sql`
- Apply: `supabase_mfa_enforce_now.sql`
- Important: the corrected MFA script blocks privileged writes without MFA, not reads.
- Evidence to capture:
  - screenshot of MFA policy enabled
  - SQL output proving owner/admin accounts have `mfa_enabled = true`
  - one successful owner/admin MFA sign-in test

## 2) Secret Rotation + Frontend Secret Safety
### Local safety check (run now)
- Command: `node scripts/security/check-frontend-secrets.mjs`
- Expected: `✅ Secret scan passed`

### Rotation checklist (prod)
- Rotate anon key and all integration secrets.
- Update deployment platform env vars.
- Restart deployment.
- Confirm app still authenticates and reads/writes successfully.

## 3) RLS Audit (Critical Tables)
- If boats, history, or owner data disappeared after the earlier hardening apply, run `supabase_policy_hotfix_client_access.sql` before anything else.
- Run SQL: `supabase_rls_audit.sql`
- Confirm:
  - `rls_enabled = true` for each table
  - policies exist and are least-privilege for owner/customer/admin paths
- Apply corrected policy pack (after review): `supabase_rls_recommended_policies.sql`
- Re-run `supabase_rls_audit.sql` and verify the app still shows public boats, history, and booking confirmation side effects.

## 4) Backup + Restore Point
- In Supabase project settings, verify backup policy enabled.
- Execute one restore-point drill in non-production/staging.
- Run post-restore smoke SQL: `supabase_backup_restore_smoke.sql`
- Evidence to capture:
  - backup schedule screenshot
  - restore completion timestamp
  - post-restore smoke query result

## Completion Evidence Block
- MFA enabled: [ ] _(latest audit still shows all privileged users with `mfa_enabled=false`)_
- Secret scan passed locally: [x]
- Secrets rotated in prod: [x]
- RLS audit completed: [x]
- Backup + restore drill completed: [~] _(partial smoke output shared; full restored-env evidence still pending)_

## SQL Files for First 4
- `supabase_policy_hotfix_client_access.sql`
- `supabase_mfa_owner_admin_audit.sql`
- `supabase_rls_audit.sql`
- `supabase_rls_recommended_policies.sql`
- `supabase_mfa_enforce_now.sql`
- `supabase_backup_restore_smoke.sql`
