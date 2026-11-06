export default function PlaceholderPage({ title }: { title: string }) {
  return (
    <div>
      <h1 className="text-4xl font-normal text-ink">{title}</h1>
      <p className="mt-4 text-accent">Coming soon.</p>
    </div>
  );
}
