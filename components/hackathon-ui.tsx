import Link from "next/link";
import type { ReactNode } from "react";
import type { Doc } from "@/convex/_generated/dataModel";

const iconPaths = {
  alert: "M12 4l9 16H3zM12 10v5M12 17.5v.5",
  arrow: "M4 12h15m-6-6 6 6-6 6",
  calendar: "M4 6h16v14H4zM8 3v6m8-6v6M4 11h16",
  check: "M5 12.5l4.5 4.5L19 7.5",
  globe:
    "M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0ZM2 12h20M12 2a16 16 0 0 1 0 20 16 16 0 0 1 0-20Z",
  pin: "M20 10c0 5-8 11-8 11s-8-6-8-11a8 8 0 1 1 16 0Zm-5 0a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z",
  search: "M16 10a6 6 0 1 1-12 0 6 6 0 0 1 12 0Zm-2 4 6 6",
  x: "M6 6l12 12M18 6L6 18",
};

export function Icon({ name }: { name: keyof typeof iconPaths }) {
  return (
    <svg
      aria-hidden="true"
      className="hs-icon"
      fill="none"
      height="16"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      viewBox="0 0 24 24"
      width="16"
    >
      <path d={iconPaths[name]} />
    </svg>
  );
}

export function AppShell({
  children,
  aside,
  exploring = false,
}: {
  children: ReactNode;
  aside?: ReactNode;
  exploring?: boolean;
}) {
  return (
    <div className="hs-shell">
      <header className="hs-shell-bar">
        <div className="hs-shell-bar-inner">
          <Link className="hs-wordmark" href="/">
            <span aria-hidden="true" className="hs-wordmark-mark" />
            Hackerspace
          </Link>
          <nav aria-label="Principal" className="hs-shell-nav">
            <Link
              aria-current={exploring ? "page" : undefined}
              className="hs-shell-link"
              href="/"
            >
              Explorar
            </Link>
          </nav>
          <span className="hs-badge hs-badge--neutral">Prototipo</span>
        </div>
      </header>
      <div
        className={
          aside ? "hs-shell-body hs-shell-body--aside" : "hs-shell-body"
        }
      >
        <main className="hs-shell-main">{children}</main>
        {aside && (
          <aside className="hs-shell-aside prototype-aside">{aside}</aside>
        )}
      </div>
    </div>
  );
}

export function ModalityBadge({
  modality,
}: Pick<Doc<"hackathons">, "modality">) {
  const virtual = modality === "virtual";

  return (
    <span
      className={`hs-badge hs-badge--${virtual ? "virtual" : "presencial"}`}
    >
      {virtual ? "Virtual" : modality === "hybrid" ? "Híbrida" : "Presencial"}
    </span>
  );
}

export function EventMeta({
  event,
}: {
  event: Pick<Doc<"hackathons">, "dates" | "modality" | "location">;
}) {
  return (
    <>
      <span className="prototype-meta-item">
        <Icon name="calendar" /> {event.dates ?? "Fechas por confirmar"}
      </span>
      <span className="prototype-meta-item">
        <Icon name={event.modality === "virtual" ? "globe" : "pin"} />{" "}
        {event.location ??
          (event.modality === "virtual" ? "En línea" : "Lugar por confirmar")}
      </span>
    </>
  );
}
