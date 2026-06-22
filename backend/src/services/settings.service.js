import { prisma } from '../config/prisma.js';
import { ApiError } from '../utils/ApiError.js';

const EDITABLE = [
  'name',
  'legalTaxId',
  'countryCode',
  'baseCurrency',
  'logoUrl',
  'address',
  'defaultPaymentTermsDays',
  'timezone',
  'settings',
];

export async function getSettings(organizationId) {
  const org = await prisma.organization.findUnique({ where: { id: organizationId } });
  if (!org) throw ApiError.notFound('Organization not found');
  return org;
}

export async function updateSettings(organizationId, dto) {
  const data = {};
  for (const key of EDITABLE) {
    if (dto[key] !== undefined) data[key] = dto[key];
  }
  return prisma.organization.update({ where: { id: organizationId }, data });
}
