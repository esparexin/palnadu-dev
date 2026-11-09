import type { User } from '@palnadu/types';
import { UserCheck, UserX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { roleColors } from './types';

interface UserTableProps {
  users: User[];
  loading: boolean;
  onRoleChange: (_userId: string, _newRole: string) => void;
  onStatusClick: (_user: User) => void;
}

export function UserTable({ users, loading, onRoleChange, onStatusClick }: UserTableProps) {
  return (
    <div className="rounded-lg border border-palnadu-border bg-white shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-palnadu-border bg-palnadu-off-white/50 text-palnadu-secondary text-left font-semibold">
              <th className="px-4 py-3">User Name</th>
              <th className="px-4 py-3">Email Address</th>
              <th className="px-4 py-3">Assigned Role</th>
              <th className="px-4 py-3">Account Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-palnadu-secondary">
                  Loading users...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-palnadu-secondary">
                  No users found.
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-palnadu-border/60 hover:bg-palnadu-light-blue/20 transition-colors"
                >
                  <td className="px-4 py-3 font-bold text-palnadu-dark">{user.name}</td>
                  <td className="px-4 py-3 text-palnadu-body font-mono">{user.email}</td>
                  <td className="px-4 py-3">
                    <select
                      value={user.role}
                      onChange={(e) => onRoleChange(user.id, e.target.value)}
                      className={cn(
                        'rounded-md border px-2 py-0.5 text-xs font-bold uppercase tracking-wider cursor-pointer focus-visible:outline-none',
                        roleColors[user.role] ||
                          'bg-palnadu-off-white text-palnadu-dark border-palnadu-border',
                      )}
                    >
                      <option value="SUPER_ADMIN">Super Admin</option>
                      <option value="ADMIN">Admin</option>
                      <option value="PROJECT_MANAGER">Project Manager</option>
                      <option value="EDITOR">Editor</option>
                      <option value="DEVELOPER">Developer</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-bold uppercase tracking-wider',
                        user.isActive
                          ? 'bg-palnadu-teal/10 text-palnadu-teal border-palnadu-teal/20'
                          : 'bg-palnadu-off-white text-palnadu-secondary border-palnadu-border',
                      )}
                    >
                      <span
                        className={cn(
                          'h-1.5 w-1.5 rounded-full',
                          user.isActive ? 'bg-palnadu-teal' : 'bg-palnadu-secondary',
                        )}
                      />
                      <span>{user.isActive ? 'Active' : 'Deactivated'}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onStatusClick(user)}
                      className={cn(
                        'h-7 px-2.5 text-xs font-semibold gap-1 transition-colors',
                        user.isActive
                          ? 'border-palnadu-border text-palnadu-secondary hover:bg-palnadu-error/10 hover:text-palnadu-error hover:border-palnadu-error/30'
                          : 'border-palnadu-teal/30 text-palnadu-teal bg-palnadu-teal/5 hover:bg-palnadu-teal/15',
                      )}
                    >
                      {user.isActive ? (
                        <>
                          <UserX className="h-3 w-3" />
                          <span>Deactivate</span>
                        </>
                      ) : (
                        <>
                          <UserCheck className="h-3 w-3" />
                          <span>Activate</span>
                        </>
                      )}
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
