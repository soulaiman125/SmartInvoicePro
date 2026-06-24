import { prisma } from '../config/prisma.js';
import { ApiError } from '../utils/ApiError.js';
import { getPagination, buildPage } from '../utils/pagination.js';
import { notifyOrg } from './notification.service.js';

async function loadProduct(tx, organizationId, productId) {
  const product = await tx.product.findFirst({ where: { id: productId, organizationId } });
  if (!product) throw ApiError.notFound('Product not found');
  return product;
}

// Applies a stock movement and updates the product's running quantity atomically.
// type: 'in' (receive), 'out' (consume), 'adjustment' (set delta, may be +/-).
export async function adjustStock(organizationId, productId, { type, quantity, reason, reference }) {
  const result = await prisma.$transaction(async (tx) => {
    const product = await loadProduct(tx, organizationId, productId);

    if (!product.trackInventory) {
      throw ApiError.badRequest('Inventory tracking is disabled for this product');
    }

    let delta;
    if (type === 'in') delta = Math.abs(quantity);
    else if (type === 'out') delta = -Math.abs(quantity);
    else delta = quantity; // adjustment: signed

    const resultingStock = product.stockQuantity + delta;
    if (resultingStock < 0) {
      throw ApiError.badRequest('Insufficient stock for this movement');
    }

    const updated = await tx.product.update({
      where: { id: product.id },
      data: { stockQuantity: resultingStock },
    });

    const movement = await tx.stockMovement.create({
      data: {
        organizationId,
        productId: product.id,
        type,
        quantity: delta,
        resultingStock,
        reason: reason ?? null,
        reference: reference ?? null,
      },
    });

    return { product: updated, movement };
  });

  // Notify the team when a movement drops stock to/below the threshold.
  const { product } = result;
  if (product.stockQuantity <= product.lowStockThreshold) {
    try {
      await notifyOrg(organizationId, 'low_stock', {
        productId: product.id,
        name: product.name,
        stock: product.stockQuantity,
        threshold: product.lowStockThreshold,
      });
    } catch {
      /* ignore notification failures */
    }
  }

  return result;
}

export async function listMovements(organizationId, productId, query) {
  const { page, pageSize, skip, take } = getPagination(query);
  const where = { organizationId, ...(productId ? { productId } : {}) };

  const [data, total] = await Promise.all([
    prisma.stockMovement.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take }),
    prisma.stockMovement.count({ where }),
  ]);

  return buildPage({ data, total, page, pageSize });
}

// Products at or below their low-stock threshold.
export async function lowStockReport(organizationId) {
  const products = await prisma.product.findMany({
    where: { organizationId, trackInventory: true },
    orderBy: { stockQuantity: 'asc' },
  });
  return products.filter((p) => p.stockQuantity <= p.lowStockThreshold);
}

// Stock valuation + movement analytics for the inventory dashboard.
export async function inventoryAnalytics(organizationId) {
  const products = await prisma.product.findMany({
    where: { organizationId, trackInventory: true },
    select: { id: true, name: true, sku: true, category: true, stockQuantity: true, unitPrice: true, lowStockThreshold: true, currency: true },
  });

  let totalValue = 0;
  let totalUnits = 0;
  let lowStock = 0;
  const byCategoryMap = new Map();
  for (const p of products) {
    const value = p.stockQuantity * Number(p.unitPrice);
    totalValue += value;
    totalUnits += p.stockQuantity;
    if (p.stockQuantity <= p.lowStockThreshold) lowStock += 1;
    const cat = p.category || 'Uncategorized';
    byCategoryMap.set(cat, (byCategoryMap.get(cat) || 0) + value);
  }

  const [movementsByType, recentMovements] = await Promise.all([
    prisma.stockMovement.groupBy({
      by: ['type'],
      where: { organizationId },
      _sum: { quantity: true },
      _count: { _all: true },
    }),
    prisma.stockMovement.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
      take: 12,
      include: { product: { select: { name: true, sku: true } } },
    }),
  ]);

  // Purchase history = received ('in') stock movements.
  const purchases = movementsByType.find((m) => m.type === 'in');

  return {
    productCount: products.length,
    totalUnits,
    totalValue,
    lowStock,
    purchasedUnits: purchases ? Number(purchases._sum.quantity) : 0,
    byCategory: [...byCategoryMap.entries()]
      .map(([category, value]) => ({ category, value }))
      .sort((a, b) => b.value - a.value),
    movementsByType: movementsByType.map((m) => ({
      type: m.type,
      quantity: Number(m._sum.quantity),
      count: m._count._all,
    })),
    recentMovements,
    topByValue: [...products]
      .map((p) => ({ id: p.id, name: p.name, sku: p.sku, units: p.stockQuantity, value: p.stockQuantity * Number(p.unitPrice) }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5),
  };
}

// Used by the invoice flow to decrement stock for tracked product lines.
export async function consumeForInvoice(tx, organizationId, items, invoiceRef) {
  for (const item of items) {
    if (!item.productId) continue;
    const product = await tx.product.findFirst({
      where: { id: item.productId, organizationId },
    });
    if (!product || !product.trackInventory) continue;

    const delta = -Math.abs(Math.round(Number(item.quantity)));
    const resultingStock = product.stockQuantity + delta;

    await tx.product.update({
      where: { id: product.id },
      data: { stockQuantity: resultingStock },
    });
    await tx.stockMovement.create({
      data: {
        organizationId,
        productId: product.id,
        type: 'out',
        quantity: delta,
        resultingStock,
        reason: 'Invoice issued',
        reference: invoiceRef,
      },
    });
  }
}
