// Normalizes pagination query params into Prisma-friendly values.
export const getPagination = (query = {}) => {
  const page = Math.max(1, Number(query.page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(query.pageSize) || 20));
  return { page, pageSize, skip: (page - 1) * pageSize, take: pageSize };
};

export const buildPage = ({ data, total, page, pageSize }) => ({
  data,
  page,
  pageSize,
  total,
  totalPages: Math.ceil(total / pageSize) || 1,
});
