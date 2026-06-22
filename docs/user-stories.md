# SmartInvoice Pro — User Stories

Stories follow the format: *As a `<role>`, I want `<goal>` so that `<benefit>`.*
Each story includes acceptance criteria (AC) in Given/When/Then form where useful.
Priority uses MoSCoW: **M** = Must, **S** = Should, **C** = Could, **W** = Won't (now).

---

## Epic 1: Account & Onboarding

### US-1.1 — Sign up (M)
As a **business owner**, I want to create an account so that I can start invoicing.
- AC: Email + password signup; password strength enforced.
- AC: A verification email is sent; account is limited until verified.
- AC: An organization is auto-created and I become its Owner.

### US-1.2 — Onboarding wizard (S)
As a **new owner**, I want a guided setup so that my invoices look professional immediately.
- AC: Steps capture company name, logo, tax ID, currency, default tax rate, and numbering.
- AC: Wizard can be skipped and resumed later.

### US-1.3 — Invite team members (S)
As an **owner**, I want to invite teammates with roles so that we can collaborate.
- AC: Invite by email; invitee sets a password via secure link.
- AC: Roles available: Admin, Member, Viewer.

### US-1.4 — Two-factor authentication (S)
As a **user**, I want to enable 2FA so that my account is more secure.
- AC: TOTP-based; recovery codes provided.

---

## Epic 2: Client Management

### US-2.1 — Create a client (M)
As a **member**, I want to add a client so that I can invoice them.
- AC: Capture name, type (person/company), email, address, tax ID, currency, language.
- AC: Email format validated; duplicates flagged by email/tax ID.

### US-2.2 — View client history (S)
As a **member**, I want to see a client's invoices and balance so that I know their standing.
- AC: Shows total billed, total paid, outstanding, and overdue amounts.

### US-2.3 — Import clients via CSV (C)
As a **member**, I want to bulk-import clients so that I can migrate from another tool.
- AC: Column mapping UI; validation report with row-level errors.

---

## Epic 3: Products & Catalog

### US-3.1 — Manage products/services (M)
As a **member**, I want a catalog of products/services so that I can add them quickly to invoices.
- AC: Capture name, description, unit price, tax rate, unit type.
- AC: Selecting a catalog item pre-fills the invoice line.

---

## Epic 4: Quotes / Estimates

### US-4.1 — Create a quote (S)
As a **member**, I want to create a quote so that clients can approve work before invoicing.
- AC: Same line-item editor as invoices; status starts Draft.

### US-4.2 — Client accepts a quote (S)
As a **client**, I want to accept or decline a quote online so that I can confirm work.
- AC: Accept/Decline buttons on the portal; status and timestamp recorded.

### US-4.3 — Convert quote to invoice (S)
As a **member**, I want to convert an accepted quote to an invoice so that I avoid re-entering data.
- AC: One-click conversion preserving line items; quote linked to the new invoice.

---

## Epic 5: Invoicing (Core)

### US-5.1 — Create an invoice (M)
As a **member**, I want to create an invoice with line items so that I can bill a client.
- AC: Add multiple lines with quantity, unit price, tax, and discount.
- AC: Subtotal, tax, discount, and total recalculate live.
- AC: Saving as Draft does not consume an invoice number.

### US-5.2 — Issue an invoice with compliant numbering (M)
As a **member**, I want issued invoices to get a sequential number so that I stay compliant.
- AC: Given two invoices issued concurrently, When both finalize, Then each gets a unique, gap-free number.
- AC: Once issued, the invoice becomes immutable.

### US-5.3 — Generate a branded PDF (M)
As a **member**, I want a PDF of my invoice so that I can share a professional document.
- AC: PDF includes logo, company/client details, line items, taxes, totals, and payment instructions.

### US-5.4 — Send an invoice by email (M)
As a **member**, I want to email an invoice so that the client receives it directly.
- AC: Customizable subject/body; PDF attached and/or portal link included.
- AC: Status changes to Sent; delivery is logged.

### US-5.5 — Track invoice views (S)
As a **member**, I want to know when a client opens an invoice so that I can follow up.
- AC: Status updates to Viewed with timestamp on first portal view.

### US-5.6 — Duplicate an invoice (C)
As a **member**, I want to duplicate an invoice so that recurring-but-irregular billing is faster.
- AC: Creates a Draft copy with a new (unassigned) number.

