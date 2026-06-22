import Badge from './Badge.jsx';

const COLORS = {
  // invoice
  draft: 'gray',
  sent: 'blue',
  viewed: 'blue',
  partially_paid: 'amber',
  paid: 'green',
  overdue: 'red',
  cancelled: 'gray',
  // quote
  accepted: 'green',
  declined: 'red',
  expired: 'amber',
};

const LABELS = {
  partially_paid: 'partially paid',
};

export default function StatusBadge({ status }) {
  return (
    <Badge color={COLORS[status] || 'gray'} dot>
      {LABELS[status] || status}
    </Badge>
  );
}
