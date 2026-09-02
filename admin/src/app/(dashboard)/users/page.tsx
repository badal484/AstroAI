'use client';

import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { AdminPermission } from '@astroai/shared-types';
import { Button } from '@/components/ui/button';
import { isForbidden } from '@/lib/apiError';
import { listUsers, reactivateUser, suspendUser } from '@/lib/adminUsersApi';
import { useAdminAuthStore } from '@/stores/adminAuthStore';

export default function UsersPage() {
  const queryClient = useQueryClient();
  const canManage = useAdminAuthStore((state) => state.hasPermission(AdminPermission.USERS_MANAGE));

  const usersQuery = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: () => listUsers(),
  });

  const suspendMutation = useMutation({
    mutationFn: suspendUser,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }),
  });

  const reactivateMutation = useMutation({
    mutationFn: reactivateUser,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }),
  });

  if (usersQuery.isPending) {
    return <p className="text-sm text-muted-foreground">Loading users…</p>;
  }

  if (usersQuery.isError) {
    if (isForbidden(usersQuery.error)) {
      return (
        <p className="text-sm text-destructive">You don&apos;t have permission to view users.</p>
      );
    }
    return <p className="text-sm text-destructive">Failed to load users. Please try again.</p>;
  }

  if (usersQuery.data.items.length === 0) {
    return <p className="text-sm text-muted-foreground">No users yet.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Users</h1>
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border text-muted-foreground">
            <th className="py-2 font-medium">Email</th>
            <th className="py-2 font-medium">Status</th>
            {canManage && <th className="py-2 font-medium">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {usersQuery.data.items.map((user) => (
            <tr key={user.id} className="border-b border-border">
              <td className="py-2">{user.email ?? '—'}</td>
              <td className="py-2">{user.status}</td>
              {canManage && (
                <td className="py-2">
                  {user.status === 'suspended' ? (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={reactivateMutation.isPending}
                      onClick={() => reactivateMutation.mutate(user.id)}
                    >
                      Reactivate
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={suspendMutation.isPending}
                      onClick={() => suspendMutation.mutate(user.id)}
                    >
                      Suspend
                    </Button>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
