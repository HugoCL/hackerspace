"use client";

import {
  Popover,
  PopoverContent,
  PopoverTitle,
  PopoverTrigger,
} from "@ui-sdk/react/popover";
import { useConvex, useConvexAuth, useMutation, useQuery } from "convex/react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import PresenceIndicator from "./PresenceIndicator";

let ephemeralVisitorId: string | undefined;

function browserVisitorId() {
  const key = "hackerspace-visitor-id";
  try {
    const stored = localStorage.getItem(key);
    if (
      stored &&
      /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(stored)
    ) {
      return stored;
    }
    const visitorId = crypto.randomUUID();
    localStorage.setItem(key, visitorId);
    return visitorId;
  } catch {
    ephemeralVisitorId ??= crypto.randomUUID();
    return ephemeralVisitorId;
  }
}

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
    const visitorId = isAuthenticated ? undefined : browserVisitorId();
    let active = true;
    let sessionToken: string | undefined;
    let timer: ReturnType<typeof setTimeout>;
    const disconnectSession = (token: string) => {
      void disconnect({ sessionToken: token }).catch(() => {});
    };

    async function sendHeartbeat() {
      try {
        const result = await heartbeat({ hackathonId, sessionId, visitorId });
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
  const initials = Array.from(
    name
      .trim()
      .split(/\s+/u)
      .slice(0, 2)
      .map((part) => Array.from(part)[0])
      .join("")
      .toLocaleUpperCase("es"),
  )
    .slice(0, 2)
    .join("");

  return (
    <span
      aria-hidden="true"
      className="hs-avatar hs-avatar--xs hs-avatar--t0 leading-none"
    >
      {image && failedImage !== image ? (
        <Image
          alt=""
          height={20}
          onError={() => setFailedImage(image)}
          referrerPolicy="no-referrer"
          src={image}
          unoptimized
          width={20}
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
  const { isAuthenticated } = useConvexAuth();
  const viewers =
    isAuthenticated && attendance && "viewers" in attendance
      ? (attendance.viewers ?? [])
      : [];
  const hiddenViewers = (attendance?.count ?? 0) - viewers.length;

  return (
    <section
      aria-label="Presencia en vivo"
      className="flex flex-wrap items-center gap-x-3 gap-y-1"
    >
      <PresenceIndicator announce count={attendance?.count} />
      {viewers.length > 0 && (
        <Popover>
          <PopoverTrigger
            aria-label="Ver quién está mirando"
            className="inline-flex items-center gap-0.5 rounded-full"
          >
            {viewers.map(({ name, image }, index) => (
              <ViewerAvatar
                // biome-ignore lint/suspicious/noArrayIndexKey: Profile names and pictures are not unique.
                key={`${index}:${name}:${image ?? ""}`}
                name={name}
                image={image}
              />
            ))}
          </PopoverTrigger>
          <PopoverContent className="hs-card z-10">
            <PopoverTitle>Personas mirando</PopoverTitle>
            <ul className="mt-2 grid gap-1 text-sm">
              {viewers.map(({ name, image }, index) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: Profile names and pictures are not unique.
                <li key={`${index}:${name}:${image ?? ""}`}>{name}</li>
              ))}
              {hiddenViewers > 0 && (
                <li className="text-muted-foreground">y {hiddenViewers} más</li>
              )}
            </ul>
          </PopoverContent>
        </Popover>
      )}
    </section>
  );
}
