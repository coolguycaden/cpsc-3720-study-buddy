import { useState } from "react";
import { z } from "zod";
import { useUser } from "../../store/user";

const schema = z.object({
  name: z.string().min(2, "Name is required"),
  username: z.string().regex(/^[a-z0-9_.-]{3,20}$/i, "3–20 chars, letters/numbers/_ . -"),
});

export default function CreateProfile() {
  const createProfile = useUser(s => s.createProfile);
  const [form, setForm] = useState({ name: "", username: "" });
  const [err, setErr] = useState<string | null>(null);
  const [fieldErr, setFieldErr] = useState<{name?:string;username?:string}>({});

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null); setFieldErr({});
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const fe: any = {};
      parsed.error.issues.forEach(i => { fe[i.path[0]] = i.message; });
      setFieldErr(fe); return;
    }
    try { await createProfile(form.name.trim(), form.username.trim()); }
    catch (e:any) { setErr(e.message ?? "Failed to create profile"); }
  }

  return (
    <section>
      <h2 className="text-xl font-semibold mb-2">Create Profile</h2>
      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <label className="block text-sm mb-1">Name</label>
          <input className="w-full rounded border px-3 py-2"
                 value={form.name}
                 onChange={e=>setForm(f=>({...f, name:e.target.value}))}/>
          {fieldErr.name && <p className="text-sm text-red-600">{fieldErr.name}</p>}
        </div>
        <div>
          <label className="block text-sm mb-1">Username</label>
          <input className="w-full rounded border px-3 py-2"
                 value={form.username}
                 onChange={e=>setForm(f=>({...f, username:e.target.value}))}
                 placeholder="eli_monroe"/>
          {fieldErr.username && <p className="text-sm text-red-600">{fieldErr.username}</p>}
        </div>
        {err && <p className="text-sm text-red-600">{err}</p>}
        <button className="rounded bg-black text-white px-3 py-2">Create</button>
      </form>
    </section>
  );
}
