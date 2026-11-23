const cells = [1, 2, 3, 4, 5, 6, 7, 8];

export default function PresenceIndicator({
  count,
  visitors = 0,
  announce = false,
}: {
  count?: number;
  visitors?: number;
  announce?: boolean;
}) {
  const label =
    count === undefined
      ? "Conectando…"
      : count > 1000
        ? "1000+ mirando"
        : `${count} mirando`;

  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap text-xs tabular-nums">
      <span aria-hidden="true" className="inline-flex items-center gap-[3px]">
        {cells.map((cell) => (
          <span
            className={`size-[7px] border transition-colors duration-150 motion-reduce:transition-none ${
              cell <= (count ?? 0)
                ? "border-(--hs-live-ink) bg-(--hs-live)"
                : "border-muted-foreground bg-transparent"
            }`}
            data-filled={cell <= (count ?? 0)}
            key={cell}
          />
        ))}
      </span>
      <span
        aria-live={announce ? "polite" : undefined}
        aria-atomic={announce ? true : undefined}
        className="inline-flex items-center gap-2"
      >
        <span className={count ? "text-(--hs-live-ink)" : undefined}>
          {label}
        </span>
        {visitors > 0 && (
          <span className="text-muted-foreground">
            {visitors > 1000
              ? "+1000 visitantes o más"
              : `+${visitors} visitante${visitors === 1 ? "" : "s"}`}
          </span>
        )}
      </span>
    </span>
  );
}
