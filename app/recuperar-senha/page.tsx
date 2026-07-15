import Link from 'next/link';
import { Mail } from 'lucide-react';

export default function RecoverPasswordPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-app px-4">
      <section className="w-full max-w-md rounded-[2rem] bg-white p-8 shadow-card">
        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-brandLight text-brand">
          <Mail className="h-6 w-6" />
        </div>
        <h1 className="mt-5 text-2xl font-black text-ink">Recuperar senha</h1>
        <p className="mt-2 text-sm leading-6 text-muted">Informe o e-mail cadastrado. Na integração real, o Supabase Auth enviará o link de redefinição.</p>
        <form className="mt-6 space-y-4">
          <label className="block">
            <span className="text-sm font-bold text-ink">E-mail</span>
            <input className="mt-2 w-full rounded-2xl border border-line bg-app px-4 py-3 text-sm outline-none focus:border-brand" placeholder="seu@email.com" />
          </label>
          <button className="w-full rounded-2xl bg-brand px-4 py-3 text-sm font-black text-white shadow-glow">Enviar instruções</button>
        </form>
        <Link href="/login" className="mt-5 block text-center text-sm font-bold text-brand">Voltar para login</Link>
      </section>
    </main>
  );
}
