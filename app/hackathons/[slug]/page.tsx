import { Button } from "@ui-sdk/react/button";
import { fetchQuery } from "convex/nextjs";
import Link from "next/link";
import { notFound } from "next/navigation";
import HackathonPresence from "@/components/HackathonPresence";
import { AppShell, EventMeta, ModalityBadge } from "@/components/hackathon-ui";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";

const sampleTeams = [
  { name: "Punto de Encuentro", roles: ["Frontend", "Diseño"] },
  { name: "Ruta Abierta", roles: ["Datos", "Backend"] },
];

function ProfileSidebar({ event }: { event: Doc<"hackathons"> }) {
  const officialUrl =
    event.officialUrl && /^https?:\/\//i.test(event.officialUrl)
      ? event.officialUrl
      : undefined;
  return (
    <>
      <section aria-labelledby="event-facts" className="hs-card">
        <h2 className="hs-section-title" id="event-facts">
          Datos del evento
        </h2>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
          <dt className="text-muted-foreground">Fechas</dt>
          <dd className="text-right">{event.dates ?? "Por confirmar"}</dd>
          <dt className="text-muted-foreground">Lugar</dt>
          <dd className="text-right">
            {event.location ??
              (event.modality === "virtual" ? "En línea" : "Por confirmar")}
          </dd>
          <dt className="text-muted-foreground">Modalidad</dt>
          <dd className="text-right">
            <ModalityBadge modality={event.modality} />
          </dd>
        </dl>
        {officialUrl ? (
          <a className="hs-link" href={officialUrl}>
            Sitio oficial
          </a>
        ) : (
          <p className="hs-pagehead-desc text-sm">
            {event.isSample
              ? "Sin sitio oficial. Evento ficticio."
              : "Sitio oficial no disponible."}
          </p>
        )}
        <Button className="hs-btn hs-btn--primary" render={<a href="#bases" />}>
          Ver bases
        </Button>
      </section>
      <section aria-labelledby="sample-teams" className="hs-card">
        <h2 className="hs-section-title" id="sample-teams">
          Equipos buscando gente
        </h2>
        <p className="hs-pagehead-desc text-sm">Equipos de ejemplo</p>
        <ul className="flex flex-col gap-2">
          {sampleTeams.map(({ name, roles }) => (
            <li className="border-border border-t pt-2" key={name}>
              <h3 className="font-semibold">{name}</h3>
              <div className="hs-tcard-looking">
                <span className="hs-tcard-looking-label">Buscan</span>
                {roles.map((role) => (
                  <span className="hs-badge hs-badge--signal" key={role}>
                    {role}
                  </span>
                ))}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}

export default async function HackathonProfile({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const event = await fetchQuery(api.hackathons.bySlug, { slug });
  if (!event) notFound();

  return (
    <AppShell aside={<ProfileSidebar event={event} />}>
      <header className="hs-pagehead">
        <div className="hs-pagehead-text">
          <nav aria-label="Ruta de navegación" className="hs-breadcrumb">
            <ol>
              <li>
                <Link className="hs-link" href="/">
                  Explorar
                </Link>
              </li>
              <li aria-current="page">Perfil de hackathon</li>
            </ol>
          </nav>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="hs-pagehead-title">{event.title}</h1>
            {event.isSample && (
              <span className="hs-badge hs-badge--neutral">
                Datos de muestra
              </span>
            )}
          </div>
          <div className="hs-pagehead-meta">
            <EventMeta event={event} />
            <ModalityBadge modality={event.modality} />
          </div>
          <HackathonPresence hackathonId={event._id} />
        </div>
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
          <p>{event.guidelines ?? "Bases no disponibles."}</p>
          <h3 className="hs-hcard-title">Reglas</h3>
          <p>{event.rules ?? "Reglas no disponibles."}</p>
        </div>
      </section>
    </AppShell>
  );
}
