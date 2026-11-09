import type { Client } from '@palnadu/types';
import { Edit2, Trash2, Building } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ClientTableProps {
  clients: Client[];
  loading: boolean;
  onEdit: (_client: Client) => void;
  onDelete: (_target: { id: string; name: string }) => void;
}

export function ClientTable({ clients, loading, onEdit, onDelete }: ClientTableProps) {
  return (
    <div className="rounded-lg border border-palnadu-border bg-white shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-palnadu-border bg-palnadu-off-white/50 text-palnadu-secondary text-left font-semibold">
              <th className="px-4 py-3">Client Name</th>
              <th className="px-4 py-3">Company</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Added Date</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-palnadu-secondary">
                  Loading clients...
                </td>
              </tr>
            ) : clients.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-palnadu-secondary">
                  <p className="font-medium text-palnadu-dark">No clients found</p>
                  <p className="text-xs mt-1">
                    Add a new client above or convert an inquiry from the Leads page.
                  </p>
                </td>
              </tr>
            ) : (
              clients.map((client) => (
                <tr
                  key={client.id}
                  className="border-b border-palnadu-border/60 hover:bg-palnadu-light-blue/20 transition-colors"
                >
                  <td className="px-4 py-3 font-bold text-palnadu-dark">{client.name}</td>
                  <td className="px-4 py-3 text-palnadu-body">
                    {client.company ? (
                      <span className="inline-flex items-center gap-1">
                        <Building className="h-3 w-3 text-palnadu-secondary" />
                        <span>{client.company}</span>
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-4 py-3 text-palnadu-body font-mono">
                    <a href={`mailto:${client.email}`} className="text-palnadu-blue hover:underline">
                      {client.email}
                    </a>
                  </td>
                  <td className="px-4 py-3 text-palnadu-body font-mono">{client.phone || '—'}</td>
                  <td className="px-4 py-3 text-palnadu-secondary">
                    {new Date(client.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right space-x-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(client)}
                      className="h-7 w-7 text-palnadu-blue hover:bg-palnadu-light-blue hover:text-palnadu-blue"
                      title="Edit Client"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete({ id: client.id, name: client.name })}
                      className="h-7 w-7 text-palnadu-error hover:bg-palnadu-error/10 hover:text-palnadu-error"
                      title="Delete Client"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
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
