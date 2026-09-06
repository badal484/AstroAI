'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { AdminPermission } from '@astroai/shared-types';
import { Button } from '@/components/ui/button';
import { adminLogout, adminMe } from '@/lib/adminAuthApi';
import { useAdminAuthStore } from '@/stores/adminAuthStore';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
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
  }, [query.isPending, query.isError, query.data, router, setAuthenticated, setLoading, setUnauthenticated]);

  async function handleLogout() {
    try {
      await adminLogout();
    } catch {
      // Best-effort
    } finally {
      setUnauthenticated();
      router.replace('/login');
    }
  }

  if (status !== 'authenticated' || !admin) {
    return (
      <main className="flex flex-1 items-center justify-center min-h-screen bg-[#0B0F19] text-slate-300">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#D4A347] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-medium text-slate-400">Authenticating Operations Session…</p>
        </div>
      </main>
    );
  }

  const navLinkClass = (path: string) => {
    const isActive = pathname === path || (path !== '/' && pathname.startsWith(path));
    return `flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium transition ${
      isActive
        ? 'bg-[#1B2236] text-[#E9C16C] border-l-2 border-[#D4A347] font-semibold'
        : 'text-slate-300 hover:bg-[#161D2F] hover:text-white'
    }`;
  };

  return (
    <div className="flex min-h-screen bg-[#0B0F19] text-slate-100 antialiased font-sans">
      {/* Sidebar Navigation */}
      <aside className="w-64 border-r border-slate-800/80 bg-[#121827] flex flex-col justify-between shrink-0 p-4">
        <div className="space-y-6">
          {/* Logo / Brand */}
          <div className="flex items-center gap-3 px-2 py-1">
            <div className="w-8 h-8 rounded-md bg-[#1B2236] border border-[#D4A347]/40 flex items-center justify-center font-serif text-[#D4A347] text-base font-bold">
              V
            </div>
            <div>
              <h1 className="font-semibold text-sm tracking-tight text-white">Astro AI Operations</h1>
              <p className="text-[10px] uppercase font-bold tracking-wider text-[#D4A347]">Acharya Vashishta</p>
            </div>
          </div>

          <nav className="space-y-5 text-xs">
            {/* Core Operations */}
            <div>
              <p className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Operations
              </p>
              <div className="space-y-0.5">
                <Link href="/" className={navLinkClass('/')}>
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                  </svg>
                  <span>Dashboard</span>
                </Link>
                {hasPermission(AdminPermission.USERS_READ) && (
                  <Link href="/users" className={navLinkClass('/users')}>
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                    </svg>
                    <span>Users & Seekers</span>
                  </Link>
                )}
                {hasPermission(AdminPermission.WALLET_READ) && (
                  <Link href="/wallets" className={navLinkClass('/wallets')}>
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" />
                    </svg>
                    <span>Wallets & Ledger</span>
                  </Link>
                )}
                {hasPermission(AdminPermission.PAYMENTS_READ) && (
                  <Link href="/payments" className={navLinkClass('/payments')}>
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6H2.25m0 0v8.25m0-8.25a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0120.25 6v8.25m-18 0a2.25 2.25 0 002.25 2.25h13.5a2.25 2.25 0 002.25-2.25m-18 0v1.5c0 .621.504 1.125 1.125 1.125m16.875-1.125v1.5a2.25 2.25 0 01-2.25 2.25H4.875A2.25 2.25 0 012.625 18" />
                    </svg>
                    <span>Payments & Gateway</span>
                  </Link>
                )}
                {hasPermission(AdminPermission.SUPPORT_READ) && (
                  <Link href="/support" className={navLinkClass('/support')}>
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3.69-3.091a1.5 1.5 0 00-.96-.34H7.5A4.5 4.5 0 013 12.214V10.6c0-.97.616-1.813 1.5-2.097a43.5 43.5 0 0115.75 0z" />
                    </svg>
                    <span>Support & Tickets</span>
                  </Link>
                )}
              </div>
            </div>

            {/* Growth & Pricing */}
            <div>
              <p className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Growth & Billing
              </p>
              <div className="space-y-0.5">
                {hasPermission(AdminPermission.PRICING_READ) && (
                  <Link href="/pricing" className={navLinkClass('/pricing')}>
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
                    </svg>
                    <span>Pricing & Packs</span>
                  </Link>
                )}
                {hasPermission(AdminPermission.PROMOTIONS_READ) && (
                  <Link href="/promotions" className={navLinkClass('/promotions')}>
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H4.5a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                    </svg>
                    <span>Promotions & Referrals</span>
                  </Link>
                )}
                {hasPermission(AdminPermission.NOTIFICATIONS_READ) && (
                  <Link href="/notifications" className={navLinkClass('/notifications')}>
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                    </svg>
                    <span>Campaign Notifications</span>
                  </Link>
                )}
              </div>
            </div>

            {/* Astrology Engine */}
            <div>
              <p className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Astrology & Intelligence
              </p>
              <div className="space-y-0.5">
                {hasPermission(AdminPermission.AI_READ) && (
                  <Link href="/ai" className={navLinkClass('/ai')}>
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 002.25-2.25V5.25a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 5.25v13.5A2.25 2.25 0 006.75 19.5z" />
                    </svg>
                    <span>AI Model Routing</span>
                  </Link>
                )}
                {hasPermission(AdminPermission.ASTROLOGY_READ) && (
                  <Link href="/astrology" className={navLinkClass('/astrology')}>
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                    </svg>
                    <span>Vedic Calculation Engine</span>
                  </Link>
                )}
                {hasPermission(AdminPermission.REPORTS_READ) && (
                  <Link href="/reports" className={navLinkClass('/reports')}>
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                    <span>Reports & Matchmaking</span>
                  </Link>
                )}
                {hasPermission(AdminPermission.VOICE_READ) && (
                  <Link href="/voice" className={navLinkClass('/voice')}>
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                    </svg>
                    <span>Voice Consultations</span>
                  </Link>
                )}
              </div>
            </div>

            {/* Platform & Governance */}
            <div>
              <p className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Governance
              </p>
              <div className="space-y-0.5">
                {hasPermission(AdminPermission.CONTENT_READ) && (
                  <Link href="/content" className={navLinkClass('/content')}>
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                    </svg>
                    <span>Content & Horoscopes</span>
                  </Link>
                )}
                {hasPermission(AdminPermission.FEATURE_FLAGS_READ) && (
                  <Link href="/feature-flags" className={navLinkClass('/feature-flags')}>
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M3 3v1.5M3 21v-6m0 0l2.77-.693a9 9 0 016.208.682l.108.054a9 9 0 006.086.71l3.114-.732a1.125 1.125 0 00.864-1.091V6.75a1.125 1.125 0 00-.864-1.091l-3.114.732a9 9 0 01-6.086-.71l-.108-.054a9 9 0 00-6.208-.682L3 4.5M3 15V4.5" />
                    </svg>
                    <span>Feature Flags</span>
                  </Link>
                )}
                {hasPermission(AdminPermission.ANALYTICS_READ) && (
                  <Link href="/analytics" className={navLinkClass('/analytics')}>
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
                    </svg>
                    <span>Analytics</span>
                  </Link>
                )}
                {hasPermission(AdminPermission.AUDIT_LOGS_READ) && (
                  <Link href="/audit-logs" className={navLinkClass('/audit-logs')}>
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                    </svg>
                    <span>Audit Logs</span>
                  </Link>
                )}
                {hasPermission(AdminPermission.SYSTEM_SETTINGS_READ) && (
                  <Link href="/settings" className={navLinkClass('/settings')}>
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>System Settings</span>
                  </Link>
                )}
              </div>
            </div>
          </nav>
        </div>

        {/* User Card & Logout */}
        <div className="pt-4 border-t border-slate-800">
          <div className="flex items-center justify-between mb-3 px-2">
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-white truncate">{admin.name}</p>
              <p className="text-[10px] font-mono text-[#D4A347] uppercase">{admin.role}</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void handleLogout()}
            className="w-full bg-[#161D2F] border-slate-800 text-slate-300 hover:bg-red-950/30 hover:text-red-400 hover:border-red-900 transition text-xs font-medium py-1.5"
          >
            Log Out
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-y-auto">
        <main className="flex-1 p-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
