import Catalog from "@/components/HackathonCatalog";
import { AppShell } from "@/components/hackathon-ui";
import { sampleEvents } from "./hackathons/sample-events";

export default function Home() {
  return (
    <AppShell exploring>
      <section className="prototype-hero">
        <div className="hs-pagehead-text">
          <h1 className="hs-pagehead-title">Hackathones cerca de ti</h1>
          <p className="hs-pagehead-desc">
            Encuentra el lugar y la fecha para tu próxima hackathon, cerca de ti
            o en línea.
          </p>
        </div>
        <svg
          aria-hidden="true"
          className="prototype-room"
          viewBox="0 0 360 160"
        >
          <rect
            fill="var(--hs-signal)"
            height="152"
            rx="8"
            width="104"
            x="24"
          />
          <rect
            fill="var(--ui-foreground)"
            height="128"
            rx="8"
            width="192"
            x="144"
            y="24"
          />
          {[48, 72, 96].map((x) => (
            <circle cx={x} cy="128" fill="var(--hs-signal-ink)" key={x} r="6" />
          ))}
          {[48, 74, 100, 126].flatMap((y) =>
            [174, 200, 226, 252, 278, 304].map((x) => (
              <circle
                cx={x}
                cy={y}
                fill="var(--ui-background)"
                key={`${x}:${y}`}
                r="6"
              />
            )),
          )}
        </svg>
      </section>
      <Catalog events={sampleEvents} />
    </AppShell>
  );
}
