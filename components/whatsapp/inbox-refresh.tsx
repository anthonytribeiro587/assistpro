'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw } from 'lucide-react';

export function InboxRefresh() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button type="button" onClick={() => startTransition(() => router.refresh())} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-600">
      <RefreshCw className={`h-4 w-4 ${pending ? 'animate-spin' : ''}`} /> Atualizar
    </button>
  );
}
