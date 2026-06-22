# SmartInvoice Pro — Functional Analysis

## 1. Overview

**SmartInvoice Pro** is a cloud-based (SaaS) invoicing and billing platform for freelancers, micro-businesses, and small-to-medium enterprises (SMEs). It is functionally comparable to Facturago: it lets users create, send, and track professional invoices and quotes, manage clients and products, collect online payments, and stay compliant with local tax and e-invoicing regulations.

The platform is multi-tenant: each customer account (an "organization") has fully isolated data, its own users, and its own billing subscription to SmartInvoice Pro itself.

### 1.1 Vision

Reduce the time a small business spends on administrative billing from hours to minutes, while ensuring legal compliance and faster cash collection.

### 1.2 Business Goals

| Goal | Metric |
|------|--------|
| Faster invoice creation | < 60 seconds to issue a standard invoice |
| Faster payment collection | Reduce average days-to-payment (DSO) by 30% |
| Compliance | 100% legally compliant invoice numbering & tax reporting |
| Retention | Monthly churn < 3% |
| Self-service onboarding | < 10 minutes from signup to first invoice |

## 2. Scope

### 2.1 In Scope (MVP + V1)

- Organization & user account management (multi-tenant)
- Client / customer management (CRM-lite)
- Product & service catalog
- Quotes / estimates with conversion to invoices
- Invoice creation, editing, and lifecycle management
- Recurring invoices & subscriptions
- Tax management (VAT/sales tax, multiple rates)
- PDF generation and branded templates
- Email delivery & client portal
- Online payments (Stripe, PayPal)
- Payment tracking & partial payments
- Credit notes / refunds
- Expense tracking (basic)
- Dashboard & reporting
- Multi-currency & multi-language
- Notifications & reminders

### 2.2 Out of Scope (initial releases)

- Full double-entry accounting / general ledger
- Payroll
- Inventory management with stock levels
- Bank reconciliation feeds (deferred to later phase)
- Native mobile apps (responsive web first)

## 3. Actors / User Roles

| Actor | Description |
|-------|-------------|
| **Owner / Admin** | Creates the organization, manages billing, users, and global settings. Full access. |
| **Accountant / Member** | Creates and manages invoices, clients, products. Cannot manage billing or delete the org. |
| **Viewer** | Read-only access to invoices and reports. |
| **Client (External)** | Receives invoices, views them via client portal, pays online. No internal login required. |
| **System** | Automated jobs: recurring invoices, reminders, payment webhooks, scheduled reports. |
| **Platform Super-Admin** | SmartInvoice Pro staff: manages tenants, subscriptions, support, feature flags. |

## 4. Functional Requirements

### 4.1 Authentication & Account Management
- FR-1: Users can sign up with email/password or SSO (Google).
- FR-2: Email verification is required before issuing invoices.
- FR-3: Users can reset passwords and enable two-factor authentication (2FA).
- FR-4: An organization can invite team members and assign roles.
- FR-5: Sessions are managed via JWT with refresh tokens; admins can revoke sessions.

### 4.2 Organization Settings
- FR-6: Configure company identity (name, legal ID/tax number, address, logo).
- FR-7: Configure invoice defaults: numbering scheme, currency, default tax rate, payment terms.
- FR-8: Upload brand assets and choose an invoice template/theme.
- FR-9: Configure legal/footer text and bank details for payment.

### 4.3 Client Management
- FR-10: CRUD operations on clients (individual or company).
- FR-11: Store billing & shipping addresses, tax ID, contacts, preferred currency/language.
- FR-12: View per-client history: invoices, quotes, payments, outstanding balance.
- FR-13: Import/export clients via CSV.

### 4.4 Product & Service Catalog
- FR-14: CRUD operations on products/services with name, description, unit price, tax rate, unit.
- FR-15: Support for service (hours) and product (quantity) line types.
- FR-16: Optional SKU and category for organization.

### 4.5 Quotes / Estimates
- FR-17: Create quotes with line items, discounts, and taxes.
- FR-18: Send quotes to clients; client can accept/decline via portal.
- FR-19: Convert an accepted quote into an invoice in one click.
- FR-20: Quote statuses: Draft, Sent, Accepted, Declined, Expired.

### 4.6 Invoicing (Core)
- FR-21: Create invoices with multiple line items, quantities, unit prices.
- FR-22: Apply line-level and invoice-level discounts (percentage or fixed).
- FR-23: Apply multiple tax rates; compute subtotals, tax, and totals automatically.
- FR-24: Sequential, gap-free, compliant invoice numbering per organization & fiscal year.
- FR-25: Invoice statuses: Draft, Sent, Viewed, Partially Paid, Paid, Overdue, Cancelled.
- FR-26: Generate a branded PDF for each invoice.
- FR-27: Once issued, invoices are immutable; corrections require a credit note.
- FR-28: Duplicate an existing invoice as a starting template.
- FR-29: Attach files (e.g., timesheets, delivery notes) to an invoice.

