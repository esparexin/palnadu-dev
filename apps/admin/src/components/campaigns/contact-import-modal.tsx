'use client';

import { useState } from 'react';
import { X, UploadCloud } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface ContactImportModalProps {
  open: boolean;
  onClose: () => void;
  onImport: (_contacts: Array<{
    businessName: string;
    phone: string;
    city?: string;
    category?: string;
    hasWebsite?: boolean;
  }>) => Promise<void>;
}

export function ContactImportModal({ open, onClose, onImport }: ContactImportModalProps) {
  const [csvText, setCsvText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleParseAndSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const lines = csvText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0 && !l.startsWith('#'));

    if (lines.length === 0) {
      setError('Please provide at least one contact line.');
      return;
    }

    const parsedContacts = [];
    for (const line of lines) {
      const parts = line.split(',').map((p) => p.trim());
      if (parts.length < 2) continue;

      const [businessName, phone, city, category, hasWebsiteStr] = parts;
      parsedContacts.push({
        businessName,
        phone,
        city: city || 'Palnadu',
        category: category || 'General',
        hasWebsite: hasWebsiteStr === 'true' || hasWebsiteStr === '1',
      });
    }

    if (parsedContacts.length === 0) {
      setError('No valid contact entries found. Format: Business Name, Phone, City, Category, HasWebsite');
      return;
    }

    setSubmitting(true);
    try {
      await onImport(parsedContacts);
      setCsvText('');
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-palnadu-dark/40 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-lg border border-palnadu-border bg-palnadu-white p-6 shadow-lg">
        <div className="flex items-center justify-between border-b border-palnadu-border pb-3">
          <div className="flex items-center gap-2">
            <UploadCloud className="h-5 w-5 text-palnadu-teal" />
            <h3 className="text-sm font-semibold text-palnadu-dark">Import Business Contacts</h3>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-7 w-7 p-0">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleParseAndSubmit} className="mt-4 space-y-4">
          <div className="space-y-1">
            <Label htmlFor="csv-input" className="text-xs font-medium text-palnadu-dark">
              Paste CSV / Tab-separated Contacts
            </Label>
            <p className="text-xs text-palnadu-secondary">
              Format: <code className="font-mono text-palnadu-dark">Business Name, Phone, City, Category, HasWebsite(true/false)</code>
            </p>
            <Textarea
              id="csv-input"
              rows={8}
              required
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              placeholder={`Sri Lakshmi Rice Mill, 919876543210, Narasaraopet, Agri-Trading, false\nKaveri Pesticides, 919876543211, Chilakaluripet, Retail, false\nGuntur Spices Trading, 919876543212, Guntur, Export, true`}
              className="font-mono text-xs"
            />
          </div>

          {error && <p className="text-xs text-palnadu-error">{error}</p>}

          <div className="flex justify-end gap-2 border-t border-palnadu-border pt-4">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={submitting} className="bg-palnadu-teal hover:bg-palnadu-teal-dark text-white">
              {submitting ? 'Importing...' : 'Import Contacts'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
