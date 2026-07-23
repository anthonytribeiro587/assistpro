import { Bot } from 'lucide-react';
import { AiBusinessSettingsForm } from '@/components/settings/ai-business-settings-form';
import { PageHeader } from '@/components/ui/page-header';

export default function SettingsPage() {
  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Administração • Atendimento inteligente"
        title="Configurações da IA"
        description="Parametrize dados da loja, horários, regras, mensagens e automações sem depender de alterações manuais no prompt."
        action={
          <span className="inline-flex items-center gap-2 rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm font-black text-brand">
            <Bot className="h-4 w-4" /> AssistPro IA
          </span>
        }
      />
      <AiBusinessSettingsForm />
    </div>
  );
}
