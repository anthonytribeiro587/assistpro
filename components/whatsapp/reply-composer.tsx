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
    <div className="border-t border-slate-200 bg-white p-2.5">
      {error ? (
        <p className="mb-2 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">{error}</p>
      ) : null}
      <form onSubmit={submit} className="flex items-end gap-2">
        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          rows={1}
          maxLength={3000}
          placeholder="Responder como atendente..."
          className="max-h-28 min-h-10 min-w-0 flex-1 resize-y rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-violet-500 focus:bg-white focus:ring-2 focus:ring-violet-100"
        />
        <button
          type="submit"
          disabled={!text.trim() || pending}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-violet-600 text-white shadow-md shadow-violet-200 transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Enviar resposta"
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </button>
      </form>
    </div>
  );
}
