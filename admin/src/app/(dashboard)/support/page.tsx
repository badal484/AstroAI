'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';
import { SupportTicketDTO, TicketPriority, TicketStatus } from '@astroai/shared-types';
import { ConfirmActionModal } from '@/components/ConfirmActionModal';
import { adminControlApi } from '@/lib/adminControlApi';

export default function SupportHelpdeskPage() {
  const queryClient = useQueryClient();
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);

  const ticketsQuery = useQuery({
    queryKey: ['admin', 'supportTickets', filterStatus],
    queryFn: () => adminControlApi.listSupportTickets(filterStatus !== 'all' ? { status: filterStatus } : undefined),
  });

  const replyMutation = useMutation({
    mutationFn: ({ ticketId, body }: { ticketId: string; body: string }) =>
      adminControlApi.replySupportTicket(ticketId, body),
    onSuccess: (updatedTicket) => {
      queryClient.setQueryData(['admin', 'supportTickets', filterStatus], (old: SupportTicketDTO[] | undefined) =>
        old ? old.map((t) => (t.id === updatedTicket.id ? updatedTicket : t)) : [updatedTicket],
      );
      setReplyText('');
    },
  });

  const resolveMutation = useMutation({
    mutationFn: ({ ticketId, notes }: { ticketId: string; notes: string }) =>
      adminControlApi.resolveSupportTicket(ticketId, notes),
    onSuccess: (updatedTicket) => {
      queryClient.setQueryData(['admin', 'supportTickets', filterStatus], (old: SupportTicketDTO[] | undefined) =>
        old ? old.map((t) => (t.id === updatedTicket.id ? updatedTicket : t)) : [updatedTicket],
      );
      queryClient.invalidateQueries({ queryKey: ['admin', 'recentAuditLogs'] });
      setIsResolveModalOpen(false);
    },
  });

  const tickets = ticketsQuery.data || [];
  const activeTicket = tickets.find((t) => t.id === selectedTicketId) || tickets[0] || null;

  const handleSendReply = async () => {
    if (!activeTicket || !replyText.trim()) return;
    await replyMutation.mutateAsync({ ticketId: activeTicket.id, body: replyText.trim() });
  };

  const handleResolveConfirm = async (resolutionNotes: string) => {
    if (!activeTicket) return;
    await resolveMutation.mutateAsync({ ticketId: activeTicket.id, notes: resolutionNotes });
  };

  const priorityBadge = (p: TicketPriority) => {
    switch (p) {
      case TicketPriority.URGENT:
        return 'bg-red-950 border-red-800 text-red-300';
      case TicketPriority.HIGH:
        return 'bg-amber-950 border-amber-800 text-amber-300';
      case TicketPriority.NORMAL:
        return 'bg-indigo-950 border-indigo-800 text-indigo-300';
      default:
        return 'bg-slate-950 border-slate-700 text-slate-400';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in" data-testid="support-helpdesk-page">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-white">Support Helpdesk & Seeker Care</h2>
          <p className="text-xs text-slate-400">
            Handle customer inquiries, dispute resolutions, and astrology guidance assistance.
          </p>
        </div>
        <div className="flex gap-2">
          {['all', 'open', 'in_progress', 'resolved'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition ${
                filterStatus === st
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              {st.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[550px]">
        {/* Left List of Tickets */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md flex flex-col gap-2 max-h-[600px] overflow-y-auto">
          {tickets.length === 0 ? (
            <div className="p-6 text-center text-slate-500 text-xs">No support tickets match filter.</div>
          ) : (
            tickets.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedTicketId(t.id)}
                className={`p-3.5 rounded-xl text-left border transition ${
                  (activeTicket?.id === t.id)
                    ? 'bg-slate-800/80 border-indigo-500/80 shadow-md'
                    : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-800/40'
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${priorityBadge(t.priority)}`}>
                    {t.priority.toUpperCase()}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    {new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-white truncate mt-1">{t.subject}</h4>
                <p className="text-[11px] text-slate-400 truncate mt-0.5">{t.userName} ({t.category})</p>
              </button>
            ))
          )}
        </div>

        {/* Right Ticket Thread Pane */}
        {activeTicket ? (
          <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md flex flex-col justify-between">
            <div>
              {/* Header */}
              <div className="flex justify-between items-start pb-4 border-b border-slate-800">
                <div>
                  <h3 className="text-base font-bold text-white">{activeTicket.subject}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Seeker: <span className="text-slate-200 font-semibold">{activeTicket.userName}</span> ({activeTicket.userEmail}) •{' '}
                    <Link href={`/users/${activeTicket.userId}`} className="text-indigo-400 hover:underline">
                      View User 360 →
                    </Link>
                  </p>
                </div>
                {activeTicket.status !== TicketStatus.RESOLVED && activeTicket.status !== TicketStatus.CLOSED && (
                  <button
                    onClick={() => setIsResolveModalOpen(true)}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-950 hover:bg-emerald-900 border border-emerald-800 text-xs font-semibold text-emerald-300 transition"
                  >
                    ✓ Mark Resolved
                  </button>
                )}
              </div>

              {/* Messages Thread */}
              <div className="py-4 space-y-3 max-h-[350px] overflow-y-auto">
                {activeTicket.messages.map((m) => {
                  const isAgent = m.senderType === 'agent';
                  return (
                    <div
                      key={m.id}
                      className={`p-3.5 rounded-2xl text-xs max-w-[85%] ${
                        isAgent
                          ? 'ml-auto bg-indigo-950/80 border border-indigo-800/80 text-slate-100'
                          : 'bg-slate-950 border border-slate-800 text-slate-200'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1 text-[10px] text-slate-400">
                        <span className="font-bold">{m.senderName} ({m.senderType.toUpperCase()})</span>
                        <span className="font-mono">{new Date(m.createdAt).toLocaleTimeString()}</span>
                      </div>
                      <p className="leading-relaxed">{m.body}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Reply Input */}
            {activeTicket.status !== TicketStatus.RESOLVED && (
              <div className="pt-4 border-t border-slate-800 flex gap-3">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSendReply();
                  }}
                  placeholder="Type official support reply to seeker..."
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
                <button
                  onClick={handleSendReply}
                  disabled={replyMutation.isPending || !replyText.trim()}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-xl text-xs font-semibold text-white transition shadow-md"
                >
                  Send Reply
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="lg:col-span-2 p-12 text-center text-slate-500 text-xs">
            Select a ticket to inspect conversation thread.
          </div>
        )}
      </div>

      {activeTicket && (
        <ConfirmActionModal
          isOpen={isResolveModalOpen}
          title={`Resolve Ticket #${activeTicket.id.slice(-6)}`}
          description="Marking this ticket as resolved will notify the user and complete the support case."
          riskLevel="warning"
          confirmText="Mark Resolved"
          onConfirm={handleResolveConfirm}
          onClose={() => setIsResolveModalOpen(false)}
        />
      )}
    </div>
  );
}
