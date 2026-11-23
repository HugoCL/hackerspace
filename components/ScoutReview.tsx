"use client";

import { SignInButton } from "@clerk/nextjs";
import {
  AlertDialog,
  AlertDialogBackdrop,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@ui-sdk/react/alert-dialog";
import { Button } from "@ui-sdk/react/button";
import { Field, FieldDescription, FieldLabel } from "@ui-sdk/react/field";
import { Input } from "@ui-sdk/react/input";
import { Radio, RadioGroup } from "@ui-sdk/react/radio";
import { Textarea } from "@ui-sdk/react/textarea";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { ConvexError } from "convex/values";
import Link from "next/link";
import { type FormEvent, type ReactNode, useState } from "react";
import { api } from "@/convex/_generated/api";
import { Icon } from "./hackathon-ui";

type Candidate = (typeof api.scoutReview.queue)["_returnType"][number];
type ProposalField = Candidate["provenance"][number]["field"];
type Notice =
  | { kind: "approved"; title: string; slug: string }
  | { kind: "rejected"; title: string };

const modalityLabels = {
  inPerson: "Presencial",
  hybrid: "Híbrida",
  virtual: "Virtual",
} as const;

const safeUrl = (url: string | undefined) =>
  url && /^https?:\/\//i.test(url) ? url : undefined;

function host(url: string) {
  try {
    return new URL(url).host.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function errorMessage(error: unknown) {
  return error instanceof ConvexError && typeof error.data === "string"
    ? error.data
    : "No pudimos guardar la decisión. Vuelve a intentarlo.";
}

function EmptyState({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="hs-empty" role="status">
      <p className="hs-empty-title">{title}</p>
      {children}
    </div>
  );
}

function Evidence({
  candidate,
  fields,
  quoted,
}: {
  candidate: Candidate;
  fields: ProposalField[];
  quoted: boolean;
}) {
  const sources = new Map<string, Candidate["provenance"][number]>();
  for (const entry of candidate.provenance) {
    if (!fields.includes(entry.field)) continue;
    const excerpt = quoted ? undefined : entry.evidenceExcerpt;
    const key = `${entry.sourceUrl}\n${excerpt ?? ""}`;
    if (!sources.has(key))
      sources.set(key, { ...entry, evidenceExcerpt: excerpt });
  }
  if (sources.size === 0) return null;
  return (
    <div className="scout-evidence">
      {[...sources].map(([key, source]) => {
        const url = safeUrl(source.sourceUrl);
        return (
          <p key={key}>
            {quoted ? (
              "Copiado de"
            ) : source.evidenceExcerpt ? (
              <>
                <q>{source.evidenceExcerpt}</q> en
              </>
            ) : (
              "Fuente:"
            )}{" "}
            {url ? (
              <a
                className="hs-link"
                href={url}
                rel="noreferrer"
                target="_blank"
              >
                {host(url)}
              </a>
            ) : (
              host(source.sourceUrl)
            )}
          </p>
        );
      })}
    </div>
  );
}

function Missing({ required = false }: { required?: boolean }) {
  return (
    <span
      className={`hs-badge ${required ? "hs-badge--danger" : "hs-badge--neutral"}`}
    >
      {required ? "Falta (obligatorio)" : "Falta"}
    </span>
  );
}

function FactRow({
  label,
  candidate,
  fields,
  required = false,
  quoted = false,
  empty,
  children,
}: {
  label: string;
  candidate: Candidate;
  fields: ProposalField[];
  required?: boolean;
  quoted?: boolean;
  empty?: string;
  children: ReactNode;
}) {
  return (
    <div className="scout-fact">
      <dt>{label}</dt>
      <dd>
        {children ||
          (empty ? (
            <span className="text-muted-foreground">{empty}</span>
          ) : (
            <Missing required={required} />
          ))}
        <Evidence candidate={candidate} fields={fields} quoted={quoted} />
      </dd>
    </div>
  );
}

function Warnings({ candidate }: { candidate: Candidate }) {
  const { possibleDuplicateOf: other, publishedMatch: match } = candidate;
  if (!other && !match) return null;
  return (
    <div className="hs-alert" role="note">
      <Icon name="alert" />
      <div className="hs-alert-text">
        <p className="hs-alert-title">Posible duplicado</p>
        {match && (
          <p className="hs-alert-desc">
            {match.reason === "sameEdition"
              ? "Esta edición ya está publicada como "
              : match.reason === "sameUrl"
                ? "Ya hay un perfil con el mismo sitio oficial: "
                : "Ya hay un perfil con el mismo título: "}
            <Link className="hs-link" href={`/hackathons/${match.slug}`}>
              {match.title}
            </Link>
            .
            {match.reason === "sameEdition" &&
              " Aprobar lo vincula a ese perfil, sin crear otro."}
          </p>
        )}
        {other && (
          <p className="hs-alert-desc">
            Hack encontró otra edición con el mismo sitio oficial: {other.title}{" "}
            ({other.dates ?? "sin fecha"}).
          </p>
        )}
      </div>
    </div>
  );
}

function Completion({ missing }: { missing: Candidate["missingRequired"] }) {
  if (missing.length === 0) return null;
  return (
    <fieldset className="scout-completion">
      <legend className="hs-hcard-title text-base!">
        Completa lo que falta
      </legend>
      <p className="hs-pagehead-desc text-sm">
        Búscalo en el sitio oficial. Lo que escribas queda como dato de la
        revisión, no del Scout.
      </p>
      {missing.includes("modality") && (
        <Field className="grid gap-1 text-sm">
          <FieldLabel>Modalidad</FieldLabel>
          <RadioGroup
            className="flex-row! flex-wrap gap-4"
            name="modality"
            required
          >
            {Object.entries(modalityLabels).map(([value, label]) => (
              <label className="hs-check items-center!" key={value}>
                <Radio
                  className="hs-radio-input data-checked:border-[5px]! data-checked:border-primary!"
                  value={value}
                />
                <span className="hs-check-label">{label}</span>
              </label>
            ))}
          </RadioGroup>
        </Field>
      )}
      {missing.includes("organizer") && (
        <Field className="grid gap-1 text-sm" name="organizer">
          <FieldLabel>Organiza</FieldLabel>
          <Input className="hs-input-control" maxLength={200} required />
        </Field>
      )}
      {missing.includes("summary") && (
        <Field className="grid gap-1 text-sm" name="summary">
          <FieldLabel>Resumen</FieldLabel>
          <Textarea
            className="hs-input-control hs-textarea"
            maxLength={600}
            required
            rows={3}
          />
          <FieldDescription className="text-xs text-muted-foreground">
            Una o dos frases sobre qué se construye y para quién.
          </FieldDescription>
        </Field>
      )}
    </fieldset>
  );
}

function CandidateCard({
  candidate,
  onDecided,
}: {
  candidate: Candidate;
  onDecided: (notice: Notice) => void;
}) {
  const approve = useMutation(api.scoutReview.approve);
  const reject = useMutation(api.scoutReview.reject);
  const [pending, setPending] = useState<"approve" | "reject" | null>(null);
  const [error, setError] = useState("");
  const { proposal, missingRequired } = candidate;
  const titleId = `candidate-${candidate._id}`;
  const officialUrl = safeUrl(proposal.officialUrl);
  const discoveredFrom = safeUrl(candidate.discoveredFromUrl);

  async function decide(
    action: "approve" | "reject",
    run: () => Promise<void>,
  ) {
    setPending(action);
    setError("");
    try {
      await run();
    } catch (error) {
      setError(errorMessage(error));
      setPending(null);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const text = (name: string) => {
      const value = data.get(name);
      return typeof value === "string" && value.trim() ? value : undefined;
    };
    const modality = text("modality");
    void decide("approve", async () => {
      const { slug } = await approve({
        candidateId: candidate._id,
        completion: {
          modality:
            modality && modality in modalityLabels
              ? (modality as keyof typeof modalityLabels)
              : undefined,
          organizer: text("organizer"),
          summary: text("summary"),
        },
      });
      onDecided({ kind: "approved", title: proposal.title, slug });
    });
  }

  function confirmReject() {
    void decide("reject", async () => {
      await reject({ candidateId: candidate._id });
      onDecided({ kind: "rejected", title: proposal.title });
    });
  }

  return (
    <article aria-labelledby={titleId} className="hs-card scout-card">
      <header className="flex flex-col gap-1">
        <h2 className="hs-hcard-title" id={titleId}>
          {proposal.title}
        </h2>
        <p className="hs-pagehead-desc flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
          <span className="hs-agent">agente scout</span>
          {officialUrl ? (
            <a
              className="hs-link"
              href={officialUrl}
              rel="noreferrer"
              target="_blank"
            >
              {host(officialUrl)}
            </a>
          ) : (
            proposal.officialUrl
          )}
          {discoveredFrom && (
            <span>· descubierto en {host(discoveredFrom)}</span>
          )}
        </p>
      </header>

      <Warnings candidate={candidate} />

      <dl className="scout-facts">
        <FactRow
          candidate={candidate}
          fields={["startsOn", "endsOn"]}
          label="Fechas"
        >
          {candidate.dates}
        </FactRow>
        <FactRow candidate={candidate} fields={["location"]} label="Lugar">
          {proposal.location}
        </FactRow>
        <FactRow
          candidate={candidate}
          fields={["organizer"]}
          label="Organiza"
          required
        >
          {proposal.organizer}
        </FactRow>
        <FactRow
          candidate={candidate}
          fields={["modality"]}
          label="Modalidad"
          required
        >
          {proposal.modality && modalityLabels[proposal.modality]}
        </FactRow>
        <FactRow
          candidate={candidate}
          fields={["summary"]}
          label="Resumen"
          required
        >
          {proposal.summary}
        </FactRow>
        {proposal.topics && proposal.topics.length > 0 && (
          <FactRow candidate={candidate} fields={["topics"]} label="Temas">
            {proposal.topics.join(", ")}
          </FactRow>
        )}
        <FactRow
          candidate={candidate}
          empty="Sin bases en la fuente"
          fields={["guidelines"]}
          label="Bases"
          quoted
        >
          {proposal.guidelines && (
            <blockquote className="scout-quote">
              {proposal.guidelines}
            </blockquote>
          )}
        </FactRow>
        <FactRow
          candidate={candidate}
          empty="Sin reglas en la fuente"
          fields={["rules"]}
          label="Reglas"
          quoted
        >
          {proposal.rules && (
            <blockquote className="scout-quote">{proposal.rules}</blockquote>
          )}
        </FactRow>
      </dl>

      <form
        aria-label={`Revisar ${proposal.title}`}
        className="flex flex-col gap-4"
        onSubmit={submit}
      >
        <Completion missing={missingRequired} />
        {error && (
          <div className="hs-alert hs-alert--danger" role="alert">
            <Icon name="alert" />
            <div className="hs-alert-text">
              <p className="hs-alert-desc">{error}</p>
            </div>
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          <Button
            className="hs-btn hs-btn--primary"
            disabled={pending !== null}
            type="submit"
          >
            {pending === "approve" ? "Publicando…" : "Aprobar y publicar"}
          </Button>
          <AlertDialog
            onOpenChange={(open, details) => {
              if (!open && details.returnValue === "confirm") confirmReject();
            }}
          >
            <AlertDialogTrigger
              className="hs-btn hs-btn--secondary"
              disabled={pending !== null}
            >
              {pending === "reject" ? "Rechazando…" : "Rechazar"}
            </AlertDialogTrigger>
            <AlertDialogBackdrop className="bg-foreground/55!" />
            <AlertDialogContent className="hs-dialog">
              <div className="hs-dialog-panel">
                <AlertDialogTitle className="hs-dialog-title">
                  ¿Rechazar {proposal.title}?
                </AlertDialogTitle>
                <AlertDialogDescription className="hs-dialog-desc">
                  No se publicará. Si Hack vuelve a encontrar esta edición,
                  seguirá rechazada.
                </AlertDialogDescription>
                <div className="hs-dialog-foot">
                  <AlertDialogClose className="hs-btn hs-btn--secondary">
                    Cancelar
                  </AlertDialogClose>
                  <AlertDialogClose
                    className="hs-btn hs-btn--danger"
                    value="confirm"
                  >
                    Rechazar
                  </AlertDialogClose>
                </div>
              </div>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </form>
    </article>
  );
}

function NoticeBanner({ notice }: { notice: Notice | null }) {
  return (
    <div aria-live="polite">
      {notice && (
        <div
          className={`hs-alert ${notice.kind === "approved" ? "hs-alert--success" : ""}`}
        >
          <Icon name={notice.kind === "approved" ? "check" : "x"} />
          <div className="hs-alert-text">
            <p className="hs-alert-desc">
              {notice.kind === "approved" ? "Publicaste " : "Rechazaste "}
              {notice.title}.
            </p>
          </div>
          {notice.kind === "approved" && (
            <Link
              className="hs-link hs-alert-action"
              href={`/hackathons/${notice.slug}`}
            >
              Ver perfil
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

function Queue() {
  const queue = useQuery(api.scoutReview.queue, {});
  const [notice, setNotice] = useState<Notice | null>(null);
  if (queue === undefined) return <p role="status">Cargando candidatos…</p>;
  return (
    <>
      <NoticeBanner notice={notice} />
      {queue.length === 0 ? (
        <EmptyState title="No hay candidatos pendientes">
          <p className="hs-empty-desc">
            Cuando Hack encuentre un evento nuevo, aparecerá aquí para que lo
            revises.
          </p>
        </EmptyState>
      ) : (
        queue.map((candidate) => (
          <CandidateCard
            candidate={candidate}
            key={candidate._id}
            onDecided={setNotice}
          />
        ))
      )}
    </>
  );
}

function Access() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const isReviewer = useQuery(
    api.scoutReview.isReviewer,
    isAuthenticated ? {} : "skip",
  );
  if (isLoading || (isAuthenticated && isReviewer === undefined))
    return <p role="status">Cargando…</p>;
  if (!isAuthenticated)
    return (
      <EmptyState title="Inicia sesión para revisar">
        <p className="hs-empty-desc">
          La revisión del Scout es solo para cuentas autorizadas.
        </p>
        <SignInButton mode="modal">
          <Button className="hs-btn hs-btn--primary">Iniciar sesión</Button>
        </SignInButton>
      </EmptyState>
    );
  if (!isReviewer)
    return (
      <EmptyState title="No tienes acceso a la revisión">
        <p className="hs-empty-desc">
          Solo las cuentas autorizadas pueden revisar lo que encuentra el Scout.
        </p>
        <Link className="hs-link" href="/">
          Volver a explorar
        </Link>
      </EmptyState>
    );
  return <Queue />;
}

export default function ScoutReview() {
  return (
    <div className="scout-page">
      <header className="hs-pagehead-text">
        <h1 className="hs-pagehead-title">Revisión del Scout</h1>
        <p className="hs-pagehead-desc">
          Hack encuentra eventos en la web. Contrasta cada dato con su fuente
          antes de publicar el perfil.
        </p>
      </header>
      <Access />
    </div>
  );
}
