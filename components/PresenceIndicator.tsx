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
  const visitorLabel =
    visitors === 0
      ? null
      : visitors > 1000
        ? "+1000 visitantes o más"
        : `+${visitors} visitante${visitors === 1 ? "" : "s"}`;

  return (
    <span className="inline-flex flex-wrap items-center gap-2 text-xs tabular-nums">
      {announce && (
        <span
          aria-atomic="true"
          aria-live="polite"
          className="sr-only"
          role="status"
        >
          <span>{label}</span>
          {visitorLabel && (
            <>
              {" "}
              · <span>{visitorLabel}</span>
            </>
          )}
        </span>
      )}
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
      {visitorLabel && (
        <span
          aria-hidden={announce || undefined}
          className="whitespace-nowrap text-muted-foreground"
        >
          {visitorLabel}
        </span>
      )}
    </span>
  );
}
