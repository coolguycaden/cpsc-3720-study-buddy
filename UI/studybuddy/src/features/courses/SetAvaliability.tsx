import { useState } from "react";
import { z } from "zod";
// Assume a state management hook similar to useUser
// This hook provides access to student data and a function to update it
import { useUser } from "../../store/user";

// 1. Define the Zod schema for the meeting time string
const schema = z.object({
  time: z.string().min(3, "A time slot is required"),
});

export default function AddMeetingTime() {
  // 2. Use a hypothetical store hook to get the function for adding a time
  const addMeetingTime = useUser(s => s.addMeetingTime);
  
  // 3. Manage the input field state and errors
  const [form, setForm] = useState({ time: "" });
  const [err, setErr] = useState<string | null>(null);
  const [fieldErr, setFieldErr] = useState<{ time?: string }>({});

  // 4. Handle form submission
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null); 
    setFieldErr({});

    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const fe: any = {};
      parsed.error.issues.forEach(i => { fe[i.path[0]] = i.message; });
      setFieldErr(fe); 
      return;
    }

    try {
      // 5. Call the function from the store to add the time
      await addMeetingTime(form.time.trim());
      setForm({ time: "" }); // Clear the form on success
    } catch (e: any) {
      setErr(e.message ?? "Failed to add time slot");
    }
  }

  return (
    <section>
      <h2 className="text-xl font-semibold mb-2">Add Meeting Time</h2>
      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <label className="block text-sm mb-1">Time Slot</label>
          <input className="w-full rounded border px-3 py-2"
                 value={form.time}
                 onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
                 placeholder="e.g., Monday 2:00 PM - 3:00 PM"
          />
          {fieldErr.time && <p className="text-sm text-red-600">{fieldErr.time}</p>}
        </div>
        {err && <p className="text-sm text-red-600">{err}</p>}
        <button className="rounded bg-black text-white px-3 py-2">Add Time</button>
      </form>
    </section>
  );
}