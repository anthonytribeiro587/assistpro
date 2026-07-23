'use client';

import { useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import {
  normalizePipelineStage,
  pipelineStages,
  pipelineStageMeta,
  type PipelineStage
} from '@/lib/pipeline';

export function PipelineStageSelect({
  conversationId,
  initialStage
}: {
  conversationId: string;
  initialStage: string;
}) {
  const [stage, setStage] = useState<PipelineStage>(() => normalizePipelineStage(initialStage));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const meta = pipelineStageMeta(stage);

  async function update(nextStage: PipelineStage) {
    const previous = stage;
    setStage(nextStage);
    setSaving(true);
    setSaved(false);
    setError('');

    try {
      const response = await fetch(`/api/pipeline/${conversationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: nextStage })
      });
      const payload = (await response.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!response.ok || !payload.ok) throw new Error(payload.error || 'Não foi possível alterar a etapa.');
      setSaved(true);
      window.setTimeout(() => setSaved(false), 1600);
    } catch (requestError) {
      setStage(previous);
      setError(requestError instanceof Error ? requestError.message : 'Falha ao alterar a etapa.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="relative">
      <div className={`flex items-center gap-1.5 rounded-lg px-2 py-1 ${meta.badgeClass}`}>
        {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : saved ? <Check className="h-3.5 w-3.5" /> : null}
        <select
          value={stage}
          disabled={saving}
          onChange={(event) => void update(event.target.value as PipelineStage)}
          className="max-w-[190px] bg-transparent text-[10px] font-black outline-none"
          aria-label="Etapa do atendimento"
        >
          {pipelineStages.map((item) => (
            <option key={item.id} value={item.id}>{item.label}</option>
          ))}
        </select>
      </div>
      {error ? (
        <span className="absolute right-0 top-full z-20 mt-1 w-56 rounded-lg border border-red-200 bg-white p-2 text-[10px] font-semibold text-red-700 shadow-lg">
          {error}
        </span>
      ) : null}
    </div>
  );
}
