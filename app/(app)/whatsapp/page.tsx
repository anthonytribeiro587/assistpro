import Link from 'next/link';
import { MessageCircle, Search } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { conversations } from '@/lib/app-data';

export default function WhatsappPage() {
  return (
    <div className="space-y-5">
      <PageHeader eyebrow="WhatsApp" title="Conversas" description="Inbox integrado ao fluxo de OS, com prioridade para mensagens não lidas e pré-atendimentos." />

      <section className="grid gap-5 xl:grid-cols-[.9fr_1.1fr]">
        <article className="rounded-[1.75rem] border border-line bg-white p-4 shadow-card">
          <div className="flex items-center gap-2 rounded-2xl border border-line bg-app px-4 py-3 text-muted">
            <Search className="h-4 w-4" />
            <input className="w-full bg-transparent text-sm outline-none" placeholder="Buscar conversa" />
          </div>
          <div className="mt-4 flex gap-2 overflow-x-auto no-scrollbar">
            {['Todas 8', 'Não lidas 3', 'Em atendimento 2'].map((item, index) => <span key={item} className={`whitespace-nowrap rounded-full px-3 py-2 text-xs font-bold ${index === 0 ? 'bg-brand text-white' : 'bg-app text-muted'}`}>{item}</span>)}
          </div>
          <div className="mt-4 space-y-2">
            {conversations.map((conversation) => (
              <Link key={conversation.name} href="/whatsapp/chat" className="flex items-center gap-3 rounded-2xl p-3 hover:bg-app">
                <span className="grid h-12 w-12 place-items-center rounded-full bg-brandLight text-xs font-black text-brand">{conversation.avatar}</span>
                <div className="min-w-0 flex-1"><strong className="block truncate text-sm text-ink">{conversation.name}</strong><p className="text-xs font-semibold text-muted">{conversation.orderId}</p><p className="truncate text-sm text-muted">{conversation.message}</p></div>
                <div className="text-right"><p className="text-xs text-muted">{conversation.time}</p>{conversation.unread ? <span className="mt-2 inline-grid h-5 w-5 place-items-center rounded-full bg-brand text-[10px] font-bold text-white">{conversation.unread}</span> : null}</div>
              </Link>
            ))}
          </div>
        </article>

        <article className="flex min-h-[560px] flex-col overflow-hidden rounded-[1.75rem] border border-line bg-white shadow-card">
          <div className="flex items-center gap-3 border-b border-line p-4"><span className="grid h-11 w-11 place-items-center rounded-full bg-brandLight text-xs font-black text-brand">JR</span><div><strong className="text-ink">Assistente JR (IA)</strong><p className="text-xs text-muted">Atendimento virtual • Evolution API preparada</p></div></div>
          <div className="flex-1 space-y-3 bg-[#efeae2] p-4">
            <div className="max-w-[78%] rounded-2xl bg-white p-3 text-sm shadow-sm">Olá! 👋 Sou o assistente virtual da JR Celular. Como posso ajudar hoje?</div>
            <div className="ml-auto max-w-[78%] rounded-2xl bg-[#d9fdd3] p-3 text-sm shadow-sm">Quero saber o valor para trocar a tela do iPhone 11</div>
            <div className="max-w-[78%] rounded-2xl bg-white p-3 text-sm shadow-sm">Claro! A troca de tela do iPhone 11 fica em torno de R$ 300,00 a R$ 350,00. Para confirmar, me envie uma foto do aparelho.</div>
          </div>
          <div className="flex items-center gap-2 border-t border-line p-3"><input className="min-w-0 flex-1 rounded-2xl border border-line bg-app px-4 py-3 text-sm outline-none" placeholder="Digite sua mensagem..." /><Link href="/voz" className="grid h-11 w-11 place-items-center rounded-2xl bg-brand text-white"><MessageCircle className="h-5 w-5" /></Link></div>
        </article>
      </section>
    </div>
  );
}
