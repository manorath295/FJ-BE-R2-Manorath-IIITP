import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL:
    window.location.hostname === "localhost"
      ? "http://localhost:3000/api/auth"
      : "https://backend.manorath.me/api/auth",
});

export const { signIn, signUp, signOut, useSession } = authClient;
