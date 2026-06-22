// Static demo dataset for SmartInvoice Pro.
// Money values are in MINOR units (cents). Tax is in basis points (1000 = 10%).
// Imported by seed.js, which wires these into the relational graph.

// Deterministic PRNG so re-seeding produces the same realistic dataset.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function rand() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// 15 realistic business clients (13 companies + 2 individuals).
export const CLIENTS = [
  { type: 'company', name: 'Nimbus Web Studio', email: 'billing@nimbusweb.io', taxId: 'US-48-2910011', city: 'Austin', state: 'TX' },
  { type: 'company', name: 'Brightline Marketing Group', email: 'accounts@brightline.co', taxId: 'US-27-7741200', city: 'Denver', state: 'CO' },
  { type: 'company', name: 'Cedar & Oak Interiors', email: 'hello@cedarandoak.com', taxId: 'US-83-1120945', city: 'Portland', state: 'OR' },
  { type: 'company', name: 'Quantum Logistics LLC', email: 'ap@quantumlogistics.com', taxId: 'US-19-5530028', city: 'Memphis', state: 'TN' },
  { type: 'company', name: 'Harborview Consulting', email: 'finance@harborview.consulting', taxId: 'US-61-9982314', city: 'Seattle', state: 'WA' },
  { type: 'company', name: 'Meridian Software Labs', email: 'invoices@meridianlabs.dev', taxId: 'US-90-3345781', city: 'San Jose', state: 'CA' },
  { type: 'company', name: 'Greenfield Organic Farms', email: 'orders@greenfieldfarms.com', taxId: 'US-44-2098117', city: 'Madison', state: 'WI' },
  { type: 'company', name: 'Apex Fitness Co.', email: 'billing@apexfitness.com', taxId: 'US-56-6612340', city: 'Miami', state: 'FL' },
  { type: 'company', name: 'Lumen Photography', email: 'studio@lumenphoto.com', taxId: 'US-72-1144908', city: 'Nashville', state: 'TN' },
  { type: 'company', name: 'Riverstone Law Partners', email: 'accounting@riverstonelaw.com', taxId: 'US-30-8847123', city: 'Chicago', state: 'IL' },
  { type: 'company', name: 'Summit Architecture', email: 'ap@summitarch.com', taxId: 'US-15-9023447', city: 'Boulder', state: 'CO' },
  { type: 'company', name: 'Coastal Catering Services', email: 'events@coastalcatering.com', taxId: 'US-88-4471203', city: 'San Diego', state: 'CA' },
  { type: 'company', name: 'Vertex Engineering', email: 'billing@vertexeng.com', taxId: 'US-21-7790148', city: 'Houston', state: 'TX' },
  { type: 'individual', name: 'Maria Sanchez', email: 'maria.sanchez.design@gmail.com', taxId: null, city: 'Phoenix', state: 'AZ' },
  { type: 'individual', name: 'James Whitfield', email: 'jwhitfield.consult@outlook.com', taxId: null, city: 'Atlanta', state: 'GA' },
];

