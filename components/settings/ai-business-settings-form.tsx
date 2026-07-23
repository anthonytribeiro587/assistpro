'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Bot,
  Building2,
  Clock3,
  KeyRound,
  Loader2,
  MapPin,
  MessageSquareText,
  Save,
  ShieldCheck,
  Sparkles,
  Volume2
} from 'lucide-react';
import {
  DEFAULT_AI_BUSINESS_SETTINGS,
  type AiBusinessSettings,
  type BusinessHour
} from '@/lib/ai-business-settings';

type ApiPayload = {
  ok?: boolean;
  error?: string;
  settings?: AiBusinessSettings;
  persisted?: boolean;
  migrationRequired?: boolean;
  writeProtectionConfigured?: boolean;
};

type ToggleProps = {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
};

function Toggle({ label, description, checked, onChange }: ToggleProps) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 rounded-2xl border border-line bg-app p-4">
      <span>
        <strong className="block text-sm text-ink">{label}</strong>
        <span className="mt-1 block text-xs leading-5 text-muted">{description}</span>
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-1 h-5 w-5 shrink-0 accent-violet-600"
      />
    </label>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = 'text'
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-muted">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm font-semibold text-ink outline-none transition focus:border-brand focus:ring-4 focus:ring-violet-100"
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  helper,
  rows = 3
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  helper?: string;
  rows?: number;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-muted">
        {label}
      </span>
      <textarea
        rows={rows}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full resize-y rounded-2xl border border-line bg-white px-4 py-3 text-sm font-semibold leading-6 text-ink outline-none transition focus:border-brand focus:ring-4 focus:ring-violet-100"
      />
      {helper ? <span className="mt-2 block text-xs text-muted">{helper}</span> : null}
    </label>
  );
}

