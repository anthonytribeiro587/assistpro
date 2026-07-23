'use client';

import { FormEvent, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Send } from 'lucide-react';

export function ReplyComposer({ conversationId }: { conversationId: string }) {
  const router = useRouter();
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [pending, startTransition] = useTransition();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = text.trim();
    if (!content || pending) return;

    setError('');
    startTransition(async () => {
      try {
        const response = await fetch('/api/whatsapp/messages/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ conversationId, text: content })
        });
        const payload = (await response.json()) as { ok?: boolean; error?: string };
        if (!response.ok || !payload.ok) throw new Error(payload.error || 'Falha ao enviar a mensagem.');
        setText('');
        router.refresh();
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : 'Falha ao enviar a mensagem.');
      }
    });
  }

  return (
    <div className="border-t border-slate-200 bg-white p-3 sm:p-4">
      {error ? <p className="mb-2 rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">{error}</p> : null}
      <form onSubmit={submit} className="flex items-end gap-2">
        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          rows={1}
          maxLength={3000}
          placeholder="Responder como atendente..."
          className="max-h-32 min-h-11 min-w-0 flex-1 resize-y rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-violet-500 focus:bg-white focus:ring-4 focus:ring-violet-100"
        />
        <button
          type="submit"
          disabled={!text.trim() || pending}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-violet-600 text-white shadow-lg shadow-violet-200 transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Enviar resposta"
        >
          {pending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
        </button>
      </form>
      <p className="mt-2 text-[11px] text-slate-400">A resposta será enviada pela instância Evolution conectada e salva no histórico.</p>
    </div>
  );
}
