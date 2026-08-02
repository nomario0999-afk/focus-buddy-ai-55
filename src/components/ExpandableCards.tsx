import { useState } from "react";

export type CardItem = {
  icon: string;
  title: string;
  desc: string;
  tint: string;
  points: string[];
};

export default function ExpandableCards({ items, columns = 3 }: { items: CardItem[]; columns?: 2 | 3 }) {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <div className={`mt-8 grid gap-4 sm:grid-cols-2 ${columns === 3 ? "lg:grid-cols-3" : ""}`}>
      {items.map((f) => {
        const isOpen = open === f.title;
        return (
          <button
            key={f.title}
            type="button"
            aria-expanded={isOpen}
            onClick={() => setOpen(isOpen ? null : f.title)}
            className={`rounded-2xl border bg-card p-6 text-left shadow-[var(--shadow-card)] transition hover:-translate-y-1 ${
              isOpen ? "border-primary ring-2 ring-primary/30 sm:col-span-2 lg:col-span-1" : "border-border"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl text-2xl" style={{ background: f.tint }}>
                {f.icon}
              </div>
              <span className={`text-xl text-muted-foreground transition-transform ${isOpen ? "rotate-45" : ""}`}>+</span>
            </div>
            <h3 className="mt-4 text-lg font-bold">{f.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
            {isOpen && (
              <ul className="mt-4 space-y-2 border-t border-border pt-4">
                {f.points.map((p) => (
                  <li key={p} className="flex gap-2 text-sm text-foreground">
                    <span className="text-primary">✦</span>
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            )}
            {!isOpen && <span className="mt-3 block text-xs font-semibold text-primary">Tap to see what it does →</span>}
          </button>
        );
      })}
    </div>
  );
}
