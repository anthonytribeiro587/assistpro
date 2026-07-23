'use client';

import { useEffect, useState } from 'react';
import { Bot, CheckCircle2, Loader2, MessageCircle, ShieldCheck, TriangleAlert } from 'lucide-react';

type StatusPayload = {
  ok?: boolean;
  mode?: string;
  makeConfigured?: boolean;
  callbackConfigured?: boolean;
  inboundPersistence?: boolean;
  businessContextConfigured?: boolean;
};

function Badge({ active, children }: { active: boolean; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-black ${active ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
      {active ? <CheckCircle2 className="h-3.5 w-3.5" /> : <TriangleAlert className="h-3.5 w-3.5" />}
      {children}
    </span>
  );
}

export function IntegrationStatus() {
  const [status, setStatus] = useState<StatusPayload | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    fetch('/api/whatsapp/orchestrator', { cache: 'no-store' })
      .then(async (response) => {
        const payload = (await response.json()) as StatusPayload;
        if (!response.ok) throw new Error('Não foi possível consultar a integração.');
        if (active) setStatus(payload);
      })
      .catch((requestError) => {
        if (active) setError(requestError instanceof Error ? requestError.message : 'Falha ao consultar integração.');
      });
    return () => { active = false; };
  }, []);

  return (
    <section id="integracoes" className="rounded-[1.75rem] border border-slate-200 bg-slate-950 p-5 text-white shadow-xl md:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-violet-600"><MessageCircle className="h-5 w-5" /></span>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-violet-300">Integrações</p>
            <h2 className="mt-1 text-xl font-black">WhatsApp, Make e Supabase</h2>
            <p className="mt-1 text-sm leading-6 text-slate-400">Visão rápida das camadas usadas pelo atendimento automático.</p>
          </div>
        </div>

        {!status && !error ? <span className="inline-flex items-center gap-2 text-sm text-slate-300"><Loader2 className="h-4 w-4 animate-spin" /> Verificando...</span> : null}
      </div>

      {error ? <p className="mt-4 rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-sm font-semibold text-red-200">{error}</p> : null}

      {status ? (
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-white/[.05] p-4"><MessageCircle className="h-5 w-5 text-emerald-300" /><strong className="mt-3 block text-sm">Orquestrador</strong><div className="mt-2"><Badge active={Boolean(status.ok)}>API operacional</Badge></div></div>
          <div className="rounded-2xl border border-white/10 bg-white/[.05] p-4"><Bot className="h-5 w-5 text-violet-300" /><strong className="mt-3 block text-sm">Make AI Agent</strong><div className="mt-2"><Badge active={Boolean(status.makeConfigured && status.callbackConfigured)}>Entrada e callback</Badge></div></div>
          <div className="rounded-2xl border border-white/10 bg-white/[.05] p-4"><ShieldCheck className="h-5 w-5 text-blue-300" /><strong className="mt-3 block text-sm">Persistência</strong><div className="mt-2"><Badge active={Boolean(status.inboundPersistence)}>Mensagens no Supabase</Badge></div></div>
          <div className="rounded-2xl border border-white/10 bg-white/[.05] p-4"><CheckCircle2 className="h-5 w-5 text-amber-300" /><strong className="mt-3 block text-sm">Contexto comercial</strong><div className="mt-2"><Badge active={Boolean(status.businessContextConfigured)}>Parâmetros da loja</Badge></div></div>
        </div>
      ) : null}
    </section>
  );
}
