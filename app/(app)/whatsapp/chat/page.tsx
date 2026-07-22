'use client';

import Link from 'next/link';
import type { ChangeEvent, FormEvent } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  Bot,
  CheckCircle2,
  ClipboardPlus,
  Loader2,
  Mic,
  Phone,
  RefreshCw,
  Send,
  ShieldCheck,
  Smartphone,
  UserRound
} from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

type IntakeContext = {
  customerName?: string;
  phone?: string;
  deviceModel?: string;
  issue?: string;
  awaiting?: 'device' | 'issue' | 'name' | 'phone' | null;
};

type ServiceOrder = {
  number: string;
  customerName: string;
  phone: string;
  deviceModel: string;
  issue: string;
  status: 'Triagem concluída';
  createdAt: string;
};

type ApiResponse = {
  intent: 'intake' | 'create_order' | 'human_handoff' | 'order_status';
  response: string;
  provider: 'openai' | 'demo-rules';
  progress: number;
  context: IntakeContext;
  serviceOrder?: ServiceOrder;
};

const initialMessage: Message = {
  id: 'welcome',
  role: 'assistant',
  content:
    'Olá! 👋 Sou o assistente virtual da JR Celular. Conte qual é o aparelho e o problema. Vou fazer a triagem e preparar uma ordem de serviço para a equipe.'
};

const quickPrompts = [
  'Meu iPhone 13 caiu e a tela ficou preta',
  'Meu Galaxy A54 não está carregando'
];

