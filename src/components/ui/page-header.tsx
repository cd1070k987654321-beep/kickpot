type PageHeaderProps = {
  title: string;
  description?: string;
};

export function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <header className="space-y-3">
      <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
      {description ? (
        <p className="text-sm leading-6 text-[var(--color-text-muted)] sm:text-base">
          {description}
        </p>
      ) : null}
    </header>
  );
}
