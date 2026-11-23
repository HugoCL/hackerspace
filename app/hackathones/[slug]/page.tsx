import { Button } from "@ui-sdk/react/button";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell, EventMeta, ModalityBadge } from "@/components/hackathon-ui";
import { sampleEvents } from "../sample-events";

export default async function HackathonProfile({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const event = sampleEvents.find((sample) => sample.slug === slug);
  if (!event) notFound();

  return (
    <AppShell
      aside={
        <section aria-labelledby="sample-info" className="hs-card">
          <h2 className="hs-section-title" id="sample-info">
            Sobre esta ficha
          </h2>
          <p className="hs-pagehead-desc">
            Evento ficticio. Las fechas, las bases y las reglas son datos de
            muestra. No hay inscripciones abiertas desde esta ficha.
          </p>
        </section>
      }
    >
      <header className="hs-pagehead">
        <div className="hs-pagehead-text">
          <div className="hs-pagehead-eyebrow">
            <Link className="hs-link" href="/">
              Explorar
            </Link>
            <span aria-hidden="true">/</span>
            <span>Perfil de hackathon</span>
          </div>
          <h1 className="hs-pagehead-title">{event.title}</h1>
          <div className="hs-pagehead-meta">
            <EventMeta event={event} />
            <ModalityBadge modality={event.modality} />
          </div>
        </div>
        <Button
          className="hs-btn hs-btn--primary hs-btn--lg"
          render={<a href="#bases" />}
        >
          Ver bases
        </Button>
      </header>
      <section aria-labelledby="overview" className="hs-section">
        <h2 className="hs-section-title" id="overview">
          Resumen
        </h2>
        <div className="hs-card">
          <p>{event.summary}</p>
          <p className="hs-pagehead-desc">Organiza: {event.organizer}</p>
          <div className="hs-hcard-tags">
            {event.topics.map((topic) => (
              <span className="hs-badge hs-badge--neutral" key={topic}>
                {topic}
              </span>
            ))}
          </div>
        </div>
      </section>
      <section aria-labelledby="bases" className="hs-section">
        <h2 className="hs-section-title" id="bases" tabIndex={-1}>
          Bases y reglas
        </h2>
        <div className="hs-card">
          <h3 className="hs-hcard-title">Bases</h3>
          <p>{event.guidelines}</p>
          <h3 className="hs-hcard-title">Reglas</h3>
          <p>{event.rules}</p>
        </div>
      </section>
    </AppShell>
  );
}
