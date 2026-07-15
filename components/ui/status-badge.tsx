import { statusLabels, statusTone, type ServiceOrderStatus } from '@/lib/app-data';

export function StatusBadge({ status }: { status: ServiceOrderStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold ring-1 ${statusTone[status]}`}>
      {statusLabels[status]}
    </span>
  );
}
