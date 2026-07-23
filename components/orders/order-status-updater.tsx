'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Loader2 } from 'lucide-react';
import {
  serviceOrderStatusLabels,
  serviceOrderStatuses,
  type DatabaseServiceOrderStatus
} from '@/lib/service-order-data';

export function OrderStatusUpdater({
  orderId,
  initialStatus
}: {
  orderId: string;
  initialStatus: DatabaseServiceOrderStatus;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  async function update(nextStatus: DatabaseServiceOrderStatus) {
    const previous = status;
    setStatus(nextStatus);
    setSaving(true);
    setSaved(false);
    setError('');

    try {
      const response = await fetch(`/api/service-orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      });
      const payload = (await response.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!response.ok || !payload.ok) throw new Error(payload.error || 'Não foi possível atualizar o status.');
      setSaved(true);
      router.refresh();
      window.setTimeout(() => setSaved(false), 1500);
    } catch (requestError) {
      setStatus(previous);
      setError(requestError instanceof Error ? requestError.message : 'Falha ao atualizar o status.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="flex items-center gap-2">
        <select
          value={status}
          disabled={saving}
          onChange={(event) => void update(event.target.value as DatabaseServiceOrderStatus)}
          className="min-w-[220px] rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-slate-700 outline-none focus:border-violet-400"
        >
          {serviceOrderStatuses.map((item) => (
            <option key={item} value={item}>{serviceOrderStatusLabels[item]}</option>
          ))}
        </select>
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-slate-500">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <Check className="h-4 w-4 text-emerald-600" /> : null}
        </span>
      </div>
      {error ? <p className="mt-2 text-xs font-semibold text-red-600">{error}</p> : null}
    </div>
  );
}
