'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Bot,
  CheckCircle2,
  Loader2,
  MessageCircle,
  RefreshCw,
  Server,
  ShieldCheck,
  TriangleAlert
} from 'lucide-react';

type StatusPayload = {
  ok?: boolean;
  error?: string;
  message?: string;
  role?: string;
  canManage?: boolean;
  evolution?: {
    configured?: boolean;
    connected?: boolean;
    state?: string | null;
    error?: string | null;
  };
  make?: {
    webhookConfigured?: boolean;
    apiKeyConfigured?: boolean;
    callbackConfigured?: boolean;
  };
  supabase?: {
    publicClientConfigured?: boolean;
    adminClientConfigured?: boolean;
  };
  webhook?: {
    secretConfigured?: boolean;
    endpoint?: string;
  };
  ai?: {
    businessContextConfigured?: boolean;
    prerecordedAudioEnabled?: boolean;
    generatedVoiceConfigured?: boolean;
  };
};

function Badge({ active, children }: { active: boolean; children: React.ReactNode }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-black ${
        active ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
      }`}
    >
      {active ? (
        <CheckCircle2 className="h-3.5 w-3.5" />
      ) : (
        <TriangleAlert className="h-3.5 w-3.5" />
      )}
      {children}
    </span>
  );
}

export function IntegrationStatus() {
  const [status, setStatus] = useState<StatusPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    setError('');
    setLoading(true);
    try {
      const response = await fetch('/api/admin/integrations', { cache: 'no-store' });
      const payload = (await response.json()) as StatusPayload;
      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || 'Não foi possível consultar as integrações.');
      }
      setStatus(payload);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Falha ao consultar as integrações.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function configureWebhook() {
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const response = await fetch('/api/admin/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'configure_whatsapp_webhook' })
      });
      const payload = (await response.json()) as StatusPayload;
      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || 'Não foi possível configurar o webhook.');
      }
      setStatus(payload);
      setMessage(payload.message || 'Integração atualizada com sucesso.');
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Falha ao configurar o webhook.'
      );
    } finally {
      setSaving(false);
    }
  }

  const evolutionReady = Boolean(
    status?.evolution?.configured &&
      status?.evolution?.connected &&
      status?.webhook?.secretConfigured
  );
  const makeReady = Boolean(
    status?.make?.webhookConfigured &&
      status?.make?.apiKeyConfigured &&
      status?.make?.callbackConfigured
  );
  const supabaseReady = Boolean(
    status?.supabase?.publicClientConfigured && status?.supabase?.adminClientConfigured
  );

  return (
    <section
      id="integracoes"
      className="rounded-[1.75rem] border border-slate-200 bg-slate-950 p-5 text-white shadow-xl md:p-6"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-violet-600">
            <MessageCircle className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-violet-300">
              Integrações
            </p>
            <h2 className="mt-1 text-xl font-black">WhatsApp, Make e Supabase</h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-400">
              Monitore as conexões e reconfigure o webhook sem expor a chave da Evolution ou o segredo do endpoint no navegador.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading || saving}
            className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[.06] px-4 py-2.5 text-xs font-black text-white transition hover:bg-white/10 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Atualizar
          </button>
          {status?.canManage ? (
            <button
              type="button"
              onClick={configureWebhook}
              disabled={saving || loading}
              className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-black text-white shadow-lg shadow-violet-950/40 transition hover:bg-violet-500 disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ShieldCheck className="h-4 w-4" />
              )}
              Reconfigurar webhook
            </button>
          ) : null}
        </div>
      </div>

      {loading && !status ? (
        <span className="mt-5 inline-flex items-center gap-2 text-sm text-slate-300">
          <Loader2 className="h-4 w-4 animate-spin" /> Verificando integrações...
        </span>
      ) : null}

      {error ? (
        <p className="mt-4 rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-sm font-semibold text-red-200">
          {error}
        </p>
      ) : null}

      {message ? (
        <p className="mt-4 rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-3 text-sm font-semibold text-emerald-200">
          {message}
        </p>
      ) : null}

      {status ? (
        <>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-white/10 bg-white/[.05] p-4">
              <MessageCircle className="h-5 w-5 text-emerald-300" />
              <strong className="mt-3 block text-sm">Evolution API</strong>
              <p className="mt-1 text-xs text-slate-400">
                Estado: {status.evolution?.state || 'não identificado'}
              </p>
              <div className="mt-3">
                <Badge active={evolutionReady}>
                  {evolutionReady ? 'WhatsApp conectado' : 'Revisar conexão'}
                </Badge>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[.05] p-4">
              <Bot className="h-5 w-5 text-violet-300" />
              <strong className="mt-3 block text-sm">Make AI Agent</strong>
              <p className="mt-1 text-xs text-slate-400">Entrada, autenticação e callback</p>
              <div className="mt-3">
                <Badge active={makeReady}>{makeReady ? 'Fluxo configurado' : 'Configuração incompleta'}</Badge>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[.05] p-4">
              <Server className="h-5 w-5 text-blue-300" />
              <strong className="mt-3 block text-sm">Supabase</strong>
              <p className="mt-1 text-xs text-slate-400">Auth, histórico e parâmetros</p>
              <div className="mt-3">
                <Badge active={supabaseReady}>{supabaseReady ? 'Banco disponível' : 'Revisar variáveis'}</Badge>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[.05] p-4">
              <ShieldCheck className="h-5 w-5 text-amber-300" />
              <strong className="mt-3 block text-sm">Contexto e áudios</strong>
              <p className="mt-1 text-xs text-slate-400">Regras comerciais e respostas híbridas</p>
              <div className="mt-3">
                <Badge active={Boolean(status.ai?.businessContextConfigured)}>
                  {status.ai?.businessContextConfigured ? 'Contexto ativo' : 'Contexto indisponível'}
                </Badge>
              </div>
            </div>
          </div>

          {status.evolution?.error ? (
            <p className="mt-4 text-xs font-semibold text-amber-200">
              Evolution: {status.evolution.error}
            </p>
          ) : null}
          <p className="mt-4 text-[11px] leading-5 text-slate-500">
            Endpoint protegido: {status.webhook?.endpoint || '/api/whatsapp/orchestrator?secret=***'} • Permissão atual: {status.role || 'não identificada'}
          </p>
        </>
      ) : null}
    </section>
  );
}
