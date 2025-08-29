import { Navigate } from "react-router-dom";
import { useUser } from "../store/user";
import { useEffect } from "react";

export function RequireAuth({ children }: { children: JSX.Element }) {
  const me = useUser(s => s.me);
  const init = useUser(s => s.init);
  useEffect(() => { init(); }, [init]);
  if (!me) return <Navigate to="/onboard" replace />;
  return children;
}
