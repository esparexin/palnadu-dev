import type { Service } from '@palnadu/types';
import { Edit2, Trash2, Briefcase, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { siteConfig } from '@palnadu/config';
import { cn } from '@/lib/utils';

interface ServiceTableProps {
  services: Service[];
  loading: boolean;
  onEdit: (_service: Service) => void;
  onDelete: (_target: { id: string; title: string }) => void;
}

export function ServiceTable({ services, loading, onEdit, onDelete }: ServiceTableProps) {
  return (
    <div className="rounded-lg border border-palnadu-border bg-white shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-palnadu-border bg-palnadu-off-white/50 text-palnadu-secondary text-left font-semibold">
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Service Title & Slug</th>
              <th className="px-4 py-3">Deliverables Summary</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-palnadu-secondary">
                  Loading services...
                </td>
              </tr>
            ) : services.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-palnadu-secondary">
                  No services found. Add your first service capability above.
                </td>
              </tr>
            ) : (
              services.map((service) => (
                <tr
                  key={service.id}
                  className="border-b border-palnadu-border/60 hover:bg-palnadu-light-blue/20 transition-colors"
                >
                  <td className="px-4 py-3 font-mono text-palnadu-secondary font-bold">
                    0{service.order}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-bold text-palnadu-dark text-xs flex items-center gap-1.5">
                      <Briefcase className="h-3.5 w-3.5 text-palnadu-blue shrink-0" />
                      <span>{service.title}</span>
                    </div>
                    <div className="font-mono text-xs text-palnadu-secondary mt-0.5">
                      /services/{service.slug}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-palnadu-body max-w-sm">
                    <p className="line-clamp-2 leading-relaxed text-xs">
                      {service.shortDescription}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        'inline-flex rounded-md border px-2 py-0.5 text-xs font-bold uppercase tracking-wider',
                        service.status === 'PUBLISHED'
                          ? 'bg-palnadu-teal/10 text-palnadu-teal border-palnadu-teal/30'
                          : 'bg-palnadu-off-white text-palnadu-secondary border-palnadu-border',
                      )}
                    >
                      {service.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right space-x-1">
                    <a
                      href={`${siteConfig.url}/services/${service.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center p-1.5 rounded-md text-palnadu-secondary hover:text-palnadu-blue hover:bg-palnadu-light-blue transition-colors"
                      title="View Live Page"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(service)}
                      className="h-7 w-7 text-palnadu-blue hover:bg-palnadu-light-blue hover:text-palnadu-blue"
                      title="Edit Service"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete({ id: service.id, title: service.title })}
                      className="h-7 w-7 text-palnadu-error hover:bg-palnadu-error/10 hover:text-palnadu-error"
                      title="Delete Service"
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
