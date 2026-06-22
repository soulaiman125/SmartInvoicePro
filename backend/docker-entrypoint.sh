#!/bin/sh
set -e

# Apply pending database migrations before the API starts. The schema lives in
# the shared database package.
echo "Applying database migrations..."
npx prisma migrate deploy --schema ../database/prisma/schema.prisma

echo "Starting SmartInvoice Pro API..."
exec "$@"
