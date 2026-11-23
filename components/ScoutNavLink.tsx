"use client";

import { useConvexAuth, useQuery } from "convex/react";
import Link from "next/link";
import { api } from "@/convex/_generated/api";

export default function ScoutNavLink({ current }: { current: boolean }) {
  const { isAuthenticated } = useConvexAuth();
  const isReviewer = useQuery(
    api.scoutReview.isReviewer,
    isAuthenticated ? {} : "skip",
  );
  if (!isReviewer) return null;
  return (
    <Link
      aria-current={current ? "page" : undefined}
      className="hs-shell-link"
      href="/scout"
    >
      Revisión
    </Link>
  );
}
