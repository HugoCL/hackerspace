"use client";

import { Tabs, TabsList, TabsPanel, TabsTab } from "@ui-sdk/react/tabs";
import { useQuery } from "convex/react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { type ReactNode, useSyncExternalStore } from "react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import HackathonTeams from "./HackathonTeams";
import { AppShell } from "./hackathon-ui";

type ProfileTab = "resumen" | "bases" | "equipos";

function subscribeToHash(onChange: () => void) {
  window.addEventListener("hashchange", onChange);
  return () => window.removeEventListener("hashchange", onChange);
}

function tabFromHash(): ProfileTab {
  switch (window.location.hash) {
    case "#bases":
      return "bases";
    case "#sample-teams":
      return "equipos";
    default:
      return "resumen";
  }
}

function formatCount(count: number) {
  return count > 1000 ? "1000+" : String(count);
}

export default function HackathonProfileTabs({
  hackathonId,
  header,
  overview,
  rules,
  year,
}: {
  hackathonId: Id<"hackathons">;
  header: ReactNode;
  overview: ReactNode;
  rules: ReactNode;
  year: number;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const requestedTab = searchParams.get("tab");
  const legacyTab = useSyncExternalStore(
    subscribeToHash,
    tabFromHash,
    (): ProfileTab => "resumen",
  );
  const tab =
    requestedTab === "bases" || requestedTab === "equipos"
      ? requestedTab
      : requestedTab === null
        ? legacyTab
        : "resumen";
  const summary = useQuery(api.teams.summary, { hackathonId });

  function changeTab(next: ProfileTab | null) {
    if (!next || next === tab) return;
    const params = new URLSearchParams(searchParams.toString());
    if (next === "resumen") params.delete("tab");
    else params.set("tab", next);
    const query = params.toString();
    const hash = window.location.hash;
    window.history.pushState(
      null,
      "",
      query ? `${pathname}?${query}` : pathname,
    );
    if (hash) window.dispatchEvent(new HashChangeEvent("hashchange"));
  }

  return (
    <AppShell
      year={year}
      aside={
        tab === "equipos" ? undefined : (
          <section className="hs-card" aria-label="Resumen de equipos">
            {summary && (
              <p>
                {summary.recruiting === 1
                  ? "1 equipo busca gente"
                  : `${formatCount(summary.recruiting)} equipos buscan gente`}
              </p>
            )}
            <Link className="hs-link" href={`${pathname}?tab=equipos`}>
              Ver equipos <span aria-hidden="true">→</span>
            </Link>
          </section>
        )
      }
    >
      {header}
      <Tabs<ProfileTab> value={tab} onValueChange={changeTab}>
        <TabsList
          aria-label="Perfil de la hackathon"
          className="hs-tabs flex-wrap"
        >
          <TabsTab className="hs-tab" value="resumen">
            Resumen
          </TabsTab>
          <TabsTab className="hs-tab" value="bases">
            Bases y reglas
          </TabsTab>
          <TabsTab className="hs-tab" value="equipos">
            {summary ? `Equipos (${formatCount(summary.total)})` : "Equipos"}
          </TabsTab>
        </TabsList>
        <TabsPanel className="prototype-panel" value="resumen">
          {overview}
        </TabsPanel>
        <TabsPanel className="prototype-panel" value="bases">
          {rules}
        </TabsPanel>
        <TabsPanel className="prototype-panel" value="equipos">
          <HackathonTeams hackathonId={hackathonId} />
        </TabsPanel>
      </Tabs>
    </AppShell>
  );
}
