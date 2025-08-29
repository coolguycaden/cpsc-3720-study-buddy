import { Link, NavLink } from "react-router-dom";
import { useUser } from "../store/user";

export default function Layout({ children }: { children: React.ReactNode }) {
  const me = useUser(s => s.me);
  const logout = useUser(s => s.logout);

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <header className="border-b bg-white">
        <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between">
          <Link to="/" className="font-semibold">StudyBuddy</Link>
          <nav className="flex gap-4">
            {me && <>
              <NavLink to="/dashboard" className="hover:underline">Dashboard</NavLink>
              <NavLink to="/courses" className="hover:underline">Courses</NavLink>
            </>}
          </nav>
          <div className="text-sm">
            {me
              ? <button className="underline" onClick={logout}>Logout @{me.username}</button>
              : <NavLink to="/onboard" className="underline">Sign in</NavLink>}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </div>
  );
}
