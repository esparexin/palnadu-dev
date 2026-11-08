'use client';

import React from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { CategoryOption } from './types';

interface BlogFiltersProps {
  search: string;
  onSearchChange: (_value: string) => void;
  languageFilter: string;
  onLanguageFilterChange: (_value: string) => void;
  categoryFilter: string;
  onCategoryFilterChange: (_value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (_value: string) => void;
  categories: CategoryOption[];
}

export function BlogFilters({
  search,
  onSearchChange,
  languageFilter,
  onLanguageFilterChange,
  categoryFilter,
  onCategoryFilterChange,
  statusFilter,
  onStatusFilterChange,
  categories,
}: BlogFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-palnadu-secondary" />
        <Input
          type="text"
          placeholder="Search articles by title or keyword..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 pr-3"
        />
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <select
          value={languageFilter}
          onChange={(e) => onLanguageFilterChange(e.target.value)}
          className="flex h-9 rounded-md border border-palnadu-border bg-white px-3 py-1.5 text-xs text-palnadu-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-palnadu-blue cursor-pointer"
        >
          <option value="">All Languages</option>
          <option value="en">English (EN)</option>
          <option value="te">Telugu (TE)</option>
        </select>

        <select
          value={categoryFilter}
          onChange={(e) => onCategoryFilterChange(e.target.value)}
          className="flex h-9 rounded-md border border-palnadu-border bg-white px-3 py-1.5 text-xs text-palnadu-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-palnadu-blue cursor-pointer"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value)}
          className="flex h-9 rounded-md border border-palnadu-border bg-white px-3 py-1.5 text-xs text-palnadu-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-palnadu-blue cursor-pointer"
        >
          <option value="">All Statuses</option>
          <option value="PUBLISHED">Published</option>
          <option value="DRAFT">Drafts Only</option>
          <option value="ARCHIVED">Archived Articles</option>
        </select>
      </div>
    </div>
  );
}
