const cells = [1, 2, 3, 4, 5, 6, 7, 8];

export default function PresenceIndicator({
  count,
  announce = false,
}: {
  count?: number;
  announce?: boolean;
}) {
  const overflow = Math.max(0, (count ?? 0) - cells.length);
  const label =
    count === undefined
      ? "Conectando…"
      : count > 1000
        ? "1000+ mirando"
        : `${count} mirando`;

  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap font-(family-name:--font-mono) text-xs tabular-nums">
      <span aria-hidden="true" className="inline-flex items-center gap-[3px]">
        {cells.map((cell) => (
          <span
            className={`size-[7px] border transition-colors duration-150 motion-reduce:transition-none ${
              cell <= (count ?? 0)
                ? "border-(--hs-signal-ink) bg-(--hs-signal)"
                : "border-muted-foreground bg-transparent"
            }`}
            data-filled={cell <= (count ?? 0)}
            key={cell}
          />
        ))}
        {overflow > 0 && (
          <span className="ml-0.5">
            +{overflow}
            {count === 1001 ? "…" : ""}
          </span>
        )}
      </span>
      <span
        aria-live={announce ? "polite" : undefined}
        aria-atomic={announce ? true : undefined}
      >
        {label}
      </span>
    </span>
  );
}
