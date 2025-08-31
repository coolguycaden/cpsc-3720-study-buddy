import { useState } from "react";
// Assume a state management hook similar to useUser
// This hook provides access to student data and a function to update it
import { useUser } from "../../store/user";
import type { Availability } from "../../types";

// 1. Define the Zod schema for the meeting time string
const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const times = Array.from({ length: 24 * 2 }, (_, i) => {
  const hour = Math.floor(i / 2);
  const minute = i % 2 === 0 ? '00' : '30';
  return `${hour.toString().padStart(2, '0')}:${minute}`;
});

export default function SetAvaliability() {
  const { addMeetingTime, removeAvailability, me } = useUser();
  
  const [day, setDay] = useState(days[0]);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    if (startTime >= endTime) {
      setErr("End time must be after start time.");
      return;
    }

    try {
      await addMeetingTime(day, startTime, endTime);
    } catch (e: any) {
      setErr(e.message ?? "Failed to add time slot");
    }
  }

  async function handleRemoveAvailability(availability: Availability) {
    try {
      await removeAvailability(availability);
    } catch (e: any) {
      setErr(e.message ?? "Failed to remove time slot");
    }
  }

  return (
    <section>
      <h2 className="text-xl font-semibold mb-2">Set Availability</h2>
      <form onSubmit={onSubmit} className="space-y-4 p-4 border rounded-lg bg-gray-50">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm mb-1 font-medium">Day</label>
            <select value={day} onChange={e => setDay(e.target.value)} className="w-full rounded border px-3 py-2">
              {days.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1 font-medium">Start Time</label>
            <select value={startTime} onChange={e => setStartTime(e.target.value)} className="w-full rounded border px-3 py-2">
              {times.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1 font-medium">End Time</label>
            <select value={endTime} onChange={e => setEndTime(e.target.value)} className="w-full rounded border px-3 py-2">
              {times.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>
        {err && <p className="text-sm text-red-600">{err}</p>}
        <button className="rounded bg-black text-white px-4 py-2">Add Time</button>
      </form>
      <div className="mt-4">
        <h3 className="text-lg font-semibold mb-2">Current Availability</h3>
        {me?.availability && me.availability.length > 0 ? (
          <ul className="divide-y rounded border bg-white">
            {me.availability.map((avail, index) => (
              <li key={index} className="p-3 flex items-center justify-between">
                <span>{`${avail.day}, ${avail.startTime} - ${avail.endTime}`}</span>
                <button
                  className="text-sm underline text-red-600"
                  onClick={() => handleRemoveAvailability(avail)}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-neutral-500">No availability set.</p>
        )}
      </div>
    </section>
  );
}