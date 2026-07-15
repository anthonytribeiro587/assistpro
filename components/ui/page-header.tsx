import type { ReactNode } from 'react';

export function PageHeader({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: ReactNode }) {
  return (
    <header className="flex flex-col gap-4 rounded-[1.75rem] border border-line bg-white p-5 shadow-card md:flex-row md:items-center md:justify-between">
      <div>
        {eyebrow ? (
          <span className="inline-flex items-center rounded-full bg-brandLight px-3 py-1 text-xs font-bold text-brand">
            {eyebrow}
          </span>
        ) : null}
        <h1 className="mt-3 text-2xl font-black tracking-tight text-ink md:text-3xl">{title}</h1>
        {description ? <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">{description}</p> : null}
      </div>
      {action}
    </header>
  );
}
