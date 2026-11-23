"use client";

import { SignInButton } from "@clerk/nextjs";
import { Button } from "@ui-sdk/react/button";
import { Checkbox, CheckboxIndicator } from "@ui-sdk/react/checkbox";
import { Input } from "@ui-sdk/react/input";
import { Textarea } from "@ui-sdk/react/textarea";
import {
  useConvexAuth,
  useMutation,
  usePaginatedQuery,
  useQuery,
} from "convex/react";
import { ConvexError } from "convex/values";
import { type FormEvent, useId, useState } from "react";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";

type TeamDetails = Pick<
  Doc<"teams">,
  "name" | "description" | "rolesWanted" | "recruitingStatus"
>;
type Team = TeamDetails & { _id: Id<"teams"> };

function useTeamAction() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function run(action: () => Promise<unknown>) {
    setPending(true);
    setError("");
    try {
      await action();
    } catch (error) {
      setError(
        error instanceof ConvexError && typeof error.data === "string"
          ? error.data
          : "No pudimos guardar el cambio. Vuelve a intentarlo.",
      );
    } finally {
      setPending(false);
    }
  }
  return { pending, error, run };
}

function TeamForm({
  team,
  onSave,
  onCancel,
}: {
  team?: Team;
  onSave: (details: TeamDetails) => Promise<unknown>;
  onCancel: () => void;
}) {
  const { pending, error, run } = useTeamAction();
  const fieldId = useId();
  const [recruiting, setRecruiting] = useState(
    team?.recruitingStatus !== "closed",
  );
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    void run(async () => {
      await onSave({
        name: String(data.get("name") ?? ""),
        description: String(data.get("description") ?? ""),
        rolesWanted: String(data.get("roles") ?? "").split(","),
        recruitingStatus: recruiting ? "recruiting" : "closed",
      });
      onCancel();
    });
  }
  return (
    <form
      aria-label={team ? "Editar equipo" : "Crear equipo"}
      className="grid gap-3"
      onSubmit={submit}
    >
      <label className="grid gap-1 text-sm" htmlFor={`${fieldId}-name`}>
        Nombre del equipo
        <Input
          className="hs-input"
          defaultValue={team?.name}
          id={`${fieldId}-name`}
          maxLength={70}
          name="name"
          required
        />
      </label>
      <label className="grid gap-1 text-sm" htmlFor={`${fieldId}-description`}>
        Descripción
        <Textarea
          className="hs-input h-auto"
          defaultValue={team?.description}
          id={`${fieldId}-description`}
          maxLength={400}
          name="description"
          required
          rows={3}
        />
      </label>
      <label className="grid gap-1 text-sm" htmlFor={`${fieldId}-roles`}>
        Roles que buscan, separados por comas
        <Input
          className="hs-input"
          defaultValue={team?.rolesWanted.join(", ")}
          id={`${fieldId}-roles`}
          name="roles"
        />
      </label>
      <label
        className="flex items-center gap-2 text-sm"
        htmlFor={`${fieldId}-recruiting`}
      >
        <Checkbox
          checked={recruiting}
          id={`${fieldId}-recruiting`}
          onCheckedChange={(value) => setRecruiting(value === true)}
        >
          <CheckboxIndicator aria-hidden="true">✓</CheckboxIndicator>
        </Checkbox>
        Buscamos integrantes
      </label>
      {error && <p role="alert">{error}</p>}
      <div className="flex flex-wrap gap-2">
        <Button
          className="hs-btn hs-btn--primary"
          disabled={pending}
          type="submit"
        >
          {pending
            ? "Guardando…"
            : team
              ? "Guardar cambios"
              : "Publicar equipo"}
        </Button>
        <Button
          className="hs-btn hs-btn--secondary"
          disabled={pending}
          onClick={onCancel}
          type="button"
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
}

