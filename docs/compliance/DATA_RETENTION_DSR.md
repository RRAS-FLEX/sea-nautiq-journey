# Data Retention & DSR Operations

## Data Retention Baseline
- Keep booking transaction records per legal/accounting requirement.
- Minimize retention for support chat and non-essential telemetry.
- Store only required customer personal data for booking operations.

## DSR Request Types
- Access (export user data)
- Deletion (erase where legally permitted)
- Correction (fix inaccurate profile/booking contact data)

## DSR Workflow
1. Verify requester identity.
2. Open DSR ticket with timestamp and request scope.
3. Export data from relevant tables (`users`, `bookings`, `reviews`, `favorites`, support data if any).
4. For deletion requests:
   - anonymize where legal retention required
   - delete where allowed
5. Respond within policy SLA and archive completion evidence.

## Evidence Log (required)
- Request ID
- Requester identity proof
- Date received
- Date completed
- Tables affected
- Handler name

## Ready-to-Use Response Snippets
- "Your data export is ready and includes account profile, bookings, and related records."
- "Your deletion request has been completed, with legal retention exceptions documented."
