// src/features/auth/Login.tsx
import { useState } from "react";
import { useUser } from "../../store/user";

/**
 * Login
 * - Minimal username-only login that delegates to the user store (Zustand).
 * - The store wraps our mock DB, so this component stays UI-focused.
 */
export default function Login() {
  // Pull only what we need from the store to avoid re-renders.
  const login = useUser((s) => s.login);

  // Controlled input + error message for friendly UX.
  const [username, setUsername] = useState("");
  const [err, setErr] = useState<string | null>(null);

  /**
   * Handle submit:
   * - Stop the browser's default form post.
   * - Clear any previous error.
   * - Attempt login; if DB throws (user not found), surface the message.
   */
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    try {
      await login(username.trim());
      // On success, the router/guard will take over (e.g., redirect to /)
    } catch (e: any) {
      setErr(e.message ?? "Login failed");
    }
  }

  return (
    <section>
      <h2 className="text-xl font-semibold mb-2">Login</h2>

      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <label className="block text-sm mb-1" htmlFor="login-username">
            Username
          </label>
          <input
            id="login-username"
            className="w-full rounded border px-3 py-2"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            placeholder="eli_monroe"
          />
        </div>

        {/* Error area (e.g., "User not found") */}
        {err && <p className="text-sm text-red-600">{err}</p>}

        <button className="rounded bg-black text-white px-3 py-2">Login</button>
      </form>
    </section>
  );
}
