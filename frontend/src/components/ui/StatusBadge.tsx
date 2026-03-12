type Status = 'pending' | 'approved' | 'rejected';

interface StatusBadgeProps {
  status: Status;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const base =
    'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium border';

  if (status === 'approved') {
    return (
      <span className={`${base} bg-emerald-50 text-emerald-800 border-emerald-200`}>
        Approved
      </span>
    );
  }
  if (status === 'rejected') {
    return (
      <span className={`${base} bg-red-50 text-red-700 border-red-200`}>
        Rejected
      </span>
    );
  }
  return (
    <span className={`${base} bg-amber-50 text-amber-800 border-amber-200`}>
      Pending
    </span>
  );
}

