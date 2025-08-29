// src/app/guard.tsx
import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useUser } from "../store/user";

/**
 * RequireAuth
 * Wrap protected routes with this to:
 * 1) Hydrate the user from storage on first mount (useUser().init()).
 * 2) While hydrating, show a tiny loading state (prevents flicker).
 * 3) If no user after hydration, redirect to /onboard.
 *
 * Usage:
 *   { path: "/", element: <RequireAuth><Layout><Home/></Layout></RequireAuth> }
 */
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const me = useUser((s) => s.me);
  const init = useUser((s) => s.init);

  // We track a local "ready" flag so we don't render/redirect before init runs.
  const [ready, setReady] = useState(false);

  useEffect(() => {
    init();        // hydrate `me` from the DB (localStorage-backed)
    setReady(true);
  }, [init]);

  // Keep it minimal; prevents a flash of redirect before hydration finishes.
  if (!ready) {
    return <p className="px-4 py-6 text-sm text-neutral-600">Checking session…</p>;
  }

  // Not logged in → punt to onboarding.
  if (!me) {
    return <Navigate to="/onboard" replace />;
  }

  // Authenticated → render the protected content.
  return <>{children}</>;
}
