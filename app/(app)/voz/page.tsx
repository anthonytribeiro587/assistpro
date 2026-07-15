import { Mic2, Play } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';

export default function VoicePage() {
  return (
    <div className="space-y-5">
      <PageHeader eyebrow="Voz autorizada" title="Resposta em áudio" description="Camada premium para gerar áudio com a voz autorizada do JR somente em fluxos aprovados." />

      <section className="mx-auto max-w-2xl rounded-[2rem] border border-line bg-white p-6 text-center shadow-card">
        <div className="mx-auto grid h-40 w-40 place-items-center rounded-full bg-gradient-to-br from-brandLight to-white ring-8 ring-brandLight">
          <div className="grid h-28 w-28 place-items-center rounded-full bg-brand text-4xl font-black text-white shadow-glow">JR</div>
        </div>
        <div className="mx-auto mt-8 flex max-w-md items-center gap-3">
          <Mic2 className="h-6 w-6 text-brand" />
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-brandLight"><div className="h-full w-2/5 rounded-full bg-brand" /></div>
          <span className="text-sm font-bold text-muted">0:18</span>
        </div>
        <button className="mx-auto mt-8 grid h-20 w-20 place-items-center rounded-full bg-brand text-white shadow-glow"><Play className="ml-1 h-8 w-8" /></button>
        <p className="mt-6 rounded-2xl bg-brandLight p-4 text-sm font-bold text-brand">Mensagem gerada pela Voz do JR. Sempre que precisar, é só chamar!</p>
      </section>
    </div>
  );
}