function TeamActions({ team }: { team: Team }) {
  const state = useQuery(api.teams.viewerState, { teamId: team._id });
  const update = useMutation(api.teams.update);
  const requestToJoin = useMutation(api.teams.requestToJoin);
  const resolveRequest = useMutation(api.teams.resolveRequest);
  const [editing, setEditing] = useState(false);
  const { error, pending, run } = useTeamAction();

  if (!state) return null;
  if (state.kind === "member")
    return <p role="status">Ya eres parte del equipo</p>;
  if (state.kind === "owner")
    return (
      <div className="grid gap-2">
        {editing ? (
          <TeamForm
            team={team}
            onSave={(details) => update({ teamId: team._id, ...details })}
            onCancel={() => setEditing(false)}
          />
        ) : (
          <Button
            className="hs-btn hs-btn--secondary justify-self-start"
            onClick={() => setEditing(true)}
          >
            Editar equipo
          </Button>
        )}
        <h4 className="font-semibold">Solicitudes pendientes</h4>
        {state.requests.length === 0 ? (
          <p>No hay solicitudes pendientes.</p>
        ) : (
          <ul className="grid gap-2">
            {state.requests.map(({ _id, displayName }) => (
              <li className="grid gap-1" key={_id}>
                <span>{displayName}</span>
                <div className="flex flex-wrap gap-2">
                  <Button
                    aria-label={`Aceptar solicitud de ${displayName}`}
                    className="hs-btn hs-btn--primary"
                    disabled={pending}
                    onClick={() =>
                      run(() =>
                        resolveRequest({
                          teamId: team._id,
                          requestId: _id,
                          decision: "accepted",
                        }),
                      )
                    }
                  >
                    Aceptar
                  </Button>
                  <Button
                    aria-label={`Rechazar solicitud de ${displayName}`}
                    className="hs-btn hs-btn--secondary"
                    disabled={pending}
                    onClick={() =>
                      run(() =>
                        resolveRequest({
                          teamId: team._id,
                          requestId: _id,
                          decision: "rejected",
                        }),
                      )
                    }
                  >
                    Rechazar
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
        {error && <p role="alert">{error}</p>}
      </div>
    );
  return (
    <div className="grid gap-2">
      {state.requestStatus === "pending" && (
        <p role="status">Solicitud pendiente</p>
      )}
      {state.requestStatus === "rejected" && (
        <p role="status">Solicitud rechazada</p>
      )}
      {state.requestStatus !== "pending" &&
        team.recruitingStatus === "recruiting" && (
          <Button
            className="hs-btn hs-btn--primary justify-self-start"
            disabled={pending}
            onClick={() => run(() => requestToJoin({ teamId: team._id }))}
          >
            {state.requestStatus === "rejected"
              ? "Volver a solicitar ingreso"
              : "Solicitar ingreso"}
          </Button>
        )}
      {error && <p role="alert">{error}</p>}
    </div>
  );
}

export default function HackathonTeams({
  hackathonId,
}: {
  hackathonId: Id<"hackathons">;
}) {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const [recruitingOnly, setRecruitingOnly] = useState(false);
  const [creating, setCreating] = useState(false);
  const filterId = useId();
  const create = useMutation(api.teams.create);
  const { results, status, loadMore } = usePaginatedQuery(
    api.teams.list,
    { hackathonId, recruitingOnly },
    { initialNumItems: 10 },
  );

  return (
    <section aria-labelledby="event-teams" className="hs-card">
      <h2 className="hs-section-title" id="event-teams">
        Equipos
      </h2>
      <label
        className="mb-3 flex items-center gap-2 text-sm"
        htmlFor={filterId}
      >
        <Checkbox
          checked={recruitingOnly}
          id={filterId}
          onCheckedChange={(value) => setRecruitingOnly(value === true)}
        >
          <CheckboxIndicator aria-hidden="true">✓</CheckboxIndicator>
        </Checkbox>
        Solo equipos que buscan integrantes
      </label>
      {isAuthenticated ? (
        creating ? (
          <TeamForm
            onSave={(details) => create({ hackathonId, ...details })}
            onCancel={() => setCreating(false)}
          />
        ) : (
          <Button
            className="hs-btn hs-btn--primary"
            onClick={() => setCreating(true)}
          >
            Crear equipo
          </Button>
        )
      ) : (
        !isLoading && (
          <SignInButton mode="modal">
            <Button className="hs-btn hs-btn--secondary">
              Inicia sesión para participar
            </Button>
          </SignInButton>
        )
      )}
      {status === "LoadingFirstPage" ? (
        <p className="mt-3" role="status">
          Cargando equipos…
        </p>
      ) : results.length === 0 ? (
        <p className="mt-3" role="status">
          {recruitingOnly
            ? "No hay equipos buscando integrantes."
            : "Aún no hay equipos en esta hackathon."}
        </p>
      ) : (
        <ul className="mt-3 grid gap-3" aria-label="Equipos de la hackathon">
          {results.map((team) => (
            <li
              className="grid gap-2 border-border border-t pt-3"
              key={team._id}
            >
              <h3 className="hs-tcard-title">{team.name}</h3>
              <p className="text-sm">{team.description}</p>
              <span className="hs-badge hs-badge--neutral justify-self-start">
                {team.recruitingStatus === "recruiting"
                  ? "Busca integrantes"
                  : "No busca integrantes"}
              </span>
              {team.rolesWanted.length > 0 && (
                <div className="hs-tcard-looking">
                  <span className="hs-tcard-looking-label">Roles</span>
                  {team.rolesWanted.map((role) => (
                    <span className="hs-badge hs-badge--signal" key={role}>
                      {role}
                    </span>
                  ))}
                </div>
              )}
              {isAuthenticated && <TeamActions team={team} />}
            </li>
          ))}
        </ul>
      )}
      {(status === "CanLoadMore" || status === "LoadingMore") && (
        <Button
          className="hs-btn hs-btn--secondary mt-3"
          disabled={status === "LoadingMore"}
          onClick={() => loadMore(10)}
        >
          Cargar más equipos
        </Button>
      )}
    </section>
  );
}
