'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { Service } from '@palnadu/types';
import { cn } from '@/lib/utils';

export default function ServicesAdminPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.services
      .list()
      .then((res: any) => setServices(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Services</h1>
          <p className="text-muted-foreground">Manage service pages and content.</p>
        </div>
        <button className="inline-flex h-10 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          Add Service
        </button>
      </div>

      <div className="rounded-lg border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">Title</th>
                <th className="px-4 py-3 text-left font-medium">Slug</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">Order</th>
                <th className="px-4 py-3 text-left font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Loading...</td>
                </tr>
              ) : services.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    No services yet. Create your first service.
                  </td>
                </tr>
              ) : (
                services.map((service) => (
                  <tr key={service.id} className="border-b hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{service.title}</td>
                    <td className="px-4 py-3 text-muted-foreground font-mono text-xs">/{service.slug}</td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'rounded-full px-2 py-0.5 text-xs font-medium',
                          service.status === 'PUBLISHED' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800',
                        )}
                      >
                        {service.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{service.order}</td>
                    <td className="px-4 py-3">
                      <button className="text-sm text-primary hover:underline">Edit</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
