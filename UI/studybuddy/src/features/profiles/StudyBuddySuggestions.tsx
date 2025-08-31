// src/features/dashboard/StudyBuddySuggestions.tsx
import { useEffect, useState } from "react";
import { DB } from "../../mocks/db";
import type { Student } from "../../types";
import { Link } from "react-router-dom";

export default function StudyBuddySuggestions() {
  const [suggestions, setSuggestions] = useState<Student[]>([]);

  useEffect(() => {
    setSuggestions(DB.suggestStudyBuddies());
  }, []);

  if (suggestions.length === 0) {
    return (
      <div>
        <h2 className="text-xl font-semibold mb-3">Study Buddy Suggestions</h2>
        <p className="text-sm text-neutral-500">No suggestions right now. Add more courses to find matches!</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-3">Study Buddy Suggestions</h2>
      <ul className="divide-y rounded border bg-white">
        {suggestions.map((s) => (
          <li key={s.id} className="p-3 flex items-center justify-between">
            <div>
              <div className="font-medium">{s.name}</div>
              <div className="text-sm text-neutral-600">@{s.username}</div>
            </div>
            <Link
              to={`/profiles/${s.username}`}
              className="text-sm underline"
            >
              View Profile
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}