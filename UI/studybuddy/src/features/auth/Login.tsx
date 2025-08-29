import { useState } from "react";
import { useUser } from "../../store/user";

export default function Login() {
  const login = useUser(s => s.login);
  const [username, setUsername] = useState("");
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    try { await login(username.trim()); }
    catch (e:any) { setErr(e.message ?? "Login failed"); }
  }

  return (
    <section>
      <h2 className="text-xl font-semibold mb-2">Login</h2>
      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <label className="block text-sm mb-1">Username</label>
          <input className="w-full rounded border px-3 py-2"
                 value={username} onChange={e=>setUsername(e.target.value)} />
        </div>
        {err && <p className="text-sm text-red-600">{err}</p>}
        <button className="rounded bg-black text-white px-3 py-2">Login</button>
      </form>
    </section>
  );
}
