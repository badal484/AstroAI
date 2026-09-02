'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { AdminPermission } from '@astroai/shared-types';
import { Button } from '@/components/ui/button';
import { adminLogout, adminMe } from '@/lib/adminAuthApi';
import { useAdminAuthStore } from '@/stores/adminAuthStore';

/**
 * The authoritative auth check for every protected page: asks the backend
 * "who am I" (the httpOnly cookie can't be read here) and only renders
 * children once that resolves. middleware.ts already redirected requests
 * with no session cookie at all before this ever runs; this additionally
 * catches a cookie that exists but no longer represents a valid session
 * (expired past refresh, revoked, or an account that's since been
 * suspended/deleted) — cases middleware can't see since it never talks to
 * the backend.
 */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { status, admin, setAuthenticated, setUnauthenticated, setLoading, hasPermission } =
    useAdminAuthStore();

  const query = useQuery({
    queryKey: ['admin', 'me'],
    queryFn: adminMe,
    retry: false,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (query.isPending) {
      setLoading();
      return;
    }
    if (query.data) {
      setAuthenticated(query.data);
      return;
    }
    if (query.isError) {
      setUnauthenticated();
      router.replace('/login');
    }
    // setLoading/setAuthenticated/setUnauthenticated are stable Zustand
    // actions; router is stable from Next — omitting them avoids
    // re-running this on every render while still reacting to query state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query.isPending, query.isError, query.data]);

  async function handleLogout() {
    try {
      await adminLogout();
    } catch {
      // Best-effort: even if the network call fails, clear local state and
      // leave — the server-side session will simply expire on its own.
    } finally {
      setUnauthenticated();
      router.replace('/login');
    }
  }

  if (status !== 'authenticated' || !admin) {
    return (
      <main className="flex flex-1 items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </main>
    );
  }

  return (
    <div className="flex flex-1">
      <aside className="flex w-56 flex-col gap-1 border-r border-border p-4">
        <Link href="/" className="rounded-md px-3 py-2 text-sm font-medium hover:bg-muted">
          Dashboard
        </Link>
        {hasPermission(AdminPermission.USERS_READ) && (
          <Link href="/users" className="rounded-md px-3 py-2 text-sm font-medium hover:bg-muted">
            Users
          </Link>
        )}
      </aside>
      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border px-6 py-3">
          <div>
            <p className="text-sm font-medium">{admin.name}</p>
            <p className="text-xs text-muted-foreground">{admin.role}</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => void handleLogout()}>
            Log out
          </Button>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
