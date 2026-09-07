'use client';

export default function TestimonialsAdminPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Testimonials</h1>
          <p className="text-muted-foreground">Manage genuine client feedback and reviews.</p>
        </div>
        <button className="inline-flex h-10 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          Add Testimonial
        </button>
      </div>

      <div className="rounded-lg border border-dashed p-12 text-center">
        <p className="text-muted-foreground">
          No testimonials recorded yet. Per our brand principle, we only display genuine, verified client feedback.
        </p>
      </div>
    </div>
  );
}