// 30 products: 16 services (no inventory) + 14 physical goods (inventory tracked).
// price is in cents. taxBps references the tax rate applied on invoice lines.
// For tracked goods, `received` is the initial stock and `threshold` the low-stock line.
export const PRODUCTS = [
  // --- Services (trackInventory: false) ---
  { name: 'Website Design Package', sku: 'SVC-WEB-001', price: 350000, unit: 'project', category: 'Web Services', taxBps: 1000 },
  { name: 'SEO Audit & Strategy', sku: 'SVC-SEO-002', price: 120000, unit: 'project', category: 'Marketing', taxBps: 1000 },
  { name: 'Brand Identity Design', sku: 'SVC-BRD-003', price: 280000, unit: 'project', category: 'Design', taxBps: 1000 },
  { name: 'Monthly Marketing Retainer', sku: 'SVC-RET-004', price: 200000, unit: 'month', category: 'Marketing', taxBps: 1000 },
  { name: 'Consulting (Senior)', sku: 'SVC-CON-005', price: 18500, unit: 'hour', category: 'Consulting', taxBps: 0 },
  { name: 'Logo Design', sku: 'SVC-LOG-006', price: 95000, unit: 'project', category: 'Design', taxBps: 1000 },
  { name: 'Social Media Management', sku: 'SVC-SMM-007', price: 150000, unit: 'month', category: 'Marketing', taxBps: 1000 },
  { name: 'Copywriting', sku: 'SVC-CPY-008', price: 12000, unit: 'page', category: 'Content', taxBps: 1000 },
  { name: 'Photography Session', sku: 'SVC-PHO-009', price: 85000, unit: 'session', category: 'Creative', taxBps: 1000 },
  { name: 'Video Editing', sku: 'SVC-VID-010', price: 14000, unit: 'hour', category: 'Creative', taxBps: 1000 },
  { name: 'App Development Sprint', sku: 'SVC-APP-011', price: 600000, unit: 'sprint', category: 'Software', taxBps: 0 },
  { name: 'UX Research Study', sku: 'SVC-UXR-012', price: 240000, unit: 'project', category: 'Software', taxBps: 1000 },
  { name: 'Cloud Hosting', sku: 'SVC-HST-013', price: 9900, unit: 'month', category: 'Software', taxBps: 1000 },
  { name: 'Technical Support', sku: 'SVC-SUP-014', price: 11000, unit: 'hour', category: 'Support', taxBps: 0 },
  { name: 'Training Workshop', sku: 'SVC-TRN-015', price: 175000, unit: 'day', category: 'Consulting', taxBps: 1000 },
  { name: 'Data Migration', sku: 'SVC-DAT-016', price: 320000, unit: 'project', category: 'Software', taxBps: 1000 },
  // --- Physical goods (trackInventory: true) ---
  { name: 'Wireless Mouse', sku: 'HW-MSE-101', price: 2999, unit: 'unit', category: 'Peripherals', taxBps: 1000, track: true, received: 180, threshold: 25 },
  { name: 'Mechanical Keyboard', sku: 'HW-KBD-102', price: 8999, unit: 'unit', category: 'Peripherals', taxBps: 1000, track: true, received: 120, threshold: 20 },
  { name: 'USB-C Hub 7-in-1', sku: 'HW-HUB-103', price: 4599, unit: 'unit', category: 'Accessories', taxBps: 1000, track: true, received: 150, threshold: 30 },
  { name: '27" 4K Monitor', sku: 'HW-MON-104', price: 39900, unit: 'unit', category: 'Displays', taxBps: 1000, track: true, received: 60, threshold: 10 },
  { name: 'Aluminum Laptop Stand', sku: 'HW-STD-105', price: 5499, unit: 'unit', category: 'Accessories', taxBps: 1000, track: true, received: 90, threshold: 15 },
  { name: 'HD Webcam 1080p', sku: 'HW-CAM-106', price: 6999, unit: 'unit', category: 'Peripherals', taxBps: 1000, track: true, received: 75, threshold: 15 },
  { name: 'Noise-Cancelling Headphones', sku: 'HW-HPN-107', price: 24900, unit: 'unit', category: 'Audio', taxBps: 1000, track: true, received: 50, threshold: 12 },
  { name: 'LED Desk Lamp', sku: 'HW-LMP-108', price: 3899, unit: 'unit', category: 'Office', taxBps: 1000, track: true, received: 110, threshold: 20 },
  { name: 'Ergonomic Office Chair', sku: 'HW-CHR-109', price: 32900, unit: 'unit', category: 'Furniture', taxBps: 1000, track: true, received: 40, threshold: 8 },
  { name: 'Electric Standing Desk', sku: 'HW-DSK-110', price: 54900, unit: 'unit', category: 'Furniture', taxBps: 1000, track: true, received: 30, threshold: 6 },
  { name: 'A5 Hardcover Notebook', sku: 'MR-NTB-201', price: 1499, unit: 'unit', category: 'Merch', taxBps: 1000, track: true, received: 400, threshold: 50 },
  { name: 'Branded T-Shirt', sku: 'MR-TSH-202', price: 2199, unit: 'unit', category: 'Merch', taxBps: 1000, track: true, received: 300, threshold: 40 },
  { name: 'Ceramic Coffee Mug', sku: 'MR-MUG-203', price: 1299, unit: 'unit', category: 'Merch', taxBps: 1000, track: true, received: 350, threshold: 50 },
  { name: 'Canvas Tote Bag', sku: 'MR-TOT-204', price: 1699, unit: 'unit', category: 'Merch', taxBps: 1000, track: true, received: 260, threshold: 40 },
];
