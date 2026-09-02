'use client';

import { useAdminAuthStore } from '@/stores/adminAuthStore';

export default function DashboardHome() {
  const admin = useAdminAuthStore((state) => state.admin);

  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-xl font-semibold">Welcome{admin ? `, ${admin.name}` : ''}</h1>
      <p className="text-sm text-muted-foreground">
        Foundation scaffold. Operational modules beyond authentication (wallet, pricing, AI
        configuration, and the rest of ARCHITECTURE.md §4) are not implemented yet.
      </p>
    </div>
  );
}
