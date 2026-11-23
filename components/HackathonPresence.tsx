"use client";

import { useConvex, useConvexAuth, useMutation, useQuery } from "convex/react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

function useHackathonPresence(hackathonId: Id<"hackathons">) {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { url } = useConvex();
  const heartbeat = useMutation(api.presence.heartbeat);
  const disconnect = useMutation(api.presence.disconnect);
  const [room, setRoom] = useState<{
    hackathonId: Id<"hackathons">;
    isAuthenticated: boolean;
    roomToken: string;
  }>();

  useEffect(() => {
    if (isLoading) return;
    const sessionId = crypto.randomUUID();
    let active = true;
    let sessionToken: string | undefined;
    let timer: ReturnType<typeof setTimeout>;
    const disconnectSession = (token: string) => {
      void disconnect({ sessionToken: token }).catch(() => {});
    };

    async function sendHeartbeat() {
      try {
        const result = await heartbeat({ hackathonId, sessionId });
        if (!active) {
          disconnectSession(result.sessionToken);
          return;
        }
        sessionToken = result.sessionToken;
        setRoom((previous) =>
          previous?.roomToken === result.roomToken &&
          previous.hackathonId === hackathonId &&
          previous.isAuthenticated === isAuthenticated
            ? previous
            : { hackathonId, isAuthenticated, roomToken: result.roomToken },
        );
      } finally {
        if (active) timer = setTimeout(ping, 5000);
      }
    }
    function ping() {
      void sendHeartbeat().catch(() => {});
    }
    function onPageHide() {
      if (!sessionToken) return;
      const payload = new Blob(
        [
          JSON.stringify({
            path: "presence:disconnect",
            args: { sessionToken },
          }),
        ],
        { type: "application/json" },
      );
      navigator.sendBeacon(`${url}/api/mutation`, payload);
    }

    ping();
    window.addEventListener("pagehide", onPageHide);
    return () => {
      active = false;
      clearTimeout(timer);
      window.removeEventListener("pagehide", onPageHide);
      if (sessionToken) disconnectSession(sessionToken);
    };
  }, [disconnect, hackathonId, heartbeat, isAuthenticated, isLoading, url]);

  return useQuery(
    api.presence.list,
    !isLoading &&
      room?.hackathonId === hackathonId &&
      room.isAuthenticated === isAuthenticated
      ? { roomToken: room.roomToken }
      : "skip",
  );
}

function ViewerAvatar({ name, image }: { name: string; image?: string }) {
  const [failedImage, setFailedImage] = useState<string>();
  const initials = name
    .trim()
    .split(/\s+/u)
    .slice(0, 2)
    .map((part) => Array.from(part)[0])
    .join("")
    .toLocaleUpperCase("es");

  return (
    <span
      aria-hidden="true"
      className="hs-avatar hs-avatar--sm hs-avatar--t0 leading-none"
    >
      {image && failedImage !== image ? (
        <Image
          alt=""
          height={28}
          onError={() => setFailedImage(image)}
          referrerPolicy="no-referrer"
          src={image}
          unoptimized
          width={28}
        />
      ) : (
        initials
      )}
    </span>
  );
}

export default function HackathonPresence({
  hackathonId,
}: {
  hackathonId: Id<"hackathons">;
}) {
  const attendance = useHackathonPresence(hackathonId);
  const viewers =
    attendance && "viewers" in attendance ? (attendance.viewers ?? []) : [];
  const count = attendance?.count;
  const countLabel =
    count === undefined
      ? "Conectando…"
      : count === 1
        ? "1 persona"
        : count > 1000
          ? "Más de 1000 personas"
          : `${count} personas`;

  return (
    <section aria-labelledby="live-presence" className="hs-card">
      <div className="hs-section-head">
        <h2 className="hs-section-title" id="live-presence">
          Viendo ahora
        </h2>
        <span className="hs-badge hs-badge--live">En vivo</span>
      </div>
      <p aria-live="polite" className="hs-avstack-more">
        {countLabel}
      </p>
      {viewers.length > 0 && (
        <ul className="mt-2 flex flex-col gap-2">
          {viewers.map(({ name, image }, index) => (
            <li
              className="flex min-w-0 items-center gap-2 text-sm"
              // biome-ignore lint/suspicious/noArrayIndexKey: Public profiles can share names and photos; the server returns no account IDs.
              key={`${index}:${name}:${image ?? ""}`}
            >
              <ViewerAvatar name={name} image={image} />
              <span className="break-all">{name}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
