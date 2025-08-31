import { useEffect, useState } from "react";
import { DB } from "../../mocks/db";
import type { DetailedStudySession } from "../../types";
import { useUser } from "../../store/user";

export default function SessionsPage() {
  const [sessions, setSessions] = useState<DetailedStudySession[]>([]);
  const [loading, setLoading] = useState(true);
  const me = useUser((s) => s.me);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      setSessions(DB.listMyStudySessions());
      setLoading(false);
    }, 200);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    // Add data-testid for the loading state
    return <p data-testid="loading-sessions" className="text-sm text-neutral-500">Loading your sessions...</p>;
  }

  return (
    <section>
      <h1 className="text-2xl font-semibold mb-4">My Confirmed Study Sessions</h1>
      {sessions.length === 0 ? (
        // Add data-testid for the empty state
        <p data-testid="no-sessions" className="text-sm text-neutral-500">You have no upcoming study sessions.</p>
      ) : (
        <div className="space-y-4">
          {sessions.map((session) => (
            <div key={session.id} className="p-4 border rounded-lg bg-white shadow-sm">
              <h2 className="font-semibold text-lg text-neutral-800">{session.courseCode}</h2>
              <p className="text-neutral-700 mb-2">{session.time}</p>
              <div>
                <h3 className="text-sm font-medium text-neutral-600">Participants:</h3>
                <ul className="list-disc list-inside text-sm text-neutral-600">
                  {session.participants.map((p) => (
                    <li key={p.id}>
                      {p.name} (@{p.username})
                      {p.id === me?.id && <span className="text-xs text-neutral-500"> (You)</span>}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}