// src/features/courses/ClassmatesPanel.tsx
import { useEffect, useState } from "react";
import { DB } from "../../mocks/db";
import type { Student } from "../../types";
import { Link } from "react-router-dom";

/**
 * ClassmatesPanel
 * Renders a list of other students enrolled in the given course.
 *
 * Props:
 * - courseCode: normalized course code (e.g., "CPSC 2150-001")
 *
 * UX notes:
 * - Shows a tiny "Loading…" state while fetching.
 * - Shows an empty state if there are no classmates.
 * - Excludes the current user (handled in DB.classmates()).
 */
export default function ClassmatesPanel({ courseCode }: { courseCode: string }) {
  // null = loading, [] = loaded but empty, Student[] = loaded with data
  const [list, setList] = useState<Student[] | null>(null);

  useEffect(() => {
    // Set to "loading" whenever the course changes to provide immediate feedback.
    setList(null);

    // Simulate a small async delay so the loading state is visible.
    // In a real API call, this would be an actual fetch/await.
    const t = setTimeout(() => {
      const classmates = DB.classmates(courseCode);
      setList(classmates);
    }, 150);

    // Cleanup timeout if the component unmounts or courseCode changes quickly.
    return () => clearTimeout(t);
  }, [courseCode]);

  // Loading UI: keep it subtle so layout doesn't jump.
  if (list === null) return <p className="text-sm">Loading…</p>;

  // Empty state: clear message helps users know what to expect next.
  if (list.length === 0) return <p className="text-sm text-neutral-500">No classmates yet.</p>;

  // Success state: list classmates with a link to their profile page stub.
  return (
    <ul className="divide-y rounded border bg-white">
      {list.map((s) => (
        <li key={s.id} className="p-3 flex items-center justify-between">
          <div>
            <div className="font-medium">{s.name}</div>
            <div className="text-sm text-neutral-600">@{s.username}</div>
          </div>
          <Link
            to={`/profiles/${s.username}`}
            className="text-sm underline"
            aria-label={`View profile for ${s.name}`}
          >
            View Profile
          </Link>
        </li>
      ))}
    </ul>
  );
}
