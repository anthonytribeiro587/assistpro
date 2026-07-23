import type { ReactNode } from 'react';

export function PageHeader({
  eyebrow,
  title,
  description,
  action
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-3 rounded-2xl border border-line bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
      <div className="min-w-0">
        {eyebrow ? (
          <span className="text-[10px] font-black uppercase tracking-[0.16em] text-brand">
            {eyebrow}
          </span>
        ) : null}
        <h1 className="mt-1 text-xl font-extrabold tracking-tight text-ink md:text-2xl">{title}</h1>
        {description ? (
          <p className="mt-1 max-w-3xl text-sm leading-5 text-muted">{description}</p>
        ) : null}
      </div>
      {action}
    </header>
  );
}
