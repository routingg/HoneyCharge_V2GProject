import type { LucideIcon } from "lucide-react";

export function PlaceholderScreen({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <section className="placeholder-screen">
      <span className="placeholder-icon">
        <Icon size={28} />
      </span>
      <strong>{title}</strong>
      <p>{description}</p>
      <span className="placeholder-badge">곧 제공됩니다</span>
    </section>
  );
}
