import type { Metadata } from "next";
import "./globals.css";
import "../design-system/components/bundle.css";
import { esMX } from "@clerk/localizations";
import { ClerkProvider } from "@clerk/nextjs";
import { connection } from "next/server";
import ConvexClientProvider from "@/components/ConvexClientProvider";

export const metadata: Metadata = {
  title: "Hackerspace",
  description:
    "Descubre hackathones, forma equipo y comparte lo que construyes.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await connection();

  return (
    <html lang="es">
      <body className="antialiased">
        <ClerkProvider dynamic localization={esMX}>
          <ConvexClientProvider>{children}</ConvexClientProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
