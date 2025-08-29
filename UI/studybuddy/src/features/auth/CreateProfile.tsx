// src/features/auth/CreateProfile.tsx
import { useState } from "react";
import { z } from "zod";
import { useUser } from "../../store/user";

/**
 * Zod schema:
 * - name: at least 2 chars (nice low-friction validation)
 * - username: 3–20 chars, letters/numbers/_ . -
 *   (mirrors validation in the DB layer for consistent rules)
 */
const schema = z.object({
  name: z.string().min(2, "Name is required"),
  username: z
    .string()
    .regex(/^[a-z0-9_.-]{3,20}$/i, "3–20 chars, letters/numbers/_ . -"),
});

/**
 * CreateProfile
 * - Collects name + username, validates with Zod on submit,
 *   and delegates the actual creation to the user store.
 * - On success, the store sets `me` and your guard/router can redirect.
 */
export default function CreateProfile() {
  const createProfile = useUser((s) => s.createProfile);

  // Simple form object + per-field error messages
  const [form, setForm] = useState({ name: "", username: "" });
  const [err, setErr] = useState<string | null>(null);
  const [fieldErr, setFieldErr] = useState<{ name?: string; username?: string }>({});

  /**
   * Handle submit:
   * - Client-validate with Zod → show field-specific errors immediately.
   * - If valid, call the store. The store/DB will enforce uniqueness and
   *   may throw, which we surface as a form-level error.
   */
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setFieldErr({});

    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      // Map Zod issues to a simple { fieldName: message } object
      const fe: Record<string, string> = {};
      parsed.error.issues.forEach((i) => {
        fe[i.path[0] as string] = i.message;
      });
      setFieldErr(fe);
      return;
    }

    try {
      await createProfile(form.name.trim(), form.username.trim());
      // Success: `me` is set in the store. Guard/Router can redirect to "/".
    } catch (e: any) {
      // e.g., "Username already in use"
      setErr(e.message ?? "Failed to create profile");
    }
  }

  return (
    <section>
      <h2 className="text-xl font-semibold mb-2">Create Profile</h2>

      <form onSubmit={onSubmit} className="space-y-3">
        {/* Name field */}
        <div>
          <label className="block text-sm mb-1" htmlFor="cp-name">
            Name
          </label>
          <input
            id="cp-name"
            className="w-full rounded border px-3 py-2"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            autoComplete="name"
            placeholder="Eli Monroe"
          />
          {fieldErr.name && <p className="text-sm text-red-600">{fieldErr.name}</p>}
        </div>

        {/* Username field */}
        <div>
          <label className="block text-sm mb-1" htmlFor="cp-username">
            Username
          </label>
          <input
            id="cp-username"
            className="w-full rounded border px-3 py-2"
            value={form.username}
            onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
            autoComplete="username"
            placeholder="eli_monroe"
          />
          {fieldErr.username && (
            <p className="text-sm text-red-600">{fieldErr.username}</p>
          )}
        </div>

        {/* Form-level error (e.g., duplicate username) */}
        {err && <p className="text-sm text-red-600">{err}</p>}

        <button className="rounded bg-black text-white px-3 py-2">Create</button>
      </form>
    </section>
  );
}
