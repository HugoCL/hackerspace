"use client";

import { Button } from "@ui-sdk/react/button";
import { Input } from "@ui-sdk/react/input";
import { Tabs, TabsList, TabsPanel, TabsTab } from "@ui-sdk/react/tabs";
import { useQuery } from "convex/react";
import Link from "next/link";
import { useState } from "react";
import { localCalendarDate } from "@/app/calendar-date";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { EventMeta, Icon, ModalityBadge } from "./hackathon-ui";
import PresenceIndicator from "./PresenceIndicator";

const modalities = [
  { value: "inPerson", label: "Presenciales" },
  { value: "virtual", label: "Virtuales" },
] as const;

function searchText(value: string) {
  return value.normalize("NFD").replace(/\p{M}/gu, "").toLocaleLowerCase("es");
}

function CatalogCard({ event }: { event: Doc<"hackathons"> }) {
  const count = useQuery(api.presence.count, { hackathonId: event._id });
  return (
    <Link
      className="hs-card hs-card--interactive hs-hcard"
      href={`/hackathons/${event.slug}`}
    >
      <div className="hs-hcard-top">
        <ModalityBadge modality={event.modality} />
        <Icon name="arrow" />
      </div>
      <h3 className="hs-hcard-title">{event.title}</h3>
      <div className="hs-hcard-meta">
        <EventMeta event={event} />
      </div>
      <p className="hs-hcard-desc">{event.summary}</p>
      <div className="hs-hcard-foot">
        <div className="hs-hcard-tags">
          {event.topics.map((topic) => (
            <span className="hs-badge hs-badge--neutral" key={topic}>
              {topic}
            </span>
          ))}
        </div>
        <PresenceIndicator count={count} />
      </div>
    </Link>
  );
}

export default function HackathonCatalog() {
  const [query, setQuery] = useState("");
  const status = useQuery(api.health.status, {});
  const events = useQuery(api.hackathons.list, {
    today: localCalendarDate(new Date()),
  });
  const term = searchText(query.trim());
  const matches = events?.filter((event) =>
    [event.title, event.location ?? "", ...event.topics].some((value) =>
      searchText(value).includes(term),
    ),
  );

  return (
    <section aria-label="Catálogo de hackathones" className="hs-section">
      <p aria-live="polite" className="sr-only" data-testid="connection-status">
        {status === "ok" ? "Conexión activa" : "Conectando…"}
      </p>
      <div className="hs-input hs-input--icon max-w-md">
        <Icon name="search" />
        <Input
          aria-label="Buscar hackathones"
          className="hs-input-control"
          onValueChange={setQuery}
          placeholder="Busca por evento, ciudad o tema"
          type="search"
          value={query}
        />
      </div>
      <Tabs defaultValue="inPerson">
        <TabsList aria-label="Modalidad" className="hs-tabs">
          {modalities.map(({ value, label }) => (
            <TabsTab className="hs-tab" key={value} value={value}>
              {label}
            </TabsTab>
          ))}
        </TabsList>
        {modalities.map(({ value }) => {
          const results = matches?.filter(
            (event) => event.modality === value || event.modality === "hybrid",
          );
          return (
            <TabsPanel className="prototype-panel" key={value} value={value}>
              <section className="hs-section">
                <h2 className="hs-section-title">
                  Próximas hackathones{" "}
                  <span aria-live="polite" className="hs-section-count">
                    {results?.length}
                  </span>
                </h2>
                {!results ? (
                  <p role="status">Cargando hackathones…</p>
                ) : results.length ? (
                  <div className="hs-grid prototype-grid">
                    {results.map((event) => (
                      <CatalogCard event={event} key={event.slug} />
                    ))}
                  </div>
                ) : (
                  <div className="hs-empty">
                    <h3 className="hs-empty-title">
                      No encontramos hackathones
                    </h3>
                    <p className="hs-empty-desc">
                      Prueba con otra ciudad, tema o nombre.
                    </p>
                    <Button
                      className="hs-btn hs-btn--secondary"
                      onClick={() => setQuery("")}
                    >
                      Limpiar búsqueda
                    </Button>
                  </div>
                )}
              </section>
            </TabsPanel>
          );
        })}
      </Tabs>
    </section>
  );
}