function createMessage(role: Message['role'], content: string): Message {
  return {
    id: `${role}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    role,
    content
  };
}

function formatPhone(phone?: string) {
  if (!phone) return 'Aguardando';
  const digits = phone.replace(/\D/g, '');

  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }

  return phone;
}

export default function AiChatPage() {
  const [messages, setMessages] = useState<Message[]>([initialMessage]);
  const [message, setMessage] = useState('');
  const [context, setContext] = useState<IntakeContext>({});
  const [progress, setProgress] = useState(0);
  const [provider, setProvider] = useState<'openai' | 'demo-rules'>('demo-rules');
  const [serviceOrder, setServiceOrder] = useState<ServiceOrder | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => {
    if (!serviceOrder) return;

    try {
      const savedOrders = JSON.parse(localStorage.getItem('assistpro-trial-orders') || '[]') as ServiceOrder[];
      const nextOrders = [serviceOrder, ...savedOrders.filter((order) => order.number !== serviceOrder.number)].slice(0, 10);
      localStorage.setItem('assistpro-trial-orders', JSON.stringify(nextOrders));
    } catch {
      localStorage.setItem('assistpro-trial-orders', JSON.stringify([serviceOrder]));
    }
  }, [serviceOrder]);

  const collectedFields = useMemo(
    () => [
      { label: 'Aparelho', value: context.deviceModel, icon: Smartphone },
      { label: 'Problema', value: context.issue, icon: ShieldCheck },
      { label: 'Cliente', value: context.customerName, icon: UserRound },
      { label: 'WhatsApp', value: context.phone ? formatPhone(context.phone) : undefined, icon: Phone }
    ],
    [context]
  );

  async function sendMessage(content: string) {
    const trimmed = content.trim();
    if (!trimmed || isLoading || serviceOrder) return;

    const userMessage = createMessage('user', trimmed);
    const nextMessages = [...messages, userMessage];

    setMessages(nextMessages);
    setMessage('');
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          context,
          history: nextMessages.map(({ role, content: itemContent }) => ({ role, content: itemContent }))
        })
      });

      const payload = (await response.json()) as ApiResponse & { error?: string };

      if (!response.ok) {
        throw new Error(payload.error || 'Não foi possível processar a mensagem.');
      }

      setContext(payload.context);
      setProgress(payload.progress);
      setProvider(payload.provider);
      if (payload.serviceOrder) {
        setServiceOrder(payload.serviceOrder);
      }
      setMessages((current) => [...current, createMessage('assistant', payload.response)]);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Falha ao responder.');
    } finally {
      setIsLoading(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendMessage(message);
  }

  function resetTrial() {
    setMessages([initialMessage]);
    setMessage('');
    setContext({});
    setProgress(0);
    setProvider('demo-rules');
    setServiceOrder(undefined);
    setError('');
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Trial da IA"
        title="Atendimento automático JR Celular"
        description="Simule uma conversa real: a IA identifica o aparelho, coleta o defeito e os dados do cliente e gera uma OS de triagem."
        action={
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={resetTrial}
              className="inline-flex items-center gap-2 rounded-2xl border border-line bg-white px-4 py-3 text-sm font-bold text-ink transition hover:border-brand hover:text-brand"
            >
              <RefreshCw className="h-4 w-4" /> Reiniciar
            </button>
            <Link
              href="/whatsapp"
              className="inline-flex items-center gap-2 rounded-2xl border border-line bg-white px-4 py-3 text-sm font-bold text-ink transition hover:border-brand hover:text-brand"
            >
              <ArrowLeft className="h-4 w-4" /> Voltar
            </Link>
          </div>
        }
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="flex min-h-[650px] flex-col overflow-hidden rounded-[1.75rem] border border-line bg-white shadow-card">
          <header className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-full bg-brand text-white shadow-soft">
                <Bot className="h-5 w-5" />
              </span>
              <div>
                <strong className="text-ink">Assistente JR</strong>
                <p className="flex items-center gap-2 text-xs text-muted">
                  <span className="h-2 w-2 rounded-full bg-success" /> Online para demonstração
                </p>
              </div>
            </div>
            <span className="inline-flex w-fit items-center gap-2 rounded-full bg-brandLight px-3 py-1.5 text-xs font-bold text-brand">
              <ShieldCheck className="h-3.5 w-3.5" />
              {provider === 'openai' ? 'OpenAI conectada' : 'Modo trial sem chave'}
            </span>
          </header>

          <div className="flex-1 space-y-4 overflow-y-auto bg-[#f4f1eb] p-4 sm:p-5">
            {messages.map((item) => (
              <div
                key={item.id}
                className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm sm:max-w-[78%] ${
                  item.role === 'user' ? 'ml-auto rounded-br-md bg-[#d9fdd3] text-ink' : 'rounded-bl-md bg-white text-ink'
                }`}
              >
                {item.content}
              </div>
            ))}

            {isLoading ? (
              <div className="flex w-fit items-center gap-2 rounded-2xl rounded-bl-md bg-white px-4 py-3 text-sm text-muted shadow-sm">
                <Loader2 className="h-4 w-4 animate-spin" /> Analisando o atendimento...
              </div>
            ) : null}

            <div ref={chatEndRef} />
          </div>

          <div className="border-t border-line bg-white p-3 sm:p-4">
            {messages.length === 1 ? (
              <div className="mb-3 flex flex-wrap gap-2">
                {quickPrompts.map((prompt) => (
                  <button
                    type="button"
                    key={prompt}
                    onClick={() => void sendMessage(prompt)}
                    className="rounded-full border border-line bg-app px-3 py-2 text-left text-xs font-semibold text-muted transition hover:border-brand hover:bg-brandLight hover:text-brand"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            ) : null}

            {error ? <p className="mb-2 text-sm font-semibold text-danger">{error}</p> : null}

            <form onSubmit={handleSubmit} className="flex items-center gap-2">
              <input
                value={message}
                onChange={(event: ChangeEvent<HTMLInputElement>) => setMessage(event.target.value)}
                disabled={isLoading || Boolean(serviceOrder)}
                className="min-w-0 flex-1 rounded-2xl border border-line bg-app px-4 py-3 text-sm outline-none transition focus:border-brand focus:bg-white disabled:opacity-60"
                placeholder={serviceOrder ? 'OS criada. Reinicie para uma nova simulação.' : 'Digite como se fosse um cliente...'}
                aria-label="Mensagem para o assistente"
              />
              <Link
                href="/voz"
                aria-label="Abrir teste de voz"
                className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-line bg-white text-brand transition hover:border-brand"
              >
                <Mic className="h-5 w-5" />
              </Link>
              <button
                type="submit"
                disabled={!message.trim() || isLoading || Boolean(serviceOrder)}
                aria-label="Enviar mensagem"
                className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-brand text-white shadow-soft transition hover:bg-brandDark disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
              </button>
            </form>
          </div>
        </section>

        <aside className="space-y-5">
          <section className="rounded-[1.75rem] border border-line bg-white p-5 shadow-card">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-brand">Triagem automática</p>
                <h2 className="mt-1 text-lg font-black text-ink">Dados coletados</h2>
              </div>
              <span className="text-sm font-black text-brand">{progress}%</span>
            </div>

            <div className="mt-4 h-2 overflow-hidden rounded-full bg-brandLight">
              <div className="h-full rounded-full bg-brand transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>

            <div className="mt-5 space-y-3">
              {collectedFields.map(({ label, value, icon: Icon }) => (
                <div key={label} className="flex items-start gap-3 rounded-2xl border border-line bg-app p-3">
                  <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${value ? 'bg-brand text-white' : 'bg-white text-muted'}`}>
                    {value ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-wide text-muted">{label}</p>
                    <p className={`mt-1 break-words text-sm font-bold ${value ? 'text-ink' : 'text-muted'}`}>{value || 'Aguardando'}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className={`rounded-[1.75rem] border p-5 shadow-card ${serviceOrder ? 'border-success/30 bg-green-50' : 'border-line bg-white'}`}>
            <div className="flex items-start gap-3">
              <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${serviceOrder ? 'bg-success text-white' : 'bg-brandLight text-brand'}`}>
                {serviceOrder ? <CheckCircle2 className="h-5 w-5" /> : <ClipboardPlus className="h-5 w-5" />}
              </span>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-muted">Ordem de serviço</p>
                <h2 className="mt-1 text-lg font-black text-ink">{serviceOrder ? serviceOrder.number : 'Será criada pela IA'}</h2>
              </div>
            </div>

            {serviceOrder ? (
              <div className="mt-5 space-y-3 text-sm">
                <div className="flex justify-between gap-3 border-b border-green-200 pb-2">
                  <span className="text-muted">Cliente</span>
                  <strong className="text-right text-ink">{serviceOrder.customerName}</strong>
                </div>
                <div className="flex justify-between gap-3 border-b border-green-200 pb-2">
                  <span className="text-muted">Aparelho</span>
                  <strong className="text-right text-ink">{serviceOrder.deviceModel}</strong>
                </div>
                <div className="flex justify-between gap-3 border-b border-green-200 pb-2">
                  <span className="text-muted">Status</span>
                  <strong className="text-right text-success">{serviceOrder.status}</strong>
                </div>
                <p className="rounded-2xl bg-white/80 p-3 leading-6 text-muted">
                  Esta OS fica salva no navegador durante o trial. A próxima etapa é gravá-la no Supabase e disparar o fluxo do n8n.
                </p>
              </div>
            ) : (
              <p className="mt-4 text-sm leading-6 text-muted">
                Quando aparelho, problema, nome e telefone forem identificados, a IA gera a OS automaticamente e exibe o resumo aqui.
              </p>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
