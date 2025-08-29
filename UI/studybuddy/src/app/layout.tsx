// src/app/layout.tsx
import { Link, NavLink } from "react-router-dom";
import { useUser } from "../store/user";

/**
 * Layout
 * App-wide shell: header (brand + nav + auth controls) and a content container.
 * Renders children inside <main>.
 */
export default function Layout({ children }: { children: React.ReactNode }) {
  const me = useUser((s) => s.me);
  const logout = useUser((s) => s.logout);

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <header className="border-b bg-white">
        <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between">
          {/* Brand */}
          <Link to="/" className="font-semibold">
            StudyBuddy
          </Link>

          {/* Primary nav: only visible when logged in */}
          <nav className="flex gap-4">
            {me && (
              <>
                <NavLink to="/dashboard" className="hover:underline">
                  Dashboard
                </NavLink>
                <NavLink to="/courses" className="hover:underline">
                  Courses
                </NavLink>
              </>
            )}
          </nav>

          {/* Auth controls: login link or logout button */}
          <div className="text-sm">
            {me ? (
              <button className="underline" onClick={logout}>
                Logout @{me.username}
              </button>
            ) : (
              <NavLink to="/onboard" className="underline">
                Sign in
              </NavLink>
            )}
          </div>
        </div>
      </header>

      {/* Page content */}
      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </div>
  );
}
