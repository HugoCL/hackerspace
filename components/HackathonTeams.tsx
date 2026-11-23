"use client";

import { SignInButton } from "@clerk/nextjs";
import { Button } from "@ui-sdk/react/button";
import { Checkbox, CheckboxIndicator } from "@ui-sdk/react/checkbox";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@ui-sdk/react/dialog";
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

function TeamConversation({
  team,
  initialId,
}: {
  team: Team;
  initialId: Id<"teamConversations"> | null;
}) {
  const [startedId, setStartedId] = useState<Id<"teamConversations"> | null>(
    null,
  );
  const conversationId = initialId ?? startedId;
  const args = conversationId ? { conversationId } : "skip";
  const conversation = useQuery(api.teams.conversation, args);
  const messages = usePaginatedQuery(api.teams.messages, args, {
    initialNumItems: 20,
  });
  const start = useMutation(api.teams.startConversation);
  const send = useMutation(api.teams.sendMessage);
  const add = useMutation(api.teams.addParticipant);
  const [body, setBody] = useState("");
  const messageId = useId();
  const { error, pending, run } = useTeamAction();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending || !body.trim()) return;
    void run(async () => {
      if (conversationId) await send({ conversationId, body });
      else setStartedId(await start({ teamId: team._id, body }));
      setBody("");
    });
  }

  return (
    <div className="grid gap-2">
      <DialogTitle>
        Conversación con {conversation?.displayName ?? team.name}
      </DialogTitle>
      {conversationId && !conversation ? (
        <p role="status">
          {conversation === null
            ? "No tienes acceso a esta conversación."
            : "Cargando conversación…"}
        </p>
      ) : (
        <>
          {messages.status === "CanLoadMore" && (
            <Button
              className="hs-btn hs-btn--secondary"
              onClick={() => messages.loadMore(20)}
            >
              Ver mensajes anteriores
            </Button>
          )}
          {messages.results.length > 0 && (
            <ol
              aria-label="Mensajes"
              className="grid max-h-64 gap-2 overflow-y-auto"
            >
              {messages.results
                .toReversed()
                .map(({ _id, displayName, body }) => (
                  <li
                    className="rounded border border-border p-2 text-sm"
                    key={_id}
                  >
                    <strong>{displayName}</strong>
                    <p className="whitespace-pre-wrap wrap-anywhere">{body}</p>
                  </li>
                ))}
            </ol>
          )}
          <form className="grid gap-2" onSubmit={submit}>
            <label className="grid gap-1 text-sm" htmlFor={messageId}>
              Mensaje
              <Textarea
                id={messageId}
                className="hs-input h-auto"
                disabled={pending}
                maxLength={1000}
                onChange={(event) => setBody(event.currentTarget.value)}
                required
                rows={3}
                value={body}
              />
            </label>
            <div className="flex flex-wrap gap-2">
              <Button
                className="hs-btn hs-btn--primary"
                disabled={pending || !body.trim()}
                type="submit"
              >
                Enviar
              </Button>
              {conversation?.canAdd && conversationId && (
                <Button
                  className="hs-btn hs-btn--secondary"
                  disabled={pending}
                  type="button"
                  onClick={() =>
                    run(() => add({ teamId: team._id, conversationId }))
                  }
                >
                  Sumar al equipo
                </Button>
              )}
            </div>
          </form>
        </>
      )}
      {error && <p role="alert">{error}</p>}
    </div>
  );
}

function TeamInbox({ team }: { team: Team }) {
  const { results, status, loadMore } = usePaginatedQuery(
    api.teams.conversations,
    { teamId: team._id },
    { initialNumItems: 10 },
  );
  const [selected, setSelected] = useState<Id<"teamConversations"> | null>(
    null,
  );
  if (selected)
    return (
      <>
        <Button
          className="hs-btn hs-btn--secondary justify-self-start"
          onClick={() => setSelected(null)}
        >
          Volver a conversaciones
        </Button>
        <TeamConversation initialId={selected} team={team} />
      </>
    );
  return (
    <>
      <DialogTitle>Conversaciones de {team.name}</DialogTitle>
      {status === "LoadingFirstPage" ? (
        <p role="status">Cargando conversaciones…</p>
      ) : results.length === 0 ? (
        <p>No hay conversaciones todavía.</p>
      ) : (
        <ul className="grid gap-2">
          {results.map(({ _id, displayName }) => (
            <li key={_id}>
              <Button
                className="hs-btn hs-btn--secondary"
                onClick={() => setSelected(_id)}
              >
                {displayName}
              </Button>
            </li>
          ))}
        </ul>
      )}
      {(status === "CanLoadMore" || status === "LoadingMore") && (
        <Button
          className="hs-btn hs-btn--secondary"
          disabled={status === "LoadingMore"}
          onClick={() => loadMore(10)}
        >
          Cargar más conversaciones
        </Button>
      )}
    </>
  );
}

function ConversationDialog({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) {
  return (
    <Dialog>
      <DialogTrigger className="hs-btn hs-btn--secondary justify-self-start">
        {label}
      </DialogTrigger>
      <DialogContent className="hs-card fixed top-1/2 left-1/2 z-50 max-h-[90dvh] w-[min(92vw,32rem)] -translate-1/2 overflow-y-auto shadow-xl">
        {children}
        <DialogClose className="hs-btn hs-btn--secondary justify-self-start">
          Cerrar
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
}

function TeamActions({ team }: { team: Team }) {
  const state = useQuery(api.teams.viewerState, { teamId: team._id });
  const update = useMutation(api.teams.update);
  const [editing, setEditing] = useState(false);
  if (!state) return null;
  return (
    <div className="grid gap-2">
      {state.kind === "owner" &&
        (editing ? (
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
        ))}
      {state.kind === "member" && <p role="status">Ya eres parte del equipo</p>}
      {state.kind !== "visitor" && (
        <ConversationDialog label="Conversaciones">
          <TeamInbox team={team} />
        </ConversationDialog>
      )}
      {(state.conversationId ||
        (state.kind === "visitor" &&
          team.recruitingStatus === "recruiting")) && (
        <ConversationDialog label="Conversar">
          <TeamConversation initialId={state.conversationId} team={team} />
        </ConversationDialog>
      )}
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
  const [role, setRole] = useState("");
  const [creating, setCreating] = useState(false);
  const filterId = useId();
  const create = useMutation(api.teams.create);
  const { results, status, loadMore } = usePaginatedQuery(
    api.teams.list,
    { hackathonId, recruitingOnly, role: role.trim() || undefined },
    { initialNumItems: 10 },
  );

  return (
    <section aria-labelledby="event-teams" className="hs-section">
      <h2 className="hs-section-title" id="event-teams">
        Equipos
      </h2>
      <div className="flex flex-wrap items-end gap-4">
        <label className="grid gap-1 text-sm" htmlFor={`${filterId}-role`}>
          Filtrar por rol
          <Input
            className="hs-input"
            id={`${filterId}-role`}
            maxLength={40}
            value={role}
            onChange={(event) => setRole(event.currentTarget.value)}
          />
        </label>
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
      </div>
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
              Inicia sesión para conversar
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
          {role.trim()
            ? "No encontramos equipos para ese rol."
            : recruitingOnly
              ? "No hay equipos buscando integrantes."
              : "Aún no hay equipos en esta hackathon."}
        </p>
      ) : (
        <ul
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
          aria-label="Equipos de la hackathon"
        >
          {results.map((team) => (
            <li className="hs-card grid content-start gap-2" key={team._id}>
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
