'use client';

import { useEffect, useRef } from 'react';

export function MessageThread({ children, messageKey }: { children: React.ReactNode; messageKey: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      bottomRef.current?.scrollIntoView({ block: 'end', behavior: 'auto' });
      if (containerRef.current) containerRef.current.scrollTop = containerRef.current.scrollHeight;
    });
    return () => window.cancelAnimationFrame(frame);
  }, [messageKey]);

  return (
    <div ref={containerRef} className="min-h-0 flex-1 space-y-2.5 overflow-y-auto p-3 sm:p-4">
      {children}
      <div ref={bottomRef} aria-hidden="true" />
    </div>
  );
}
