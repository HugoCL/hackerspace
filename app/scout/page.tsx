import type { Metadata } from "next";
import { AppShell } from "@/components/hackathon-ui";
import ScoutReview from "@/components/ScoutReview";

export const metadata: Metadata = { title: "Revisión del Scout · Hackerspace" };

export default function ScoutPage() {
  return (
    <AppShell current="scout" year={new Date().getFullYear()}>
      <ScoutReview />
    </AppShell>
  );
}
