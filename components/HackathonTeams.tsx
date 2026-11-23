"use client";

import { SignInButton } from "@clerk/nextjs";
import { Button } from "@ui-sdk/react/button";
import { Checkbox, CheckboxIndicator } from "@ui-sdk/react/checkbox";
import {
  Dialog,
  DialogBackdrop,
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
import {
  type FormEvent,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
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

const chatTime = new Intl.DateTimeFormat("es", {
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

function ChatTime({ value }: { value: number }) {
  return (
    <time
      className="shrink-0 font-mono text-xs text-muted-foreground"
      dateTime={new Date(value).toISOString()}
    >
      {chatTime.format(value)}
    </time>
  );
}

function ChatAvatar({ name }: { name: string }) {
  return (
    <span aria-hidden="true" className="hs-avatar hs-avatar--md hs-avatar--t0">
      {name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => Array.from(part)[0])
        .join("")
        .toLocaleUpperCase("es")}
    </span>
  );
}

function ChatIcon({ back }: { back?: boolean }) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="20"
      width="20"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
    >
      <path d={back ? "M19 12H5m6-6-6 6 6 6" : "m6 6 12 12M18 6 6 18"} />
    </svg>
  );
}

const chatIconClass = "hs-btn hs-btn--ghost size-11! shrink-0 p-0!";

function focusBackButton(node: HTMLButtonElement | null) {
  node?.focus();
}

function ChatHeader({
  team,
  contact,
  onBack,
  action,
  thread = false,
}: {
  team: string;
  contact?: string;
  onBack?: () => void;
  action?: React.ReactNode;
  thread?: boolean;
}) {
  return (
    <header className="shrink-0 border-b border-border bg-[var(--hs-surface)] p-4">
      <div className="flex items-center gap-3">
        {onBack && (
          <Button
            aria-label="Volver a conversaciones"
            className={chatIconClass}
            onClick={onBack}
            ref={focusBackButton}
          >
            <ChatIcon back />
          </Button>
        )}
        <div className="min-w-0 flex-1">
          <DialogTitle className="truncate text-lg font-semibold" title={team}>
            {team}
          </DialogTitle>
          <p className="text-xs text-muted-foreground">
            {thread ? "Conversación privada" : "Conversaciones"}
          </p>
        </div>
        <DialogClose aria-label="Cerrar" className={chatIconClass}>
          <ChatIcon />
        </DialogClose>
      </div>
      {contact && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <ChatAvatar name={contact} />
            <span className="wrap-anywhere text-sm font-medium">{contact}</span>
          </div>
          {action}
        </div>
      )}
    </header>
  );
}

