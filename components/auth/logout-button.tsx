'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, LogOut } from 'lucide-react';
import { getSupabaseBrowserClient } from '@/lib/supabase';

export function LogoutButton({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function signOut() {
    setLoading(true);
    try {
      await getSupabaseBrowserClient().auth.signOut();
    } finally {
      router.replace('/login');
      router.refresh();
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={signOut}
      disabled={loading}
      className={
        compact
          ? 'grid h-11 w-11 place-items-center rounded-2xl border border-line bg-white text-muted transition hover:border-red-200 hover:text-red-600 disabled:opacity-60'
          : 'flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-violet-50/80 transition hover:bg-white/10 hover:text-white disabled:opacity-60'
      }
      aria-label="Sair do AssistPro"
    >
      {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <LogOut className="h-5 w-5" />}
      {compact ? null : 'Sair com segurança'}
    </button>
  );
}
