interface PagePlaceholderProps {
  title: string;
  description: string;
}

export function PagePlaceholder({ title, description }: PagePlaceholderProps) {
  return (
    <div className="mx-auto max-w-md rounded-xl border border-dashed p-10 text-center">
      <h1 className="text-lg font-semibold">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
