'use client';

export default function CaseStudiesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Case Studies</h1>
          <p className="text-muted-foreground">Manage case studies and project showcases.</p>
        </div>
        <button className="inline-flex h-10 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          New Case Study
        </button>
      </div>

      <div className="rounded-lg border p-8 text-center">
        <p className="text-muted-foreground">
          No case studies yet. Add your first case study to showcase your work.
        </p>
      </div>
    </div>
  );
}
