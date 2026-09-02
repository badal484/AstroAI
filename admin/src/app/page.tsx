import { Button } from '@/components/ui/button';

/**
 * Placeholder landing page for the foundation phase. No admin business
 * screens (users, wallet, pricing, ...) exist yet — see ARCHITECTURE.md §3.
 */
export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-2xl font-semibold">AstroAI Admin</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        Foundation scaffold. Operational modules (users, wallet, pricing, AI configuration, and the
        rest of ARCHITECTURE.md §4) are not implemented yet.
      </p>
      <Button variant="outline" disabled>
        Sign in (not yet implemented)
      </Button>
    </main>
  );
}
