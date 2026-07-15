import { Bot, KeyRound, ShieldCheck } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';

export default function SettingsPage() {
  return (
    <div className="space-y-5">
      <PageHeader eyebrow="Administração" title="Configurações" description="Ajustes de empresa, permissões, Evolution API e políticas do atendente virtual." />
      <section className="grid gap-5 xl:grid-cols-3">
        {[
          { title: 'Empresa', description: 'Nome, telefone, endereço e identidade visual.', icon: ShieldCheck },
          { title: 'Evolution API', description: 'Instância, webhooks e status de conexão.', icon: KeyRound },
          { title: 'Atendente IA', description: 'Regras de atendimento, handoff e voz autorizada.', icon: Bot }
        ].map((item) => (
          <article key={item.title} className="rounded-[1.75rem] border border-line bg-white p-5 shadow-card">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brandLight text-brand"><item.icon className="h-5 w-5" /></span>
            <h2 className="mt-4 text-xl font-black text-ink">{item.title}</h2>
            <p className="mt-2 text-sm leading-6 text-muted">{item.description}</p>
            <button className="mt-5 rounded-2xl border border-line px-4 py-3 text-sm font-bold text-ink">Configurar</button>
          </article>
        ))}
      </section>
    </div>
  );
}