### US-5.7 — Cancel via credit note (M)
As a **member**, I want to issue a credit note so that I can correct or cancel an issued invoice legally.
- AC: Credit note references the original invoice and adjusts the balance.

---

## Epic 6: Recurring Invoices

### US-6.1 — Set up recurring invoice (S)
As a **member**, I want to schedule recurring invoices so that subscriptions bill automatically.
- AC: Choose frequency, start/end (or occurrence count), and auto-send option.
- AC: System generates invoices on schedule in the org timezone.

### US-6.2 — Manage recurring profile (S)
As a **member**, I want to pause/resume/cancel a recurring profile so that I control billing.
- AC: Pausing stops generation without losing history.

---

## Epic 7: Payments

### US-7.1 — Pay online (M)
As a **client**, I want to pay an invoice online so that settling is convenient.
- AC: "Pay Now" opens a secure gateway checkout (Stripe/PayPal).
- AC: On success, the invoice is marked Paid (or Partially Paid) automatically via webhook.

### US-7.2 — Record a manual payment (M)
As a **member**, I want to record offline payments so that my records stay accurate.
- AC: Capture amount, date, method, and reference; supports partial amounts.

### US-7.3 — Partial payments (S)
As a **member**, I want to track partial payments so that I see the remaining balance.
- AC: Status becomes Partially Paid; remaining balance shown until fully settled.

### US-7.4 — Refund / credit (S)
As a **member**, I want to issue refunds so that I can return funds to a client.
- AC: Refund recorded against payment; gateway refund triggered when applicable.

---

## Epic 8: Notifications & Reminders

### US-8.1 — Automated overdue reminders (S)
As a **member**, I want automatic reminders sent for overdue invoices so that I get paid faster.
- AC: Configurable schedule (before/on/after due date); reminders logged and stoppable once paid.

### US-8.2 — Payment received notification (M)
As a **member**, I want to be notified when payment arrives so that I can update my books.
- AC: In-app + email notification on successful payment.

---

## Epic 9: Dashboard & Reporting

### US-9.1 — View dashboard KPIs (M)
As an **owner**, I want a dashboard so that I understand my business at a glance.
- AC: Shows revenue, outstanding, overdue, paid this month, and recent activity.

### US-9.2 — Tax (VAT) report (S)
As an **accountant**, I want a tax report for a period so that I can file returns.
- AC: Summarizes tax collected by rate; exportable to CSV/PDF.

### US-9.3 — Aging report (S)
As an **owner**, I want an accounts-receivable aging report so that I can chase debts.
- AC: Buckets outstanding amounts (0-30, 31-60, 61-90, 90+ days).

---

## Epic 10: Internationalization & Compliance

### US-10.1 — Multi-currency invoicing (S)
As a **member**, I want to invoice in a client's currency so that I serve global clients.
- AC: Currency chosen per invoice; FX rate snapshotted at issue time.

### US-10.2 — Multi-language invoices (S)
As a **member**, I want invoices in the client's language so that they are clear.
- AC: Template language follows the client's preference; RTL supported for Arabic.

### US-10.3 — Export & delete my data (M)
As an **owner**, I want to export or delete org data so that I comply with GDPR.
- AC: Full export (JSON/CSV); deletion request honored within policy SLA with audit trail.

---

## Epic 11: SaaS Platform & Billing

### US-11.1 — Subscribe to a plan (M)
As an **owner**, I want to choose a subscription plan so that I unlock the features I need.
- AC: Plans (Free/Pro/Business) with clear limits; upgrade/downgrade via Stripe Billing.

### US-11.2 — Enforce plan limits (M)
As the **system**, I must enforce usage limits so that plans are respected.
- AC: When a Free org exceeds its monthly invoice quota, further issuing is blocked with an upgrade prompt.

### US-11.3 — Super-admin tenant management (S)
As a **platform super-admin**, I want to manage tenants so that I can support and operate the service.
- AC: View tenants, subscription status, usage; impersonate with full audit logging.

---

## Story Map Summary

| Release | Epics included |
|---------|----------------|
| **MVP** | 1, 2, 3, 5 (core), 7 (manual + Stripe), 9 (basic dashboard), 11 (basic plans) |
| **V1**  | 4, 6, 8, 9 (reports), 10 |
| **V2**  | Advanced 11 (metering), expenses, bank feeds, mobile |
