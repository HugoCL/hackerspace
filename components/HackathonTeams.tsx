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
import type { Id } from "@/convex/_generated/dataModel";
import { lookingForLimit } from "@/convex/teamText";
import { Icon } from "./hackathon-ui";

type TeamDetails = Pick<
  Team,
  "name" | "description" | "lookingFor" | "recruitingStatus"
>;
type Team = (typeof api.teams.list)["_returnType"]["page"][number];

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
  const [lookingFor, setLookingFor] = useState(team?.lookingFor ?? "");
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
        lookingFor,
        recruitingStatus: recruiting ? "recruiting" : "closed",
      });
      onCancel();
    });
  }
  return (
    <form
      aria-label={team ? "Editar equipo" : "Crear equipo"}
      className="hs-card grid! gap-3!"
      onSubmit={submit}
    >
      <label className="grid gap-1 text-sm" htmlFor={`${fieldId}-name`}>
        Nombre del equipo
        <Input
          className="hs-input-control"
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
          className="hs-input-control hs-textarea"
          defaultValue={team?.description}
          id={`${fieldId}-description`}
          maxLength={400}
          name="description"
          required
          rows={3}
        />
      </label>
      <div className="grid gap-1 text-sm">
        <label htmlFor={`${fieldId}-looking-for`}>Qué buscan</label>
        <Textarea
          aria-describedby={`${fieldId}-looking-for-count`}
          className="hs-input-control hs-textarea"
          id={`${fieldId}-looking-for`}
          maxLength={lookingForLimit}
          name="lookingFor"
          onValueChange={setLookingFor}
          placeholder="Por ejemplo: alguien que se anime a entrevistar a usuarios."
          rows={2}
          value={lookingFor}
        />
        <p
          className="text-right text-xs text-muted-foreground"
          id={`${fieldId}-looking-for-count`}
        >
          {lookingFor.length} / {lookingForLimit} caracteres
        </p>
      </div>
      <label className="hs-check" htmlFor={`${fieldId}-recruiting`}>
        <Checkbox
          className="hs-check-input data-checked:border-primary! data-checked:bg-primary!"
          checked={recruiting}
          id={`${fieldId}-recruiting`}
          onCheckedChange={(value) => setRecruiting(value === true)}
        >
          <CheckboxIndicator aria-hidden="true">
            <Icon name="check" />
          </CheckboxIndicator>
        </Checkbox>
        <span className="hs-check-label">Buscamos integrantes</span>
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

function ChatError({ message }: { message: string }) {
  return (
    <div className="hs-alert hs-alert--danger" role="alert">
      <Icon name="alert" />
      <div className="hs-alert-text">
        <p className="hs-alert-desc">{message}</p>
      </div>
    </div>
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
            <span className="rotate-180">
              <Icon name="arrow" />
            </span>
          </Button>
        )}
        <div className="min-w-0 flex-1">
          <DialogTitle
            className="hs-dialog-title truncate text-nowrap!"
            title={team}
          >
            {team}
          </DialogTitle>
          <p className="hs-dialog-desc text-xs">
            {thread ? "Conversación privada" : "Conversaciones"}
          </p>
        </div>
        <DialogClose aria-label="Cerrar" className={chatIconClass}>
          <Icon name="x" />
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
        <div className="shrink-0 px-4 pt-2">
          <ChatError message={addition.error} />
        </div>
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
          <div className="hs-empty m-auto max-w-64 py-4!">
            <p className="hs-empty-desc m-0! text-sm">
              Rompe el hielo: cuéntales qué te gustaría construir.
            </p>
          </div>
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
              className="hs-input-control hs-textarea min-h-10! max-h-32 resize-none! text-base! sm:text-sm!"
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
            <div className="mt-2">
              <ChatError message={error} />
            </div>
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
          <div className="hs-empty m-4 py-6!">
            <p className="hs-empty-desc m-0!">Aún no hay conversaciones.</p>
          </div>
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
  primary = false,
}: {
  children: React.ReactNode;
  label: string;
  primary?: boolean;
}) {
  return (
    <Dialog>
      <DialogTrigger
        className={
          primary
            ? "hs-btn hs-btn--primary"
            : "hs-btn hs-btn--secondary hs-btn--sm"
        }
      >
        {label}
      </DialogTrigger>
      <DialogBackdrop className="bg-foreground/55!" />
      <DialogContent className="hs-dialog hs-dialog--drawer fixed inset-y-0 right-0 left-auto z-50 m-0! flex h-dvh! max-h-none! w-full! flex-col gap-0 overflow-clip! rounded-none! border-0! bg-background! p-0 shadow-none! sm:w-[420px]! sm:border-l! sm:border-border!">
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
  const count = state.conversationCount;
  return (
    <>
      {state.kind === "member" && (
        <p className="hs-tcard-sub" role="status">
          Ya eres parte del equipo
        </p>
      )}
      <div className="flex items-center gap-2">
        {state.kind !== "visitor" && (
          <ConversationDialog
            label={
              count === null
                ? "Conversaciones"
                : `Conversaciones (${count > 1000 ? "1000+" : count})`
            }
          >
            <TeamInbox team={team} />
          </ConversationDialog>
        )}
        {state.kind === "owner" && !editing && (
          <Button
            className="hs-btn hs-btn--secondary hs-btn--sm"
            onClick={() => setEditing(true)}
          >
            Editar
          </Button>
        )}
        {(state.conversationId ||
          (state.kind === "visitor" &&
            team.recruitingStatus === "recruiting")) && (
          <ConversationDialog label="Conversar" primary>
            <TeamConversation initialId={state.conversationId} team={team} />
          </ConversationDialog>
        )}
      </div>
      {state.kind === "owner" && editing && (
        <TeamForm
          team={team}
          onSave={(details) => update({ teamId: team._id, ...details })}
          onCancel={() => setEditing(false)}
        />
      )}
    </>
  );
}

export default function HackathonTeams({
  hackathonId,
}: {
  hackathonId: Id<"hackathons">;
}) {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const [recruitingOnly, setRecruitingOnly] = useState(false);
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const filterId = useId();
  const create = useMutation(api.teams.create);
  const { results, status, loadMore } = usePaginatedQuery(
    api.teams.list,
    { hackathonId, recruitingOnly, search: search.trim() || undefined },
    { initialNumItems: 10 },
  );

  return (
    <section aria-labelledby="event-teams" className="hs-section">
      <h2 className="hs-section-title" id="event-teams">
        Equipos
      </h2>
      <div className="flex flex-wrap items-end gap-x-4 gap-y-3">
        <label className="grid gap-1 text-sm" htmlFor={`${filterId}-search`}>
          Buscar equipos
          <Input
            className="hs-input-control"
            id={`${filterId}-search`}
            maxLength={lookingForLimit}
            placeholder="Nombre o qué buscan"
            value={search}
            onValueChange={setSearch}
          />
        </label>
        <label className="hs-check min-h-8 items-center!" htmlFor={filterId}>
          <Checkbox
            className="hs-check-input data-checked:border-primary! data-checked:bg-primary!"
            checked={recruitingOnly}
            id={filterId}
            onCheckedChange={(value) => setRecruitingOnly(value === true)}
          >
            <CheckboxIndicator aria-hidden="true">
              <Icon name="check" />
            </CheckboxIndicator>
          </Checkbox>
          <span className="hs-check-label">
            Solo equipos que buscan integrantes
          </span>
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
        <div className="hs-empty" role="status">
          <p className="hs-empty-title">
            {search.trim()
              ? "No encontramos equipos para esa búsqueda."
              : recruitingOnly
                ? "No hay equipos buscando integrantes."
                : "Aún no hay equipos en esta hackathon."}
          </p>
        </div>
      ) : (
        <ul
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
          aria-label="Equipos de la hackathon"
        >
          {results.map((team) => (
            <li className="hs-card hs-tcard min-w-0" key={team._id}>
              <div className="hs-tcard-head">
                <h3 className="hs-tcard-title wrap-anywhere">{team.name}</h3>
              </div>
              <p
                className="hs-tcard-pitch line-clamp-1!"
                title={team.description}
              >
                {team.description}
              </p>
              {team.lookingFor && (
                <div className="hs-tcard-looking block! rounded border border-border bg-muted px-2.5 py-2 text-sm wrap-anywhere">
                  <p className="hs-tcard-looking-label font-medium">
                    Qué buscan
                  </p>
                  <p className="whitespace-pre-line">{team.lookingFor}</p>
                </div>
              )}
              <div className="hs-tcard-foot items-center!">
                <span className="hs-tcard-sub tabular-nums">
                  {team.memberCount > 1000 ? "1000+" : team.memberCount}{" "}
                  {team.memberCount === 1 ? "integrante" : "integrantes"}
                </span>
                <span className="hs-badge hs-badge--neutral">
                  {team.recruitingStatus === "recruiting"
                    ? "Busca integrantes"
                    : "No busca integrantes"}
                </span>
              </div>
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
