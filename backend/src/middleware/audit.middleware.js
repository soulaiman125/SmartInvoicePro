import { recordAudit } from '../services/audit.service.js';

// Captures every successful authenticated mutation as an audit-log entry, with
// zero changes to individual controllers. Runs on response 'finish' so req.user
// (populated by authenticate inside each router) and the final status are known.

const MUTATING = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const SKIP = [/\/auth\//, /\/audit-logs/]; // auth flows + audit reads are noise
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const singular = (r) => (r.endsWith('ies') ? `${r.slice(0, -3)}y` : r.endsWith('s') ? r.slice(0, -1) : r);

export function auditLogger(req, res, next) {
  res.on('finish', () => {
    try {
      if (!req.user || !MUTATING.has(req.method) || res.statusCode >= 400) return;
      const path = (req.originalUrl || req.url).split('?')[0];
      if (SKIP.some((re) => re.test(path))) return;

      const parts = path.replace(/^\/api\/v1\//, '').split('/').filter(Boolean);
      const resource = parts[0] || 'resource';
      let entityId = null;
      let sub = null;
      if (parts[1] && UUID.test(parts[1])) {
        entityId = parts[1];
        sub = parts[2] || null;
      } else {
        sub = parts[1] || null;
      }
      const verb = sub || { POST: 'create', PUT: 'update', PATCH: 'update', DELETE: 'delete' }[req.method];
      const entityType = singular(resource);

      recordAudit({
        organizationId: req.user.organizationId,
        actorUserId: req.user.id,
        action: `${entityType}.${verb}`,
        entityType,
        entityId,
        metadata: { method: req.method, path, status: res.statusCode },
      });
    } catch {
      /* never throw from a finish handler */
    }
  });
  next();
}