function TeamConversation({
  team,
  initialId,
  onBack,
}: {
  team: Team;
  initialId: Id<"teamConversations"> | null;
  onBack?: () => void;
}) {
  const [startedId, setStartedId] = useState<Id<"teamConversations"> | null>(
    null,
  );
  const conversationId = initialId ?? startedId;
  const args = conversationId ? { conversationId } : "skip";
  const conversation = useQuery(api.teams.conversation, args);
  const prospectContact = useQuery(
    api.teams.conversationContact,
    conversationId ? "skip" : { teamId: team._id },
  );
  const messages = usePaginatedQuery(api.teams.messages, args, {
    initialNumItems: 20,
  });
  const start = useMutation(api.teams.startConversation);
  const send = useMutation(api.teams.sendMessage);
  const add = useMutation(api.teams.addParticipant);
  const [body, setBody] = useState("");
  const { error, pending, run } = useTeamAction();
  const addition = useTeamAction();
  const history = useRef<HTMLDivElement>(null);
  const newest = messages.results[0]?._id;
  const olderHeight = useRef<number | null>(null);
  const unavailable =
    conversation === null ||
    prospectContact === null ||
    (!!conversationId && !startedId && conversation === undefined);

  useLayoutEffect(() => {
    const pane = history.current;
    if (pane && newest && !unavailable) pane.scrollTop = pane.scrollHeight;
  }, [newest, unavailable]);

  const loadingOlder = messages.status === "LoadingMore";
  useLayoutEffect(() => {
    const pane = history.current;
    if (pane && !loadingOlder && olderHeight.current !== null) {
      pane.scrollTop += pane.scrollHeight - olderHeight.current;
      olderHeight.current = null;
    }
  }, [loadingOlder]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending || !body.trim()) return;
    void run(async () => {
      if (conversationId) await send({ conversationId, body });
      else setStartedId(await start({ teamId: team._id, body }));
      setBody("");
    });
  }

  const ordered = messages.results.toReversed();

  return (
    <>
      <ChatHeader
        team={team.name}
        contact={conversation?.displayName ?? prospectContact ?? undefined}
        onBack={onBack}
        thread
        action={
          conversation?.canAdd && conversationId ? (
            <Button
              className="hs-btn hs-btn--secondary hs-btn--sm"
              disabled={addition.pending}
              onClick={() =>
                addition.run(() => add({ teamId: team._id, conversationId }))
              }
            >
              Sumar al equipo
            </Button>
          ) : conversation?.isMember ? (
            <p className="text-xs text-muted-foreground" role="status">
              Ya es parte del equipo
            </p>
          ) : null
        }
      />
      {addition.error && (
        <p
          className="px-4 pt-2 text-sm text-[var(--ui-destructive)]"
          role="alert"
        >
          {addition.error}
        </p>
      )}
      <div
        className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain p-4"
        ref={history}
      >
        {unavailable ? (
          <p className="m-auto text-sm text-muted-foreground" role="status">
            {conversation === null || prospectContact === null
              ? "No tienes acceso a esta conversación."
              : "Cargando conversación…"}
          </p>
        ) : conversationId && messages.status === "LoadingFirstPage" ? (
          <p className="m-auto text-sm text-muted-foreground" role="status">
            Cargando mensajes…
          </p>
        ) : ordered.length === 0 ? (
          <p className="m-auto max-w-60 text-center text-sm text-muted-foreground">
            Rompe el hielo: cuéntales qué te gustaría construir.
          </p>
        ) : (
          <>
            {(messages.status === "CanLoadMore" || loadingOlder) && (
              <Button
                className="hs-btn hs-btn--ghost mb-3 shrink-0 self-center"
                disabled={loadingOlder}
                onClick={() => {
                  olderHeight.current = history.current?.scrollHeight ?? null;
                  messages.loadMore(20);
                }}
              >
                Ver mensajes anteriores
              </Button>
            )}
            <ol
              aria-label="Mensajes"
              className="mt-auto flex list-none flex-col gap-1 p-0"
            >
              {ordered.map(
                (
                  { _id, _creationTime, senderId, displayName, isMine, body },
                  index,
                ) => {
                  const startsGroup = ordered[index - 1]?.senderId !== senderId;
                  const endsGroup = ordered[index + 1]?.senderId !== senderId;
                  return (
                    <li
                      className={`flex max-w-[88%] flex-col ${isMine ? "items-end self-end" : "items-start self-start"} ${startsGroup && index > 0 ? "mt-3" : ""}`}
                      key={_id}
                    >
                      {startsGroup && (
                        <span
                          className={
                            isMine
                              ? "sr-only"
                              : "mb-1 px-1 text-xs font-medium text-muted-foreground"
                          }
                        >
                          {displayName}
                        </span>
                      )}
                      <p
                        className={`whitespace-pre-wrap wrap-anywhere rounded-[var(--radius-md)] px-3 py-2 text-sm ${isMine ? "bg-primary text-primary-foreground" : "border border-border bg-[var(--hs-surface)]"}`}
                      >
                        {body}
                      </p>
                      {endsGroup && (
                        <span className="mt-1 px-1">
                          <ChatTime value={_creationTime} />
                        </span>
                      )}
                    </li>
                  );
                },
              )}
            </ol>
          </>
        )}
      </div>
      {!unavailable && (
        <form
          className="shrink-0 border-t border-border bg-[var(--hs-surface)] px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
          onSubmit={submit}
        >
          <div className="flex items-end gap-2">
            <Textarea
              aria-label="Mensaje"
              autoResize
              className="min-h-10! max-h-32 resize-none! text-base! sm:text-sm!"
              maxLength={1000}
              onChange={(event) => setBody(event.currentTarget.value)}
              onKeyDown={(event) => {
                if (
                  event.key === "Enter" &&
                  !event.shiftKey &&
                  !event.nativeEvent.isComposing &&
                  event.keyCode !== 229
                ) {
                  event.preventDefault();
                  event.currentTarget.form?.requestSubmit();
                }
              }}
              placeholder="Escribe un mensaje…"
              readOnly={pending}
              rows={1}
              value={body}
            />
            <Button
              className="hs-btn hs-btn--primary h-10!"
              disabled={pending || !body.trim()}
              type="submit"
            >
              Enviar
            </Button>
          </div>
          {error && (
            <p
              className="mt-2 text-sm text-[var(--ui-destructive)]"
              role="alert"
            >
              {error}
            </p>
          )}
        </form>
      )}
    </>
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
  const returnTo = useRef<Id<"teamConversations"> | null>(null);
  if (selected)
    return (
      <TeamConversation
        initialId={selected}
        team={team}
        onBack={() => {
          returnTo.current = selected;
          setSelected(null);
        }}
      />
    );

  return (
    <>
      <ChatHeader team={team.name} />
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {status === "LoadingFirstPage" ? (
          <p className="p-4 text-sm text-muted-foreground" role="status">
            Cargando conversaciones…
          </p>
        ) : results.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">
            Aún no hay conversaciones.
          </p>
        ) : (
          <ul className="list-none divide-y divide-border border-b border-border p-0">
            {results.map(({ _id, displayName, lastMessage, lastMessageAt }) => (
              <li key={_id}>
                <Button
                  className="flex! h-auto! w-full justify-start! gap-3! rounded-none! border-0! bg-transparent! px-4! py-3! text-left hover:bg-muted! focus-visible:outline-offset-[-3px]"
                  onClick={() => setSelected(_id)}
                  ref={(button) => {
                    if (button && returnTo.current === _id) {
                      button.focus();
                      returnTo.current = null;
                    }
                  }}
                >
                  <ChatAvatar name={displayName} />
                  <span className="min-w-0 flex-1">
                    <span className="flex justify-between gap-2">
                      <span className="truncate font-semibold">
                        {displayName}
                      </span>
                      <ChatTime value={lastMessageAt} />
                    </span>
                    <span className="block truncate text-sm font-normal text-muted-foreground">
                      {lastMessage ?? "Sin mensajes"}
                    </span>
                  </span>
                </Button>
              </li>
            ))}
          </ul>
        )}
        {(status === "CanLoadMore" || status === "LoadingMore") && (
          <Button
            className="hs-btn hs-btn--ghost m-3"
            disabled={status === "LoadingMore"}
            onClick={() => loadMore(10)}
          >
            Cargar más conversaciones
          </Button>
        )}
      </div>
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
      <DialogBackdrop />
      <DialogContent className="fixed inset-y-0 right-0 left-auto z-50 m-0 flex h-dvh max-h-none w-full flex-col gap-0 overflow-hidden rounded-none border-0 bg-background p-0 shadow-none sm:max-w-[420px] sm:border-l sm:border-border">
        {children}
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
      <div className="flex flex-wrap items-end gap-x-4 gap-y-3">
        <label className="grid gap-1 text-sm" htmlFor={`${filterId}-role`}>
          Filtrar por rol
          <Input
            className="hs-input-control"
            id={`${filterId}-role`}
            maxLength={40}
            value={role}
            onChange={(event) => setRole(event.currentTarget.value)}
          />
        </label>
        <label
          className="flex min-h-8 items-center gap-2 text-sm"
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
        {isAuthenticated && !creating && (
          <Button
            className="hs-btn hs-btn--primary sm:ml-auto"
            onClick={() => setCreating(true)}
          >
            Crear equipo
          </Button>
        )}
        {!isAuthenticated && !isLoading && (
          <SignInButton mode="modal">
            <Button className="hs-btn hs-btn--secondary sm:ml-auto">
              Inicia sesión para conversar
            </Button>
          </SignInButton>
        )}
      </div>
      {isAuthenticated && creating && (
        <TeamForm
          onSave={(details) => create({ hackathonId, ...details })}
          onCancel={() => setCreating(false)}
        />
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
              <span className="hs-badge hs-badge--neutral self-start">
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
