# Finance Reconciliation SOP

## Daily Reconciliation
1. Pull successful booking confirmations from app DB.
2. Pull successful Stripe captures for same period.
3. Match by booking reference/request metadata.
4. Investigate unmatched rows immediately.

## Weekly Controls
- Verify total captured payments vs booking total.
- Verify owner payout basis vs platform commission.
- Verify cancelled/refunded bookings are correctly reflected.

## Required Reports
- Bookings confirmed by day
- Payments captured by day
- Variance report (expected vs captured)
- Refund report

## Escalation Thresholds
- Variance > 1% daily revenue => P2 investigation.
- Missing payout records => P1 if affects owner settlement window.

## Month-End Close
- Lock reporting period.
- Approve final variance summary.
- Archive supporting exports and approval notes.
