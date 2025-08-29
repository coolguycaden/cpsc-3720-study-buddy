import { useEffect, useState } from "react";
import { DB } from "../../mocks/db";
import type { Student } from "../../types";
import { Link } from "react-router-dom";

export default function ClassmatesPanel({ courseCode }: { courseCode: string }) {
  const [list, setList] = useState<Student[] | null>(null);

  useEffect(() => {
    setList(null);
    const t = setTimeout(()=> setList(DB.classmates(courseCode)), 150);
    return () => clearTimeout(t);
  }, [courseCode]);

  if (list === null) return <p className="text-sm">Loading…</p>;
  if (list.length === 0) return <p className="text-sm text-neutral-500">No classmates yet.</p>;

  return (
    <ul className="divide-y rounded border bg-white">
      {list.map(s => (
        <li key={s.id} className="p-3 flex items-center justify-between">
          <div>
            <div className="font-medium">{s.name}</div>
            <div className="text-sm text-neutral-600">@{s.username}</div>
          </div>
          <Link to={`/profiles/${s.username}`} className="text-sm underline">View Profile</Link>
        </li>
      ))}
    </ul>
  );
}
