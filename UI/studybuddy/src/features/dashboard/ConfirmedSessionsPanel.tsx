// src/features/dashboard/ConfirmedSessionsPanel.tsx
import { useEffect, useState } from "react";
import { DB } from "../../mocks/db.ts";
import type { DetailedStudySession } from "../../types.ts";
import { useUser } from "../../store/user.ts";
import { Link } from "react-router-dom";

export default function ConfirmedSessionsPanel() {
  const [sessions, setSessions] = useState<DetailedStudySession[]>([]);
  const me = useUser((s) => s.me);

  useEffect(() => {
    // In a real app, this would be a subscription or a smart query
    setSessions(DB.listMyStudySessions());
  }, []);

  if (!sessions || sessions.length === 0) {
    return (
      <section>
        <h2 className="text-xl font-semibold mb-3">Upcoming Study Sessions</h2>
        <div className="p-4 border rounded-lg bg-white">
            <p className="text-sm text-neutral-500">You have no confirmed sessions. Find a study buddy and send a request!</p>
        </div>
      </section>
    );
  }

  return (
    <section>
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-xl font-semibold">Upcoming Study Sessions</h2>
        <Link to="/sessions" className="text-sm underline">View All</Link>
      </div>
      <div className="space-y-3">
        {sessions.slice(0, 3).map((session) => { // Show the first 3 sessions as a preview
          const otherParticipant = session.participants.find(p => p.id !== me?.id);
          return (
            <div key={session.id} className="p-3 border rounded-lg bg-white shadow-sm">
              <p className="font-semibold text-neutral-800">{session.courseCode}</p>
              <p className="text-sm text-neutral-700">{session.time}</p>
              <p className="text-sm text-neutral-600">
                With: {otherParticipant?.name ?? '...'} (@{otherParticipant?.username ?? '...'})
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