function Section({
  icon: Icon,
  title,
  description,
  children
}: {
  icon: typeof Building2;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[1.75rem] border border-line bg-white p-5 shadow-card md:p-6">
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-brandLight text-brand">
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-lg font-black text-ink">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-muted">{description}</p>
        </div>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

export function AiBusinessSettingsForm() {
  const [settings, setSettings] = useState<AiBusinessSettings>(() =>
    structuredClone(DEFAULT_AI_BUSINESS_SETTINGS)
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [adminSecret, setAdminSecret] = useState('');
  const [message, setMessage] = useState('');
  const [messageTone, setMessageTone] = useState<'success' | 'error' | 'warning'>('success');
  const [migrationRequired, setMigrationRequired] = useState(false);
  const [persisted, setPersisted] = useState(false);
  const [writeProtectionConfigured, setWriteProtectionConfigured] = useState(false);

  const addressPreview = useMemo(
    () =>
      [
        settings.addressLine,
        settings.neighborhood,
        `${settings.city} - ${settings.state}`,
        settings.postalCode
      ]
        .filter(Boolean)
        .join(', '),
    [settings.addressLine, settings.neighborhood, settings.city, settings.state, settings.postalCode]
  );

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const response = await fetch('/api/settings/ai', { cache: 'no-store' });
        const payload = (await response.json()) as ApiPayload;
        if (!active) return;

        if (!response.ok || !payload.ok) {
          throw new Error(payload.error || 'Não foi possível carregar as parametrizações.');
        }

        if (payload.settings) setSettings(payload.settings);
        setPersisted(Boolean(payload.persisted));
        setMigrationRequired(Boolean(payload.migrationRequired));
        setWriteProtectionConfigured(Boolean(payload.writeProtectionConfigured));
      } catch (error) {
        if (!active) return;
        setMessage(error instanceof Error ? error.message : 'Falha ao carregar as parametrizações.');
        setMessageTone('error');
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, []);

  function update<K extends keyof AiBusinessSettings>(key: K, value: AiBusinessSettings[K]) {
    setSettings((current) => ({ ...current, [key]: value }));
  }

  function updateHour(index: number, patch: Partial<BusinessHour>) {
    setSettings((current) => ({
      ...current,
      businessHours: current.businessHours.map((hour, hourIndex) =>
        hourIndex === index ? { ...hour, ...patch } : hour
      )
    }));
  }

  async function save() {
    setMessage('');

    if (!adminSecret.trim()) {
      setMessage('Informe o código administrativo configurado na Vercel para salvar.');
      setMessageTone('warning');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/settings/ai', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-assistpro-admin-secret': adminSecret.trim()
        },
        body: JSON.stringify({ settings })
      });
      const payload = (await response.json()) as ApiPayload;

      if (!response.ok || !payload.ok) {
        setMigrationRequired(Boolean(payload.migrationRequired));
        throw new Error(payload.error || 'Não foi possível salvar as parametrizações.');
      }

      if (payload.settings) setSettings(payload.settings);
      setPersisted(true);
      setMigrationRequired(false);
      setMessage('Parametrizações salvas. O backend já enviará esse contexto ao Make.');
      setMessageTone('success');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Falha ao salvar as parametrizações.');
      setMessageTone('error');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-64 items-center justify-center rounded-[1.75rem] border border-line bg-white shadow-card">
        <Loader2 className="h-7 w-7 animate-spin text-brand" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <section className="rounded-[1.75rem] border border-violet-200 bg-gradient-to-r from-violet-50 to-white p-5 shadow-card md:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand text-white">
              <Sparkles className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-xl font-black text-ink">Central de parâmetros da IA</h2>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-muted">
                Endereço, horários, regras, mensagens e automações básicas deixam de depender de um prompt fixo.
              </p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold">
                <span className="rounded-full bg-white px-3 py-2 text-ink ring-1 ring-line">
                  {persisted ? 'Dados persistidos no Supabase' : 'Usando valores iniciais'}
                </span>
                <span className="rounded-full bg-white px-3 py-2 text-ink ring-1 ring-line">
                  Fuso: {settings.timezone}
                </span>
              </div>
            </div>
          </div>

          <div className="w-full rounded-2xl border border-line bg-white p-4 lg:max-w-sm">
            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-muted">
                <KeyRound className="h-4 w-4" /> Código administrativo
              </span>
              <input
                type="password"
                autoComplete="off"
                value={adminSecret}
                onChange={(event) => setAdminSecret(event.target.value)}
                placeholder="Não fica salvo no navegador"
                className="w-full rounded-2xl border border-line bg-app px-4 py-3 text-sm font-semibold text-ink outline-none focus:border-brand focus:ring-4 focus:ring-violet-100"
              />
            </label>
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-brand px-5 py-3 text-sm font-black text-white shadow-glow disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Salvar configurações
            </button>
          </div>
        </div>

        {!writeProtectionConfigured ? (
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900">
            Configure <code>ASSISTPRO_ADMIN_SECRET</code> na Vercel antes de liberar gravações.
          </div>
        ) : null}

        {migrationRequired ? (
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900">
            A tabela ainda precisa ser criada no Supabase com a migration incluída nesta entrega.
          </div>
        ) : null}

        {message ? (
          <div
            className={`mt-4 rounded-2xl border p-4 text-sm font-semibold ${
              messageTone === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                : messageTone === 'warning'
                  ? 'border-amber-200 bg-amber-50 text-amber-900'
                  : 'border-red-200 bg-red-50 text-red-900'
            }`}
          >
            {message}
          </div>
        ) : null}
      </section>

      <div className="grid gap-5 xl:grid-cols-2">
        <Section
          icon={Building2}
          title="Dados da loja"
          description="Informações oficiais usadas para endereço, contato e respostas comerciais."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Nome da empresa"
              value={settings.businessName}
              onChange={(value) => update('businessName', value)}
            />
            <Field
              label="Telefone"
              value={settings.phone}
              onChange={(value) => update('phone', value)}
              placeholder="(51) ..."
            />
            <div className="sm:col-span-2">
              <Field
                label="Endereço"
                value={settings.addressLine}
                onChange={(value) => update('addressLine', value)}
              />
            </div>
            <Field
              label="Bairro"
              value={settings.neighborhood}
              onChange={(value) => update('neighborhood', value)}
            />
            <Field
              label="Cidade"
              value={settings.city}
              onChange={(value) => update('city', value)}
            />
            <Field
              label="Estado"
              value={settings.state}
              onChange={(value) => update('state', value)}
            />
            <Field
              label="CEP"
              value={settings.postalCode}
              onChange={(value) => update('postalCode', value)}
            />
            <div className="sm:col-span-2">
              <Field
                label="Link do Google Maps"
                value={settings.mapsUrl}
                onChange={(value) => update('mapsUrl', value)}
                placeholder="https://maps.google.com/..."
                type="url"
              />
            </div>
          </div>
          <div className="mt-4 rounded-2xl bg-app p-4 text-sm text-muted">
            <span className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
              <span>
                <strong className="text-ink">Prévia usada pela IA:</strong>
                <br />
                {addressPreview}
              </span>
            </span>
          </div>
        </Section>

        <Section
          icon={Clock3}
          title="Horários de atendimento"
          description="A IA poderá informar se a loja está aberta e qual é o horário do dia."
        >
          <div className="space-y-3">
            {settings.businessHours.map((hour, index) => (
              <div
                key={hour.day}
                className="grid items-center gap-3 rounded-2xl border border-line bg-app p-3 sm:grid-cols-[1fr_auto_auto_auto]"
              >
                <label className="flex items-center gap-3 text-sm font-bold text-ink">
                  <input
                    type="checkbox"
                    checked={hour.enabled}
                    onChange={(event) => updateHour(index, { enabled: event.target.checked })}
                    className="h-5 w-5 accent-violet-600"
                  />
                  {hour.label}
                </label>
                <input
                  type="time"
                  value={hour.open}
                  disabled={!hour.enabled}
                  onChange={(event) => updateHour(index, { open: event.target.value })}
                  className="rounded-xl border border-line bg-white px-3 py-2 text-sm font-bold text-ink disabled:opacity-50"
                />
                <span className="text-center text-xs font-bold text-muted">até</span>
                <input
                  type="time"
                  value={hour.close}
                  disabled={!hour.enabled}
                  onChange={(event) => updateHour(index, { close: event.target.value })}
                  className="rounded-xl border border-line bg-white px-3 py-2 text-sm font-bold text-ink disabled:opacity-50"
                />
              </div>
            ))}
          </div>
          <div className="mt-4">
            <Field
              label="Fuso horário"
              value={settings.timezone}
              onChange={(value) => update('timezone', value)}
              placeholder="America/Sao_Paulo"
            />
          </div>
        </Section>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Section
          icon={Bot}
          title="Comportamento da IA"
          description="Controles gerais que serão enviados como contexto oficial para as automações."
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <Toggle
              label="Atendimento com IA"
              description="Permite o atendimento automático no WhatsApp."
              checked={settings.aiEnabled}
              onChange={(value) => update('aiEnabled', value)}
            />
            <Toggle
              label="Respostas em áudio"
              description="Autoriza o uso dos áudios cadastrados."
              checked={settings.audioEnabled}
              onChange={(value) => update('audioEnabled', value)}
            />
            <Toggle
              label="Atendimento sem agendamento"
              description="Clientes podem levar o aparelho dentro do horário, sem reserva automática."
              checked={settings.walkInEnabled}
              onChange={(value) => update('walkInEnabled', value)}
            />
            <Toggle
              label="Agendamentos"
              description="Mantenha desligado enquanto a JR não trabalhar com reserva de horário."
              checked={settings.appointmentsEnabled}
              onChange={(value) => update('appointmentsEnabled', value)}
            />
            <Toggle
              label="Resposta fora do horário"
              description="Permite informar que a loja está fechada usando a mensagem cadastrada."
              checked={settings.outsideHoursReplyEnabled}
              onChange={(value) => update('outsideHoursReplyEnabled', value)}
            />
            <Toggle
              label="Encaminhamento humano"
              description="Autoriza a IA a indicar continuidade pela equipe."
              checked={settings.humanHandoffEnabled}
              onChange={(value) => update('humanHandoffEnabled', value)}
            />
            <Toggle
              label="Pendência de estoque"
              description="Marca consultas de produto que precisam de confirmação humana."
              checked={settings.stockFollowupEnabled}
              onChange={(value) => update('stockFollowupEnabled', value)}
            />
          </div>
        </Section>

        <Section
          icon={ShieldCheck}
          title="Orçamento e prazos"
          description="Textos oficiais usados quando ainda não existem tempos específicos por serviço."
        >
          <div className="space-y-4">
            <TextArea
              label="Regra de orçamento"
              value={settings.quoteEstimate}
              onChange={(value) => update('quoteEstimate', value)}
            />
            <TextArea
              label="Regra de prazo"
              value={settings.defaultRepairEstimate}
              onChange={(value) => update('defaultRepairEstimate', value)}
            />
            <TextArea
              label="Instruções extras"
              value={settings.customInstructions}
              onChange={(value) => update('customInstructions', value)}
              helper="Use para políticas permanentes da JR. Evite colar o prompt completo aqui."
              rows={4}
            />
          </div>
        </Section>
      </div>

      <Section
        icon={MessageSquareText}
        title="Mensagens operacionais"
        description="Respostas que podem ser editadas sem entrar no Make ou alterar o código."
      >
        <div className="grid gap-4 lg:grid-cols-3">
          <TextArea
            label="Fora do horário"
            value={settings.outsideHoursMessage}
            onChange={(value) => update('outsideHoursMessage', value)}
            rows={5}
          />
          <TextArea
            label="Atendimento humano"
            value={settings.humanHandoffMessage}
            onChange={(value) => update('humanHandoffMessage', value)}
            rows={5}
          />
          <TextArea
            label="Aguardando estoque"
            value={settings.stockPendingMessage}
            onChange={(value) => update('stockPendingMessage', value)}
            rows={5}
          />
        </div>
      </Section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[1.5rem] border border-line bg-white p-5 shadow-card">
          <Volume2 className="h-5 w-5 text-brand" />
          <strong className="mt-3 block text-ink">Áudios</strong>
          <p className="mt-1 text-sm leading-6 text-muted">
            O liga/desliga já é parametrizável. A troca dos arquivos será a próxima camada.
          </p>
        </div>
        <div className="rounded-[1.5rem] border border-line bg-white p-5 shadow-card">
          <MessageSquareText className="h-5 w-5 text-brand" />
          <strong className="mt-3 block text-ink">Make</strong>
          <p className="mt-1 text-sm leading-6 text-muted">
            O backend passa a enviar um campo <code>agentInput</code> com os dados oficiais.
          </p>
        </div>
        <div className="rounded-[1.5rem] border border-line bg-white p-5 shadow-card">
          <ShieldCheck className="h-5 w-5 text-brand" />
          <strong className="mt-3 block text-ink">Segurança</strong>
          <p className="mt-1 text-sm leading-6 text-muted">
            Gravações exigem código administrativo e a service role permanece somente no servidor.
          </p>
        </div>
      </section>
    </div>
  );
}
