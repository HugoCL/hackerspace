import { Button } from "@ui-sdk/react/button";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell, EventMeta, ModalityBadge } from "@/components/hackathon-ui";
import { type SampleEvent, sampleEvents } from "../sample-events";

const sampleViewers = ["AM", "CR", "LS", "VP"];
const sampleTeams = [
  { name: "Punto de Encuentro", roles: ["Frontend", "Diseño"] },
  { name: "Ruta Abierta", roles: ["Datos", "Backend"] },
];

function ProfileSidebar({ event }: { event: SampleEvent }) {
  return (
    <>
      <section aria-labelledby="event-facts" className="hs-card">
        <h2 className="hs-section-title" id="event-facts">
          Datos del evento
        </h2>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
          <dt className="text-muted-foreground">Fechas</dt>
          <dd className="text-right">{event.dates}</dd>
          <dt className="text-muted-foreground">Lugar</dt>
          <dd className="text-right">{event.location}</dd>
          <dt className="text-muted-foreground">Modalidad</dt>
          <dd className="text-right">
            <ModalityBadge modality={event.modality} />
          </dd>
        </dl>
        <p className="hs-pagehead-desc text-sm">
          Sin sitio oficial. Evento ficticio.
        </p>
        <Button className="hs-btn hs-btn--primary" render={<a href="#bases" />}>
          Ver bases
        </Button>
      </section>
      <section aria-labelledby="sample-presence" className="hs-card">
        <div className="hs-section-head">
          <h2 className="hs-section-title" id="sample-presence">
            Viendo ahora
          </h2>
          <span className="hs-badge hs-badge--neutral">Simulación</span>
        </div>
        <div className="hs-avstack">
          <span aria-hidden="true" className="hs-avstack-faces">
            {sampleViewers.map((initials, tone) => (
              <span
                className={`hs-avatar hs-avatar--sm hs-avatar--t${tone}`}
                key={initials}
              >
                {initials}
              </span>
            ))}
          </span>
          <span className="hs-avstack-more">8 personas</span>
        </div>
        <p className="hs-pagehead-desc text-sm">
          No refleja actividad en vivo.
        </p>
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
  const event = sampleEvents.find((sample) => sample.slug === slug);
  if (!event) notFound();

  return (
    <AppShell aside={<ProfileSidebar event={event} />}>
      <header className="hs-pagehead">
        <div className="hs-pagehead-text">
          <div className="hs-pagehead-eyebrow">
            <Link className="hs-link" href="/">
              Explorar
            </Link>
            <span aria-hidden="true">/</span>
            <span>Perfil de hackathon</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="hs-pagehead-title">{event.title}</h1>
            <span className="hs-badge hs-badge--neutral">Datos de muestra</span>
          </div>
          <div className="min-[901px]:hidden">
            <div className="hs-pagehead-meta">
              <EventMeta event={event} />
              <ModalityBadge modality={event.modality} />
            </div>
          </div>
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
          <p>{event.guidelines}</p>
          <h3 className="hs-hcard-title">Reglas</h3>
          <p>{event.rules}</p>
        </div>
      </section>
    </AppShell>
  );
}
