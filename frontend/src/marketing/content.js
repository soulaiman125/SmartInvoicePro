// Single source of truth for marketing copy so previews on the landing page and
// the dedicated Features/Pricing pages never drift.

export const FEATURES = [
  {
    icon: 'invoices',
    title: 'Invoicing',
    desc: 'Create compliant, branded invoices in seconds with sequential numbering, tax handling and multi-currency support.',
    points: ['Sequential, gap-free numbering', 'Per-line tax & discounts', 'Premium PDF templates'],
  },
  {
    icon: 'quotes',
    title: 'Quotes',
    desc: 'Send professional quotations, track acceptance, and convert them into invoices with a single click.',
    points: ['Accept / decline tracking', 'One-click convert to invoice', 'Validity & e-acceptance'],
  },
  {
    icon: 'inventory',
    title: 'Inventory',
    desc: 'Track stock levels in real time with automatic movements on every issued invoice and low-stock alerts.',
    points: ['Automatic stock movements', 'Low-stock alerts', 'Adjustments & audit trail'],
  },
  {
    icon: 'clients',
    title: 'Clients',
    desc: 'A clean CRM for every customer — contacts, billing details, history and a secure self-service portal.',
    points: ['Company & individual profiles', 'Secure customer portal', 'Full billing history'],
  },
  {
    icon: 'payments',
    title: 'Payments',
    desc: 'Record card, bank, cash and gateway payments, with partial payments and instant receipts.',
    points: ['Partial & installment payments', 'Automatic receipts', 'Refunds & reconciliation'],
  },
  {
    icon: 'bar-chart',
    title: 'Reports',
    desc: 'Revenue, client, product, outstanding and payment reports — exportable to CSV, Excel and PDF.',
    points: ['CSV · Excel · PDF export', 'Outstanding & aging', 'Date-range filtering'],
  },
  {
    icon: 'dashboard',
    title: 'Dashboard Analytics',
    desc: 'See revenue trends, top clients and products, and cash flow at a glance — updated in real time.',
    points: ['12-month revenue trends', 'Top clients & products', 'Live KPIs'],
  },
];

export const PRICING = [
  {
    name: 'Starter',
    price: 0,
    cadence: 'forever',
    tagline: 'For freelancers getting started.',
    cta: 'Start free',
    features: ['Up to 5 invoices / month', '1 user', 'Clients & products', 'Standard PDF template', 'Email support'],
  },
  {
    name: 'Pro',
    price: 15,
    cadence: 'per month',
    tagline: 'For growing businesses.',
    cta: 'Start free trial',
    highlight: true,
    features: [
      'Up to 200 invoices / month',
      '5 team members',
      'Quotes & inventory',
      'Premium PDF templates',
      'Email delivery & reminders',
      'Customer portal',
      'Reports & analytics',
    ],
  },
  {
    name: 'Business',
    price: 49,
    cadence: 'per month',
    tagline: 'For established teams at scale.',
    cta: 'Start free trial',
    features: [
      'Unlimited invoices',
      '25 team members',
      'Multi-currency',
      'Advanced reports & exports',
      'API access',
      'Priority support',
      'Audit logs',
    ],
  },
];

export const TESTIMONIALS = [
  {
    quote:
      'We replaced three tools with SmartInvoice Pro. Our team sends invoices in seconds and gets paid days faster.',
    name: 'Maria Sanchez',
    role: 'Founder, Cedar & Oak Interiors',
    initials: 'MS',
  },
  {
    quote:
      'The dashboard analytics give me the clarity I used to pay an accountant for. It just feels premium.',
    name: 'James Whitfield',
    role: 'CEO, Vertex Engineering',
    initials: 'JW',
  },
  {
    quote:
      'The customer portal and automatic reminders cut our overdue invoices by 40% in the first quarter.',
    name: 'Lena Park',
    role: 'Finance Lead, Meridian Software Labs',
    initials: 'LP',
  },
];

export const FAQS = [
  {
    q: 'Is there a free plan?',
    a: 'Yes. The Starter plan is free forever and includes up to 5 invoices per month — no credit card required.',
  },
  {
    q: 'Can I try the paid features?',
    a: 'Every paid plan starts with a 14-day free trial. You can upgrade, downgrade or cancel at any time.',
  },
  {
    q: 'Do you support multiple currencies and taxes?',
    a: 'Absolutely. Set per-line tax rates, discounts, and multi-currency invoicing with locale-aware formatting.',
  },
  {
    q: 'Can my clients pay and view invoices online?',
    a: 'Yes. Share a secure, tokenized customer portal link where clients can view invoices, quotes and payment history, and download PDFs — no login required.',
  },
  {
    q: 'Can I export my data?',
    a: 'All reports export to CSV, Excel and PDF, and you own your data — export anytime.',
  },
  {
    q: 'Is my data secure?',
    a: 'We use hashed tokens, role-based access control and audit logging throughout. Your data is encrypted in transit.',
  },
];

export const COMPANIES = ['Northwind', 'Lumen', 'Acme Corp', 'Quantum', 'Harborview', 'Vertex', 'Meridian'];

export const STATS = [
  { value: '12k+', label: 'Businesses' },
  { value: '$480M', label: 'Invoiced' },
  { value: '99.9%', label: 'Uptime' },
  { value: '4.9/5', label: 'Avg. rating' },
];
