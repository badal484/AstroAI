'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

/**
 * App Router error boundary foundation. Never surfaces raw error messages/
 * stack traces to the user — logs client-side for now (a proper error-
 * reporting sink is a later concern) and shows a safe, actionable message
 * with a retry path, per CLAUDE.md §39/§43 (no dead-end screens).
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-xl font-semibold">Something went wrong</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        Please try again. If the problem persists, contact an administrator.
      </p>
      <Button onClick={reset}>Try again</Button>
    </main>
  );
}
