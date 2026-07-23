import Link from 'next/link';
import { MessageCircle } from 'lucide-react';
import { PipelineBoard } from '@/components/pipeline/pipeline-board';
import { PageHeader } from '@/components/ui/page-header';
import { loadWhatsappInbox } from '@/lib/whatsapp-inbox';

export const dynamic = 'force-dynamic';

export default async function PipelinePage() {
  const inbox = await loadWhatsappInbox(180);

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Atendimento"
        title="Funil de clientes"
        description="Organize cada conversa pela próxima ação necessária e mantenha a equipe alinhada."
        action={
          <Link
            href="/whatsapp"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:border-violet-300 hover:text-violet-700"
          >
            <MessageCircle className="h-4 w-4" /> Abrir WhatsApp
          </Link>
        }
      />

      {inbox.error ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-900">
          {inbox.error}
        </div>
      ) : null}

      <PipelineBoard conversations={inbox.conversations} />
    </div>
  );
}
