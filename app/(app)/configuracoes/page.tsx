import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Bot, Building2, FlaskConical, MessageCircle, Mic2, ShieldCheck } from 'lucide-react';
import { AiBusinessSettingsForm } from '@/components/settings/ai-business-settings-form';
import { IntegrationStatus } from '@/components/settings/integration-status';
import { PageHeader } from '@/components/ui/page-header';
import { getAuthenticatedProfile, hasAnyRole } from '@/lib/supabase-server';

const areas = [
  {
    title: 'Empresa e atendimento',
    description: 'Endereço, horários, orçamento, prazos e mensagens oficiais.',
    href: '#parametros',
    icon: Building2
  },
  {
    title: 'WhatsApp e integrações',
    description: 'Evolution, Make, callback e persistência das conversas.',
    href: '#integracoes',
    icon: MessageCircle
  },
  {
    title: 'IA e automações',
    description: 'Regras, handoff humano, estoque e respostas fora do horário.',
    href: '#parametros',
    icon: Bot
  },
  {
    title: 'Voz e áudios',
    description: 'Controle de respostas gravadas e uso da voz autorizada.',
    href: '#parametros',
    icon: Mic2
  },
  {
    title: 'Segurança',
    description: 'Sessões, código administrativo, RLS e credenciais no servidor.',
    href: '#seguranca',
    icon: ShieldCheck
  }
];

export default async function SettingsPage() {
  const profile = await getAuthenticatedProfile();
  if (!hasAnyRole(profile, ['owner', 'admin'])) redirect('/dashboard');

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Gestão • Administração"
        title="Central administrativa"
        description="Configurações da empresa, WhatsApp, IA, voz e segurança organizadas em um único ambiente."
        action={
          <Link
            href="/whatsapp/chat"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-700 transition hover:border-violet-300 hover:text-violet-700"
          >
            <FlaskConical className="h-4 w-4" /> Laboratório da IA
          </Link>
        }
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {areas.map((area) => (
          <a
            key={area.title}
            href={area.href}
            className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-lg"
          >
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-slate-600 transition group-hover:bg-violet-50 group-hover:text-violet-700">
              <area.icon className="h-5 w-5" />
            </span>
            <h2 className="mt-4 text-sm font-black text-slate-950">{area.title}</h2>
            <p className="mt-1 text-xs leading-5 text-slate-500">{area.description}</p>
          </a>
        ))}
      </section>

      <IntegrationStatus />

      <div id="parametros" className="scroll-mt-24">
        <AiBusinessSettingsForm />
      </div>

      <section
        id="seguranca"
        className="scroll-mt-24 rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-card md:p-6"
      >
        <div className="flex items-start gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-50 text-emerald-700">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-lg font-black text-slate-950">Camadas de segurança ativas</h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              O login usa Supabase Auth, as rotas administrativas exigem sessão e perfil autorizado, e as credenciais da Evolution e service role permanecem somente no servidor.
            </p>
          </div>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {[
            ['Sessão no servidor', 'Middleware e layout validam o usuário antes de liberar o CRM.'],
            ['Permissão por função', 'Somente proprietário e administrador acessam esta central.'],
            ['Isolamento de dados', 'RLS e company_id mantêm os dados vinculados à empresa correta.']
          ].map(([title, description]) => (
            <div key={title} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <strong className="text-sm text-slate-900">{title}</strong>
              <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
