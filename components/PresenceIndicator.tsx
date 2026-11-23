import type { ReactNode } from "react";

export default function PresenceIndicator({
  count,
  visitors = 0,
  announce = false,
  children,
  compact = false,
}: {
  count?: number;
  visitors?: number;
  announce?: boolean;
  children?: ReactNode;
  compact?: boolean;
}) {
  const label =
    count === undefined
      ? "Conectando…"
      : count > 1000
        ? "1000+ viendo"
        : `${count} viendo`;

  return (
    <span
      aria-atomic={announce ? true : undefined}
      aria-live={announce ? "polite" : undefined}
      className="inline-flex flex-wrap items-center gap-2 text-xs tabular-nums"
      role={announce ? "status" : undefined}
    >
      <span className={compact ? "hs-presence hs-presence--sm" : "hs-presence"}>
        <span
          aria-hidden="true"
          className="hs-presence-dot after:content-none!"
        />
        {!compact && <span className="hs-presence-live">En vivo</span>}
        <span className="hs-presence-count" key={label}>
          {label}
        </span>
        {children}
      </span>
      {visitors > 0 && (
        <span className="whitespace-nowrap text-muted-foreground">
          {visitors > 1000
            ? "+1000 visitantes o más"
            : `+${visitors} visitante${visitors === 1 ? "" : "s"}`}
        </span>
      )}
    </span>
  );
}
