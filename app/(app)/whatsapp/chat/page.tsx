import Link from 'next/link';
import { ArrowLeft, Mic, MoreHorizontal, Send } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';

export default function AiChatPage() {
  return (
    <div className="space-y-5">
      <PageHeader eyebrow="IA" title="Chat com IA" description="Conversa assistida com respostas seguras, handoff humano e contexto da OS." action={<Link href="/whatsapp" className="inline-flex items-center gap-2 rounded-2xl border border-line bg-white px-4 py-3 text-sm font-bold text-ink"><ArrowLeft className="h-4 w-4" /> Voltar</Link>} />

      <section className="mx-auto flex h-[calc(100vh-220px)] min-h-[560px] max-w-3xl flex-col overflow-hidden rounded-[1.75rem] border border-line bg-white shadow-card">
        <header className="flex items-center justify-between border-b border-line p-4">
          <div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-full bg-brand text-sm font-black text-white">JR</span><div><strong className="text-ink">Assistente JR (IA)</strong><p className="text-xs text-muted">Atendimento virtual</p></div></div>
          <MoreHorizontal className="h-5 w-5 text-muted" />
        </header>
        <div className="flex-1 space-y-4 overflow-y-auto bg-[#efeae2] p-4">
          <div className="max-w-[82%] rounded-2xl bg-white p-3 text-sm shadow-sm">Olá! 👋 Eu sou o assistente virtual da JR Celular. Como posso te ajudar hoje?</div>
          <div className="ml-auto max-w-[82%] rounded-2xl bg-[#d9fdd3] p-3 text-sm shadow-sm">Quero saber o valor para trocar a tela do iPhone 11</div>
          <div className="max-w-[82%] rounded-2xl bg-white p-3 text-sm shadow-sm">Claro! A troca da tela do iPhone 11 Original fica R$ 300,00 e a mão de obra é R$ 50,00. Total: R$ 350,00 ✅</div>
          <div className="ml-auto max-w-[82%] rounded-2xl bg-[#d9fdd3] p-3 text-sm shadow-sm">Qual o prazo do serviço?</div>
          <div className="max-w-[82%] rounded-2xl bg-white p-3 text-sm shadow-sm">O prazo médio é de 24h úteis após a aprovação do orçamento.</div>
        </div>
        <footer className="flex items-center gap-2 border-t border-line bg-white p-3">
          <input className="min-w-0 flex-1 rounded-2xl border border-line bg-app px-4 py-3 text-sm outline-none focus:border-brand" placeholder="Digite sua mensagem..." />
          <Link href="/voz" className="grid h-11 w-11 place-items-center rounded-2xl border border-line bg-white text-brand"><Mic className="h-5 w-5" /></Link>
          <button className="grid h-11 w-11 place-items-center rounded-2xl bg-brand text-white"><Send className="h-5 w-5" /></button>
        </footer>
      </section>
    </div>
  );
}
