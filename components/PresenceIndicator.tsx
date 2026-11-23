import { PopoverTrigger } from "@ui-sdk/react/popover";
import type { ReactNode } from "react";

export default function PresenceIndicator({
  count,
  visitors = 0,
  announce = false,
  children,
  compact = false,
  interactive = false,
}: {
  count?: number;
  visitors?: number;
  announce?: boolean;
  children?: ReactNode;
  compact?: boolean;
  interactive?: boolean;
}) {
  const label =
    count === undefined
      ? "Conectando…"
      : count > 1000
        ? "1000+ viendo"
        : `${count} viendo`;
  const Pill = interactive ? PopoverTrigger : "span";

  return (
    <span
      aria-atomic={announce ? true : undefined}
      aria-live={announce ? "polite" : undefined}
      className="inline-flex flex-wrap items-center gap-2 text-xs tabular-nums"
      role={announce ? "status" : undefined}
    >
      <Pill
        aria-label={
          interactive ? `Ver quién está mirando: En vivo · ${label}` : undefined
        }
        className={
          compact
            ? "hs-presence hs-presence--sm"
            : interactive
              ? "hs-presence cursor-pointer border-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ui-ring)]"
              : "hs-presence"
        }
      >
        <span
          aria-hidden="true"
          className="hs-presence-dot after:content-none!"
        />
        {!compact && <span className="hs-presence-live">En vivo</span>}
        {!compact && <span aria-hidden="true">·</span>}
        <span className="hs-presence-count" key={label}>
          {label}
        </span>
        {children}
      </Pill>
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
