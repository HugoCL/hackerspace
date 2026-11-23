"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function Home() {
  const status = useQuery(api.health.status, {});

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-4 px-6 py-12 text-pretty">
      <h1 className="text-4xl font-bold text-balance">Hackerspace</h1>
      <p className="text-lg">
        Descubre hackathones presenciales y virtuales, forma equipo y comparte
        lo que construyes.
      </p>
      <p className="text-muted-foreground">
        Estamos preparando un espacio para encontrarte con otras personas en
        vivo.
      </p>
      <p aria-live="polite" className="sr-only" data-testid="connection-status">
        {status === "ok" ? "Conexión activa" : "Conectando…"}
      </p>
    </main>
  );
}
