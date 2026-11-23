"use client";

import { Show, SignInButton, UserButton } from "@clerk/nextjs";
import { Button } from "@ui-sdk/react/button";

export default function HeaderAuth() {
  return (
    <>
      <Show when="signed-out">
        <SignInButton mode="modal">
          <Button className="hs-btn hs-btn--secondary">Iniciar sesión</Button>
        </SignInButton>
      </Show>
      <Show when="signed-in">
        <UserButton />
      </Show>
    </>
  );
}