### 4.7 Recurring Invoices & Subscriptions
- FR-30: Define a recurring schedule (daily/weekly/monthly/yearly, end date or occurrences).
- FR-31: Automatically generate and optionally auto-send invoices on schedule.
- FR-32: Pause, resume, and cancel recurring profiles.

### 4.8 Payments
- FR-33: Integrate online payment gateways (Stripe, PayPal).
- FR-34: Provide a "Pay Now" button in invoice emails and the client portal.
- FR-35: Record manual/offline payments (bank transfer, cash, cheque).
- FR-36: Support partial payments and track remaining balance.
- FR-37: Reconcile gateway webhooks to mark invoices paid automatically.
- FR-38: Issue credit notes and refunds.

### 4.9 Notifications & Reminders
- FR-39: Send invoice issued, payment received, and quote accepted notifications.
- FR-40: Configure automated overdue reminders (e.g., 3 days before due, on due, 7 days after).
- FR-41: In-app notification center for org users.

### 4.10 Dashboard & Reporting
- FR-42: Dashboard with KPIs: revenue, outstanding, overdue, paid this month, top clients.
- FR-43: Reports: revenue by period, tax summary (VAT report), aging report, client statements.
- FR-44: Export reports to CSV/PDF.

### 4.11 Internationalization & Compliance
- FR-45: Multi-currency invoices with exchange-rate snapshot at issue time.
- FR-46: Multi-language UI and invoice templates.
- FR-47: Configurable tax rules and tax-inclusive/exclusive pricing.
- FR-48: GDPR-compliant data handling (export & delete on request).
- FR-49: Audit log of key actions (invoice issued, deleted, payment recorded).

### 4.12 Platform Administration (SaaS)
- FR-50: Subscription plans (Free, Pro, Business) with feature gating and usage limits.
- FR-51: Billing for SmartInvoice Pro subscriptions (Stripe Billing).
- FR-52: Usage metering (invoices/month, users, storage).
- FR-53: Super-admin console for tenant management and support impersonation (audited).

## 5. Non-Functional Requirements

| Category | Requirement |
|----------|-------------|
| **Performance** | Invoice list loads < 1s for up to 10k invoices (paginated). PDF generation < 3s. |
| **Availability** | 99.9% uptime SLA for paid plans. |
| **Scalability** | Horizontally scalable stateless API; supports 50k+ tenants. |
| **Security** | Encryption in transit (TLS 1.2+) and at rest; OWASP Top 10 mitigations; tenant data isolation. |
| **Compliance** | GDPR, local e-invoicing/tax regulations, PCI-DSS via gateway tokenization (no raw card storage). |
| **Reliability** | Gap-free invoice numbering guaranteed even under concurrency; idempotent payment webhooks. |
| **Usability** | Responsive design; WCAG 2.1 AA accessibility; onboarding wizard. |
| **Maintainability** | Modular service boundaries; >80% test coverage on billing logic. |
| **Observability** | Centralized logging, metrics, tracing, and alerting. |
| **Localization** | Support at least EN, FR, ES, AR at launch (RTL support for AR). |

## 6. Business Rules

- BR-1: Invoice numbers must be sequential and gap-free within an organization's fiscal year and numbering series.
- BR-2: A finalized (issued) invoice cannot be edited or deleted; only cancelled via credit note.
- BR-3: Tax is calculated per line based on the applicable rate, then summed; rounding follows local rules (half-up, 2 decimals by default).
- BR-4: A payment cannot exceed the invoice's outstanding balance (overpayment creates a credit).
- BR-5: Currency is fixed at invoice creation; exchange rate is snapshotted.
- BR-6: Recurring profiles generate invoices in the org's timezone at the scheduled time.
- BR-7: A client cannot be hard-deleted if they have issued invoices; they are archived instead.
- BR-8: Feature access and quotas are enforced according to the active subscription plan.

## 7. Assumptions & Dependencies

- Payment processing relies on third-party gateways (Stripe, PayPal); no card data is stored.
- Email delivery relies on a transactional email provider (e.g., SendGrid/SES).
- Exchange rates are fetched from an external FX rate provider, cached daily.
- E-invoicing legal formats vary by country; initial release targets standard PDF + selected e-formats.

## 8. Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Regulatory changes in e-invoicing | High | Pluggable tax/compliance module; monitor per-country rules. |
| Payment gateway downtime | Medium | Multiple gateways; retry & manual payment fallback. |
| Numbering integrity under load | High | DB-level sequences/locking; thorough concurrency tests. |
| Tenant data leakage | Critical | Row-level isolation, automated tenant-scoping tests. |
| PDF rendering inconsistency | Medium | Headless rendering service with template tests. |
