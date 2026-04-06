export function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="rounded-lg border border-dashed bg-muted p-6">
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        This section is mocked for quick access and will be implemented in a future sprint.
      </p>
    </div>
  );
}
